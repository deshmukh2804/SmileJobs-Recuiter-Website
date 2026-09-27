const mongoose = require("mongoose");
const { getJobsConnection } = require("../config/db");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    companyName: { type: String, required: true },
    companyWebsite: { type: String, default: "" },
    companyLogo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    companyImages: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    companyInitials: { type: String, default: "" },
    location: {
      address: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    salary: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      period: {
        type: String,
        enum: ["month", "year", "hour"],
        default: "month",
      },
    },
    experience: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      text: { type: String, default: "" },
    },
    jobType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Internship"],
      default: "Full-Time",
    },
    workMode: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      default: "On-site",
    },
    department: { type: String, default: "" },
    role: { type: String, default: "" },
    qualification: { type: String, default: "" },
    skills: [{ type: String }],
    languages: [{ type: String }],
    jobDescription: { type: String, default: "" },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    benefits: [{ type: String }],
    jobTiming: { type: String, default: "" },
    workingDays: { type: String, default: "" },
    contactPerson: {
      name: { type: String, default: "" },
      designation: { type: String, default: "" },
    },
    recruiterWhatsappNumber: { type: String, default: "" },
    recruiterMobileNumber: { type: String, default: "" },
    recruiterEmail: { type: String, default: "" },
    applicationUrl: { type: String, default: "" },
    noPaymentInvolved: { type: Boolean, default: true },
    contactVisibility: {
      whatsapp: { type: Boolean, default: true },
      mobile: { type: Boolean, default: true },
    },
    whatsappContactEnabled: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Live", "Draft", "Paused", "Closed"],
      default: "Live",
    },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: true },
    isCompanyVerified: { type: Boolean, default: false },
    industry: { type: String, default: "" },
    applicantsCount: { type: Number, default: 0 },
    applicantsCap: { type: Number, default: 100 },
    postedAt: { type: Date, default: Date.now },
    establishedYear: { type: Number, default: null },
    noticePeriod: { type: String, default: "" },
    organizationSize: { type: String, default: "" },
  },
  { timestamps: true }
);

let JobModel = null;
const getJobModel = () => {
  if (!JobModel) {
    const conn = getJobsConnection();
    JobModel = conn.model("Job", jobSchema, "jobs");
  }
  return JobModel;
};

module.exports = getJobModel;