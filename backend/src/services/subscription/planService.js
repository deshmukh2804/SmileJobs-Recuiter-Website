const getSubscriptionPlanModel = require("../../models/subscriptionPlanModel");
const ApiError = require("../../utils/apiError");

class PlanService {
  /**
   * Fetches all active plans from careerflow_admin.subscriptionplans
   * Sorted by displayOrder → price → createdAt
   */
  async listActivePlans() {
    const Plan = getSubscriptionPlanModel();
    const plans = await Plan.find({ isActive: true })
      .sort({ displayOrder: 1, price: 1, createdAt: 1 })
      .lean();
    return plans;
  }

  /**
   * Fetches a single plan by ID (admin-controlled)
   */
  async getPlanById(planId) {
    const Plan = getSubscriptionPlanModel();
    const plan = await Plan.findOne({ _id: planId, isActive: true }).lean();
    if (!plan) {
      throw new ApiError(
        404,
        "Selected plan is unavailable, inactive, or has been removed by administrator."
      );
    }
    return plan;
  }

  /**
   * Fetches plan by tier — used for auto-detection of Basic/Standard/Enterprise
   */
  async getPlanByTier(tier) {
    const Plan = getSubscriptionPlanModel();
    return await Plan.findOne({ tier: tier.toLowerCase(), isActive: true }).lean();
  }

  /**
   * Builds an immutable snapshot from the plan document.
   * Used when creating a RecruiterSubscription so future admin
   * price/limit changes never break existing recruiters.
   */
  buildPlanSnapshot(plan) {
    return {
      name: plan.name,
      tier: plan.tier,
      price: plan.price,
      currency: plan.currency || "INR",
      billingCycle: plan.billingCycle || "monthly",
      jobPostLimit: plan.jobPostLimit,
      resumeViewLimit: plan.resumeViewLimit,
      features: Array.isArray(plan.features) ? plan.features : [],
    };
  }

  /**
   * Determines effective price with discount applied
   */
  calculateEffectivePrice(plan) {
    const basePrice = Number(plan.price) || 0;
    const discount = Number(plan.discountPercent) || 0;
    if (discount <= 0) return basePrice;
    const discountedPrice = basePrice - (basePrice * discount) / 100;
    return Math.max(0, Math.round(discountedPrice * 100) / 100);
  }

  /**
   * Calculates billing period end date based on plan billing cycle
   */
  calculatePeriodEnd(billingCycle) {
    const now = new Date();
    const end = new Date(now);
    const cycle = (billingCycle || "monthly").toLowerCase();
    switch (cycle) {
      case "yearly":
        end.setFullYear(end.getFullYear() + 1);
        break;
      case "weekly":
        end.setDate(end.getDate() + 7);
        break;
      case "daily":
        end.setDate(end.getDate() + 1);
        break;
      case "monthly":
      default:
        end.setDate(end.getDate() + 30);
        break;
    }
    return end;
  }
}

module.exports = new PlanService();