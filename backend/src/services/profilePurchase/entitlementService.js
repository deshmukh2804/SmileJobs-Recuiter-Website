// backend/src/services/profilePurchase/entitlementService.js
// Manages (recruiter, candidate) unlock rows. Idempotent grants.
// Also provides fast "which candidates has this recruiter unlocked?" lookups.

const mongoose = require("mongoose");
const ProfileEntitlement = require("../../models/profileEntitlementModel");
const ApiError = require("../../utils/apiError");

class EntitlementService {
  /**
   * Check if recruiter has active unlock for a single candidate.
   */
  async hasEntitlement(recruiterId, candidateId) {
    if (!recruiterId || !candidateId) return false;
    if (!mongoose.isValidObjectId(candidateId)) return false;

    const row = await ProfileEntitlement.findOne({
      recruiterId,
      candidateId,
      status: "active",
    })
      .select("_id")
      .lean();
    return !!row;
  }

  /**
   * Returns Set<string> of candidateIds this recruiter has unlocked.
   * Used by candidateController to overlay unlock flag on list responses.
   */
  async getUnlockedCandidateIdSet(recruiterId, candidateIds = null) {
    if (!recruiterId) return new Set();

    const query = { recruiterId, status: "active" };
    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      query.candidateId = { $in: candidateIds };
    }

    const rows = await ProfileEntitlement.find(query)
      .select("candidateId")
      .lean();
    return new Set(rows.map((r) => String(r.candidateId)));
  }

  /**
   * Atomically grant unlocks for a list of candidateIds.
   * Idempotent: if entitlement already exists, it is left untouched.
   * Returns { granted: [...], alreadyOwned: [...] }
   */
  async grantEntitlements({
    recruiterId,
    candidateIds,
    purchaseId,
    unitPriceInPaise,
    session = null,
  }) {
    if (!recruiterId) throw new ApiError(400, "recruiterId required");
    if (!purchaseId) throw new ApiError(400, "purchaseId required");
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      throw new ApiError(400, "candidateIds must be a non-empty array");
    }

    const uniqueIds = [...new Set(candidateIds.map(String))];
    const granted = [];
    const alreadyOwned = [];

    for (const cid of uniqueIds) {
      if (!mongoose.isValidObjectId(cid)) {
        // Skip malformed IDs silently; purchase service pre-validates
        continue;
      }

      try {
        const doc = await ProfileEntitlement.findOneAndUpdate(
          { recruiterId, candidateId: cid },
          {
            $setOnInsert: {
              recruiterId,
              candidateId: cid,
              purchaseId,
              status: "active",
              grantedAt: new Date(),
              pricePaidInPaise: unitPriceInPaise,
            },
          },
          {
            upsert: true,
            new: false, // returns pre-insert doc; null means it was newly created
            setDefaultsOnInsert: true,
            session,
          }
        ).lean();

        if (doc) {
          alreadyOwned.push(cid);
        } else {
          granted.push(cid);
        }
      } catch (err) {
        // Duplicate-key race (two parallel grants for same pair) → treat as alreadyOwned
        if (err && err.code === 11000) {
          alreadyOwned.push(cid);
        } else {
          throw err;
        }
      }
    }

    return { granted, alreadyOwned };
  }

  /**
   * List all active entitlements for a recruiter (paginated).
   */
  async listEntitlements(recruiterId, { page = 1, limit = 50 } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    const [items, total] = await Promise.all([
      ProfileEntitlement.find({ recruiterId, status: "active" })
        .sort({ grantedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProfileEntitlement.countDocuments({ recruiterId, status: "active" }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new EntitlementService();