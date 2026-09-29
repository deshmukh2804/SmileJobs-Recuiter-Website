const RecruiterSubscription = require("../models/recruiterSubscriptionModel");
const quotaService = require("../services/subscription/quotaService");
const ApiError = require("../utils/apiError");

const requireActiveSubscription = async (req, res, next) => {
  try {
    const activeSub = await RecruiterSubscription.findOne({
      recruiterId: req.user._id,
      status: "active",
      currentPeriodEnd: { $gt: new Date() },
    });

    if (!activeSub) {
      return next(
        new ApiError(403, "Active subscription required. Please subscribe to a plan first.")
      );
    }

    req.subscription = activeSub;
    next();
  } catch (error) {
    next(error);
  }
};

const requireJobQuota = async (req, res, next) => {
  try {
    // Skip quota check for drafts
    const isDraft = req.body.status === "Draft" || req.body.status === "draft";
    if (isDraft) return next();

    await quotaService.verifyJobCreationAllowance(req.user._id);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireActiveSubscription, requireJobQuota };