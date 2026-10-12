const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const ProfilePurchase = require('../../models/profilePurchaseModel');
const ProfileEntitlement = require('../../models/profileEntitlementModel');
const pricingService = require('./pricingService');

// ═══════════════════════════════════════════════════════════════
// ADMIN DB CONNECTION — Fetch candidates from careerflow_admin.users
// ═══════════════════════════════════════════════════════════════
let AdminPoolUser = null;

function getAdminUserModel() {
  if (AdminPoolUser) return AdminPoolUser;

  try {
    const dbModule = require('../../config/db');
    let adminConn = null;

    // Try multiple ways to get admin connection
    if (typeof dbModule.getAdminConnection === 'function') {
      adminConn = dbModule.getAdminConnection();
    } else if (dbModule.adminConnection) {
      adminConn = dbModule.adminConnection;
    } else if (dbModule.adminDB) {
      adminConn = dbModule.adminDB;
    }

    if (!adminConn) {
      // Fallback: scan all mongoose connections for careerflow_admin
      for (const conn of mongoose.connections) {
        if (conn.name === 'careerflow_admin') {
          adminConn = conn;
          console.log('[ProfilePurchaseService] Found careerflow_admin via connection scan');
          break;
        }
      }
    }

    if (!adminConn) {
      throw new Error('Cannot locate careerflow_admin connection');
    }

    console.log(`[ProfilePurchaseService] Admin connection name: ${adminConn.name}, ready state: ${adminConn.readyState}`);

    if (adminConn.models.AdminPoolUser) {
      AdminPoolUser = adminConn.models.AdminPoolUser;
      return AdminPoolUser;
    }

    const adminUserSchema = new mongoose.Schema(
      {},
      {
        timestamps: true,
        collection: 'users',
        strict: false, // Accept ALL fields regardless of schema
      }
    );

    AdminPoolUser = adminConn.model('AdminPoolUser', adminUserSchema);
    console.log('[ProfilePurchaseService] ✅ AdminPoolUser model bound to careerflow_admin.users');
    return AdminPoolUser;
  } catch (err) {
    console.error('[ProfilePurchaseService] ❌ Failed to bind AdminPoolUser model:', err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// INLINE RECRUITER CREDIT MODEL
// ═══════════════════════════════════════════════════════════════
let RecruiterCredit;
try {
  RecruiterCredit = require('../../models/recruiterCreditModel');
} catch (e) {
  const recruiterCreditSchema = new mongoose.Schema(
    {
      recruiterId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
      balance: { type: Number, required: true, default: 0, min: [0, 'Credit balance cannot be negative'] },
      totalPurchased: { type: Number, required: true, default: 0, min: 0 },
      totalUsed: { type: Number, required: true, default: 0, min: 0 },
    },
    { timestamps: true, collection: 'recruiter_credits' }
  );
  RecruiterCredit = mongoose.models.RecruiterCredit || mongoose.model('RecruiterCredit', recruiterCreditSchema);
  console.log('[ProfilePurchaseService] Using inline RecruiterCredit schema (model file not found)');
}

class ProfilePurchaseService {
  constructor() {
    this._razorpay = null;
  }

  _getRazorpayInstance() {
    if (!this._razorpay) {
      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_id || !key_secret) {
        throw new Error('Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
      }
      this._razorpay = new Razorpay({ key_id, key_secret });
    }
    return this._razorpay;
  }

  async getRecruiterCredits(recruiterId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    let credit = await RecruiterCredit.findOne({ recruiterId: rId }).lean();
    if (!credit) {
      credit = { recruiterId: rId, balance: 0, totalPurchased: 0, totalUsed: 0 };
    }
    return credit;
  }

  async grantCredits(recruiterId, quantity) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be a positive integer');

    const updated = await RecruiterCredit.findOneAndUpdate(
      { recruiterId: rId },
      { $inc: { balance: qty, totalPurchased: qty }, $setOnInsert: { totalUsed: 0 } },
      { upsert: true, new: true }
    );
    return updated;
  }

  async createPurchaseOrder({ recruiterId, quantity }) {
    if (!recruiterId) throw new Error('recruiterId is required');
    const quote = await pricingService.quote(quantity);
    const razorpay = this._getRazorpayInstance();
    const receipt = `rcpt_pp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const rzpOrder = await razorpay.orders.create({
      amount: quote.totalAmountInPaise,
      currency: quote.currency,
      receipt,
      notes: { recruiterId: recruiterId.toString(), quantity: String(quote.quantity), purchaseType: 'profile_purchase_credits' },
    });

    const purchase = await ProfilePurchase.create({
      recruiterId,
      candidateIds: [],
      quantity: quote.quantity,
      unitPriceInPaise: quote.unitPriceInPaise,
      totalAmountInPaise: quote.totalAmountInPaise,
      currency: quote.currency,
      pricingConfigId: quote.pricingConfigId,
      pricingSnapshotAt: new Date(),
      razorpayOrderId: rzpOrder.id,
      status: 'created',
      notes: { receipt },
    });

    return {
      orderId: rzpOrder.id,
      amount: quote.totalAmountInPaise,
      currency: quote.currency,
      quantity: quote.quantity,
      unitPriceInPaise: quote.unitPriceInPaise,
      unitPriceInRupees: quote.unitPriceInRupees,
      totalAmountInRupees: quote.totalAmountInRupees,
      keyId: process.env.RAZORPAY_KEY_ID,
      purchaseId: purchase._id,
    };
  }

  verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured');
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return expectedSignature === razorpaySignature;
  }

  async verifyAndCapturePayment({ recruiterId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const isValid = this.verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!isValid) throw new Error('Invalid Razorpay signature. Payment verification failed.');

    const purchase = await ProfilePurchase.findOne({ razorpayOrderId });
    if (!purchase) throw new Error(`Profile purchase order ${razorpayOrderId} not found.`);

    if (purchase.status === 'captured') {
      const credit = await this.getRecruiterCredits(recruiterId);
      return { success: true, alreadyProcessed: true, purchase, credits: credit };
    }

    purchase.status = 'captured';
    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.razorpaySignature = razorpaySignature;
    purchase.paidAt = new Date();
    purchase.verifiedBy = 'checkout';
    await purchase.save();

    const updatedCredits = await this.grantCredits(purchase.recruiterId, purchase.quantity);
    return { success: true, purchase, credits: updatedCredits };
  }

  async unlockCandidate({ recruiterId, candidateId }) {
    if (!recruiterId || !candidateId) throw new Error('recruiterId and candidateId are required');

    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    const existingEntitlement = await ProfileEntitlement.findOne({ recruiterId: rId, candidateId: cId, status: 'active' });
    if (existingEntitlement) {
      const credit = await this.getRecruiterCredits(rId);
      return { success: true, alreadyUnlocked: true, entitlement: existingEntitlement, remainingCredits: credit.balance };
    }

    const creditDoc = await RecruiterCredit.findOneAndUpdate(
      { recruiterId: rId, balance: { $gte: 1 } },
      { $inc: { balance: -1, totalUsed: 1 } },
      { new: true }
    );

    if (!creditDoc) {
      const currentCredit = await this.getRecruiterCredits(rId);
      const err = new Error('Insufficient profile credits. Please buy credits to unlock this candidate.');
      err.code = 'INSUFFICIENT_CREDITS';
      err.balance = currentCredit.balance;
      throw err;
    }

    const entitlement = await ProfileEntitlement.findOneAndUpdate(
      { recruiterId: rId, candidateId: cId },
      {
        $setOnInsert: {
          recruiterId: rId, candidateId: cId, status: 'active',
          pricePaidInPaise: 0, currency: 'INR', grantedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return { success: true, entitlement, remainingCredits: creditDoc.balance };
  }

  async handleWebhookPaymentCaptured({ razorpayOrderId, razorpayPaymentId, rawPayload }) {
    const purchase = await ProfilePurchase.findOne({ razorpayOrderId });
    if (!purchase) return null;
    if (purchase.status === 'captured') return purchase;

    purchase.status = 'captured';
    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.paidAt = new Date();
    purchase.verifiedBy = 'webhook';
    purchase.rawWebhookPayload = rawPayload;
    await purchase.save();
    await this.grantCredits(purchase.recruiterId, purchase.quantity);
    return purchase;
  }

  async handleWebhookPaymentFailed({ razorpayOrderId, failureReason, rawPayload }) {
    const purchase = await ProfilePurchase.findOne({ razorpayOrderId });
    if (!purchase) return null;
    purchase.status = 'failed';
    purchase.failureReason = failureReason || 'Payment failed';
    purchase.rawWebhookPayload = rawPayload;
    await purchase.save();
    return purchase;
  }

  async listPurchases(recruiterId, options = {}) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    return await ProfilePurchase.find({ recruiterId: rId })
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 50)
      .lean();
  }

  // ═══════════════════════════════════════════════════════════════
  // CORE FIX: Fetch ALL users from careerflow_admin.users
  // NO ROLE FILTER — show every document in that collection
  // ═══════════════════════════════════════════════════════════════
  async getUnlockedProfilesWithAutoReveal(recruiterId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;

    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(`[ProfilePurchase] START getUnlockedProfilesWithAutoReveal`);
    console.log(`[ProfilePurchase] Recruiter ID: ${rId}`);

    // Get the model bound to careerflow_admin.users
    let AdminUser;
    try {
      AdminUser = getAdminUserModel();
    } catch (modelErr) {
      console.error('[ProfilePurchase] FATAL: Could not bind AdminUser model:', modelErr.message);
      throw modelErr;
    }

    // Step 1: Count total documents in careerflow_admin.users (DIAGNOSTIC)
    let totalInCollection = 0;
    try {
      totalInCollection = await AdminUser.countDocuments({});
      console.log(`[ProfilePurchase] 📊 Total documents in careerflow_admin.users: ${totalInCollection}`);
    } catch (countErr) {
      console.error('[ProfilePurchase] Count error:', countErr.message);
    }

    // Also dump first 3 raw documents for inspection
    try {
      const sampleDocs = await AdminUser.find({}).limit(3).lean();
      console.log(`[ProfilePurchase] 🔍 Sample raw documents (first 3):`);
      sampleDocs.forEach((doc, i) => {
        console.log(`  [${i}] _id=${doc._id} | role=${doc.role} | email=${doc.email} | name=${doc.name || doc.fullName}`);
      });
    } catch (sampleErr) {
      console.error('[ProfilePurchase] Sample fetch error:', sampleErr.message);
    }

    // Step 2: Fetch existing entitlements
    let entitlements = await ProfileEntitlement.find({
      recruiterId: rId,
      status: 'active',
    }).lean();

    const alreadyUnlockedIds = entitlements.map((e) => e.candidateId.toString());
    console.log(`[ProfilePurchase] Already unlocked: ${alreadyUnlockedIds.length} profiles`);

    // Step 3: Check credit balance
    const creditDoc = await RecruiterCredit.findOne({ recruiterId: rId });
    let availableBalance = creditDoc ? creditDoc.balance : 0;
    console.log(`[ProfilePurchase] Available credit balance: ${availableBalance}`);

    // Step 4: Auto-reveal if credits available
    if (availableBalance > 0) {
      const excludeIds = alreadyUnlockedIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      // NO ROLE FILTER — just exclude already unlocked ones
      const candidateFilter = {
        _id: { $nin: excludeIds },
      };

      console.log(`[ProfilePurchase] Querying with filter:`, JSON.stringify(candidateFilter));

      let randomCandidates = [];

      // Try aggregation with $sample first
      try {
        randomCandidates = await AdminUser.aggregate([
          { $match: candidateFilter },
          { $sample: { size: availableBalance } },
        ]);
        console.log(`[ProfilePurchase] ✅ $sample returned ${randomCandidates.length} candidates`);
      } catch (aggErr) {
        console.error(`[ProfilePurchase] ❌ $sample failed:`, aggErr.message);
      }

      // Fallback: simple find
      if (randomCandidates.length === 0) {
        try {
          randomCandidates = await AdminUser.find(candidateFilter)
            .limit(availableBalance)
            .lean();
          console.log(`[ProfilePurchase] ✅ Fallback find returned ${randomCandidates.length} candidates`);
        } catch (findErr) {
          console.error(`[ProfilePurchase] ❌ Fallback find failed:`, findErr.message);
        }
      }

      // Final fallback: direct collection access (bypasses Mongoose model entirely)
      if (randomCandidates.length === 0) {
        try {
          const dbModule = require('../../config/db');
          let adminConn = null;
          if (typeof dbModule.getAdminConnection === 'function') {
            adminConn = dbModule.getAdminConnection();
          }
          if (adminConn && adminConn.db) {
            const nativeDocs = await adminConn.db
              .collection('users')
              .find(candidateFilter)
              .limit(availableBalance)
              .toArray();
            randomCandidates = nativeDocs;
            console.log(`[ProfilePurchase] ✅ Native driver returned ${randomCandidates.length} candidates`);
          }
        } catch (nativeErr) {
          console.error(`[ProfilePurchase] ❌ Native driver failed:`, nativeErr.message);
        }
      }

      if (randomCandidates.length > 0) {
        const unlockCount = randomCandidates.length;
        console.log(`[ProfilePurchase] 🔓 Unlocking ${unlockCount} profiles, deducting ${unlockCount} credits`);

        const updatedCredit = await RecruiterCredit.findOneAndUpdate(
          { recruiterId: rId, balance: { $gte: unlockCount } },
          { $inc: { balance: -unlockCount, totalUsed: unlockCount } },
          { new: true }
        );

        if (updatedCredit) {
          for (const candidate of randomCandidates) {
            try {
              await ProfileEntitlement.findOneAndUpdate(
                { recruiterId: rId, candidateId: candidate._id },
                {
                  $setOnInsert: {
                    recruiterId: rId,
                    candidateId: candidate._id,
                    status: 'active',
                    pricePaidInPaise: 0,
                    currency: 'INR',
                    grantedAt: new Date(),
                  },
                },
                { upsert: true, new: true }
              );
              console.log(`[ProfilePurchase]   ✓ Entitlement created for candidate ${candidate._id}`);
            } catch (entErr) {
              console.error(`[ProfilePurchase] ❌ Entitlement error for ${candidate._id}:`, entErr.message);
            }
          }

          entitlements = await ProfileEntitlement.find({
            recruiterId: rId,
            status: 'active',
          }).lean();
          console.log(`[ProfilePurchase] Entitlements reloaded. Total active: ${entitlements.length}`);
        } else {
          console.error('[ProfilePurchase] ❌ Credit decrement failed');
        }
      } else {
        console.warn(`[ProfilePurchase] ⚠️  No candidates returned from careerflow_admin.users`);
        console.warn(`[ProfilePurchase] ⚠️  Check: Is there data in that collection? Did excludeIds filter them all?`);
      }
    } else {
      console.log(`[ProfilePurchase] No credits available (balance=${availableBalance}), skipping auto-reveal`);
    }

    // Step 5: Hydrate entitlements with candidate data
    const candidateIds = entitlements
      .map((e) => e.candidateId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    console.log(`[ProfilePurchase] Hydrating ${candidateIds.length} entitlement candidate IDs`);

    let candidates = [];
    if (candidateIds.length > 0) {
      try {
        candidates = await AdminUser.find({ _id: { $in: candidateIds } }).lean();
        console.log(`[ProfilePurchase] Hydrated ${candidates.length} candidates via Mongoose`);
      } catch (hyErr) {
        console.error(`[ProfilePurchase] Mongoose hydrate failed:`, hyErr.message);
      }

      // Native fallback for hydration
      if (candidates.length === 0 && candidateIds.length > 0) {
        try {
          const dbModule = require('../../config/db');
          let adminConn = null;
          if (typeof dbModule.getAdminConnection === 'function') {
            adminConn = dbModule.getAdminConnection();
          }
          if (adminConn && adminConn.db) {
            candidates = await adminConn.db
              .collection('users')
              .find({ _id: { $in: candidateIds } })
              .toArray();
            console.log(`[ProfilePurchase] Hydrated ${candidates.length} candidates via native driver`);
          }
        } catch (nhErr) {
          console.error(`[ProfilePurchase] Native hydrate failed:`, nhErr.message);
        }
      }
    }

    const candidateMap = new Map();
    candidates.forEach((c) => {
      candidateMap.set(c._id.toString(), c);
    });

    // Build final profile list
    const profiles = entitlements
      .map((ent) => {
        const candidate = candidateMap.get(ent.candidateId.toString());
        if (!candidate) {
          console.warn(`[ProfilePurchase] ⚠️  No candidate data found for entitlement ${ent._id} (candidateId=${ent.candidateId})`);
          return null;
        }

        const fullName =
          candidate.name ||
          candidate.fullName ||
          [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') ||
          candidate.email ||
          'Unnamed Candidate';

        const phone =
          candidate.phone ||
          candidate.phoneNumber ||
          candidate.mobile ||
          candidate.contactNumber ||
          null;

        const resume =
          candidate.resume ||
          candidate.resumeUrl ||
          candidate.cv ||
          candidate.cvUrl ||
          null;

        return {
          _id: candidate._id,
          candidateId: candidate._id,
          name: fullName,
          email: candidate.email || null,
          phone,
          resume,
          resumeUrl: resume,
          profilePicture: candidate.profilePicture || candidate.avatar || candidate.photo || null,
          headline: candidate.headline || candidate.title || candidate.jobTitle || null,
          skills: candidate.skills || [],
          location: candidate.location || candidate.city || null,
          unlockedAt: ent.grantedAt || ent.createdAt,
          entitlementId: ent._id,
        };
      })
      .filter(Boolean);

    const finalCredits = await this.getRecruiterCredits(rId);

    console.log(`[ProfilePurchase] ✅ Returning ${profiles.length} profiles to frontend`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    return {
      profiles,
      totalUnlocked: profiles.length,
      credits: finalCredits,
      _debug: {
        totalInAdminUsersCollection: totalInCollection,
        entitlementCount: entitlements.length,
        hydratedCount: candidates.length,
      },
    };
  }
}

module.exports = new ProfilePurchaseService();