const mongoose = require('mongoose');
const { getAdminConnection } = require('../config/db');

let ProfilePricingModel = null;

function getProfilePricingModel() {
  if (ProfilePricingModel) return ProfilePricingModel;

  let adminConn = null;
  try {
    adminConn = getAdminConnection();
  } catch (err) {
    for (const conn of mongoose.connections) {
      if (conn.name === 'careerflow_admin') {
        adminConn = conn;
        break;
      }
    }
  }

  if (!adminConn) {
    adminConn = mongoose;
  }

  if (adminConn.models && adminConn.models.ProfilePricing) {
    ProfilePricingModel = adminConn.models.ProfilePricing;
    return ProfilePricingModel;
  }

  const profilePricingSchema = new mongoose.Schema(
    {
      price: {
        type: Number,
        required: true,
        default: 2,
      },
      priceInPaise: {
        type: Number,
        default: 200,
      },
      currency: {
        type: String,
        default: 'INR',
        uppercase: true,
      },
      minQuantity: {
        type: Number,
        default: 1,
      },
      maxQuantity: {
        type: Number,
        default: 100,
      },
      enabled: {
        type: Boolean,
        default: true,
      },
      description: {
        type: String,
        default: 'Candidate Profile Direct Unlock',
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: true,
      collection: 'profilepricings',
    }
  );

  profilePricingSchema.statics.getActivePricing = async function () {
    try {
      const active = await this.findOne({ enabled: true }).sort({ updatedAt: -1 }).lean();
      if (active) return active;
    } catch (err) {
      console.warn('[ProfilePricingModel] getActivePricing find warning:', err.message);
    }

    try {
      const anyDoc = await this.findOne().sort({ updatedAt: -1 }).lean();
      if (anyDoc) return anyDoc;
    } catch (e) {
      // ignore
    }

    return null;
  };

  ProfilePricingModel = adminConn.model('ProfilePricing', profilePricingSchema);
  return ProfilePricingModel;
}

module.exports = new Proxy(
  {},
  {
    get(target, prop) {
      const Model = getProfilePricingModel();
      const val = Model[prop];
      if (typeof val === 'function') {
        return val.bind(Model);
      }
      return val;
    },
  }
);