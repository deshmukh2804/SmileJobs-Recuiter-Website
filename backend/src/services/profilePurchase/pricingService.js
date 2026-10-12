const { getProfilePricingModel } = require('../../models/profilePricingModel');

class ProfilePricingService {
  constructor() {
    this._cachedPricing = null;
    this._cachedAt = 0;
    this._CACHE_TTL_MS = 30 * 1000; // 30 seconds
  }

  async getActivePricing() {
    const now = Date.now();
    if (this._cachedPricing && now - this._cachedAt < this._CACHE_TTL_MS) {
      return this._cachedPricing;
    }

    const ProfilePricing = getProfilePricingModel();
    const pricing = await ProfilePricing.findOne({ enabled: true })
      .sort({ updatedAt: -1 })
      .lean();

    if (!pricing) {
      const fallbackPricing = {
        _id: null,
        price: 10,
        priceInPaise: 1000,
        currency: 'INR',
        minQuantity: 1,
        maxQuantity: 100,
        enabled: true,
        description: 'Standard Candidate Profile Direct Unlock (Fallback)',
      };
      this._cachedPricing = fallbackPricing;
      this._cachedAt = now;
      return fallbackPricing;
    }

    if (!pricing.priceInPaise && pricing.price) {
      pricing.priceInPaise = Math.round(pricing.price * 100);
    }

    this._cachedPricing = pricing;
    this._cachedAt = now;
    return pricing;
  }

  async quote(quantity) {
    const qty = parseInt(quantity, 10);
    if (!qty || isNaN(qty) || qty <= 0) {
      throw new Error('Quantity must be a positive integer greater than 0');
    }

    const pricing = await this.getActivePricing();
    if (!pricing || !pricing.enabled) {
      throw new Error('Profile purchasing is currently disabled by administrator');
    }

    if (pricing.minQuantity && qty < pricing.minQuantity) {
      throw new Error(`Minimum quantity allowed is ${pricing.minQuantity}`);
    }
    if (pricing.maxQuantity && qty > pricing.maxQuantity) {
      throw new Error(`Maximum quantity allowed is ${pricing.maxQuantity}`);
    }

    const unitPriceInPaise = pricing.priceInPaise;
    const totalAmountInPaise = unitPriceInPaise * qty;

    return {
      quantity: qty,
      unitPriceInPaise,
      unitPriceInRupees: unitPriceInPaise / 100,
      totalAmountInPaise,
      totalAmountInRupees: totalAmountInPaise / 100,
      currency: pricing.currency || 'INR',
      pricingConfigId: pricing._id || null,
      pricingDescription: pricing.description || 'Standard Profile Unlock',
      enabled: pricing.enabled,
    };
  }

  invalidateCache() {
    this._cachedPricing = null;
    this._cachedAt = 0;
  }
}

module.exports = new ProfilePricingService();