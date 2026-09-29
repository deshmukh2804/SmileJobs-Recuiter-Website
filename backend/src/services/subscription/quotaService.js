const usageService = require("./usageService");
const RecruiterSubscription = require("../../models/recruiterSubscriptionModel");
const ApiError = require("../../utils/apiError");

class QuotaService {
  async verifyJobCreationAllowance(recruiterId) {
    const stats = await usageService.getRecruiterJobUsage(recruiterId);

    if (!stats.subscriptionActive) {
      throw new ApiError(
        403,
        "Active subscription required to publish jobs.",
        [{ code: "NO_ACTIVE_SUBSCRIPTION", limit: 0, used: stats.jobsUsed, remaining: 0 }]
      );
    }

    if (stats.remainingJobs <= 0) {
      throw new ApiError(
        403,
        "Your current subscription has reached its job posting limit.",
        [{
          code: "JOB_LIMIT_REACHED",
          limit: stats.jobLimit,
          used: stats.jobsUsed,
          remaining: 0,
        }]
      );
    }

    return stats;
  }

  async enforceCandidateAccessRules(recruiterId, candidateData) {
    const activeSub = await RecruiterSubscription.findOne({
      recruiterId,
      status: "active",
      currentPeriodEnd: { $gt: new Date() },
    });

    const tier = activeSub ? activeSub.planSnapshot.tier : "none";
    return this._maskCandidateFields(candidateData, tier);
  }

  _maskCandidateFields(data, tier) {
    const isArray = Array.isArray(data);
    const list = isArray ? data : [data];

    const processed = list.map((cand) => {
      const copy = { ...cand };
      const normalizedTier = (tier || "none").toLowerCase();

      if (normalizedTier === "none") {
        copy.phone = "";
        copy.email = "";
        copy.resumeUrl = "";
        copy.candidateAccessLevel = "none";
      } else if (normalizedTier === "basic") {
        copy.phone = this._obfuscate(copy.phone);
        copy.email = this._obfuscate(copy.email);
        copy.resumeUrl = "";
        copy.candidateAccessLevel = "basic";
      } else if (normalizedTier === "standard" || normalizedTier === "pro") {
        copy.phone = this._obfuscate(copy.phone);
        copy.candidateAccessLevel = "standard";
      } else {
        // enterprise or higher: full access
        copy.candidateAccessLevel = "enterprise";
      }
      return copy;
    });

    return isArray ? processed : processed[0];
  }

  _obfuscate(str) {
    if (!str) return "";
    if (str.includes("@")) {
      const [user, domain] = str.split("@");
      return `${user.substring(0, 2)}***@${domain}`;
    }
    return str.length > 5 ? `${str.substring(0, 3)}******${str.slice(-2)}` : "***";
  }
}

module.exports = new QuotaService();