const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "verihire_recruiter_jwt_secret_key_2026";

// ═══════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════
const documentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: [
        "shop_act_msme",
        "gst_certificate",
        "pan_card",
        "company_registration",
        "incorporation_certificate",
        "authorization_letter",
        "address_proof",
        "other",
      ],
      required: true,
    },
    docName: { type: String, required: true },
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    format: { type: String, default: "" },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ═══════════════════════════════════════════════════════
// MAIN RECRUITER SCHEMA
// ═══════════════════════════════════════════════════════
const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },

    companyName: { type: String, default: "" },
    designation: { type: String, default: "" },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    loginMethod: {
      type: String,
      enum: ["google", "phone_otp", "email_otp"],
      required: true,
    },

    role: { type: String, default: "recruiter" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },

    companyProfile: {
      name: { type: String, default: "" },
      tagline: { type: String, default: "" },
      industry: { type: String, default: "" },
      about: { type: String, default: "" },
      website: { type: String, default: "" },
      linkedInUrl: { type: String, default: "" },
      logo: {
        url: { type: String, default: "" },
        publicId: { type: String, default: "" },
      },
      companyInitials: { type: String, default: "" },
      gallery: [galleryImageSchema],
      headquarters: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
      teamSize: { type: String, default: "" },
      organizationSize: { type: String, default: "" },
      foundedYear: { type: String, default: "" },
      establishedYear: { type: Number, default: null },
      perks: [{ type: String }],

      // ✅ Company Type field
      companyType: { type: String, default: "" },

      registrationNumber: { type: String, default: "" },
      gstNumber: { type: String, default: "" },
      // ✅ PAN or TAN (either accepted)
      panNumber: { type: String, default: "" },
      tanNumber: { type: String, default: "" },
      // ✅ MSME / Shop Act Certificate Number
      msmeNumber: { type: String, default: "" },

      contactPerson: {
        name: { type: String, default: "" },
        designation: { type: String, default: "" },
      },
      contactEmail: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
      whatsappNumber: { type: String, default: "" },
    },

    verificationDocuments: [documentSchema],
    verificationStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    isVerified: { type: Boolean, default: false },
    verificationSubmittedAt: { type: Date, default: null },
    verificationReviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
  },
  {
    timestamps: true,
    autoIndex: true,
    minimize: true,
    suppressReservedKeysWarning: true,
  }
);

// ═══════════════════════════════════════════════════════
// PRE-VALIDATE
// ═══════════════════════════════════════════════════════
recruiterSchema.pre("validate", function (next) {
  if (!this.phone && !this.email && !this.googleId) {
    return next(new Error("Recruiter must have at least one identifier: phone, email, or googleId"));
  }
  next();
});

// ═══════════════════════════════════════════════════════
// PRE-SAVE
// ═══════════════════════════════════════════════════════
recruiterSchema.pre("save", function (next) {
  const fieldsToStrip = ["email", "phone", "googleId"];

  for (const field of fieldsToStrip) {
    const val = this[field];
    if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
      this[field] = undefined;
      if (this.$__ && this.$__.activePaths && this.$__.activePaths.paths) {
        this.$__.activePaths.paths[field] = undefined;
      }
      if (this._doc && field in this._doc) {
        delete this._doc[field];
      }
    }
  }

  next();
});

// ═══════════════════════════════════════════════════════
// POST-SAVE
// ═══════════════════════════════════════════════════════
recruiterSchema.post("save", async function (doc) {
  try {
    const unsetFields = {};
    if (!doc.email) unsetFields.email = "";
    if (!doc.phone) unsetFields.phone = "";
    if (!doc.googleId) unsetFields.googleId = "";

    if (Object.keys(unsetFields).length > 0) {
      await mongoose.connection.collection("recruiters").updateOne(
        { _id: doc._id },
        { $unset: unsetFields }
      );
    }
  } catch (err) {
    console.warn("⚠️ Post-save cleanup warning:", err.message);
  }
});

// ═══════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════
recruiterSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role || "recruiter" },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "30d" }
  );
};

recruiterSchema.methods.canRecruit = function () {
  return this.isVerified && this.verificationStatus === "approved";
};

recruiterSchema.methods.isProfileComplete = function () {
  const p = this.companyProfile || {};
  return !!(
    p.name &&
    p.industry &&
    p.about &&
    p.city &&
    p.state &&
    p.country &&
    p.logo?.url &&
    p.contactPerson?.name &&
    p.contactPerson?.designation &&
    p.contactPhone &&
    p.contactEmail
  );
};

recruiterSchema.methods.getLockedField = function () {
  if (this.loginMethod === "phone_otp") return "phone";
  if (this.loginMethod === "google" || this.loginMethod === "email_otp") return "email";
  return null;
};

const Recruiter = mongoose.model("Recruiter", recruiterSchema);

// ═══════════════════════════════════════════════════════
// 🚀 AUTO-HEAL ENGINE
// ═══════════════════════════════════════════════════════
const autoHealDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once("connected", resolve));
    }

    const collection = mongoose.connection.collection("recruiters");
    console.log("⚙️  Auto-Heal: Verifying indexes and clearing DB legacy conflicts...");

    const badIndexes = ["email_1", "phone_1", "googleId_1"];
    for (const idxName of badIndexes) {
      try {
        await collection.dropIndex(idxName);
        console.log(`🧹 Auto-Heal: Dropped old index ${idxName}`);
      } catch (e) {
        // ignore
      }
    }

    const fieldsToClean = ["email", "phone", "googleId"];
    for (const field of fieldsToClean) {
      const result = await collection.updateMany(
        { [field]: { $in: [null, ""] } },
        { $unset: { [field]: "" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Auto-Heal: Unset null/empty values on '${field}' field in ${result.modifiedCount} docs`);
      }
    }

    await collection.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
    await collection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: "phone_1" });
    await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true, name: "googleId_1" });

    console.log("✅ Auto-Heal: Sparse unique database verification completed successfully.");
  } catch (err) {
    console.error("⚠️ Auto-Heal Engine Warning:", err.message);
  }
};

autoHealDatabase();

module.exports = Recruiter;