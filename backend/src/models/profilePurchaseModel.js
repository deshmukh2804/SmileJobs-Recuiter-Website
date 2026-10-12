const mongoose = require('mongoose');

const profilePurchaseSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    candidateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPriceInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmountInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    pricingConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    pricingSnapshotAt: {
      type: Date,
      default: Date.now,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: String,
      enum: ['checkout', 'webhook', null],
      default: null,
    },
    rawWebhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
    collection: 'profile_purchases',
  }
);

profilePurchaseSchema.index({ recruiterId: 1, createdAt: -1 });

module.exports = mongoose.model('ProfilePurchase', profilePurchaseSchema);