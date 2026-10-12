// backend/src/controllers/profilePurchaseController.js
// HTTP layer for profile purchase feature. All auth enforced via route-level middleware.

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const pricingService = require("../services/profilePurchase/pricingService");
const profilePurchaseService = require("../services/profilePurchase/profilePurchaseService");
const entitlementService = require("../services/profilePurchase/entitlementService");
const resumeProxyService = require("../services/profilePurchase/resumeProxyService");

const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

/**
 * GET /api/v1/profile-purchase/pricing
 * Returns current admin-controlled pricing. Public to authenticated recruiters.
 */
const getPricing = asyncHandler(async (req, res) => {
  const pricing = await pricingService.getActivePricing();
  return res
    .status(200)
    .json(new ApiResponse(200, pricing, "Pricing fetched successfully."));
});

/**
 * POST /api/v1/profile-purchase/quote
 * Body: { quantity: number }
 * Returns server-authoritative total. Used by frontend to show "You pay ₹X" before checkout.
 */
const getQuote = asyncHandler(async (req, res) => {
  const { quantity } = req.body || {};
  const quote = await pricingService.quote(quantity);
  return res
    .status(200)
    .json(new ApiResponse(200, quote, "Quote calculated."));
});

/**
 * POST /api/v1/profile-purchase/order
 * Body: { candidateIds: ObjectId[] }
 * Creates a Razorpay order for unlocking the specified candidate profiles.
 */
const createOrder = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  if (!recruiterId) throw new ApiError(401, "Authentication required.");

  const { candidateIds } = req.body || {};
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    throw new ApiError(400, "candidateIds (non-empty array) is required.");
  }

  const result = await profilePurchaseService.createPurchaseOrder({
    recruiterId,
    candidateIds,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Order created successfully."));
});

/**
 * POST /api/v1/profile-purchase/verify
 * Body: {
 *   razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId
 * }
 * Verifies Razorpay signature + grants entitlements (idempotent).
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  if (!recruiterId) throw new ApiError(401, "Authentication required.");

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body || {};

  const result = await profilePurchaseService.verifyAndCapturePayment({
    recruiterId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      result.alreadyProcessed
        ? "Payment already verified. Entitlements active."
        : "Payment verified. Profiles unlocked successfully."
    )
  );
});

/**
 * GET /api/v1/profile-purchase/entitlements
 * Returns list of candidateIds this recruiter has unlocked (full list, no pagination here).
 * Also returns a lightweight set for frontend overlay.
 */
const getMyEntitlements = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  if (!recruiterId) throw new ApiError(401, "Authentication required.");

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));

  const result = await entitlementService.listEntitlements(recruiterId, {
    page,
    limit,
  });

  // Also return flat ID array for easy frontend lookup
  const unlockedCandidateIds = result.items.map((e) => String(e.candidateId));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        unlockedCandidateIds,
      },
      "Entitlements fetched."
    )
  );
});

/**
 * GET /api/v1/profile-purchase/entitlements/ids
 * Lightweight endpoint — just returns the Set of unlocked candidateIds.
 * Used on app load and candidate list refresh.
 */
const getUnlockedIds = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  if (!recruiterId) throw new ApiError(401, "Authentication required.");

  const set = await entitlementService.getUnlockedCandidateIdSet(recruiterId);
  const ids = Array.from(set);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { unlockedCandidateIds: ids, count: ids.length },
        "Unlocked IDs fetched."
      )
    );
});

/**
 * GET /api/v1/profile-purchase/purchases
 * Purchase history (paginated).
 */
const listMyPurchases = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  if (!recruiterId) throw new ApiError(401, "Authentication required.");

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const result = await profilePurchaseService.listPurchases(recruiterId, {
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Purchases fetched."));
});

/**
 * GET /api/v1/profile-purchase/summary
 * Stats widget: total spent, total unlocks held, etc.
 */
const getSummary = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  if (!recruiterId) throw new ApiError(401, "Authentication required.");

  const summary = await profilePurchaseService.getRecruiterSummary(recruiterId);
  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Summary fetched."));
});

/**
 * GET /api/v1/profile-purchase/resume/:candidateId
 * Streams the resume PDF through this backend after entitlement check.
 * External URL is NEVER exposed to the client.
 */
const streamResume = asyncHandler(async (req, res) => {
  const recruiterId = req.user?._id || req.user?.id;
  const { candidateId } = req.params;

  await resumeProxyService.streamResume({
    recruiterId,
    candidateId,
    res,
    req,
  });
  // streamResume pipes directly to res; do not send another response
});

module.exports = {
  getPricing,
  getQuote,
  createOrder,
  verifyPayment,
  getMyEntitlements,
  getUnlockedIds,
  listMyPurchases,
  getSummary,
  streamResume,
};