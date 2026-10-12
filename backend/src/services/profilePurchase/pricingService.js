// backend/src/services/profilePurchase/pricingService.js
// Fetches admin-controlled pricing. 30-second cache. Enforces enabled flag.

const getProfilePricingModel = require("../../models/profilePricingModel");
const ApiError = require("../../utils/apiError");

const CACHE_TTL_MS = 30 * 1000;
let _cache = { data: null, expiresAt: 0 };

class PricingService {
  _isCacheValid() {
    return _cache.data && Date.now() < _cache.expiresAt;
  }

  _setCache(data) {
    _cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  }

  invalidateCache() {
    _cache = { data: null, expiresAt: 0 };
  }

  /**
   * Fetches the ACTIVE pricing document from careerflow_admin.profilepricings.
   * Picks the first enabled=true document (admin should keep only one active).
   */
  async getActivePricing({ bypassCache = false } = {}) {
    if (!bypassCache && this._isCacheValid()) {
      return _cache.data;
    }

    const Pricing = getProfilePricingModel();
    const doc = await Pricing.findOne({ enabled: true })
      .sort({ updatedAt: -1 })
      .lean();

    if (!doc) {
      throw new ApiError(
        503,
        "Profile purchase is currently unavailable. No active pricing configured by administrator."
      );
    }

    // Normalize + validate
    const priceInPaise = Number(doc.priceInPaise);
    if (!Number.isInteger(priceInPaise) || priceInPaise <= 0) {
      throw new ApiError(
        500,
        "Invalid pricing configuration: priceInPaise must be a positive integer."
      );
    }

    const normalized = {
      _id: doc._id,
      enabled: doc.enabled === true,
      price: Number(doc.price),
      priceInPaise,
      currency: (doc.currency || "INR").toUpperCase(),
      minQuantity: Math.max(1, Number(doc.minQuantity) || 1),
      maxQuantity: Math.max(1, Number(doc.maxQuantity) || 100),
      label: doc.label || "Candidate Profile Unlock",
      description: doc.description || "",
      updatedAt: doc.updatedAt,
    };

    this._setCache(normalized);
    return normalized;
  }

  /**
   * Server-authoritative quote calculation.
   * NEVER trust client amount.
   */
  async quote(quantity) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw new ApiError(400, "Quantity must be a positive integer.");
    }

    const pricing = await this.getActivePricing();

    if (!pricing.enabled) {
      throw new ApiError(
        503,
        "Profile purchase is temporarily disabled by administrator."
      );
    }

    if (qty < pricing.minQuantity) {
      throw new ApiError(
        400,
        `Minimum purchase quantity is ${pricing.minQuantity}.`
      );
    }
    if (qty > pricing.maxQuantity) {
      throw new ApiError(
        400,
        `Maximum purchase quantity is ${pricing.maxQuantity}.`
      );
    }

    // Integer arithmetic in paise — never floats
    const totalAmountInPaise = pricing.priceInPaise * qty;

    return {
      pricingConfigId: pricing._id,
      unitPriceInPaise: pricing.priceInPaise,
      unitPrice: pricing.price,
      quantity: qty,
      totalAmountInPaise,
      totalAmount: totalAmountInPaise / 100,
      currency: pricing.currency,
      label: pricing.label,
    };
  }
}

module.exports = new PricingService();