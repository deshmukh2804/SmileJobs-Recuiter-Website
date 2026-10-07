const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: [
        "shop_act_msme",            // ✅ Added: Matches recruiterModel
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

// ✅ Company snapshot at time of submission (immutable historical record)
// ✅ Updated to include Company Type, TAN, and MSME numbers for auditing
const companySnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    industry: { type: String, default: "" },
    website: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    
    // ✅ Added new fields to snapshot
    companyType: { type: String, default: "" },
    registrationNumber: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    tanNumber: { type: String, default: "" },
    msmeNumber: { type: String, default: "" },
    
    logoUrl: { type: String, default: "" },
    about: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactPersonName: { type: String, default: "" },
    contactPersonDesignation: { type: String, default: "" },
    organizationSize: { type: String, default: "" },
    establishedYear: { type: Number, default: null },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      unique: true,
      index: true,
    },

    // ✅ RECRUITER DENORMALIZED DATA (synced on save/status change)
    recruiterName: { type: String, default: "" },
    recruiterEmail: { type: String, default: "" },
    recruiterPhone: { type: String, default: "" },
    companyName: { type: String, default: "" },

    // ✅ COMPANY SNAPSHOT (synced on save/status change)
    companySnapshot: { type: companySnapshotSchema, default: () => ({}) },

    // ✅ Documents uploaded by recruiter
    documents: [documentSchema],

    // ✅ Verification workflow status
    status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
      index: true,
    },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    adminNotes: { type: String, default: "" },

    // ✅ Admin can request clarification docs
    clarificationDocs: [{ type: String }],
    clarificationMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

const Verification = mongoose.model("Verification", verificationSchema, "verifications");
module.exports = Verification;