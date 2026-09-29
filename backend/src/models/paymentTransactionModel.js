const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruiterSubscription",
    },
    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    razorpaySubscriptionId: { type: String, default: "", index: true },
    razorpaySignature: { type: String, default: "" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "captured", "failed", "refunded"],
      default: "created",
    },
    paymentType: {
      type: String,
      enum: ["one_time", "recurring"],
      default: "one_time",
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    planSnapshot: {
      name: String,
      tier: String,
    },
    failureReason: { type: String, default: "" },
    rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true, collection: "payment_transactions" }
);

module.exports = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);