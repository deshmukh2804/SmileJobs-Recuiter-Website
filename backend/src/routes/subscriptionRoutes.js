const express = require("express");
const router = express.Router();
const { protect, recruiterOnly } = require("../middleware/authMiddleware");
const subscriptionService = require("../services/subscription/subscriptionService");
const usageService = require("../services/subscription/usageService");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

// PUBLIC: List active plans (from careerflow_admin DB)
router.get("/plans", async (req, res, next) => {
  try {
    const plans = await subscriptionService.listAvailablePlans();
    res.status(200).json(new ApiResponse(200, plans, "Plans fetched successfully"));
  } catch (err) {
    next(err);
  }
});

router.use(protect);
router.use(recruiterOnly);

router.get("/my-subscription", async (req, res, next) => {
  try {
    const sub = await subscriptionService.getMyActiveSubscription(req.user._id);
    res.status(200).json(new ApiResponse(200, sub, "Subscription fetched"));
  } catch (err) {
    next(err);
  }
});

router.get("/usage", async (req, res, next) => {
  try {
    const usage = await usageService.getRecruiterJobUsage(req.user._id);
    res.status(200).json(new ApiResponse(200, usage, "Usage fetched"));
  } catch (err) {
    next(err);
  }
});

router.post("/subscribe", async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) return next(new ApiError(400, "planId is required"));
    const result = await subscriptionService.initiateSubscription(req.user, planId);
    res.status(200).json(new ApiResponse(200, result, "Subscription initiated"));
  } catch (err) {
    next(err);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const sub = await subscriptionService.verifyAndActivateSubscription(req.user._id, req.body);
    res.status(200).json(new ApiResponse(200, sub, "Subscription activated"));
  } catch (err) {
    next(err);
  }
});

router.post("/cancel", async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancelSubscription(req.user._id);
    res.status(200).json(new ApiResponse(200, sub, "Subscription cancelled"));
  } catch (err) {
    next(err);
  }
});

router.get("/payments", async (req, res, next) => {
  try {
    const payments = await subscriptionService.listPaymentHistory(req.user._id);
    res.status(200).json(new ApiResponse(200, payments, "Payments fetched"));
  } catch (err) {
    next(err);
  }
});

module.exports = router;