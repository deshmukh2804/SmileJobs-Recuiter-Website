const mongoose = require("mongoose");

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

const verificationSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      unique: true,
      index: true,
    },
    recruiterName: { type: String, required: true },
    recruiterEmail: { type: String, required: true },
    companyName: { type: String, default: "" },

    // Company snapshot (at submission time)
    companySnapshot: {
      name: { type: String, default: "" },
      industry: { type: String, default: "" },
      website: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      registrationNumber: { type: String, default: "" },
      gstNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
    },

    documents: [documentSchema],

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
  },
  { timestamps: true }
);

const Verification = mongoose.model("Verification", verificationSchema, "verifications");
module.exports = Verification;