const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "verihire_recruiter_jwt_secret_key_2026";

const documentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: [
        "company_registration",
        "gst_certificate",
        "pan_card",
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

const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    companyName: { type: String, default: "" },
    designation: { type: String, default: "" },
    googleId: { type: String },
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
      registrationNumber: { type: String, default: "" },
      gstNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
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
    autoIndex: false,
    minimize: true, // ✅ CRITICAL: Removes empty objects
  }
);

// ✅ Validation guard
recruiterSchema.pre("validate", function (next) {
  if (!this.phone && !this.email) {
    return next(new Error("Recruiter must have either phone or email"));
  }
  next();
});

// ✅ CRITICAL: Strip null/empty identifier fields at document level BEFORE save
recruiterSchema.pre("save", function (next) {
  // Strip null/empty email
  if (!this.email || this.email === "" || this.email === null) {
    this.email = undefined;
    this.$__.activePaths.paths.email = undefined;
    delete this._doc.email;
  }
  // Strip null/empty phone
  if (!this.phone || this.phone === "" || this.phone === null) {
    this.phone = undefined;
    this.$__.activePaths.paths.phone = undefined;
    delete this._doc.phone;
  }
  // Strip null/empty googleId
  if (!this.googleId || this.googleId === "" || this.googleId === null) {
    this.googleId = undefined;
    this.$__.activePaths.paths.googleId = undefined;
    delete this._doc.googleId;
  }
  next();
});

// ✅ Post-insert cleanup: use raw MongoDB update to remove null fields
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
    console.warn("Post-save cleanup warning:", err.message);
  }
});

recruiterSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: "recruiter" },
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
module.exports = Recruiter;