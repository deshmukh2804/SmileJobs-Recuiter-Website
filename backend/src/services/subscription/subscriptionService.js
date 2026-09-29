const RecruiterSubscription = require("../../models/recruiterSubscriptionModel");
const PaymentTransaction = require("../../models/paymentTransactionModel");
const planService = require("./planService");
const usageService = require("./usageService");
const razorpayService = require("../payments/razorpayService");
const ApiError = require("../../utils/apiError");

class SubscriptionService {
  async listAvailablePlans() {
    return await planService.listActivePlans();
  }

  async getMyActiveSubscription(recruiterId) {
    return await RecruiterSubscription.findOne({
      recruiterId,
      status: "active",
      currentPeriodEnd: { $gt: new Date() },
    });
  }

  /**
   * Initiates subscription — FREE plans activate immediately,
   * PAID plans create a Razorpay order.
   */
  async initiateSubscription(recruiter, planId) {
    const plan = await planService.getPlanById(planId);
    const effectivePrice = planService.calculateEffectivePrice(plan);
    const now = new Date();
    const periodEnd = planService.calculatePeriodEnd(plan.billingCycle);
    const snapshot = planService.buildPlanSnapshot(plan);

    // ═══ FREE PLAN — Activate immediately ═══
    if (effectivePrice === 0) {
      // Expire any existing active subscriptions
      await RecruiterSubscription.updateMany(
        { recruiterId: recruiter._id, status: "active" },
        { status: "expired", expiredAt: now }
      );

      const freeSub = await RecruiterSubscription.create({
        recruiterId: recruiter._id,
        planId: plan._id,
        planSnapshot: snapshot,
        status: "active",
        amount: 0,
        currency: plan.currency || "INR",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentStatus: "not_required",
        activatedAt: now,
      });

      await usageService.syncUsageMetadata(recruiter._id);

      return {
        isFreePlan: true,
        subscription: freeSub,
        plan: plan,
      };
    }

    // ═══ PAID PLAN — Create Razorpay order ═══
    const receipt = `sub_${recruiter._id.toString().slice(-8)}_${Date.now()}`;
    const order = await razorpayService.createOrder(
      effectivePrice,
      plan.currency || "INR",
      receipt,
      {
        recruiterId: recruiter._id.toString(),
        planId: plan._id.toString(),
        tier: plan.tier,
        planName: plan.name,
      }
    );

    const pendingSub = await RecruiterSubscription.create({
      recruiterId: recruiter._id,
      planId: plan._id,
      planSnapshot: snapshot,
      status: "pending",
      amount: effectivePrice,
      currency: plan.currency || "INR",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentStatus: "pending",
    });

    await PaymentTransaction.create({
      recruiterId: recruiter._id,
      subscriptionId: pendingSub._id,
      razorpayOrderId: order.id,
      amount: effectivePrice,
      currency: plan.currency || "INR",
      status: "created",
      planId: plan._id,
      planSnapshot: { name: plan.name, tier: plan.tier },
      paymentType: "one_time",
    });

    return {
      isFreePlan: false,
      orderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      internalSubId: pendingSub._id,
      amount: effectivePrice,
      currency: plan.currency || "INR",
      planName: plan.name,
      planTier: plan.tier,
    };
  }

  /**
   * Verifies payment and activates subscription
   * Handles: successful payment, duplicate verification, signature mismatch
   */
  async verifyAndActivateSubscription(recruiterId, payload) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internalSubId,
    } = payload;

    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internalSubId) {
      throw new ApiError(400, "Missing payment verification parameters. Please try again.");
    }

    // Verify Razorpay signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error(`❌ Payment signature mismatch for order: ${razorpay_order_id}`);
      
      // Mark payment as failed
      await PaymentTransaction.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "failed",
          failureReason: "Signature verification failed",
          razorpayPaymentId: razorpay_payment_id,
        }
      );

      throw new ApiError(400, "Payment verification failed: Invalid signature. If money was deducted, it will be refunded automatically.");
    }

    // Find the pending subscription
    const sub = await RecruiterSubscription.findOne({
      _id: internalSubId,
      recruiterId,
    });

    if (!sub) {
      throw new ApiError(404, "Subscription record not found. Please contact support.");
    }

    // Idempotent: if already active, just return
    if (sub.status === "active") {
      console.log(`ℹ️ Subscription ${internalSubId} already active. Returning existing.`);
      return sub;
    }

    // Expire previous active subscriptions
    await RecruiterSubscription.updateMany(
      { recruiterId, status: "active", _id: { $ne: sub._id } },
      { status: "expired", expiredAt: new Date() }
    );

    // Activate the new subscription
    const now = new Date();
    sub.status = "active";
    sub.paymentStatus = "paid";
    sub.lastPaymentId = razorpay_payment_id;
    sub.activatedAt = now;
    await sub.save();

    // Update payment transaction
    await PaymentTransaction.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "captured",
        paidAt: now,
      }
    );

    // Sync usage cache
    await usageService.syncUsageMetadata(recruiterId);

    console.log(`✅ Subscription activated: ${sub.planSnapshot.name} for recruiter ${recruiterId}`);

    return sub;
  }

  async cancelSubscription(recruiterId) {
    const sub = await RecruiterSubscription.findOne({
      recruiterId,
      status: "active",
    });
    if (!sub) throw new ApiError(404, "No active subscription found");

    sub.cancelAtPeriodEnd = true;
    sub.cancelledAt = new Date();
    await sub.save();
    return sub;
  }

  async listPaymentHistory(recruiterId) {
    return await PaymentTransaction.find({ recruiterId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }
}

module.exports = new SubscriptionService();