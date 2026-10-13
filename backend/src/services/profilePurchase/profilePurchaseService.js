const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════
// SAFE IMPORTS
// ═══════════════════════════════════════════════════════════════

function safeRequire(path) {
  try { return require(path); } catch (e) { return null; }
}

let getAdminConnection = null;
try {
  const dbModule = require('../../config/db');
  getAdminConnection = dbModule.getAdminConnection || null;
} catch (e) {
  console.warn('[ProfilePurchaseService] Could not load getAdminConnection');
}

let ProfilePricing = safeRequire('../../models/profilePricingModel');

// ═══════════════════════════════════════════════════════════════
// MODEL LOADING
// ═══════════════════════════════════════════════════════════════

let RecruiterCredit = null;
let ProfileEntitlement = null;
let ProfilePurchase = null;

const combinedModel = safeRequire('../../models/recruiterCreditModel');
if (combinedModel) {
  RecruiterCredit = combinedModel.RecruiterCredit || null;
  ProfileEntitlement = combinedModel.ProfileEntitlement || null;
  ProfilePurchase = combinedModel.ProfilePurchase || null;
}

if (!ProfileEntitlement) {
  const entModel = safeRequire('../../models/profileEntitlementModel');
  if (entModel) ProfileEntitlement = entModel.ProfileEntitlement || entModel.default || entModel;
}
if (!ProfilePurchase) {
  const purModel = safeRequire('../../models/profilePurchaseModel');
  if (purModel) ProfilePurchase = purModel.ProfilePurchase || purModel.default || purModel;
}

if (!RecruiterCredit) {
  const s = new mongoose.Schema({
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    totalPurchased: { type: Number, default: 0 },
    totalExpended: { type: Number, default: 0 },
  }, { timestamps: true, collection: 'recruiter_credits' });
  RecruiterCredit = mongoose.models.RecruiterCredit || mongoose.model('RecruiterCredit', s);
}

if (!ProfileEntitlement) {
  const s = new mongoose.Schema({
    recruiterId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    candidateEmail: { type: String, lowercase: true, trim: true, default: '' },
    status: { type: String, default: 'active', index: true },
    unlockedAt: { type: Date, default: Date.now },
    source: { type: String, default: 'credit_auto_reveal' },
    orderId: { type: String, default: null },
    paymentId: { type: String, default: null },
  }, { timestamps: true, collection: 'profile_entitlements' });
  s.index({ recruiterId: 1, candidateId: 1 }, { unique: true });
  ProfileEntitlement = mongoose.models.ProfileEntitlement || mongoose.model('ProfileEntitlement', s);
}

if (!ProfilePurchase) {
  const s = new mongoose.Schema({
    recruiterId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    razorpayOrderId: { type: String, default: null, index: { unique: true, sparse: true } },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paymentId: { type: String, default: null },
    signature: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0 },
    unitPriceInPaise: { type: Number, default: 0 },
    unitPriceInRupees: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalAmountInPaise: { type: Number, default: 0 },
    totalAmountInRupees: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: { type: String, default: 'pending', index: true },
    status: { type: String, default: 'created', index: true },
    paymentMethod: { type: String, default: null },
    pricingSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    rawRazorpayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    purchasedAt: { type: Date, default: null },
  }, { timestamps: true, collection: 'profile_purchases' });
  ProfilePurchase = mongoose.models.ProfilePurchase || mongoose.model('ProfilePurchase', s);
}

console.log('[ProfilePurchaseService] ✅ All models loaded successfully');

// ═══════════════════════════════════════════════════════════════
// 🔧 AUTO-HEAL: Fix duplicate key index on razorpayOrderId
// Runs once on startup to clean legacy non-sparse indexes
// ═══════════════════════════════════════════════════════════════

(async function autoHealPurchaseIndexes() {
  try {
    // Wait for mongoose default connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 15000);
        mongoose.connection.once('connected', () => { clearTimeout(timeout); resolve(); });
      });
    }

    const db = mongoose.connection.db;
    if (!db) {
      console.warn('[ProfilePurchaseService] Auto-heal: mongoose.connection.db not ready, skipping');
      return;
    }

    const collection = db.collection('profile_purchases');
    const indexes = await collection.indexes();

    // Drop old non-sparse unique indexes
    for (const idx of indexes) {
      if (idx.key && idx.key.razorpayOrderId && idx.unique && !idx.sparse) {
        console.log(`[ProfilePurchaseService] 🔧 Dropping old non-sparse index: ${idx.name}`);
        try {
          await collection.dropIndex(idx.name);
          console.log(`[ProfilePurchaseService] ✅ Dropped index ${idx.name}`);
        } catch (dropErr) {
          console.warn(`[ProfilePurchaseService] Index drop warning:`, dropErr.message);
        }
      }
      if (idx.key && idx.key.orderId && idx.unique && !idx.sparse) {
        console.log(`[ProfilePurchaseService] 🔧 Dropping old non-sparse orderId index: ${idx.name}`);
        try {
          await collection.dropIndex(idx.name);
        } catch (dropErr) {
          console.warn(`[ProfilePurchaseService] orderId index drop warning:`, dropErr.message);
        }
      }
    }

    // Fix any existing documents with null razorpayOrderId
    const nullCount = await collection.countDocuments({ razorpayOrderId: null });
    if (nullCount > 0) {
      console.log(`[ProfilePurchaseService] 🔧 Fixing ${nullCount} purchases with null razorpayOrderId...`);
      const nullDocs = await collection.find({ razorpayOrderId: null }).toArray();
      for (const doc of nullDocs) {
        const uniqueId = `legacy_${doc._id.toString()}_${Date.now()}`;
        try {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { razorpayOrderId: uniqueId, orderId: doc.orderId || uniqueId } }
          );
        } catch (updateErr) {
          console.warn(`[ProfilePurchaseService] Update warning for ${doc._id}:`, updateErr.message);
        }
      }
      console.log(`[ProfilePurchaseService] ✅ Fixed ${nullCount} legacy records`);
    }

    // Recreate sparse unique index
    try {
      await collection.createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true });
      console.log('[ProfilePurchaseService] ✅ Sparse unique index on razorpayOrderId ready');
    } catch (createErr) {
      console.warn('[ProfilePurchaseService] Index creation warning:', createErr.message);
    }

  } catch (healErr) {
    console.warn('[ProfilePurchaseService] Auto-heal warning (non-fatal):', healErr.message);
  }
})();

// ═══════════════════════════════════════════════════════════════
// ADMIN CANDIDATE USER MODEL
// ═══════════════════════════════════════════════════════════════

let AdminUserModel = null;

function getAdminCandidateUserModel() {
  if (AdminUserModel) return AdminUserModel;

  let adminConn = null;
  if (typeof getAdminConnection === 'function') {
    try { adminConn = getAdminConnection(); } catch (err) { /* ignore */ }
  }
  if (!adminConn) {
    for (const conn of mongoose.connections) {
      if (conn.name === 'careerflow_admin' || (conn.db && conn.db.databaseName === 'careerflow_admin')) {
        adminConn = conn; break;
      }
    }
  }
  if (!adminConn) adminConn = mongoose;

  if (adminConn.models && adminConn.models.AdminCandidateUser) {
    AdminUserModel = adminConn.models.AdminCandidateUser;
    return AdminUserModel;
  }

  const schema = new mongoose.Schema({}, { timestamps: true, collection: 'users', strict: false });
  try {
    AdminUserModel = adminConn.model('AdminCandidateUser', schema);
  } catch (e) {
    AdminUserModel = adminConn.models.AdminCandidateUser || mongoose.models.AdminCandidateUser;
  }
  return AdminUserModel;
}

function getAdminDb() {
  try {
    if (typeof getAdminConnection === 'function') {
      const conn = getAdminConnection();
      if (conn && conn.db) return conn.db;
    }
  } catch (e) { /* ignore */ }
  for (const conn of mongoose.connections) {
    if ((conn.name === 'careerflow_admin' || (conn.db && conn.db.databaseName === 'careerflow_admin')) && conn.db) {
      return conn.db;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 🔑 PROFILE COMPLETENESS CHECKER
// Only unlock candidates with ≥50% profile + uploaded resume
// ═══════════════════════════════════════════════════════════════

function candidateHasResume(candidate) {
  if (!candidate) return false;

  const resumeFields = [
    candidate.resume,
    candidate.resumeUrl,
    candidate.cv,
    candidate.cvUrl,
    candidate.profile?.resume,
    candidate.profile?.resumeUrl,
    candidate.profile?.cv,
    candidate.personalInfo?.resume,
    candidate.personalInfo?.resumeUrl,
    candidate.documents?.resume,
  ];

  for (const field of resumeFields) {
    if (!field) continue;
    if (typeof field === 'string' && field.trim().length > 5) return true;
    if (typeof field === 'object') {
      const url = field.url || field.fileUrl || field.path || field.secure_url || field.location || '';
      if (url.trim().length > 5) return true;
    }
  }
  return false;
}

/**
 * Calculate profile completeness percentage (0-100).
 *   Name (real name, not email prefix)    → 15 points
 *   Email (verified, present)             → 10 points
 *   Phone number                          → 15 points
 *   Resume/CV uploaded                    → 25 points  ← most important
 *   Headline / Job Title                  → 10 points
 *   Skills (at least 1)                   → 10 points
 *   Experience (at least 1 role/years)    → 10 points
 *   Education (at least 1 degree)         →  5 points
 *   TOTAL                                 → 100 points
 *   Minimum to unlock: 50 points (50%)
 */
function calculateProfileCompleteness(candidate) {
  if (!candidate) return { score: 0, details: {} };
  let score = 0;
  const details = {};

  // 1. Name (15 pts)
  let name = candidate.name || candidate.fullName || '';
  if (!name && (candidate.firstName || candidate.lastName)) {
    name = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
  }
  if (!name && candidate.personalInfo) {
    name = candidate.personalInfo.name || candidate.personalInfo.fullName ||
      `${candidate.personalInfo.firstName || ''} ${candidate.personalInfo.lastName || ''}`.trim();
  }
  if (!name && candidate.profile) {
    name = candidate.profile.name || candidate.profile.fullName || '';
  }
  const isRealName = name.length > 2 && !name.includes('@') && name !== 'Verified Candidate';
  if (isRealName) { score += 15; details.name = true; } else { details.name = false; }

  // 2. Email (10 pts)
  const email = candidate.email || candidate.personalInfo?.email || candidate.contact?.email || '';
  if (email && email.includes('@') && email.length > 5) { score += 10; details.email = true; } else { details.email = false; }

  // 3. Phone (15 pts)
  const phone = candidate.phone || candidate.phoneNumber || candidate.mobile ||
    candidate.mobileNumber || candidate.contactNumber ||
    candidate.personalInfo?.phone || candidate.personalInfo?.phoneNumber ||
    candidate.contact?.phone || candidate.profile?.phone || '';
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length >= 7) { score += 15; details.phone = true; } else { details.phone = false; }

  // 4. Resume (25 pts)
  const hasResume = candidateHasResume(candidate);
  if (hasResume) { score += 25; details.resume = true; } else { details.resume = false; }

  // 5. Headline (10 pts)
  const headline = candidate.headline || candidate.title || candidate.jobTitle ||
    candidate.designation || candidate.profession || candidate.currentRole ||
    candidate.profile?.headline || candidate.profile?.title || '';
  if (headline && headline.length > 2 && headline !== 'Candidate') { score += 10; details.headline = true; } else { details.headline = false; }

  // 6. Skills (10 pts)
  let hasSkills = false;
  if (Array.isArray(candidate.skills) && candidate.skills.length > 0) hasSkills = true;
  else if (typeof candidate.skills === 'string' && candidate.skills.trim().length > 2) hasSkills = true;
  else if (Array.isArray(candidate.keySkills) && candidate.keySkills.length > 0) hasSkills = true;
  else if (Array.isArray(candidate.profile?.skills) && candidate.profile.skills.length > 0) hasSkills = true;
  if (hasSkills) { score += 10; details.skills = true; } else { details.skills = false; }

  // 7. Experience (10 pts)
  let hasExp = false;
  if (candidate.totalExperience !== undefined && candidate.totalExperience !== null && candidate.totalExperience > 0) hasExp = true;
  else if (candidate.yearsOfExperience !== undefined && candidate.yearsOfExperience > 0) hasExp = true;
  else if (Array.isArray(candidate.experience) && candidate.experience.length > 0) hasExp = true;
  else if (Array.isArray(candidate.workExperience) && candidate.workExperience.length > 0) hasExp = true;
  else if (typeof candidate.experience === 'string' && candidate.experience.trim().length > 2) hasExp = true;
  if (hasExp) { score += 10; details.experience = true; } else { details.experience = false; }

  // 8. Education (5 pts)
  let hasEdu = false;
  if (Array.isArray(candidate.education) && candidate.education.length > 0) hasEdu = true;
  else if (typeof candidate.education === 'string' && candidate.education.trim().length > 2) hasEdu = true;
  else if (Array.isArray(candidate.profile?.education) && candidate.profile.education.length > 0) hasEdu = true;
  if (hasEdu) { score += 5; details.education = true; } else { details.education = false; }

  return { score, details };
}

function isCandidateQualified(candidate) {
  if (!candidate) return false;
  if (!candidateHasResume(candidate)) return false;
  const { score } = calculateProfileCompleteness(candidate);
  return score >= 50;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACT CANDIDATE DATA
// ═══════════════════════════════════════════════════════════════

function extractCandidateData(candidate) {
  if (!candidate) return null;
  const id = candidate._id ? candidate._id.toString() : '';

  let name = candidate.name || candidate.fullName || '';
  if (!name && (candidate.firstName || candidate.lastName)) {
    name = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
  }
  if (!name && candidate.personalInfo) {
    name = candidate.personalInfo.name || candidate.personalInfo.fullName ||
      `${candidate.personalInfo.firstName || ''} ${candidate.personalInfo.lastName || ''}`.trim();
  }
  if (!name && candidate.profile) {
    name = candidate.profile.name || candidate.profile.fullName || '';
  }
  if (!name) {
    name = candidate.username || (candidate.email ? candidate.email.split('@')[0] : 'Verified Candidate');
  }

  const email = candidate.email || candidate.personalInfo?.email ||
    candidate.contact?.email || candidate.profile?.email || candidate.contactEmail || '';

  const phone = candidate.phone || candidate.phoneNumber || candidate.mobile ||
    candidate.mobileNumber || candidate.contactNumber ||
    candidate.personalInfo?.phone || candidate.personalInfo?.phoneNumber ||
    candidate.personalInfo?.mobile || candidate.contact?.phone ||
    candidate.profile?.phone || candidate.profile?.phoneNumber || candidate.profile?.mobile || '';

  let resumeUrl = '';
  if (typeof candidate.resume === 'string' && candidate.resume.trim()) {
    resumeUrl = candidate.resume.trim();
  } else if (candidate.resume && typeof candidate.resume === 'object') {
    resumeUrl = candidate.resume.url || candidate.resume.fileUrl || candidate.resume.path ||
      candidate.resume.secure_url || candidate.resume.location || '';
  } else if (typeof candidate.resumeUrl === 'string') {
    resumeUrl = candidate.resumeUrl;
  } else if (typeof candidate.cv === 'string') {
    resumeUrl = candidate.cv;
  } else if (candidate.cv && typeof candidate.cv === 'object') {
    resumeUrl = candidate.cv.url || candidate.cv.fileUrl || candidate.cv.path || '';
  } else if (typeof candidate.cvUrl === 'string') {
    resumeUrl = candidate.cvUrl;
  } else if (candidate.profile?.resume) {
    resumeUrl = typeof candidate.profile.resume === 'string'
      ? candidate.profile.resume : (candidate.profile.resume.url || candidate.profile.resume.fileUrl || '');
  } else if (candidate.personalInfo?.resume) {
    resumeUrl = typeof candidate.personalInfo.resume === 'string'
      ? candidate.personalInfo.resume : (candidate.personalInfo.resume.url || '');
  }

  const headline = candidate.headline || candidate.title || candidate.jobTitle ||
    candidate.designation || candidate.profession || candidate.currentRole ||
    candidate.profile?.headline || candidate.profile?.title || candidate.profile?.designation || 'Candidate';

  let location = 'Location not specified';
  if (typeof candidate.location === 'string' && candidate.location.trim()) {
    location = candidate.location.trim();
  } else if (candidate.location && typeof candidate.location === 'object') {
    const parts = [candidate.location.city, candidate.location.state, candidate.location.country].filter(Boolean);
    if (parts.length > 0) location = parts.join(', ');
  } else if (candidate.city) {
    location = candidate.city;
  } else if (candidate.profile?.location) {
    location = typeof candidate.profile.location === 'string'
      ? candidate.profile.location : (candidate.profile.location.city || 'Location not specified');
  } else if (candidate.personalInfo?.city) {
    location = candidate.personalInfo.city;
  }

  let skills = [];
  if (Array.isArray(candidate.skills)) {
    skills = candidate.skills.map((s) => (typeof s === 'object' ? s.name || s.skill || '' : String(s))).filter(Boolean);
  } else if (typeof candidate.skills === 'string' && candidate.skills.trim()) {
    skills = candidate.skills.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(candidate.keySkills)) {
    skills = candidate.keySkills.map(String).filter(Boolean);
  } else if (Array.isArray(candidate.profile?.skills)) {
    skills = candidate.profile.skills.map(String).filter(Boolean);
  }

  let experience = '';
  if (candidate.totalExperience !== undefined && candidate.totalExperience !== null) {
    experience = `${candidate.totalExperience} years`;
  } else if (candidate.yearsOfExperience !== undefined && candidate.yearsOfExperience !== null) {
    experience = `${candidate.yearsOfExperience} years`;
  } else if (Array.isArray(candidate.experience) && candidate.experience.length > 0) {
    experience = `${candidate.experience.length} roles`;
  } else if (typeof candidate.experience === 'string') {
    experience = candidate.experience;
  }

  let education = '';
  if (Array.isArray(candidate.education) && candidate.education.length > 0) {
    education = candidate.education
      .map((e) => (typeof e === 'object' ? `${e.degree || e.course || ''} ${e.institution || e.college || ''}`.trim() : String(e)))
      .filter(Boolean).join(', ');
  } else if (typeof candidate.education === 'string') {
    education = candidate.education;
  }

  const profilePicture = candidate.profilePicture || candidate.avatar || candidate.photo ||
    candidate.image || candidate.profileImage ||
    candidate.profile?.avatar || candidate.profile?.profilePicture || '';

  const completeness = calculateProfileCompleteness(candidate);

  return {
    _id: id,
    candidateId: id,
    name,
    email,
    phone,
    hasResume: Boolean(resumeUrl),
    resumeUrl,
    headline,
    location,
    skills,
    experience,
    education,
    profilePicture,
    role: candidate.role || 'candidate',
    profileCompleteness: completeness.score,
    profileCompletenessDetails: completeness.details,
  };
}

// ═══════════════════════════════════════════════════════════════
// RECRUITER/ADMIN CHECK
// ═══════════════════════════════════════════════════════════════

function isRecruiterOrAdmin(doc, recruiterIdStr, recruiterEmail) {
  if (!doc) return false;
  const docId = doc._id ? doc._id.toString() : '';
  const docEmail = (doc.email || '').toLowerCase().trim();
  const recEmail = (recruiterEmail || '').toLowerCase().trim();

  if (docId === recruiterIdStr) return true;
  if (recEmail && docEmail && docEmail === recEmail) return true;

  const role = (doc.role || '').toLowerCase();
  if (['admin', 'superadmin', 'recruiter', 'employer', 'company', 'organization'].includes(role)) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

class ProfilePurchaseService {

  async getRecruiterCredits(recruiterId) {
    try {
      const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
      let credit = await RecruiterCredit.findOne({ recruiterId: rId });
      if (!credit) {
        credit = await RecruiterCredit.create({ recruiterId: rId, balance: 0, totalPurchased: 0, totalExpended: 0 });
      }
      return credit;
    } catch (err) {
      console.error('[ProfilePurchaseService] getRecruiterCredits error:', err.message);
      return { balance: 0, totalPurchased: 0, totalExpended: 0 };
    }
  }

  async grantCredits(recruiterId, quantity, session = null) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Invalid credit quantity');
    const opts = session ? { session, new: true, upsert: true } : { new: true, upsert: true };
    return await RecruiterCredit.findOneAndUpdate(
      { recruiterId: rId },
      { $inc: { balance: qty, totalPurchased: qty } },
      opts
    );
  }

  async spendCredits(recruiterId, quantity, session = null) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Invalid credit quantity to spend');
    const current = await RecruiterCredit.findOne({ recruiterId: rId });
    if (!current || current.balance < qty) {
      throw new Error(`Insufficient credits. Available: ${current ? current.balance : 0}, Required: ${qty}`);
    }
    const opts = session ? { session, new: true } : { new: true };
    const updated = await RecruiterCredit.findOneAndUpdate(
      { recruiterId: rId, balance: { $gte: qty } },
      { $inc: { balance: -qty, totalExpended: qty } },
      opts
    );
    if (!updated) throw new Error('Credit deduction failed due to concurrent modification');
    return updated;
  }

  async getActivePricing() {
    if (ProfilePricing) {
      try {
        const pricing = typeof ProfilePricing.getActivePricing === 'function'
          ? await ProfilePricing.getActivePricing()
          : await ProfilePricing.findOne({ enabled: true });
        if (pricing) {
          return {
            price: pricing.price !== undefined ? pricing.price : 2,
            priceInPaise: pricing.priceInPaise !== undefined ? pricing.priceInPaise : Math.round((pricing.price || 2) * 100),
            currency: pricing.currency || 'INR',
            minQuantity: pricing.minQuantity || 1,
            maxQuantity: pricing.maxQuantity || 100,
            enabled: pricing.enabled !== undefined ? pricing.enabled : true,
            description: pricing.description || 'Candidate Profile Direct Unlock',
          };
        }
      } catch (err) {
        console.warn('[ProfilePurchaseService] Pricing model query warning:', err.message);
      }
    }
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const rawPricing = await adminDb.collection('profilepricings').findOne({ enabled: true });
        if (rawPricing) {
          return {
            price: rawPricing.price || 2,
            priceInPaise: rawPricing.priceInPaise || Math.round((rawPricing.price || 2) * 100),
            currency: rawPricing.currency || 'INR',
            minQuantity: rawPricing.minQuantity || 1,
            maxQuantity: rawPricing.maxQuantity || 100,
            enabled: rawPricing.enabled !== undefined ? rawPricing.enabled : true,
            description: rawPricing.description || 'Candidate Profile Direct Unlock',
          };
        }
      }
    } catch (nativeErr) {
      console.warn('[ProfilePurchaseService] Native pricing fallback warning:', nativeErr.message);
    }
    return { price: 2, priceInPaise: 200, currency: 'INR', minQuantity: 1, maxQuantity: 100, enabled: true, description: 'Candidate Profile Direct Unlock' };
  }

  async getQuote(quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be a positive integer');
    const pricing = await this.getActivePricing();
    if (!pricing.enabled) throw new Error('Candidate profile purchases are currently disabled');
    if (qty < pricing.minQuantity) throw new Error(`Minimum purchase quantity is ${pricing.minQuantity}`);
    if (qty > pricing.maxQuantity) throw new Error(`Maximum purchase quantity is ${pricing.maxQuantity}`);
    const unitPriceInPaise = pricing.priceInPaise || Math.round(pricing.price * 100);
    const totalAmountInPaise = unitPriceInPaise * qty;
    return {
      quantity: qty, unitPrice: pricing.price, unitPriceInPaise,
      totalAmount: totalAmountInPaise / 100, totalAmountInPaise,
      currency: pricing.currency || 'INR',
      pricingSnapshot: { price: pricing.price, priceInPaise: unitPriceInPaise, currency: pricing.currency || 'INR', description: pricing.description },
    };
  }

  async createOrder(recruiterId, quantity) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const quote = await this.getQuote(quantity);
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    let razorpayOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    if (razorpayKeyId && razorpayKeySecret && !razorpayKeyId.includes('dummy')) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
        const rzpOrder = await razorpay.orders.create({
          amount: quote.totalAmountInPaise, currency: quote.currency,
          receipt: `rcpt_cr_${Date.now().toString().slice(-8)}`,
          notes: { recruiterId: rId.toString(), quantity: String(quote.quantity), type: 'candidate_profile_credits' },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        console.error('[ProfilePurchaseService] Razorpay order creation failed:', err.message);
        throw new Error(`Payment gateway initialization failed: ${err.message}`);
      }
    }

    // Ensure razorpayOrderId is NEVER null (prevents duplicate key errors)
    const finalOrderId = razorpayOrderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const purchase = await ProfilePurchase.create({
      recruiterId: rId,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      unitPriceInPaise: quote.unitPriceInPaise,
      unitPriceInRupees: quote.unitPrice,
      totalAmount: quote.totalAmount,
      totalAmountInPaise: quote.totalAmountInPaise,
      totalAmountInRupees: quote.totalAmount,
      currency: quote.currency,
      paymentStatus: 'pending',
      status: 'created',
      razorpayOrderId: finalOrderId,
      orderId: finalOrderId,
      pricingSnapshot: quote.pricingSnapshot,
    });

    return {
      purchaseId: purchase._id, orderId: finalOrderId,
      amount: quote.totalAmountInPaise, amountInRupees: quote.totalAmount,
      currency: quote.currency, quantity: quote.quantity,
      keyId: razorpayKeyId || 'rzp_test_placeholder',
    };
  }

  async verifyPayment(recruiterId, { purchaseId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    let purchase = null;

    if (purchaseId && mongoose.Types.ObjectId.isValid(purchaseId)) {
      purchase = await ProfilePurchase.findOne({ _id: purchaseId, recruiterId: rId });
    }
    if (!purchase && razorpayOrderId) {
      purchase = await ProfilePurchase.findOne({ recruiterId: rId, $or: [{ razorpayOrderId }, { orderId: razorpayOrderId }] });
    }
    if (!purchase) throw new Error('Purchase record not found for verification');

    if (purchase.paymentStatus === 'completed' || purchase.status === 'paid') {
      const credits = await this.getRecruiterCredits(rId);
      return { success: true, alreadyProcessed: true, purchase, credits };
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpayKeySecret && razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha256', razorpayKeySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
      if (expectedSignature !== razorpaySignature) {
        purchase.paymentStatus = 'failed'; purchase.status = 'failed';
        await purchase.save();
        throw new Error('Invalid payment signature. Transaction rejected.');
      }
    }

    purchase.paymentStatus = 'completed'; purchase.status = 'paid';
    purchase.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    purchase.razorpaySignature = razorpaySignature || 'mock_sig';
    purchase.paymentId = razorpayPaymentId || purchase.paymentId;
    purchase.purchasedAt = new Date();
    await purchase.save();

    const updatedCredits = await this.grantCredits(rId, purchase.quantity);
    console.log(`[ProfilePurchaseService] ✅ Added ${purchase.quantity} credits to recruiter ${rId}. New balance: ${updatedCredits.balance}`);
    return { success: true, purchase, credits: updatedCredits };
  }

  async unlockCandidate(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    let existing = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (!existing) existing = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId });
    if (existing) {
      const credits = await this.getRecruiterCredits(rId);
      return { success: true, alreadyUnlocked: true, entitlement: existing, credits };
    }

    const updatedCredits = await this.spendCredits(rId, 1);
    const entitlement = await ProfileEntitlement.create({
      recruiterId: rId, candidateId: cId, status: 'active', unlockedAt: new Date(),
    });
    return { success: true, entitlement, credits: updatedCredits };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔑 MAIN AUTO-REVEAL PIPELINE (WITH 50% COMPLETENESS FILTER)
  // ═══════════════════════════════════════════════════════════════

  async getUnlockedProfilesWithAutoReveal(recruiterId, recruiterEmail) {
    try {
      const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
      const rIdStr = rId.toString();
      const rEmail = (recruiterEmail || '').toLowerCase().trim();

      console.log(`\n[ProfilePurchase] 🔍 Auto-reveal START for recruiter ${rIdStr} (${rEmail})`);

      const adminDb = getAdminDb();
      const AdminCandidateUser = getAdminCandidateUserModel();

      // ── Step 1: Diagnostic counts ──
      let totalInUsers = 0;
      let qualifiedInUsers = 0;
      try {
        if (adminDb) {
          totalInUsers = await adminDb.collection('users').countDocuments({});
          qualifiedInUsers = await adminDb.collection('users').countDocuments({
            $or: [
              { resume: { $exists: true, $ne: null, $ne: '' } },
              { resumeUrl: { $exists: true, $ne: null, $ne: '' } },
              { cv: { $exists: true, $ne: null, $ne: '' } },
              { cvUrl: { $exists: true, $ne: null, $ne: '' } },
              { 'profile.resume': { $exists: true, $ne: null, $ne: '' } },
              { 'personalInfo.resume': { $exists: true, $ne: null, $ne: '' } },
            ],
          });
        } else {
          totalInUsers = await AdminCandidateUser.countDocuments({});
        }
      } catch (err) {
        console.warn('[ProfilePurchase] Count error:', err.message);
      }
      console.log(`[ProfilePurchase] 📊 Total in careerflow_admin.users: ${totalInUsers}, With resume: ${qualifiedInUsers}`);

      // ── Step 2: Fetch active entitlements ──
      let entitlements = [];
      try {
        entitlements = await ProfileEntitlement.find({
          recruiterId: rId,
          $or: [{ status: 'active' }, { status: { $exists: false } }],
        }).lean();
      } catch (entErr) {
        try { entitlements = await ProfileEntitlement.find({ recruiterId: rId }).lean(); } catch (e2) { /* ignore */ }
      }
      console.log(`[ProfilePurchase] 📋 Existing entitlements: ${entitlements.length}`);

      // ── Step 3: Check credits ──
      const creditDoc = await RecruiterCredit.findOne({ recruiterId: rId });
      let availableBalance = creditDoc ? creditDoc.balance : 0;
      console.log(`[ProfilePurchase] 💰 Credit balance: ${availableBalance}`);

      // ── Step 4: Purge self-entitlements ──
      const validEntitlements = [];
      let refundedCount = 0;

      for (const ent of entitlements) {
        const candIdStr = ent.candidateId ? ent.candidateId.toString() : '';
        let isSelf = candIdStr === rIdStr;

        if (!isSelf && rEmail && adminDb) {
          try {
            const candDoc = await adminDb.collection('users').findOne({ _id: ent.candidateId });
            if (candDoc && isRecruiterOrAdmin(candDoc, rIdStr, rEmail)) isSelf = true;
          } catch (e) { /* ignore */ }
        }

        if (isSelf) {
          try { await ProfileEntitlement.deleteOne({ _id: ent._id }); refundedCount++; } catch (delErr) { /* ignore */ }
        } else {
          validEntitlements.push(ent);
        }
      }

      if (refundedCount > 0) {
        await RecruiterCredit.findOneAndUpdate(
          { recruiterId: rId },
          { $inc: { balance: refundedCount, totalExpended: -refundedCount } }
        );
        availableBalance += refundedCount;
        console.log(`[ProfilePurchase] ↩️ Purged & refunded ${refundedCount} self-entitlements`);
      }

      entitlements = validEntitlements;
      const alreadyUnlockedIds = entitlements
        .map((e) => (e.candidateId ? e.candidateId.toString() : ''))
        .filter(Boolean);

      // ── Step 5: Auto-reveal with 50% completeness + resume filter ──
      if (availableBalance > 0 && totalInUsers > 0) {
        console.log(`[ProfilePurchase] 🎯 Auto-revealing up to ${availableBalance} QUALIFIED candidates (≥50% profile + resume)...`);

        const excludeObjIds = [...alreadyUnlockedIds, rIdStr]
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const candidateFilter = {
          _id: { $nin: excludeObjIds },
          role: {
            $nin: ['admin', 'superadmin', 'recruiter', 'employer', 'company', 'organization',
              'Admin', 'Recruiter', 'Employer', 'SUPERADMIN'],
          },
          $or: [
            { resume: { $exists: true, $ne: null, $ne: '' } },
            { resumeUrl: { $exists: true, $ne: null, $ne: '' } },
            { cv: { $exists: true, $ne: null, $ne: '' } },
            { cvUrl: { $exists: true, $ne: null, $ne: '' } },
            { 'profile.resume': { $exists: true, $ne: null, $ne: '' } },
            { 'personalInfo.resume': { $exists: true, $ne: null, $ne: '' } },
          ],
        };
        if (rEmail) candidateFilter.email = { $ne: rEmail };

        let qualifiedCandidates = [];
        let fetchAttempts = 0;
        const maxFetchAttempts = 5;
        let batchSize = Math.max(availableBalance * 3, 20);

        while (qualifiedCandidates.length < availableBalance && fetchAttempts < maxFetchAttempts) {
          fetchAttempts++;
          let rawCandidates = [];

          if (adminDb && rawCandidates.length === 0) {
            try {
              rawCandidates = await adminDb.collection('users')
                .aggregate([
                  { $match: candidateFilter },
                  { $sample: { size: batchSize } },
                ]).toArray();
            } catch (aggErr) {
              console.warn('[ProfilePurchase] Aggregate error:', aggErr.message);
            }
          }

          if (adminDb && rawCandidates.length === 0) {
            try {
              rawCandidates = await adminDb.collection('users')
                .find(candidateFilter)
                .limit(batchSize)
                .toArray();
            } catch (findErr) {
              console.warn('[ProfilePurchase] Find error:', findErr.message);
            }
          }

          if (rawCandidates.length === 0) {
            try {
              rawCandidates = await AdminCandidateUser.find(candidateFilter).limit(batchSize).lean();
            } catch (mErr) {
              console.warn('[ProfilePurchase] Mongoose error:', mErr.message);
            }
          }

          if (!rawCandidates || rawCandidates.length === 0) {
            console.warn(`[ProfilePurchase] ⚠️ No candidates with resume found (attempt ${fetchAttempts})`);
            break;
          }

          const alreadyQualifiedIds = new Set(qualifiedCandidates.map((c) => c._id.toString()));

          for (const candidate of rawCandidates) {
            if (qualifiedCandidates.length >= availableBalance) break;

            const cIdStr = candidate._id ? candidate._id.toString() : '';
            if (alreadyQualifiedIds.has(cIdStr)) continue;
            if (isRecruiterOrAdmin(candidate, rIdStr, rEmail)) continue;

            const completeness = calculateProfileCompleteness(candidate);

            if (completeness.score >= 50) {
              qualifiedCandidates.push(candidate);
              alreadyQualifiedIds.add(cIdStr);
              console.log(`[ProfilePurchase] ✅ Qualified: ${candidate.name || candidate.email} (score: ${completeness.score}%)`);
            } else {
              console.log(`[ProfilePurchase] ❌ Skipped (incomplete): ${candidate.name || candidate.email} (score: ${completeness.score}%, resume: ${completeness.details.resume})`);
            }
          }

          batchSize = batchSize * 2;

          const newExcludeIds = rawCandidates.map((c) => c._id).filter(Boolean);
          if (candidateFilter._id && candidateFilter._id.$nin) {
            candidateFilter._id.$nin = [...candidateFilter._id.$nin, ...newExcludeIds];
          }

          console.log(`[ProfilePurchase] 📊 Attempt ${fetchAttempts}: found ${qualifiedCandidates.length}/${availableBalance} qualified candidates`);
        }

        if (qualifiedCandidates.length > 0) {
          const countToUnlock = Math.min(qualifiedCandidates.length, availableBalance);
          console.log(`[ProfilePurchase] 🔑 Unlocking ${countToUnlock} qualified candidates...`);

          for (let i = 0; i < countToUnlock; i++) {
            const candidate = qualifiedCandidates[i];
            const candId = candidate._id;
            try {
              await this.spendCredits(rId, 1);
              const newEntitlement = await ProfileEntitlement.create({
                recruiterId: rId,
                candidateId: candId,
                candidateEmail: (candidate.email || '').toLowerCase(),
                status: 'active',
                unlockedAt: new Date(),
                source: 'credit_auto_reveal',
              });
              entitlements.push(newEntitlement.toObject ? newEntitlement.toObject() : newEntitlement);
              const completeness = calculateProfileCompleteness(candidate);
              console.log(`[ProfilePurchase] 🔓 Auto-unlocked: ${candidate.name || candidate.email} (completeness: ${completeness.score}%)`);
            } catch (unlockErr) {
              console.error(`[ProfilePurchase] ❌ Error unlocking ${candId}:`, unlockErr.message);
            }
          }
        } else {
          console.warn(`[ProfilePurchase] ⚠️ No candidates in careerflow_admin.users meet the 50% completeness + resume requirement`);
          console.warn(`[ProfilePurchase] 💡 Out of ${totalInUsers} total users, only ${qualifiedInUsers} have a resume uploaded`);
        }
      } else if (availableBalance <= 0) {
        console.log('[ProfilePurchase] ℹ️ No credits available for auto-reveal');
      }

      // ── Step 6: Hydrate ALL unlocked profiles ──
      const candidateIds = entitlements
        .map((e) => e.candidateId)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
        .map((id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id));

      let candidateDocs = [];
      if (candidateIds.length > 0) {
        if (adminDb) {
          try { candidateDocs = await adminDb.collection('users').find({ _id: { $in: candidateIds } }).toArray(); } catch (e) { /* ignore */ }
        }
        if (!candidateDocs || candidateDocs.length === 0) {
          try { candidateDocs = await AdminCandidateUser.find({ _id: { $in: candidateIds } }).lean(); } catch (e) { /* ignore */ }
        }
      }

      const candidateMap = new Map();
      if (candidateDocs) {
        for (const doc of candidateDocs) candidateMap.set(doc._id.toString(), doc);
      }

      const profiles = [];
      for (const ent of entitlements) {
        const candIdStr = ent.candidateId ? ent.candidateId.toString() : '';
        if (!candIdStr) continue;
        const rawCandidate = candidateMap.get(candIdStr);
        if (!rawCandidate) continue;
        if (isRecruiterOrAdmin(rawCandidate, rIdStr, rEmail)) continue;

        const extracted = extractCandidateData(rawCandidate);
        if (extracted) {
          profiles.push({
            ...extracted,
            entitlementId: ent._id,
            unlockedAt: ent.unlockedAt || ent.createdAt,
            sourceCollection: 'careerflow_admin.users',
          });
        }
      }

      profiles.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
      const finalCredits = await this.getRecruiterCredits(rId);

      console.log(`[ProfilePurchase] 🏁 DONE. Profiles: ${profiles.length}, Balance: ${finalCredits.balance}`);
      if (profiles.length > 0) {
        profiles.forEach((p) => {
          console.log(`   → ${p.name} | email: ${p.email ? '✅' : '❌'} | phone: ${p.phone ? '✅' : '❌'} | resume: ${p.hasResume ? '✅' : '❌'} | completeness: ${p.profileCompleteness}%`);
        });
      }
      console.log('');

      return {
        profiles,
        totalUnlocked: profiles.length,
        credits: finalCredits,
        _debug: {
          totalInAdminUsersCollection: totalInUsers,
          candidatesWithResume: qualifiedInUsers,
          recruiterEmail: rEmail,
          entitlementCount: entitlements.length,
          hydratedCount: profiles.length,
          availableBalance: finalCredits.balance,
          adminDbConnected: !!adminDb,
        },
      };

    } catch (fatalErr) {
      console.error('[ProfilePurchase] 💥 FATAL ERROR in auto-reveal:', fatalErr.message);
      console.error(fatalErr.stack);
      const fallbackCredits = await this.getRecruiterCredits(recruiterId).catch(() => ({ balance: 0, totalPurchased: 0, totalExpended: 0 }));
      return { profiles: [], totalUnlocked: 0, credits: fallbackCredits, _debug: { error: fatalErr.message } };
    }
  }

  async getPurchases(recruiterId) {
    try {
      const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
      let purchases = await ProfilePurchase.find({ recruiterId: rId }).sort({ createdAt: -1 }).lean();
      if (!purchases || purchases.length === 0) {
        purchases = await ProfilePurchase.find({ recruiterId: rId.toString() }).sort({ createdAt: -1 }).lean();
      }
      if (purchases && purchases.length > 0) {
        purchases = purchases.map((p) => ({
          ...p,
          totalAmount: Number(p.totalAmount || p.totalAmountInRupees || (p.totalAmountInPaise ? p.totalAmountInPaise / 100 : 0) || 0),
          totalAmountInPaise: Number(p.totalAmountInPaise || (p.totalAmount ? p.totalAmount * 100 : 0) || 0),
          quantity: Number(p.quantity || 0),
        }));
      }
      return purchases || [];
    } catch (err) {
      console.error('[ProfilePurchaseService] getPurchases error:', err.message);
      return [];
    }
  }

  async getResumeStreamInfo(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    let entitlement = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (!entitlement) entitlement = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId });
    if (!entitlement) throw new Error('You have not unlocked this candidate profile yet');

    let candDoc = null;
    const adminDb = getAdminDb();
    if (adminDb) candDoc = await adminDb.collection('users').findOne({ _id: cId });
    if (!candDoc) {
      const AdminCandidateUser = getAdminCandidateUserModel();
      candDoc = await AdminCandidateUser.findOne({ _id: cId }).lean();
    }
    if (!candDoc) throw new Error('Candidate not found');

    const extracted = extractCandidateData(candDoc);
    return { candidateId: cId.toString(), name: extracted.name, resumeUrl: extracted.resumeUrl, hasResume: extracted.hasResume };
  }
}

module.exports = new ProfilePurchaseService();