const mongoose = require("mongoose");
const { getAdminConnection } = require("../config/db");

// Schema mirrors your admin-managed plan structure exactly
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tier: {
      type: String,
      required: true,
      lowercase: true,
    },
    audience: { type: String, default: "recruiters" },
    price: { type: Number, required: true, default: 0 },
    priceYearly: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    billingCycle: { type: String, default: "monthly" },
    description: { type: String, default: "" },
    features: [{ type: String }],
    advantages: [{ type: String }],
    jobPostLimit: { type: Number, required: true, default: 0 },
    resumeViewLimit: { type: Number, required: true, default: 0 },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    discountPercent: { type: Number, default: 0 },
    trialDays: { type: Number, default: 0 },
    razorpayPlanId: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    strict: false, // Accept any additional admin-configured fields
  }
);

let PlanModel = null;

/**
 * Returns the SubscriptionPlan model bound to careerflow_admin database.
 * Collection name is 'subscriptionplans' (matches admin panel exactly).
 */
const getSubscriptionPlanModel = () => {
  if (!PlanModel) {
    const conn = getAdminConnection();
    PlanModel = conn.model(
      "SubscriptionPlan",
      subscriptionPlanSchema,
      "subscriptionplans" // ← Exact collection name in careerflow_admin
    );
  }
  return PlanModel;
};

module.exports = getSubscriptionPlanModel;