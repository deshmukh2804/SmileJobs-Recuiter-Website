const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const ProfilePurchase = require('../../models/profilePurchaseModel');
const ProfileEntitlement = require('../../models/profileEntitlementModel');
const User = require('../../models/userModel');
const pricingService = require('./pricingService');

// ═══════════════════════════════════════════════════════════════
// INLINE RECRUITER CREDIT MODEL - Self-contained, no external file needed
// ═══════════════════════════════════════════════════════════════
let RecruiterCredit;
try {
  RecruiterCredit = require('../../models/recruiterCreditModel');
} catch (e) {
  const recruiterCreditSchema = new mongoose.Schema(
    {
      recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true,
      },
      balance: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Credit balance cannot be negative'],
      },
      totalPurchased: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      totalUsed: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
      collection: 'recruiter_credits',
    }
  );
  RecruiterCredit =
    mongoose.models.RecruiterCredit ||
    mongoose.model('RecruiterCredit', recruiterCreditSchema);
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
      credit = {
        recruiterId: rId,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      };
    }
    return credit;
  }

  async grantCredits(recruiterId, quantity) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    const updated = await RecruiterCredit.findOneAndUpdate(
      { recruiterId: rId },
      {
        $inc: { balance: qty, totalPurchased: qty },
        $setOnInsert: { totalUsed: 0 },
      },
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
      notes: {
        recruiterId: recruiterId.toString(),
        quantity: String(quote.quantity),
        purchaseType: 'profile_purchase_credits',
      },
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
    if (!isValid) {
      throw new Error('Invalid Razorpay signature. Payment verification failed.');
    }

    const purchase = await ProfilePurchase.findOne({ razorpayOrderId });
    if (!purchase) {
      throw new Error(`Profile purchase order ${razorpayOrderId} not found.`);
    }

    if (purchase.status === 'captured') {
      const credit = await this.getRecruiterCredits(recruiterId);
      return {
        success: true,
        alreadyProcessed: true,
        purchase,
        credits: credit,
      };
    }

    purchase.status = 'captured';
    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.razorpaySignature = razorpaySignature;
    purchase.paidAt = new Date();
    purchase.verifiedBy = 'checkout';
    await purchase.save();

    const updatedCredits = await this.grantCredits(purchase.recruiterId, purchase.quantity);

    return {
      success: true,
      purchase,
      credits: updatedCredits,
    };
  }

  async unlockCandidate({ recruiterId, candidateId }) {
    if (!recruiterId || !candidateId) {
      throw new Error('recruiterId and candidateId are required');
    }

    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    const existingEntitlement = await ProfileEntitlement.findOne({
      recruiterId: rId,
      candidateId: cId,
      status: 'active',
    });

    if (existingEntitlement) {
      const credit = await this.getRecruiterCredits(rId);
      return {
        success: true,
        alreadyUnlocked: true,
        entitlement: existingEntitlement,
        remainingCredits: credit.balance,
      };
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
          recruiterId: rId,
          candidateId: cId,
          status: 'active',
          pricePaidInPaise: 0,
          currency: 'INR',
          grantedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      entitlement,
      remainingCredits: creditDoc.balance,
    };
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
    const limit = options.limit || 50;
    const skip = options.skip || 0;

    return await ProfilePurchase.find({ recruiterId: rId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Auto-reveal unlocked profiles with lazy credit consumption
  // Logic:
  //  1. Fetch all existing active entitlements for this recruiter
  //  2. If recruiter has unused credits (balance > 0), auto-consume them
  //     by picking random candidates from User collection (excluding
  //     already-unlocked ones) and creating entitlements
  //  3. Return the full list of entitled candidates with revealed
  //     email, phone, and resumeUrl
  // ═══════════════════════════════════════════════════════════════
  async getUnlockedProfilesWithAutoReveal(recruiterId) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;

    // Step 1: Fetch existing entitlements
    let entitlements = await ProfileEntitlement.find({
      recruiterId: rId,
      status: 'active',
    }).lean();

    const alreadyUnlockedIds = entitlements.map((e) => e.candidateId.toString());

    // Step 2: Check for unused credits and auto-consume them
    const creditDoc = await RecruiterCredit.findOne({ recruiterId: rId });
    let availableBalance = creditDoc ? creditDoc.balance : 0;

    if (availableBalance > 0) {
      // Fetch random candidates from User pool, excluding already-unlocked ones
      const excludeIds = alreadyUnlockedIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      // Build base filter: exclude recruiters, only include candidate-type users
      const baseFilter = {
        _id: { $nin: excludeIds },
        $and: [
          {
            $or: [
              { role: { $exists: false } },
              { role: 'user' },
              { role: 'candidate' },
              { role: 'jobseeker' },
            ],
          },
        ],
      };

      // Use aggregation $sample for random selection
      const randomCandidates = await User.aggregate([
        { $match: baseFilter },
        { $sample: { size: availableBalance } },
      ]);

      if (randomCandidates.length > 0) {
        // Atomically decrement credit balance by the number we're actually unlocking
        const unlockCount = randomCandidates.length;
        const updatedCredit = await RecruiterCredit.findOneAndUpdate(
          { recruiterId: rId, balance: { $gte: unlockCount } },
          { $inc: { balance: -unlockCount, totalUsed: unlockCount } },
          { new: true }
        );

        if (updatedCredit) {
          // Create entitlements for each selected candidate
          const newEntitlements = [];
          for (const candidate of randomCandidates) {
            try {
              const entitlement = await ProfileEntitlement.findOneAndUpdate(
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
              newEntitlements.push(entitlement);
            } catch (entErr) {
              console.error('[ProfilePurchase] Entitlement upsert error:', entErr.message);
            }
          }

          // Refresh entitlements list
          entitlements = await ProfileEntitlement.find({
            recruiterId: rId,
            status: 'active',
          }).lean();
        }
      }
    }

    // Step 3: Hydrate entitlements with candidate profile data
    const candidateIds = entitlements.map((e) => e.candidateId);
    const candidates = await User.find({ _id: { $in: candidateIds } })
      .select('name fullName firstName lastName email phone phoneNumber mobile resume resumeUrl profilePicture avatar headline title skills experience location createdAt')
      .lean();

    const candidateMap = new Map();
    candidates.forEach((c) => {
      candidateMap.set(c._id.toString(), c);
    });

    // Build final response with revealed fields
    const profiles = entitlements
      .map((ent) => {
        const candidate = candidateMap.get(ent.candidateId.toString());
        if (!candidate) return null;

        const fullName =
          candidate.name ||
          candidate.fullName ||
          [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') ||
          'Unnamed Candidate';

        const phone =
          candidate.phone ||
          candidate.phoneNumber ||
          candidate.mobile ||
          null;

        const resume =
          candidate.resume ||
          candidate.resumeUrl ||
          null;

        return {
          _id: candidate._id,
          candidateId: candidate._id,
          name: fullName,
          email: candidate.email || null,
          phone,
          resume,
          resumeUrl: resume,
          profilePicture: candidate.profilePicture || candidate.avatar || null,
          headline: candidate.headline || candidate.title || null,
          skills: candidate.skills || [],
          location: candidate.location || null,
          unlockedAt: ent.grantedAt || ent.createdAt,
          entitlementId: ent._id,
        };
      })
      .filter(Boolean);

    // Final credit snapshot
    const finalCredits = await this.getRecruiterCredits(rId);

    return {
      profiles,
      totalUnlocked: profiles.length,
      credits: finalCredits,
    };
  }
}

module.exports = new ProfilePurchaseService();