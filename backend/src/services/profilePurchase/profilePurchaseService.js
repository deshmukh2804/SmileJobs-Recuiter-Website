const mongoose = require('mongoose');
const { getAdminConnection } = require('../../config/db');
const ProfilePricing = require('../../models/profilePricingModel');
const ProfilePurchase = require('../../models/profilePurchaseModel');
const ProfileEntitlement = require('../../models/profileEntitlementModel');

// Ensure RecruiterCredit model
let RecruiterCredit;
try {
  RecruiterCredit = mongoose.model('RecruiterCredit');
} catch (e) {
  try {
    RecruiterCredit = require('../../models/recruiterCreditModel');
  } catch (err) {
    const s = new mongoose.Schema(
      {
        recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        balance: { type: Number, default: 0, min: 0 },
        totalPurchased: { type: Number, default: 0 },
        totalExpended: { type: Number, default: 0 },
      },
      { timestamps: true, collection: 'recruiter_credits' }
    );
    RecruiterCredit = mongoose.model('RecruiterCredit', s);
  }
}

// Model bound to careerflow_admin.users collection
let AdminUserModel = null;

function getAdminCandidateUserModel() {
  if (AdminUserModel) return AdminUserModel;

  let adminConn = null;
  try {
    adminConn = getAdminConnection();
  } catch (err) {
    for (const conn of mongoose.connections) {
      if (conn.name === 'careerflow_admin') {
        adminConn = conn;
        break;
      }
    }
  }

  if (!adminConn) {
    adminConn = mongoose;
  }

  if (adminConn.models && adminConn.models.AdminCandidateUser) {
    AdminUserModel = adminConn.models.AdminCandidateUser;
    return AdminUserModel;
  }

  const adminCandidateUserSchema = new mongoose.Schema(
    {},
    {
      timestamps: true,
      collection: 'users',
      strict: false,
    }
  );

  AdminUserModel = adminConn.model('AdminCandidateUser', adminCandidateUserSchema);
  return AdminUserModel;
}

// Extract real candidate data cleanly
function extractCandidateData(candidate) {
  if (!candidate) return null;
  const id = candidate._id ? candidate._id.toString() : '';

  // Name extraction
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

  // Email extraction
  const email = candidate.email || candidate.personalInfo?.email || candidate.contact?.email || candidate.profile?.email || candidate.contactEmail || '';

  // Phone extraction
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
    candidate.profile?.mobile ||
    '';

  // Resume extraction
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

  // Headline extraction
  const headline = candidate.headline ||
    candidate.title ||
    candidate.jobTitle ||
    candidate.designation ||
    candidate.profession ||
    candidate.currentRole ||
    candidate.profile?.headline ||
    candidate.profile?.title ||
    candidate.profile?.designation ||
    'Candidate';

  // Location extraction
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

  // Skills extraction
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

  // Experience
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

  // Education
  let education = '';
  if (Array.isArray(candidate.education) && candidate.education.length > 0) {
    education = candidate.education.map((e) => (typeof e === 'object' ? `${e.degree || e.course || ''} ${e.institution || e.college || ''}`.trim() : String(e))).filter(Boolean).join(', ');
  } else if (typeof candidate.education === 'string') {
    education = candidate.education;
  }

  // Avatar / Photo
  const profilePicture = candidate.profilePicture || candidate.avatar || candidate.photo || candidate.image ||
    candidate.profileImage || candidate.profile?.avatar || candidate.profile?.profilePicture || '';

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

// Exclude recruiter self / employer accounts
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

class ProfilePurchaseService {
  async getRecruiterCredits(recruiterId) {
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

  async getActivePricing() {
    try {
      const pricing = await ProfilePricing.getActivePricing();
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
      console.warn('[ProfilePurchaseService] Pricing query warning:', err.message);
    }

    try {
      const adminConn = getAdminConnection();
      if (adminConn && adminConn.db) {
        const rawPricing = await adminConn.db.collection('profilepricings').findOne({ enabled: true });
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

  async createOrder(recruiterId, quantity) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const quote = await this.getQuote(quantity);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    if (razorpayKeyId && razorpayKeySecret && !razorpayKeyId.includes('dummy')) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpayKeySecret,
        });

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
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

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

    return {
      success: true,
      purchase,
      credits: updatedCredits,
    };
  }

  async unlockCandidate(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    const existing = await ProfileEntitlement.findOne({
      recruiterId: rId,
      candidateId: cId,
      status: 'active',
    });

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

    return {
      success: true,
      entitlement,
      credits: updatedCredits,
    };
  }

  /**
   * Main Auto-Reveal Pipeline:
   * 1. Connects directly to careerflow_admin.users collection
   * 2. Checks recruiter's remaining credit balance
   * 3. Cleans up any accidental self-entitlements (recruiter unlocking their own account)
   * 4. Selects real candidates from careerflow_admin.users based on available credits
   * 5. Automatically creates entitlements and deducts credits
   * 6. Hydrates candidate profiles with verified email, phone, and resume download
   */
  async getUnlockedProfilesWithAutoReveal(recruiterId, recruiterEmail) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const rIdStr = rId.toString();
    const rEmail = (recruiterEmail || '').toLowerCase().trim();

    const AdminCandidateUser = getAdminCandidateUserModel();
    let adminConn = null;
    try {
      adminConn = getAdminConnection();
    } catch (e) {
      // ignore
    }

    // 1. Diagnostic count in careerflow_admin.users
    let totalInUsers = 0;
    try {
      if (adminConn && adminConn.db) {
        totalInUsers = await adminConn.db.collection('users').countDocuments({});
      } else {
        totalInUsers = await AdminCandidateUser.countDocuments({});
      }
    } catch (err) {
      console.warn('[ProfilePurchase] Count error in careerflow_admin.users:', err.message);
    }

    // 2. Fetch active entitlements
    let entitlements = await ProfileEntitlement.find({ recruiterId: rId, status: 'active' }).lean();

    // 3. Check credits balance
    const creditDoc = await RecruiterCredit.findOne({ recruiterId: rId });
    let availableBalance = creditDoc ? creditDoc.balance : 0;

    // 4. Purge accidental self-entitlements
    const validEntitlements = [];
    let refundedCount = 0;

    for (const ent of entitlements) {
      const candIdStr = ent.candidateId ? ent.candidateId.toString() : '';
      let isSelf = candIdStr === rIdStr;

      if (!isSelf && rEmail && adminConn && adminConn.db) {
        try {
          const candDoc = await adminConn.db.collection('users').findOne({ _id: ent.candidateId });
          if (candDoc && isRecruiterOrAdmin(candDoc, rIdStr, rEmail)) {
            isSelf = true;
          }
        } catch (e) {
          // ignore
        }
      }

      if (isSelf) {
        await ProfileEntitlement.deleteOne({ _id: ent._id });
        refundedCount++;
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
    const alreadyUnlockedIds = entitlements.map((e) => e.candidateId.toString());

    // 5. Auto-reveal candidates from careerflow_admin.users if recruiter has balance
    if (availableBalance > 0) {
      console.log(`[ProfilePurchase] 🎯 Auto-revealing ${availableBalance} candidates from careerflow_admin.users for recruiter ${rIdStr}...`);

      const excludeObjIds = [...alreadyUnlockedIds, rIdStr]
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const candidateFilter = {
        _id: { $nin: excludeObjIds },
        role: { $nin: ['admin', 'superadmin', 'recruiter', 'employer', 'company', 'organization', 'Admin', 'Recruiter', 'Employer'] },
      };

      if (rEmail) {
        candidateFilter.email = { $ne: rEmail };
      }

      let candidatePool = [];

      // Method A: Native Mongo Driver aggregation on careerflow_admin.users
      if (adminConn && adminConn.db) {
        try {
          candidatePool = await adminConn.db
            .collection('users')
            .aggregate([{ $match: candidateFilter }, { $sample: { size: availableBalance } }])
            .toArray();
        } catch (aggErr) {
          console.warn('[ProfilePurchase] Native aggregate error:', aggErr.message);
        }

        // Method B: Native find
        if (!candidatePool || candidatePool.length === 0) {
          try {
            candidatePool = await adminConn.db
              .collection('users')
              .find(candidateFilter)
              .limit(availableBalance)
              .toArray();
          } catch (findErr) {
            console.warn('[ProfilePurchase] Native find error:', findErr.message);
          }
        }
      }

      // Method C: Mongoose model on careerflow_admin
      if (!candidatePool || candidatePool.length === 0) {
        try {
          candidatePool = await AdminCandidateUser.find(candidateFilter).limit(availableBalance).lean();
        } catch (mErr) {
          console.warn('[ProfilePurchase] Mongoose find error:', mErr.message);
        }
      }

      // Method D: Broader search if strict role filter didn't match (any user except recruiter self)
      if (!candidatePool || candidatePool.length === 0) {
        try {
          const broadFilter = { _id: { $nin: excludeObjIds } };
          if (rEmail) broadFilter.email = { $ne: rEmail };

          if (adminConn && adminConn.db) {
            candidatePool = await adminConn.db.collection('users').find(broadFilter).limit(availableBalance).toArray();
          } else {
            candidatePool = await AdminCandidateUser.find(broadFilter).limit(availableBalance).lean();
          }
        } catch (broadErr) {
          console.warn('[ProfilePurchase] Broad search error:', broadErr.message);
        }
      }

      // Final safety filter: remove any remaining recruiter/admin self profiles
      if (candidatePool && candidatePool.length > 0) {
        candidatePool = candidatePool.filter((c) => !isRecruiterOrAdmin(c, rIdStr, rEmail));

        const countToUnlock = Math.min(candidatePool.length, availableBalance);

        for (let i = 0; i < countToUnlock; i++) {
          const candidate = candidatePool[i];
          const candId = candidate._id;

          try {
            await this.spendCredits(rId, 1);
            const newEntitlement = await ProfileEntitlement.create({
              recruiterId: rId,
              candidateId: candId,
              status: 'active',
              unlockedAt: new Date(),
            });
            entitlements.push(newEntitlement.toObject ? newEntitlement.toObject() : newEntitlement);
            console.log(`[ProfilePurchase] 🔓 Auto-unlocked candidate ${candId} (${candidate.name || candidate.email})`);
          } catch (unlockErr) {
            console.error(`[ProfilePurchase] ❌ Error auto-unlocking candidate ${candId}:`, unlockErr.message);
          }
        }
      }
    }

    // 6. Hydrate all unlocked profiles from careerflow_admin.users
    const candidateIds = entitlements
      .map((e) => e.candidateId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    let candidateDocs = [];
    if (candidateIds.length > 0) {
      if (adminConn && adminConn.db) {
        try {
          candidateDocs = await adminConn.db.collection('users').find({ _id: { $in: candidateIds } }).toArray();
        } catch (fetchErr) {
          console.warn('[ProfilePurchase] Native candidate docs fetch warning:', fetchErr.message);
        }
      }

      if (!candidateDocs || candidateDocs.length === 0) {
        try {
          candidateDocs = await AdminCandidateUser.find({ _id: { $in: candidateIds } }).lean();
        } catch (mFetchErr) {
          console.warn('[ProfilePurchase] Mongoose candidate docs fetch warning:', mFetchErr.message);
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
      const candIdStr = ent.candidateId.toString();
      const rawCandidate = candidateMap.get(candIdStr);

      if (rawCandidate) {
        if (isRecruiterOrAdmin(rawCandidate, rIdStr, rEmail)) {
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
      },
    };
  }

  async getPurchases(recruiterId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    let purchases = await ProfilePurchase.find({ recruiterId: rId }).sort({ createdAt: -1 }).lean();
    if (!purchases || purchases.length === 0) {
      purchases = await ProfilePurchase.find({ recruiterId: rId.toString() }).sort({ createdAt: -1 }).lean();
    }
    return purchases || [];
  }

  async getResumeStreamInfo(recruiterId, candidateId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    const entitlement = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (!entitlement) {
      throw new Error('You have not unlocked this candidate profile yet');
    }

    let candDoc = null;
    const adminConn = getAdminConnection();
    if (adminConn && adminConn.db) {
      candDoc = await adminConn.db.collection('users').findOne({ _id: cId });
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