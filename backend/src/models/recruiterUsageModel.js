const mongoose = require("mongoose");

const recruiterUsageSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      unique: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruiterSubscription",
    },
    jobPostsUsed: { type: Number, default: 0 },
    jobPostsLimit: { type: Number, default: 0 },
    candidateViewsUsed: { type: Number, default: 0 },
    candidateViewsLimit: { type: Number, default: 0 },
    resetAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "recruiter_usages" }
);

module.exports = mongoose.model("RecruiterUsage", recruiterUsageSchema);