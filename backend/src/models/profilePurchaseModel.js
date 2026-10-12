// backend/src/models/profilePurchaseModel.js
// Stores every purchase order (recruiter_db — default connection)

const mongoose = require("mongoose");

const profilePurchaseSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true,
    },

    // Candidate IDs the recruiter selected to unlock
    // These are application _id values from application_db.applications
    candidateIds: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "candidateIds must be a non-empty array",
      },
    },

    quantity: { type: Number, required: true, min: 1 },

    // Pricing snapshot (immutable — recorded at order creation)
    unitPriceInPaise: { type: Number, required: true, min: 0 },
    totalAmountInPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    pricingConfigId: { type: mongoose.Schema.Types.ObjectId },
    pricingSnapshotAt: { type: Date, default: Date.now },

    // Razorpay refs
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, sparse: true, index: true },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ["created", "pending", "captured", "failed", "refunded"],
      default: "created",
      index: true,
    },

    paidAt: { type: Date },
    failureReason: { type: String },
    verifiedBy: {
      type: String,
      enum: ["checkout", "webhook", null],
      default: null,
    },

    rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },

    notes: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, collection: "profile_purchases" }
);

profilePurchaseSchema.index({ recruiterId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ProfilePurchase", profilePurchaseSchema);