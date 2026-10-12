const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const ProfilePurchase = require('../../models/profilePurchaseModel');
const ProfileEntitlement = require('../../models/profileEntitlementModel');
const pricingService = require('./pricingService');

// ═══════════════════════════════════════════════════════════════
// INLINE RECRUITER CREDIT MODEL - Self-contained, no external file needed
// ═══════════════════════════════════════════════════════════════
let RecruiterCredit;
try {
  // Try to load existing model file if present
  RecruiterCredit = require('../../models/recruiterCreditModel');
} catch (e) {
  // Fallback: Define schema inline so service runs regardless
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
}

module.exports = new ProfilePurchaseService();