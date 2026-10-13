import mongoose from 'mongoose';

/**
 * 1. RECRUITER CREDIT SCHEMA
 * Stores the live profile credit balance for each recruiter in recruiter_db.
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

// Helper method to deduct 1 credit atomically
recruiterCreditSchema.methods.useCredit = async function (amount = 1) {
  const qty = Number(amount) || 1;
  if (this.balance < qty) {
    throw new Error('Insufficient profile credits balance');
  }
  this.balance -= qty;
  this.totalUsed += qty;
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
 */
const profilePurchaseSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterUser',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    signature: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPriceInPaise: {
      type: Number,
      required: true,
    },
    unitPriceInRupees: {
      type: Number,
      required: true,
    },
    totalAmountInPaise: {
      type: Number,
      required: true,
    },
    totalAmountInRupees: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    paymentMethod: {
      type: String,
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