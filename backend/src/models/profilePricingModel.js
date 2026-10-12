const mongoose = require('mongoose');
const { getAdminConnection } = require('../config/db');

const profilePricingSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    priceInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxQuantity: {
      type: Number,
      default: 100,
      min: 1,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: 'Standard Candidate Profile Direct Unlock',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'profilepricings',
  }
);

function getProfilePricingModel() {
  const adminConn = getAdminConnection();
  if (adminConn.models.ProfilePricing) {
    return adminConn.models.ProfilePricing;
  }
  return adminConn.model('ProfilePricing', profilePricingSchema, 'profilepricings');
}

module.exports = {
  profilePricingSchema,
  getProfilePricingModel,
};