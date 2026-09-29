const mongoose = require("mongoose");

const recruiterSubscriptionSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Immutable snapshot at time of purchase — protects users from admin plan changes
    planSnapshot: {
      name: { type: String, required: true },
      tier: { type: String, required: true },
      price: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      billingCycle: { type: String, required: true },
      jobPostLimit: { type: Number, required: true },
      resumeViewLimit: { type: Number, required: true },
      features: [{ type: String }],
    },
    razorpayCustomerId: { type: String, default: "" },
    razorpaySubscriptionId: { type: String, default: "", index: true },
    razorpayPlanId: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "paused",
        "cancelled",
        "expired",
        "halted",
        "payment_failed",
      ],
      default: "pending",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true, index: true },
    nextBillingAt: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    activatedAt: { type: Date },
    expiredAt: { type: Date },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "failed", "not_required"],
      default: "pending",
    },
    lastPaymentId: { type: String, default: "" },
  },
  { timestamps: true, collection: "recruiter_subscriptions" }
);

recruiterSubscriptionSchema.index({ recruiterId: 1, status: 1 });

module.exports = mongoose.model(
  "RecruiterSubscription",
  recruiterSubscriptionSchema
);