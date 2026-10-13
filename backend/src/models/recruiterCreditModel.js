import mongoose from 'mongoose';

/**
 * 1. RECRUITER CREDIT SCHEMA
 * Stores live profile credit balance for each recruiter in recruiter_db.
 */
const recruiterCreditSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterUser',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Credit balance cannot be negative'],
    },
    totalPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalExpended: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchasedAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'recruiter_credits',
  }
);

// Helper method to add credits atomically
recruiterCreditSchema.methods.addCredits = async function (amount) {
  const qty = Number(amount) || 0;
  if (qty <= 0) return this;
  this.balance += qty;
  this.totalPurchased += qty;
  this.lastPurchasedAt = new Date();
  return this.save();
};

// Helper method to deduct credits atomically
recruiterCreditSchema.methods.useCredit = async function (amount = 1) {
  const qty = Number(amount) || 1;
  if (this.balance < qty) {
    throw new Error('Insufficient profile credits balance');
  }
  this.balance -= qty;
  this.totalUsed += qty;
  this.totalExpended += qty;
  this.lastUsedAt = new Date();
  return this.save();
};

/**
 * 2. PROFILE ENTITLEMENT SCHEMA
 * Maps which candidate profiles from careerflow_admin.users have been unlocked by a recruiter.
 */
const profileEntitlementSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterUser',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    candidateEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'active',
      index: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: ['credit_auto_reveal', 'credit_manual', 'direct_purchase', 'admin_grant'],
      default: 'credit_auto_reveal',
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'profile_entitlements',
  }
);

// Ensure a recruiter cannot unlock the exact same candidate profile twice
profileEntitlementSchema.index({ recruiterId: 1, candidateId: 1 }, { unique: true });

/**
 * 3. PROFILE PURCHASE SCHEMA
 * Stores Razorpay purchase history and payment verification details.
 * FIXED: razorpayOrderId uses sparse unique index (allows null safely).
 * FIXED: unitPriceInRupees included for schema compatibility.
 * FIXED: All fields optional with defaults to prevent validation errors.
 */
const profilePurchaseSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterUser',
      required: true,
      index: true,
    },

    // Order ID fields — sparse unique so multiple nulls don't collide
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: { unique: true, sparse: true },
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },

    // Alternative payment ID fields (legacy support)
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    signature: {
      type: String,
      default: null,
    },

    // Quantity
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },

    // Pricing fields — all include defaults to prevent validation errors
    unitPrice: {
      type: Number,
      default: 0,
    },
    unitPriceInPaise: {
      type: Number,
      default: 0,
    },
    unitPriceInRupees: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalAmountInPaise: {
      type: Number,
      default: 0,
    },
    totalAmountInRupees: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },

    // Status — expanded enum for all possible states
    paymentStatus: {
      type: String,
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded', 'pending', 'completed', 'captured'],
      default: 'created',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },

    // Metadata
    pricingSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawRazorpayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    purchasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'profile_purchases',
  }
);

// Prevent model overwrite on multiple imports
export const RecruiterCredit =
  mongoose.models.RecruiterCredit ||
  mongoose.model('RecruiterCredit', recruiterCreditSchema);

export const ProfileEntitlement =
  mongoose.models.ProfileEntitlement ||
  mongoose.model('ProfileEntitlement', profileEntitlementSchema);

export const ProfilePurchase =
  mongoose.models.ProfilePurchase ||
  mongoose.model('ProfilePurchase', profilePurchaseSchema);

export default {
  RecruiterCredit,
  ProfileEntitlement,
  ProfilePurchase,
};