// backend/src/services/profilePurchase/profilePurchaseService.js
// Orchestrates: validate candidates → quote price → create Razorpay order
// → verify payment (checkout OR webhook) → grant entitlements (idempotent)

const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const ProfilePurchase = require("../../models/profilePurchaseModel");
const ProfileEntitlement = require("../../models/profileEntitlementModel");
const pricingService = require("./pricingService");
const entitlementService = require("./entitlementService");
const ApiError = require("../../utils/apiError");

// Reuse existing application model loader (DO NOT touch applications collection — read-only)
let _getApplicationModel = null;
function getApplicationModel() {
  if (!_getApplicationModel) {
    _getApplicationModel = require("../../models/applicationModel");
  }
  // applicationModel exports a function that returns the model
  if (typeof _getApplicationModel === "function") {
    return _getApplicationModel();
  }
  return _getApplicationModel;
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

let _razorpayInstance = null;
function getRazorpay() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new ApiError(
      500,
      "Payment gateway not configured. RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing."
    );
  }
  if (!_razorpayInstance) {
    _razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpayInstance;
}

class ProfilePurchaseService {
  /**
   * Validates that each candidateId exists in application_db.applications.
   * We DO NOT modify applications. Pure read-only existence check.
   * Also filters out any candidate the recruiter already owns.
   */
  async _validateAndFilterCandidates(recruiterId, candidateIds) {
    const uniqueIds = [...new Set(candidateIds.map(String))];

    // 1. Format check
    const validObjectIds = uniqueIds.filter((id) =>
      mongoose.isValidObjectId(id)
    );
    if (validObjectIds.length !== uniqueIds.length) {
      throw new ApiError(400, "One or more candidateIds are malformed.");
    }

    // 2. Existence check in application_db.applications
    const Application = getApplicationModel();
    const existing = await Application.find({
      _id: { $in: validObjectIds },
    })
      .select("_id")
      .lean();

    const existingIdSet = new Set(existing.map((d) => String(d._id)));
    const missing = validObjectIds.filter((id) => !existingIdSet.has(id));

    if (missing.length > 0) {
      throw new ApiError(
        400,
        `Candidate(s) not found in applications: ${missing.join(", ")}`
      );
    }

    // 3. Filter out already-owned (prevents double-charging for same unlock)
    const alreadyOwnedSet = await entitlementService.getUnlockedCandidateIdSet(
      recruiterId,
      validObjectIds
    );
    const toPurchase = validObjectIds.filter(
      (id) => !alreadyOwnedSet.has(id)
    );
    const alreadyOwned = validObjectIds.filter((id) =>
      alreadyOwnedSet.has(id)
    );

    return {
      toPurchase,
      alreadyOwned,
    };
  }

  /**
   * STEP 1 — Create a purchase order.
   * - Server validates candidates, prices in paise, calls Razorpay.
   * - Returns checkout data for frontend Razorpay modal.
   */
  async createPurchaseOrder({ recruiterId, candidateIds }) {
    if (!recruiterId) throw new ApiError(401, "Authentication required.");
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      throw new ApiError(400, "candidateIds (non-empty array) is required.");
    }

    // Validate + filter (removes already-owned, verifies existence)
    const { toPurchase, alreadyOwned } =
      await this._validateAndFilterCandidates(recruiterId, candidateIds);

    if (toPurchase.length === 0) {
      throw new ApiError(
        409,
        "You already own unlocks for all selected candidates.",
        { alreadyOwned }
      );
    }

    // Server-authoritative pricing
    const quote = await pricingService.quote(toPurchase.length);

    // Create Razorpay order
    const razorpay = getRazorpay();
    const receipt = `pp_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")}`;

    const notes = {
      purchaseType: "profile_purchase",
      recruiterId: String(recruiterId),
      quantity: String(toPurchase.length),
    };

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: quote.totalAmountInPaise, // integer paise — Razorpay expects paise
        currency: quote.currency,
        receipt,
        notes,
        payment_capture: 1,
      });
    } catch (err) {
      console.error(
        "[profilePurchase] Razorpay order creation failed:",
        err?.error || err
      );
      throw new ApiError(
        502,
        err?.error?.description ||
          "Failed to create payment order. Please try again."
      );
    }

    // Persist purchase record (status=created)
    const purchase = await ProfilePurchase.create({
      recruiterId,
      candidateIds: toPurchase,
      quantity: toPurchase.length,
      unitPriceInPaise: quote.unitPriceInPaise,
      totalAmountInPaise: quote.totalAmountInPaise,
      currency: quote.currency,
      pricingConfigId: quote.pricingConfigId,
      pricingSnapshotAt: new Date(),
      razorpayOrderId: rzpOrder.id,
      status: "created",
      notes: {
        receipt,
        requestedCandidateIds: candidateIds.map(String),
        alreadyOwnedAtCreation: alreadyOwned,
      },
    });

    return {
      purchaseId: purchase._id,
      razorpayOrderId: rzpOrder.id,
      amount: quote.totalAmountInPaise,     // paise (Razorpay checkout expects paise)
      amountInRupees: quote.totalAmount,
      currency: quote.currency,
      quantity: toPurchase.length,
      unitPriceInPaise: quote.unitPriceInPaise,
      candidateIds: toPurchase,
      alreadyOwned,
      razorpayKeyId: RAZORPAY_KEY_ID, // frontend prefers VITE_RAZORPAY_KEY_ID, this is fallback
    };
  }

  /**
   * STEP 2a — Verify payment from Razorpay checkout callback.
   * Idempotent: if already captured, returns success without re-granting.
   */
  async verifyAndCapturePayment({
    recruiterId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Missing Razorpay verification fields.");
    }

    // Signature verification (checkout callback uses order_id + payment_id)
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw new ApiError(400, "Payment signature verification failed.");
    }

    const purchase = await ProfilePurchase.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!purchase) {
      throw new ApiError(404, "Purchase record not found for this order.");
    }

    // Ownership check — recruiter can only verify own orders
    if (recruiterId && String(purchase.recruiterId) !== String(recruiterId)) {
      throw new ApiError(403, "You are not authorized to verify this order.");
    }

    // Idempotency: already captured → return existing entitlements
    if (purchase.status === "captured") {
      return {
        alreadyProcessed: true,
        purchaseId: purchase._id,
        unlockedCandidateIds: purchase.candidateIds.map(String),
      };
    }

    if (purchase.status === "failed" || purchase.status === "refunded") {
      throw new ApiError(
        409,
        `Purchase is in terminal state: ${purchase.status}`
      );
    }

    // Mark captured + grant entitlements
    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.razorpaySignature = razorpay_signature;
    purchase.status = "captured";
    purchase.paidAt = new Date();
    purchase.verifiedBy = "checkout";
    await purchase.save();

    const grantResult = await entitlementService.grantEntitlements({
      recruiterId: purchase.recruiterId,
      candidateIds: purchase.candidateIds,
      purchaseId: purchase._id,
      unitPriceInPaise: purchase.unitPriceInPaise,
    });

    return {
      alreadyProcessed: false,
      purchaseId: purchase._id,
      unlockedCandidateIds: purchase.candidateIds.map(String),
      granted: grantResult.granted,
      alreadyOwned: grantResult.alreadyOwned,
    };
  }

  /**
   * STEP 2b — Called by webhook router when payment.captured arrives.
   * Also idempotent. Does NOT require recruiter context.
   */
  async handleWebhookPaymentCaptured({ razorpayOrderId, razorpayPaymentId, rawPayload }) {
    const purchase = await ProfilePurchase.findOne({
      razorpayOrderId,
    });
    if (!purchase) {
      // Not our order (likely a subscription payment) — ignore
      return { handled: false, reason: "not_a_profile_purchase" };
    }

    if (purchase.status === "captured") {
      return { handled: true, idempotent: true, purchaseId: purchase._id };
    }

    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.status = "captured";
    purchase.paidAt = new Date();
    purchase.verifiedBy = "webhook";
    purchase.rawWebhookPayload = rawPayload;
    await purchase.save();

    await entitlementService.grantEntitlements({
      recruiterId: purchase.recruiterId,
      candidateIds: purchase.candidateIds,
      purchaseId: purchase._id,
      unitPriceInPaise: purchase.unitPriceInPaise,
    });

    return { handled: true, idempotent: false, purchaseId: purchase._id };
  }

  async handleWebhookPaymentFailed({ razorpayOrderId, failureReason, rawPayload }) {
    const purchase = await ProfilePurchase.findOne({ razorpayOrderId });
    if (!purchase) {
      return { handled: false, reason: "not_a_profile_purchase" };
    }
    if (purchase.status === "captured") {
      // Already captured elsewhere — ignore late failure
      return { handled: true, ignored: true };
    }
    if (purchase.status === "failed") {
      return { handled: true, idempotent: true };
    }
    purchase.status = "failed";
    purchase.failureReason = failureReason || "unknown";
    purchase.rawWebhookPayload = rawPayload;
    await purchase.save();
    return { handled: true };
  }

  /**
   * Lists recruiter's purchase history (paginated).
   */
  async listPurchases(recruiterId, { page = 1, limit = 20 } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    const [items, total] = await Promise.all([
      ProfilePurchase.find({ recruiterId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProfilePurchase.countDocuments({ recruiterId }),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Summary stats for recruiter: total spent, total unlocks, etc.
   */
  async getRecruiterSummary(recruiterId) {
    const [agg, activeUnlockCount] = await Promise.all([
      ProfilePurchase.aggregate([
        {
          $match: {
            recruiterId: new mongoose.Types.ObjectId(String(recruiterId)),
            status: "captured",
          },
        },
        {
          $group: {
            _id: null,
            totalSpentPaise: { $sum: "$totalAmountInPaise" },
            totalPurchases: { $sum: 1 },
            totalUnlocksBought: { $sum: "$quantity" },
          },
        },
      ]),
      ProfileEntitlement.countDocuments({
        recruiterId,
        status: "active",
      }),
    ]);

    const stats = agg[0] || {
      totalSpentPaise: 0,
      totalPurchases: 0,
      totalUnlocksBought: 0,
    };

    return {
      totalSpentPaise: stats.totalSpentPaise,
      totalSpent: stats.totalSpentPaise / 100,
      totalPurchases: stats.totalPurchases,
      totalUnlocksBought: stats.totalUnlocksBought,
      activeUnlocks: activeUnlockCount,
      currency: "INR",
    };
  }
}

module.exports = new ProfilePurchaseService();