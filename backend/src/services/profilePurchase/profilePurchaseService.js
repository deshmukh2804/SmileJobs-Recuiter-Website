const mongoose = require('mongoose');
const ProfilePricing = require('../../models/profilePricingModel');
const ProfilePurchase = require('../../models/profilePurchaseModel');
const ProfileEntitlement = require('../../models/profileEntitlementModel');

// ─── RecruiterCredit Model (inline fallback) ───
let RecruiterCredit;
try {
  RecruiterCredit = mongoose.model('RecruiterCredit');
} catch (e) {
  try {
    RecruiterCredit = require('../../models/recruiterCreditModel');
  } catch (err) {
    const recruiterCreditSchema = new mongoose.Schema(
      {
        recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        balance: { type: Number, default: 0, min: [0, 'Balance cannot be negative'] },
        totalPurchased: { type: Number, default: 0 },
        totalExpended: { type: Number, default: 0 },
      },
      { timestamps: true }
    );
    RecruiterCredit = mongoose.model('RecruiterCredit', recruiterCreditSchema);
  }
}

// ─── Admin User Model (bound to careerflow_admin.users) ───
let AdminPoolUser = null;

function getAdminUserModel() {
  if (AdminPoolUser) return AdminPoolUser;

  const dbModule = require('../../config/db');
  let adminConn = null;

  if (typeof dbModule.getAdminConnection === 'function') {
    adminConn = dbModule.getAdminConnection();
  } else if (dbModule.adminConnection) {
    adminConn = dbModule.adminConnection;
  } else if (dbModule.adminDB) {
    adminConn = dbModule.adminDB;
  }

  if (!adminConn) {
    for (const conn of mongoose.connections) {
      if (conn.name === 'careerflow_admin') {
        adminConn = conn;
        break;
      }
    }
  }

  if (!adminConn) {
    console.warn('[ProfilePurchaseService] ⚠️ careerflow_admin connection not ready, using global mongoose');
    adminConn = mongoose;
  }

  if (adminConn.models && adminConn.models.AdminPoolUser) {
    AdminPoolUser = adminConn.models.AdminPoolUser;
    return AdminPoolUser;
  }

  const adminUserSchema = new mongoose.Schema({}, { timestamps: true, collection: 'users', strict: false });
  AdminPoolUser = adminConn.model('AdminPoolUser', adminUserSchema);
  console.log('[ProfilePurchaseService] ✅ AdminPoolUser model bound to careerflow_admin.users');
  return AdminPoolUser;
}

// ─── Helper: Extract candidate data from raw document ───
function extractCandidateData(candidate) {
  if (!candidate) return null;
  const id = candidate._id ? candidate._id.toString() : '';

  let name = candidate.name || candidate.fullName || '';
  if (!name && (candidate.firstName || candidate.lastName)) {
    name = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
  }
  if (!name && candidate.personalInfo) {
    name = candidate.personalInfo.name || candidate.personalInfo.fullName || `${candidate.personalInfo.firstName || ''} ${candidate.personalInfo.lastName || ''}`.trim();
  }
  if (!name && candidate.profile) {
    name = candidate.profile.name || candidate.profile.fullName || '';
  }
  if (!name) {
    name = candidate.username || (candidate.email ? candidate.email.split('@')[0] : 'Verified Candidate');
  }

  const email = candidate.email || candidate.personalInfo?.email || candidate.contact?.email || candidate.profile?.email || candidate.contactEmail || '';

  const phone = candidate.phone || candidate.phoneNumber || candidate.mobile || candidate.mobileNumber ||
    candidate.contactNumber || candidate.personalInfo?.phone || candidate.personalInfo?.phoneNumber ||
    candidate.personalInfo?.mobile || candidate.contact?.phone || candidate.profile?.phone ||
    candidate.profile?.phoneNumber || candidate.profile?.mobile || '';

  let resumeUrl = '';
  if (typeof candidate.resume === 'string' && candidate.resume.trim()) {
    resumeUrl = candidate.resume.trim();
  } else if (candidate.resume && typeof candidate.resume === 'object') {
    resumeUrl = candidate.resume.url || candidate.resume.fileUrl || candidate.resume.path || candidate.resume.secure_url || candidate.resume.location || '';
  } else if (typeof candidate.resumeUrl === 'string') {
    resumeUrl = candidate.resumeUrl;
  } else if (typeof candidate.cv === 'string') {
    resumeUrl = candidate.cv;
  } else if (candidate.cv && typeof candidate.cv === 'object') {
    resumeUrl = candidate.cv.url || candidate.cv.fileUrl || candidate.cv.path || '';
  } else if (typeof candidate.cvUrl === 'string') {
    resumeUrl = candidate.cvUrl;
  } else if (candidate.profile?.resume) {
    resumeUrl = typeof candidate.profile.resume === 'string' ? candidate.profile.resume : (candidate.profile.resume.url || candidate.profile.resume.fileUrl || '');
  } else if (candidate.personalInfo?.resume) {
    resumeUrl = typeof candidate.personalInfo.resume === 'string' ? candidate.personalInfo.resume : (candidate.personalInfo.resume.url || '');
  }

  const headline = candidate.headline || candidate.title || candidate.jobTitle || candidate.designation ||
    candidate.profession || candidate.currentRole || candidate.profile?.headline || candidate.profile?.title ||
    candidate.profile?.designation || 'Candidate';

  let location = 'Location not specified';
  if (typeof candidate.location === 'string' && candidate.location.trim()) {
    location = candidate.location.trim();
  } else if (candidate.location && typeof candidate.location === 'object') {
    const parts = [candidate.location.city, candidate.location.state, candidate.location.country].filter(Boolean);
    if (parts.length > 0) location = parts.join(', ');
  } else if (candidate.city) {
    location = candidate.city;
  } else if (candidate.profile?.location) {
    location = typeof candidate.profile.location === 'string' ? candidate.profile.location : (candidate.profile.location.city || 'Location not specified');
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
    education = candidate.education.map((e) => (typeof e === 'object' ? `${e.degree || e.course || ''} ${e.institution || e.college || ''}`.trim() : String(e))).filter(Boolean).join(', ');
  } else if (typeof candidate.education === 'string') {
    education = candidate.education;
  }

  const profilePicture = candidate.profilePicture || candidate.avatar || candidate.photo || candidate.image ||
    candidate.profileImage || candidate.profile?.avatar || candidate.profile?.profilePicture || '';

  return {
    _id: id, candidateId: id, name, email, phone,
    hasResume: Boolean(resumeUrl), resumeUrl, headline, location,
    skills, experience, education, profilePicture,
    role: candidate.role || 'candidate',
  };
}

// ─── Helper: Check if a document is the recruiter themselves ───
function isRecruiterSelf(doc, recruiterIdStr, recruiterEmail) {
  if (!doc) return false;
  const docId = doc._id ? doc._id.toString() : '';
  const docEmail = (doc.email || '').toLowerCase().trim();
  const recEmail = (recruiterEmail || '').toLowerCase().trim();

  // Match by ID
  if (docId === recruiterIdStr) return true;

  // Match by email (most reliable cross-database check)
  if (recEmail && docEmail && docEmail === recEmail) return true;

  // Match by role
  const role = (doc.role || '').toLowerCase();
  if (['admin', 'superadmin', 'recruiter', 'employer', 'company'].includes(role)) return true;

  return false;
}

class ProfilePurchaseService {

  async getRecruiterCredits(recruiterId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    let credit = await RecruiterCredit.findOne({ recruiterId: rId });
    if (!credit) {
      credit = await RecruiterCredit.create({ recruiterId: rId, balance: 0, totalPurchased: 0, totalExpended: 0 });
    }
    return credit;
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
    const pricing = await ProfilePricing.getActivePricing();
    if (!pricing) {
      return { price: 2, priceInPaise: 200, currency: 'INR', minQuantity: 1, maxQuantity: 100, enabled: true, description: 'Candidate Profile Direct Unlock' };
    }
    return pricing;
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
          amount: quote.totalAmountInPaise,
          currency: quote.currency,
          receipt: `rcpt_cr_${Date.now().toString().slice(-8)}`,
          notes: { recruiterId: rId.toString(), quantity: String(quote.quantity), type: 'candidate_profile_credits' },
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
      totalAmount: quote.totalAmount,
      totalAmountInPaise: quote.totalAmountInPaise,
      currency: quote.currency,
      paymentStatus: 'pending',
      razorpayOrderId,
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
      purchase = await ProfilePurchase.findOne({ razorpayOrderId, recruiterId: rId });
    }
    if (!purchase) throw new Error('Purchase record not found for verification');

    if (purchase.paymentStatus === 'completed') {
      const credits = await this.getRecruiterCredits(rId);
      return { success: true, alreadyProcessed: true, purchase, credits };
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpayKeySecret && razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha256', razorpayKeySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
      if (expectedSignature !== razorpaySignature) {
        purchase.paymentStatus = 'failed';
        await purchase.save();
        throw new Error('Invalid payment signature. Transaction rejected.');
      }
    }

    purchase.paymentStatus = 'completed';
    purchase.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    purchase.razorpaySignature = razorpaySignature || 'mock_sig';
    purchase.purchasedAt = new Date();
    await purchase.save();

    const updatedCredits = await this.grantCredits(rId, purchase.quantity);
    console.log(`[ProfilePurchaseService] ✅ Added ${purchase.quantity} credits to recruiter ${rId}. New balance: ${updatedCredits.balance}`);
    return { success: true, purchase, credits: updatedCredits };
  }

  async unlockCandidate(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;
    const existing = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (existing) {
      const credits = await this.getRecruiterCredits(rId);
      return { success: true, alreadyUnlocked: true, entitlement: existing, credits };
    }
    const updatedCredits = await this.spendCredits(rId, 1);
    const entitlement = await ProfileEntitlement.create({ recruiterId: rId, candidateId: cId, status: 'active', unlockedAt: new Date() });
    return { success: true, entitlement, credits: updatedCredits };
  }

  /**
   * MAIN AUTO-REVEAL PIPELINE
   * @param {string|ObjectId} recruiterId - The recruiter's _id from recruiter_db
   * @param {string} recruiterEmail - The recruiter's email (CRITICAL for cross-DB exclusion)
   */
  async getUnlockedProfilesWithAutoReveal(recruiterId, recruiterEmail) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const rIdStr = rId.toString();
    const rEmail = (recruiterEmail || '').toLowerCase().trim();
    const AdminUser = getAdminUserModel();

    console.log(`\n[ProfilePurchase] ═══════════════════════════════════════`);
    console.log(`[ProfilePurchase] Recruiter ID: ${rIdStr}`);
    console.log(`[ProfilePurchase] Recruiter Email: ${rEmail || '(not provided)'}`);

    // ── STEP 1: DIAGNOSTIC — Log everything in careerflow_admin.users ──
    let totalDocsInCollection = 0;
    try {
      totalDocsInCollection = await AdminUser.countDocuments({});
      console.log(`[ProfilePurchase] 📊 Total documents in careerflow_admin.users: ${totalDocsInCollection}`);

      const allDocs = await AdminUser.find({}).limit(20).lean();
      for (const doc of allDocs) {
        const isSelf = isRecruiterSelf(doc, rIdStr, rEmail);
        console.log(`[ProfilePurchase]   → _id: ${doc._id} | email: ${doc.email || 'N/A'} | name: ${doc.name || doc.fullName || 'N/A'} | role: ${doc.role || 'N/A'} | IS_SELF: ${isSelf}`);
      }
    } catch (diagErr) {
      console.error('[ProfilePurchase] Diagnostic scan failed:', diagErr.message);
    }

    // ── STEP 2: Fetch existing entitlements ──
    let entitlements = await ProfileEntitlement.find({ recruiterId: rId, status: 'active' }).lean();
    console.log(`[ProfilePurchase] Active entitlements: ${entitlements.length}`);

    // ── STEP 3: Fetch credit balance ──
    const creditDoc = await RecruiterCredit.findOne({ recruiterId: rId });
    let availableBalance = creditDoc ? creditDoc.balance : 0;
    console.log(`[ProfilePurchase] Credit balance: ${availableBalance}`);

    // ── STEP 4: PURGE self-entitlements (recruiter's own profile) ──
    const selfEntitlements = [];
    const validEntitlements = [];

    for (const ent of entitlements) {
      const candIdStr = ent.candidateId.toString();
      let isSelf = candIdStr === rIdStr;

      // Also check by email — fetch the candidate doc to verify
      if (!isSelf && rEmail) {
        try {
          const candDoc = await AdminUser.findOne({ _id: ent.candidateId }).lean();
          if (candDoc && isRecruiterSelf(candDoc, rIdStr, rEmail)) {
            isSelf = true;
          }
        } catch (e) { /* ignore */ }
      }

      if (isSelf) {
        selfEntitlements.push(ent);
      } else {
        validEntitlements.push(ent);
      }
    }

    if (selfEntitlements.length > 0) {
      console.log(`[ProfilePurchase] ⚠️ Found ${selfEntitlements.length} SELF-entitlement(s). Purging and refunding...`);
      for (const selfEnt of selfEntitlements) {
        await ProfileEntitlement.deleteOne({ _id: selfEnt._id });
        await RecruiterCredit.findOneAndUpdate({ recruiterId: rId }, { $inc: { balance: 1, totalExpended: -1 } });
        availableBalance += 1;
        console.log(`[ProfilePurchase]   ↩️ Refunded 1 credit for self-entitlement ${selfEnt._id}`);
      }
    }

    entitlements = validEntitlements;
    const alreadyUnlockedIds = entitlements.map((e) => e.candidateId.toString());

    // ── STEP 5: AUTO-REVEAL new candidates if balance > 0 ──
    if (availableBalance > 0) {
      console.log(`[ProfilePurchase] 🎯 Auto-revealing up to ${availableBalance} candidates...`);

      const excludeObjIds = [...alreadyUnlockedIds, rIdStr]
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      // Build the exclusion filter — EMAIL is the key cross-database identifier
      const candidateFilter = {
        _id: { $nin: excludeObjIds },
        role: { $nin: ['admin', 'superadmin', 'recruiter', 'employer', 'company', 'Admin', 'Recruiter', 'Employer', 'SuperAdmin'] },
      };

      if (rEmail) {
        candidateFilter.email = { $ne: rEmail };
      }

      let randomCandidates = [];

      // Method A: $sample aggregation
      try {
        randomCandidates = await AdminUser.aggregate([
          { $match: candidateFilter },
          { $sample: { size: availableBalance } },
        ]);
        console.log(`[ProfilePurchase] Method A ($sample): found ${randomCandidates.length}`);
      } catch (aggErr) {
        console.warn('[ProfilePurchase] Method A failed:', aggErr.message);
      }

      // Method B: .find() with limit
      if (!randomCandidates || randomCandidates.length === 0) {
        try {
          randomCandidates = await AdminUser.find(candidateFilter).limit(availableBalance).lean();
          console.log(`[ProfilePurchase] Method B (find): found ${randomCandidates.length}`);
        } catch (findErr) {
          console.warn('[ProfilePurchase] Method B failed:', findErr.message);
        }
      }

      // Method C: Native driver
      if (!randomCandidates || randomCandidates.length === 0) {
        try {
          const dbModule = require('../../config/db');
          const adminConn = typeof dbModule.getAdminConnection === 'function' ? dbModule.getAdminConnection() : dbModule.adminConnection;
          if (adminConn && adminConn.db) {
            const nativeFilter = {
              _id: { $nin: excludeObjIds },
              role: { $nin: ['admin', 'superadmin', 'recruiter', 'employer', 'company', 'Admin', 'Recruiter', 'Employer', 'SuperAdmin'] },
            };
            if (rEmail) nativeFilter.email = { $ne: rEmail };

            randomCandidates = await adminConn.db.collection('users').find(nativeFilter).limit(availableBalance).toArray();
            console.log(`[ProfilePurchase] Method C (native): found ${randomCandidates.length}`);
          }
        } catch (nativeErr) {
          console.error('[ProfilePurchase] Method C failed:', nativeErr.message);
        }
      }

      // Method D: Broadest — exclude ONLY by email and own ID
      if (!randomCandidates || randomCandidates.length === 0) {
        try {
          const broadFilter = { _id: { $nin: excludeObjIds } };
          if (rEmail) broadFilter.email = { $ne: rEmail };
          randomCandidates = await AdminUser.find(broadFilter).limit(availableBalance).lean();
          console.log(`[ProfilePurchase] Method D (broad): found ${randomCandidates.length}`);
        } catch (broadErr) {
          console.error('[ProfilePurchase] Method D failed:', broadErr.message);
        }
      }

      // Final safety filter: remove any candidate that is the recruiter
      if (randomCandidates && randomCandidates.length > 0) {
        randomCandidates = randomCandidates.filter((c) => !isRecruiterSelf(c, rIdStr, rEmail));
        console.log(`[ProfilePurchase] After safety filter: ${randomCandidates.length} candidates`);
      }

      if (randomCandidates && randomCandidates.length > 0) {
        const countToUnlock = Math.min(randomCandidates.length, availableBalance);
        for (let i = 0; i < countToUnlock; i++) {
          const candidate = randomCandidates[i];
          try {
            await this.spendCredits(rId, 1);
            const newEnt = await ProfileEntitlement.create({
              recruiterId: rId,
              candidateId: candidate._id,
              status: 'active',
              unlockedAt: new Date(),
            });
            entitlements.push(newEnt.toObject ? newEnt.toObject() : newEnt);
            console.log(`[ProfilePurchase] 🔓 Unlocked: ${candidate.name || candidate.email} (${candidate._id})`);
          } catch (unlockErr) {
            console.error(`[ProfilePurchase] ❌ Unlock error for ${candidate._id}:`, unlockErr.message);
          }
        }
      } else {
        console.log(`[ProfilePurchase] ⚠️ No real candidates found in careerflow_admin.users (excluding recruiter)`);
      }
    }

    // ── STEP 6: HYDRATE all valid entitlements ──
    const candidateIds = entitlements
      .map((e) => e.candidateId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    let candidateDocs = [];
    if (candidateIds.length > 0) {
      try {
        candidateDocs = await AdminUser.find({ _id: { $in: candidateIds } }).lean();
      } catch (fetchErr) {
        console.error('[ProfilePurchase] Hydration fetch error:', fetchErr.message);
      }

      if (!candidateDocs || candidateDocs.length === 0) {
        try {
          const dbModule = require('../../config/db');
          const adminConn = typeof dbModule.getAdminConnection === 'function' ? dbModule.getAdminConnection() : dbModule.adminConnection;
          if (adminConn && adminConn.db) {
            candidateDocs = await adminConn.db.collection('users').find({ _id: { $in: candidateIds } }).toArray();
          }
        } catch (nativeFetchErr) {
          console.error('[ProfilePurchase] Native hydration error:', nativeFetchErr.message);
        }
      }
    }

    const candidateMap = new Map();
    if (candidateDocs) {
      for (const doc of candidateDocs) {
        candidateMap.set(doc._id.toString(), doc);
      }
    }

    // ── STEP 7: Build final profiles (FINAL safety filter) ──
    const profiles = [];
    for (const ent of entitlements) {
      const candIdStr = ent.candidateId.toString();
      const rawCandidate = candidateMap.get(candIdStr);

      if (rawCandidate) {
        // FINAL CHECK: never include recruiter's own profile
        if (isRecruiterSelf(rawCandidate, rIdStr, rEmail)) {
          console.log(`[ProfilePurchase] 🚫 BLOCKED self-profile in final output: ${rawCandidate.email}`);
          continue;
        }

        const extracted = extractCandidateData(rawCandidate);
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

    console.log(`[ProfilePurchase] ✅ Returning ${profiles.length} real candidate profiles`);
    console.log(`[ProfilePurchase] ═══════════════════════════════════════\n`);

    return {
      profiles,
      totalUnlocked: profiles.length,
      credits: finalCredits,
      _debug: {
        totalInAdminUsersCollection: totalDocsInCollection,
        recruiterEmail: rEmail,
        entitlementCount: entitlements.length,
        hydratedCount: profiles.length,
        availableBalance: finalCredits.balance,
      },
    };
  }

  async getPurchases(recruiterId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    console.log(`[ProfilePurchase] Fetching purchases for recruiter ${rId}`);

    // Try ObjectId format first
    let purchases = await ProfilePurchase.find({ recruiterId: rId }).sort({ createdAt: -1 }).lean();
    console.log(`[ProfilePurchase] Found ${purchases.length} purchases (ObjectId query)`);

    // Fallback: try string format
    if (purchases.length === 0) {
      purchases = await ProfilePurchase.find({ recruiterId: rId.toString() }).sort({ createdAt: -1 }).lean();
      console.log(`[ProfilePurchase] Found ${purchases.length} purchases (string query)`);
    }

    // Diagnostic: log total count if still empty
    if (purchases.length === 0) {
      try {
        const totalCount = await ProfilePurchase.countDocuments({});
        console.log(`[ProfilePurchase] ⚠️ Total purchases in collection: ${totalCount}`);
        if (totalCount > 0) {
          const samples = await ProfilePurchase.find({}).limit(3).lean();
          for (const s of samples) {
            console.log(`[ProfilePurchase]   Sample: _id=${s._id} recruiterId=${s.recruiterId} status=${s.paymentStatus} qty=${s.quantity}`);
          }
        }
      } catch (diagErr) {
        console.error('[ProfilePurchase] Purchase diagnostic error:', diagErr.message);
      }
    }

    return purchases;
  }
}

module.exports = new ProfilePurchaseService();