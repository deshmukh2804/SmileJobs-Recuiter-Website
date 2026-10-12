// backend/src/models/profileEntitlementModel.js
// One row per (recruiter, candidate) unlock. Never expires.
// candidateId = application _id from application_db.applications (NOT a copy of profile)

const mongoose = require("mongoose");

const profileEntitlementSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true,
    },

    // Reference to existing application _id — we DO NOT duplicate profile data here
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfilePurchase",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },

    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    revokedReason: { type: String },

    // Price paid for this specific unlock (for audit)
    pricePaidInPaise: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "profile_entitlements" }
);

// Hard uniqueness: a recruiter can hold at most 1 active entitlement per candidate
profileEntitlementSchema.index(
  { recruiterId: 1, candidateId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ProfileEntitlement",
  profileEntitlementSchema
);