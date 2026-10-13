const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════
// SAFE IMPORTS — Never crash the module if a file is missing
// ═══════════════════════════════════════════════════════════════

function safeRequire(path) {
  try {
    return require(path);
  } catch (e) {
    return null;
  }
}

// --- Admin DB Connection ---
let getAdminConnection = null;
try {
  const dbModule = require('../../config/db');
  getAdminConnection = dbModule.getAdminConnection || null;
} catch (e) {
  console.warn('[ProfilePurchaseService] Could not load getAdminConnection from db.js');
}

// --- Pricing Model ---
let ProfilePricing = safeRequire('../../models/profilePricingModel');

// ═══════════════════════════════════════════════════════════════
// MODEL LOADING — Try recruiterCreditModel.js first (has all 3),
// then separate files, then inline schemas as last resort
// ═══════════════════════════════════════════════════════════════

let RecruiterCredit = null;
let ProfileEntitlement = null;
let ProfilePurchase = null;

// Attempt 1: Load from the combined recruiterCreditModel.js
const combinedModel = safeRequire('../../models/recruiterCreditModel');
if (combinedModel) {
  RecruiterCredit = combinedModel.RecruiterCredit || null;
  ProfileEntitlement = combinedModel.ProfileEntitlement || null;
  ProfilePurchase = combinedModel.ProfilePurchase || null;
}

// Attempt 2: Load from separate files if still missing
if (!ProfileEntitlement) {
  const entModel = safeRequire('../../models/profileEntitlementModel');
  if (entModel) {
    ProfileEntitlement = entModel.ProfileEntitlement || entModel.default || entModel;
  }
}
if (!ProfilePurchase) {
  const purModel = safeRequire('../../models/profilePurchaseModel');
  if (purModel) {
    ProfilePurchase = purModel.ProfilePurchase || purModel.default || purModel;
  }
}

// Attempt 3: Inline schema definitions (guaranteed to work)
if (!RecruiterCredit) {
  const creditSchema = new mongoose.Schema(
    {
      recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
      balance: { type: Number, default: 0, min: 0 },
      totalPurchased: { type: Number, default: 0 },
      totalExpended: { type: Number, default: 0 },
    },
    { timestamps: true, collection: 'recruiter_credits' }
  );
  RecruiterCredit = mongoose.models.RecruiterCredit || mongoose.model('RecruiterCredit', creditSchema);
  console.log('[ProfilePurchaseService] ✅ RecruiterCredit model created inline');
}

if (!ProfileEntitlement) {
  const entitlementSchema = new mongoose.Schema(
    {
      recruiterId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
      candidateId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
      candidateEmail: { type: String, lowercase: true, trim: true, default: '' },
      status: { type: String, default: 'active', index: true },
      unlockedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'credit_auto_reveal' },
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
    },
    { timestamps: true, collection: 'profile_entitlements' }
  );
  entitlementSchema.index({ recruiterId: 1, candidateId: 1 }, { unique: true });
  ProfileEntitlement = mongoose.models.ProfileEntitlement || mongoose.model('ProfileEntitlement', entitlementSchema);
  console.log('[ProfilePurchaseService] ✅ ProfileEntitlement model created inline');
}

if (!ProfilePurchase) {
  const purchaseSchema = new mongoose.Schema(
    {
      recruiterId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
      orderId: { type: String, default: null, index: true },
      razorpayOrderId: { type: String, default: null, index: true },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      paymentId: { type: String, default: null },
      signature: { type: String, default: null },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, default: 0 },
      unitPriceInPaise: { type: Number, default: 0 },
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
    },
    { timestamps: true, collection: 'profile_purchases' }
  );
  ProfilePurchase = mongoose.models.ProfilePurchase || mongoose.model('ProfilePurchase', purchaseSchema);
  console.log('[ProfilePurchaseService] ✅ ProfilePurchase model created inline');
}

console.log('[ProfilePurchaseService] ✅ All models loaded successfully');

// ═══════════════════════════════════════════════════════════════
// ADMIN CANDIDATE USER MODEL (careerflow_admin.users)
// ═══════════════════════════════════════════════════════════════

let AdminUserModel = null;

function getAdminCandidateUserModel() {
  if (AdminUserModel) return AdminUserModel;

  let adminConn = null;

  // Try getAdminConnection first
  if (typeof getAdminConnection === 'function') {
    try {
      adminConn = getAdminConnection();
    } catch (err) {
      console.warn('[ProfilePurchaseService] getAdminConnection() error:', err.message);
    }
  }

  // Fallback: search mongoose connections
  if (!adminConn) {
    for (const conn of mongoose.connections) {
      if (conn.name === 'careerflow_admin' || (conn.db && conn.db.databaseName === 'careerflow_admin')) {
        adminConn = conn;
        break;
      }
    }
  }

  // Last resort: use default mongoose
  if (!adminConn) {
    adminConn = mongoose;
  }

  // Check if model already exists on this connection
  if (adminConn.models && adminConn.models.AdminCandidateUser) {
    AdminUserModel = adminConn.models.AdminCandidateUser;
    return AdminUserModel;
  }

  // Create model with strict: false to read ALL fields from careerflow_admin.users
  const adminCandidateUserSchema = new mongoose.Schema(
    {},
    { timestamps: true, collection: 'users', strict: false }
  );

  try {
    AdminUserModel = adminConn.model('AdminCandidateUser', adminCandidateUserSchema);
  } catch (e) {
    // If model already registered, retrieve it
    AdminUserModel = adminConn.models.AdminCandidateUser || mongoose.models.AdminCandidateUser;
  }

  return AdminUserModel;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get a working admin DB reference (native driver)
// ═══════════════════════════════════════════════════════════════

function getAdminDb() {
  try {
    if (typeof getAdminConnection === 'function') {
      const conn = getAdminConnection();
      if (conn && conn.db) return conn.db;
      if (conn && conn.readyState === 1 && conn.db) return conn.db;
    }
  } catch (e) {
    // ignore
  }

  // Fallback: search all mongoose connections
  for (const conn of mongoose.connections) {
    if ((conn.name === 'careerflow_admin' || (conn.db && conn.db.databaseName === 'careerflow_admin')) && conn.db) {
      return conn.db;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Extract real candidate data from careerflow_admin.users doc
// ═══════════════════════════════════════════════════════════════

function extractCandidateData(candidate) {
  if (!candidate) return null;
  const id = candidate._id ? candidate._id.toString() : '';

  // --- Name ---
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

  // --- Email ---
  const email = candidate.email ||
    candidate.personalInfo?.email ||
    candidate.contact?.email ||
    candidate.profile?.email ||
    candidate.contactEmail || '';

  // --- Phone ---
  const phone = candidate.phone ||
    candidate.phoneNumber ||
    candidate.mobile ||
    candidate.mobileNumber ||
    candidate.contactNumber ||
    candidate.personalInfo?.phone ||
    candidate.personalInfo?.phoneNumber ||
    candidate.personalInfo?.mobile ||
    candidate.contact?.phone ||
    candidate.profile?.phone ||
    candidate.profile?.phoneNumber ||
    candidate.profile?.mobile || '';

  // --- Resume ---
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
      ? candidate.profile.resume
      : (candidate.profile.resume.url || candidate.profile.resume.fileUrl || '');
  } else if (candidate.personalInfo?.resume) {
    resumeUrl = typeof candidate.personalInfo.resume === 'string'
      ? candidate.personalInfo.resume
      : (candidate.personalInfo.resume.url || '');
  }

  // --- Headline ---
  const headline = candidate.headline ||
    candidate.title ||
    candidate.jobTitle ||
    candidate.designation ||
    candidate.profession ||
    candidate.currentRole ||
    candidate.profile?.headline ||
    candidate.profile?.title ||
    candidate.profile?.designation || 'Candidate';

  // --- Location ---
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
      ? candidate.profile.location
      : (candidate.profile.location.city || 'Location not specified');
  } else if (candidate.personalInfo?.city) {
    location = candidate.personalInfo.city;
  }

  // --- Skills ---
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

  // --- Experience ---
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

  // --- Education ---
  let education = '';
  if (Array.isArray(candidate.education) && candidate.education.length > 0) {
    education = candidate.education
      .map((e) => (typeof e === 'object' ? `${e.degree || e.course || ''} ${e.institution || e.college || ''}`.trim() : String(e)))
      .filter(Boolean).join(', ');
  } else if (typeof candidate.education === 'string') {
    education = candidate.education;
  }

  // --- Avatar ---
  const profilePicture = candidate.profilePicture || candidate.avatar || candidate.photo ||
    candidate.image || candidate.profileImage ||
    candidate.profile?.avatar || candidate.profile?.profilePicture || '';

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
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Check if a document is the recruiter self or admin
// ═══════════════════════════════════════════════════════════════

function isRecruiterOrAdmin(doc, recruiterIdStr, recruiterEmail) {
  if (!doc) return false;
  const docId = doc._id ? doc._id.toString() : '';
  const docEmail = (doc.email || '').toLowerCase().trim();
  const recEmail = (recruiterEmail || '').toLowerCase().trim();

  if (docId === recruiterIdStr) return true;
  if (recEmail && docEmail && docEmail === recEmail) return true;

  const role = (doc.role || '').toLowerCase();
  if (['admin', 'superadmin', 'recruiter', 'employer', 'company', 'organization'].includes(role)) {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

class ProfilePurchaseService {

  // ───────────────────────────────────────────
  // CREDITS
  // ───────────────────────────────────────────

  async getRecruiterCredits(recruiterId) {
    try {
      const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
      let credit = await RecruiterCredit.findOne({ recruiterId: rId });
      if (!credit) {
        credit = await RecruiterCredit.create({
          recruiterId: rId,
          balance: 0,
          totalPurchased: 0,
          totalExpended: 0,
        });
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
    const updated = await RecruiterCredit.findOneAndUpdate(
      { recruiterId: rId },
      { $inc: { balance: qty, totalPurchased: qty } },
      opts
    );
    return updated;
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

    if (!updated) {
      throw new Error('Credit deduction failed due to concurrent modification');
    }
    return updated;
  }

  // ───────────────────────────────────────────
  // PRICING
  // ───────────────────────────────────────────

  async getActivePricing() {
    // Method 1: Mongoose model
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

    // Method 2: Native MongoDB query on careerflow_admin.profilepricings
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

    // Method 3: Hardcoded fallback
    return {
      price: 2,
      priceInPaise: 200,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 100,
      enabled: true,
      description: 'Candidate Profile Direct Unlock',
    };
  }

  async getQuote(quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be a positive integer');

    const pricing = await this.getActivePricing();
    if (!pricing.enabled) throw new Error('Candidate profile purchases are currently disabled by administration');
    if (qty < pricing.minQuantity) throw new Error(`Minimum purchase quantity is ${pricing.minQuantity}`);
    if (qty > pricing.maxQuantity) throw new Error(`Maximum purchase quantity is ${pricing.maxQuantity}`);

    const unitPriceInPaise = pricing.priceInPaise || Math.round(pricing.price * 100);
    const totalAmountInPaise = unitPriceInPaise * qty;

    return {
      quantity: qty,
      unitPrice: pricing.price,
      unitPriceInPaise,
      totalAmount: totalAmountInPaise / 100,
      totalAmountInPaise,
      currency: pricing.currency || 'INR',
      pricingSnapshot: {
        price: pricing.price,
        priceInPaise: unitPriceInPaise,
        currency: pricing.currency || 'INR',
        description: pricing.description,
      },
    };
  }

  // ───────────────────────────────────────────
  // ORDERS & PAYMENTS
  // ───────────────────────────────────────────

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
          amount: quote.totalAmountInPaise,
          currency: quote.currency,
          receipt: `rcpt_cr_${Date.now().toString().slice(-8)}`,
          notes: {
            recruiterId: rId.toString(),
            quantity: String(quote.quantity),
            type: 'candidate_profile_credits',
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        console.error('[ProfilePurchaseService] Razorpay order creation failed:', err.message);
        throw new Error(`Payment gateway initialization failed: ${err.message}`);
      }
    }

    const purchase = await ProfilePurchase.create({
      recruiterId: rId,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      unitPriceInPaise: quote.unitPriceInPaise,
      totalAmount: quote.totalAmount,
      totalAmountInPaise: quote.totalAmountInPaise,
      totalAmountInRupees: quote.totalAmount,
      currency: quote.currency,
      paymentStatus: 'pending',
      status: 'created',
      razorpayOrderId,
      orderId: razorpayOrderId,
      pricingSnapshot: quote.pricingSnapshot,
    });

    return {
      purchaseId: purchase._id,
      orderId: razorpayOrderId,
      amount: quote.totalAmountInPaise,
      amountInRupees: quote.totalAmount,
      currency: quote.currency,
      quantity: quote.quantity,
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
      purchase = await ProfilePurchase.findOne({
        recruiterId: rId,
        $or: [{ razorpayOrderId }, { orderId: razorpayOrderId }],
      });
    }
    if (!purchase) throw new Error('Purchase record not found for verification');

    if (purchase.paymentStatus === 'completed' || purchase.status === 'paid') {
      const credits = await this.getRecruiterCredits(rId);
      return { success: true, alreadyProcessed: true, purchase, credits };
    }

    // Verify Razorpay signature if real keys
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpayKeySecret && razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        purchase.paymentStatus = 'failed';
        purchase.status = 'failed';
        await purchase.save();
        throw new Error('Invalid payment signature. Transaction rejected.');
      }
    }

    purchase.paymentStatus = 'completed';
    purchase.status = 'paid';
    purchase.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    purchase.razorpaySignature = razorpaySignature || 'mock_sig';
    purchase.paymentId = razorpayPaymentId || purchase.paymentId;
    purchase.purchasedAt = new Date();
    await purchase.save();

    const updatedCredits = await this.grantCredits(rId, purchase.quantity);
    console.log(`[ProfilePurchaseService] ✅ Added ${purchase.quantity} credits to recruiter ${rId}. New balance: ${updatedCredits.balance}`);

    return { success: true, purchase, credits: updatedCredits };
  }

  // ───────────────────────────────────────────
  // UNLOCK SINGLE CANDIDATE
  // ───────────────────────────────────────────

  async unlockCandidate(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    // Check if already unlocked (try with and without status filter)
    let existing = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (!existing) {
      existing = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId });
    }

    if (existing) {
      const credits = await this.getRecruiterCredits(rId);
      return { success: true, alreadyUnlocked: true, entitlement: existing, credits };
    }

    const updatedCredits = await this.spendCredits(rId, 1);

    const entitlement = await ProfileEntitlement.create({
      recruiterId: rId,
      candidateId: cId,
      status: 'active',
      unlockedAt: new Date(),
    });

    return { success: true, entitlement, credits: updatedCredits };
  }

  // ───────────────────────────────────────────
  // 🔑 MAIN AUTO-REVEAL PIPELINE
  // ───────────────────────────────────────────

  async getUnlockedProfilesWithAutoReveal(recruiterId, recruiterEmail) {
    try {
      const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
      const rIdStr = rId.toString();
      const rEmail = (recruiterEmail || '').toLowerCase().trim();

      console.log(`\n[ProfilePurchase] 🔍 Auto-reveal START for recruiter ${rIdStr} (${rEmail})`);

      const adminDb = getAdminDb();
      const AdminCandidateUser = getAdminCandidateUserModel();

      // ── Step 1: Diagnostic count ──
      let totalInUsers = 0;
      try {
        if (adminDb) {
          totalInUsers = await adminDb.collection('users').countDocuments({});
        } else {
          totalInUsers = await AdminCandidateUser.countDocuments({});
        }
      } catch (err) {
        console.warn('[ProfilePurchase] Count error:', err.message);
      }
      console.log(`[ProfilePurchase] 📊 Total docs in careerflow_admin.users: ${totalInUsers}`);

      if (totalInUsers === 0) {
        console.warn('[ProfilePurchase] ⚠️ careerflow_admin.users is EMPTY. No candidates to reveal.');
      }

      // ── Step 2: Fetch active entitlements ──
      let entitlements = [];
      try {
        entitlements = await ProfileEntitlement.find({
          recruiterId: rId,
          $or: [{ status: 'active' }, { status: { $exists: false } }],
        }).lean();
      } catch (entErr) {
        // Fallback: no status filter
        try {
          entitlements = await ProfileEntitlement.find({ recruiterId: rId }).lean();
        } catch (e2) {
          console.error('[ProfilePurchase] Entitlement fetch failed:', e2.message);
        }
      }
      console.log(`[ProfilePurchase] 📋 Existing entitlements: ${entitlements.length}`);

      // ── Step 3: Check credits balance ──
      const creditDoc = await RecruiterCredit.findOne({ recruiterId: rId });
      let availableBalance = creditDoc ? creditDoc.balance : 0;
      console.log(`[ProfilePurchase] 💰 Credit balance: ${availableBalance}`);

      // ── Step 4: Purge accidental self-entitlements ──
      const validEntitlements = [];
      let refundedCount = 0;

      for (const ent of entitlements) {
        const candIdStr = ent.candidateId ? ent.candidateId.toString() : '';
        let isSelf = candIdStr === rIdStr;

        if (!isSelf && rEmail && adminDb) {
          try {
            const candDoc = await adminDb.collection('users').findOne({ _id: ent.candidateId });
            if (candDoc && isRecruiterOrAdmin(candDoc, rIdStr, rEmail)) {
              isSelf = true;
            }
          } catch (e) {
            // ignore
          }
        }

        if (isSelf) {
          try {
            await ProfileEntitlement.deleteOne({ _id: ent._id });
            refundedCount++;
          } catch (delErr) {
            console.warn('[ProfilePurchase] Failed to delete self-entitlement:', delErr.message);
          }
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

      console.log(`[ProfilePurchase] 🔓 Already unlocked IDs: ${alreadyUnlockedIds.length}`);

      // ── Step 5: Auto-reveal new candidates if balance > 0 ──
      if (availableBalance > 0 && totalInUsers > 0) {
        console.log(`[ProfilePurchase] 🎯 Auto-revealing up to ${availableBalance} candidates...`);

        const excludeObjIds = [...alreadyUnlockedIds, rIdStr]
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const candidateFilter = {
          _id: { $nin: excludeObjIds },
          role: {
            $nin: [
              'admin', 'superadmin', 'recruiter', 'employer', 'company', 'organization',
              'Admin', 'Recruiter', 'Employer', 'SUPERADMIN',
            ],
          },
        };
        if (rEmail) {
          candidateFilter.email = { $ne: rEmail };
        }

        let candidatePool = [];

        // Method A: Native aggregate with $sample
        if (adminDb && candidatePool.length === 0) {
          try {
            candidatePool = await adminDb
              .collection('users')
              .aggregate([{ $match: candidateFilter }, { $sample: { size: availableBalance } }])
              .toArray();
            console.log(`[ProfilePurchase] Method A (aggregate): found ${candidatePool.length} candidates`);
          } catch (aggErr) {
            console.warn('[ProfilePurchase] Method A error:', aggErr.message);
          }
        }

        // Method B: Native find
        if (adminDb && candidatePool.length === 0) {
          try {
            candidatePool = await adminDb
              .collection('users')
              .find(candidateFilter)
              .limit(availableBalance)
              .toArray();
            console.log(`[ProfilePurchase] Method B (native find): found ${candidatePool.length} candidates`);
          } catch (findErr) {
            console.warn('[ProfilePurchase] Method B error:', findErr.message);
          }
        }

        // Method C: Mongoose model
        if (candidatePool.length === 0) {
          try {
            candidatePool = await AdminCandidateUser.find(candidateFilter).limit(availableBalance).lean();
            console.log(`[ProfilePurchase] Method C (mongoose): found ${candidatePool.length} candidates`);
          } catch (mErr) {
            console.warn('[ProfilePurchase] Method C error:', mErr.message);
          }
        }

        // Method D: Broad search (no role filter)
        if (candidatePool.length === 0) {
          try {
            const broadFilter = { _id: { $nin: excludeObjIds } };
            if (rEmail) broadFilter.email = { $ne: rEmail };

            if (adminDb) {
              candidatePool = await adminDb.collection('users').find(broadFilter).limit(availableBalance).toArray();
            } else {
              candidatePool = await AdminCandidateUser.find(broadFilter).limit(availableBalance).lean();
            }
            console.log(`[ProfilePurchase] Method D (broad): found ${candidatePool.length} candidates`);
          } catch (broadErr) {
            console.warn('[ProfilePurchase] Method D error:', broadErr.message);
          }
        }

        // Final safety filter & unlock
        if (candidatePool && candidatePool.length > 0) {
          candidatePool = candidatePool.filter((c) => !isRecruiterOrAdmin(c, rIdStr, rEmail));
          const countToUnlock = Math.min(candidatePool.length, availableBalance);
          console.log(`[ProfilePurchase] 🔑 Unlocking ${countToUnlock} candidates...`);

          for (let i = 0; i < countToUnlock; i++) {
            const candidate = candidatePool[i];
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
              const cName = candidate.name || candidate.email || candId.toString();
              console.log(`[ProfilePurchase] ✅ Auto-unlocked: ${cName}`);
            } catch (unlockErr) {
              console.error(`[ProfilePurchase] ❌ Error unlocking ${candId}:`, unlockErr.message);
            }
          }
        } else {
          console.warn('[ProfilePurchase] ⚠️ No candidates found in careerflow_admin.users to unlock');
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
        // Try native first
        if (adminDb) {
          try {
            candidateDocs = await adminDb.collection('users').find({ _id: { $in: candidateIds } }).toArray();
          } catch (fetchErr) {
            console.warn('[ProfilePurchase] Native hydration error:', fetchErr.message);
          }
        }

        // Fallback to Mongoose
        if (!candidateDocs || candidateDocs.length === 0) {
          try {
            candidateDocs = await AdminCandidateUser.find({ _id: { $in: candidateIds } }).lean();
          } catch (mFetchErr) {
            console.warn('[ProfilePurchase] Mongoose hydration error:', mFetchErr.message);
          }
        }
      }

      const candidateMap = new Map();
      if (candidateDocs) {
        for (const doc of candidateDocs) {
          candidateMap.set(doc._id.toString(), doc);
        }
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

      console.log(`[ProfilePurchase] 🏁 DONE. Profiles: ${profiles.length}, Balance: ${finalCredits.balance}\n`);

      return {
        profiles,
        totalUnlocked: profiles.length,
        credits: finalCredits,
        _debug: {
          totalInAdminUsersCollection: totalInUsers,
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

      // Return safe fallback instead of crashing
      const fallbackCredits = await this.getRecruiterCredits(recruiterId).catch(() => ({ balance: 0, totalPurchased: 0, totalExpended: 0 }));
      return {
        profiles: [],
        totalUnlocked: 0,
        credits: fallbackCredits,
        _debug: { error: fatalErr.message },
      };
    }
  }

  // ───────────────────────────────────────────
  // PURCHASES HISTORY
  // ───────────────────────────────────────────

  async getPurchases(recruiterId) {
    try {
      const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
      let purchases = await ProfilePurchase.find({ recruiterId: rId }).sort({ createdAt: -1 }).lean();
      if (!purchases || purchases.length === 0) {
        purchases = await ProfilePurchase.find({ recruiterId: rId.toString() }).sort({ createdAt: -1 }).lean();
      }

      // Fix ₹0.00 issue: ensure totalAmount is always a valid number
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

  // ───────────────────────────────────────────
  // RESUME DOWNLOAD
  // ───────────────────────────────────────────

  async getResumeStreamInfo(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    let entitlement = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (!entitlement) {
      entitlement = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId });
    }
    if (!entitlement) {
      throw new Error('You have not unlocked this candidate profile yet');
    }

    let candDoc = null;
    const adminDb = getAdminDb();
    if (adminDb) {
      candDoc = await adminDb.collection('users').findOne({ _id: cId });
    }

    if (!candDoc) {
      const AdminCandidateUser = getAdminCandidateUserModel();
      candDoc = await AdminCandidateUser.findOne({ _id: cId }).lean();
    }

    if (!candDoc) {
      throw new Error('Candidate not found');
    }

    const extracted = extractCandidateData(candDoc);
    return {
      candidateId: cId.toString(),
      name: extracted.name,
      resumeUrl: extracted.resumeUrl,
      hasResume: extracted.hasResume,
    };
  }
}

module.exports = new ProfilePurchaseService();