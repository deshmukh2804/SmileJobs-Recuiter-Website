// backend/src/routes/profilePurchaseRoutes.js
// All routes require authenticated recruiter. NO subscription requirement
// (per spec: credits/unlocks are independent of subscription).

const express = require("express");
const router = express.Router();

const {
  protect,
  recruiterOnly,
  requireVerified,
} = require("../middleware/authMiddleware");

const {
  getPricing,
  getQuote,
  createOrder,
  verifyPayment,
  getMyEntitlements,
  getUnlockedIds,
  listMyPurchases,
  getSummary,
  streamResume,
} = require("../controllers/profilePurchaseController");

// All routes require: logged-in recruiter with verified account
router.use(protect, recruiterOnly, requireVerified);

// Pricing (admin-controlled, read-only)
router.get("/pricing", getPricing);
router.post("/quote", getQuote);

// Checkout flow
router.post("/order", createOrder);
router.post("/verify", verifyPayment);

// Entitlements
router.get("/entitlements", getMyEntitlements);
router.get("/entitlements/ids", getUnlockedIds);

// History + summary
router.get("/purchases", listMyPurchases);
router.get("/summary", getSummary);

// Secured resume proxy (entitlement-gated inside controller)
router.get("/resume/:candidateId", streamResume);

module.exports = router;