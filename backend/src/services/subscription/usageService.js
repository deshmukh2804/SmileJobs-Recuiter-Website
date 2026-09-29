const getJobModel = require("../../models/jobModel");
const RecruiterUsage = require("../../models/recruiterUsageModel");
const RecruiterSubscription = require("../../models/recruiterSubscriptionModel");

class UsageService {
  /**
   * Authoritative job usage - counts from actual DB, never from cached counters
   */
  async getRecruiterJobUsage(recruiterId) {
    const Job = getJobModel();

    const aggregation = await Job.aggregate([
      { $match: { recruiterId: recruiterId } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          liveJobs: { $sum: { $cond: [{ $eq: ["$status", "Live"] }, 1, 0] } },
          pausedJobs: { $sum: { $cond: [{ $eq: ["$status", "Paused"] }, 1, 0] } },
          draftJobs: { $sum: { $cond: [{ $eq: ["$status", "Draft"] }, 1, 0] } },
          closedJobs: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
        },
      },
    ]);

    const stats = aggregation[0] || {
      totalJobs: 0,
      liveJobs: 0,
      pausedJobs: 0,
      draftJobs: 0,
      closedJobs: 0,
    };

    const activeSub = await RecruiterSubscription.findOne({
      recruiterId,
      status: "active",
      currentPeriodEnd: { $gt: new Date() },
    });

    const jobLimit = activeSub ? activeSub.planSnapshot.jobPostLimit : 0;
    const jobsUsed = stats.liveJobs + stats.pausedJobs;
    const remainingJobs = Math.max(0, jobLimit - jobsUsed);

    return {
      totalJobs: stats.totalJobs,
      activeJobs: stats.liveJobs,
      pausedJobs: stats.pausedJobs,
      draftJobs: stats.draftJobs,
      closedJobs: stats.closedJobs,
      jobsUsed,
      jobLimit,
      remainingJobs,
      subscriptionActive: !!activeSub,
      subscription: activeSub
        ? {
            id: activeSub._id,
            tier: activeSub.planSnapshot.tier,
            name: activeSub.planSnapshot.name,
            status: activeSub.status,
            currentPeriodEnd: activeSub.currentPeriodEnd,
            paymentStatus: activeSub.paymentStatus,
            cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
          }
        : null,
    };
  }

  async syncUsageMetadata(recruiterId) {
    const stats = await this.getRecruiterJobUsage(recruiterId);
    await RecruiterUsage.findOneAndUpdate(
      { recruiterId },
      {
        jobPostsUsed: stats.jobsUsed,
        jobPostsLimit: stats.jobLimit,
        candidateViewsLimit: stats.subscription
          ? await this._getResumeLimit(recruiterId)
          : 0,
      },
      { upsert: true, new: true }
    );
    return stats;
  }

  async _getResumeLimit(recruiterId) {
    const sub = await RecruiterSubscription.findOne({
      recruiterId,
      status: "active",
    });
    return sub ? sub.planSnapshot.resumeViewLimit : 0;
  }
}

module.exports = new UsageService();