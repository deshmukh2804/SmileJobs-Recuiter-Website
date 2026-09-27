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
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    companyName: {
      type: String,
      default: "Verihire Talent Technologies",
    },
    designation: { type: String, default: "Lead Recruiter" },
    googleId: { type: String, default: null },
    loginMethod: {
      type: String,
      enum: ["google", "phone_otp", "email_otp"],
      required: true,
    },
    role: { type: String, default: "recruiter" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },

    // 🏢 REUSABLE COMPANY PROFILE (Stored in recruiter_db)
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

    // 📄 VERIFICATION DOCUMENTS & STATUS
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
  { timestamps: true }
);

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

const Recruiter = mongoose.model("Recruiter", recruiterSchema);
module.exports = Recruiter;