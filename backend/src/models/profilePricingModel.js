// backend/src/models/profilePricingModel.js
// READ-ONLY model pointing to careerflow_admin.profilepricings
// Admin fully controls price. We never write to this collection.

const mongoose = require("mongoose");
const { getAdminConnection } = require("../config/db");

const profilePricingSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    price: { type: Number, required: true },           // display price (major unit)
    priceInPaise: { type: Number, required: true },    // AUTHORITATIVE integer paise
    currency: { type: String, default: "INR" },
    minQuantity: { type: Number, default: 1 },
    maxQuantity: { type: Number, default: 100 },
    label: { type: String },
    description: { type: String },
  },
  {
    collection: "profilepricings",
    strict: false,
    timestamps: true,
  }
);

let cachedModel = null;

function getProfilePricingModel() {
  if (cachedModel) return cachedModel;
  const adminConn = getAdminConnection();
  if (!adminConn) {
    throw new Error(
      "[profilePricingModel] careerflow_admin connection not available"
    );
  }
  cachedModel = adminConn.model(
    "ProfilePricing",
    profilePricingSchema,
    "profilepricings"
  );
  return cachedModel;
}

module.exports = getProfilePricingModel;