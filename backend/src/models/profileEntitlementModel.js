const mongoose = require('mongoose');

const profileEntitlementSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
    pricePaidInPaise: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProfilePurchase',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'profile_entitlements',
  }
);

profileEntitlementSchema.index({ recruiterId: 1, candidateId: 1 }, { unique: true });
profileEntitlementSchema.index({ recruiterId: 1, status: 1 });

module.exports = mongoose.model('ProfileEntitlement', profileEntitlementSchema);