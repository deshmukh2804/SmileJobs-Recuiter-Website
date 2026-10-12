const mongoose = require('mongoose');
const ProfileEntitlement = require('../../models/profileEntitlementModel');

class EntitlementService {
  async hasEntitlement(recruiterId, candidateId) {
    if (!recruiterId || !candidateId) return false;

    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const cId = typeof candidateId === 'string' ? new mongoose.Types.ObjectId(candidateId) : candidateId;

    const entitlement = await ProfileEntitlement.findOne({
      recruiterId: rId,
      candidateId: cId,
      status: 'active',
    }).lean();

    return !!entitlement;
  }

  async getUnlockedCandidateIdSet(recruiterId) {
    if (!recruiterId) return new Set();

    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const entitlements = await ProfileEntitlement.find({
      recruiterId: rId,
      status: 'active',
    })
      .select('candidateId')
      .lean();

    return new Set(entitlements.map((e) => e.candidateId.toString()));
  }

  async listEntitlements(recruiterId, options = {}) {
    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const limit = options.limit || 100;
    const skip = options.skip || 0;

    return await ProfileEntitlement.find({
      recruiterId: rId,
      status: 'active',
    })
      .sort({ grantedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async grantEntitlements({ recruiterId, candidateIds, pricePaidInPaise, currency, purchaseId }) {
    if (!candidateIds || candidateIds.length === 0) return [];

    const rId = typeof recruiterId === 'string' ? new mongoose.Types.ObjectId(recruiterId) : recruiterId;
    const pId = purchaseId ? (typeof purchaseId === 'string' ? new mongoose.Types.ObjectId(purchaseId) : purchaseId) : null;

    const operations = candidateIds.map((cId) => {
      const candObjId = typeof cId === 'string' ? new mongoose.Types.ObjectId(cId) : cId;
      return {
        updateOne: {
          filter: { recruiterId: rId, candidateId: candObjId },
          update: {
            $setOnInsert: {
              recruiterId: rId,
              candidateId: candObjId,
              status: 'active',
              pricePaidInPaise: pricePaidInPaise || 0,
              currency: currency || 'INR',
              grantedAt: new Date(),
              purchaseId: pId,
            },
          },
          upsert: true,
        },
      };
    });

    return await ProfileEntitlement.bulkWrite(operations);
  }
}

module.exports = new EntitlementService();