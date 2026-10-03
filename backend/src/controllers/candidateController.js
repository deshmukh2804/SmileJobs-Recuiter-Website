const getJobModel = require("../models/jobModel");
const getApplicationModel = require("../models/applicationModel");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const quotaService = require("../services/subscription/quotaService");

const AVATAR_COLORS = ["#42326E", "#6E5B9A", "#C58A3A", "#5A6E8F", "#8A6E4F", "#B29CFE", "#7B5FA0"];

// ═══════════════════════════════════════════════════════════════
// RESUME PROXY URL BUILDER
// Transforms raw Cloudinary resume URLs into proper proxy URLs
// that stream validated PDF buffers with correct headers.
// ═══════════════════════════════════════════════════════════════
const APPLICATION_SERVICE_BASE_URL =
  process.env.APPLICATION_SERVICE_URL ||
  process.env.APPLICATION_BACKEND_URL ||
  "https://smilejobs-application-backend.onrender.com";

const buildResumeProxyUrl = (userId) => {
  if (!userId) return "";
  const base = APPLICATION_SERVICE_BASE_URL.replace(/\/+$/, "");
  return `${base}/api/profile/resume/view/${userId}`;
};

// ═══════════════════════════════════════════════════════
// TRANSFORM APPLICATION TO CANDIDATE (LIST VIEW)
// ✅ NOW INCLUDES resumeUrl, resumeFileName, avatarUrl (via proxy)
// ═══════════════════════════════════════════════════════
const transformApplicationToCandidate = (app) => {
  const name = app.candidateName || "Anonymous";
  const avatarBg = AVATAR_COLORS[Math.abs(name.charCodeAt(0)) % AVATAR_COLORS.length];

  const educationText =
    [app.candidateEducation?.degree, app.candidateEducation?.collegeName]
      .filter(Boolean)
      .join(", ") || "Not disclosed";

  // ✅ Build proxy URL for resume (fixes corrupted/insecure Cloudinary URLs)
  const userIdStr = app.userId ? String(app.userId) : "";
  const proxyResumeUrl = userIdStr ? buildResumeProxyUrl(userIdStr) : "";

  return {
    id: String(app._id),
    _id: String(app._id),
    name,
    role: app.candidateJobTitle || app.jobTitle || "Applicant",
    department: app.candidateJobTitle || "General",
    location: [app.candidateCity, app.candidateSubLocation].filter(Boolean).join(", ") || app.jobLocation || "",
    experienceYears: parseInt(app.candidateExperience) || 0,
    skills: app.candidateSkills || [],
    matchScore: app.matchPercentage || 0,
    salaryExpected: app.candidateCurrentSalary || app.jobSalary || "Not disclosed",
    avatarBg,
    // ✅ CRITICAL FIX: Include avatar and PROXY resume URL in list view
    avatarUrl: app.candidateAvatarUrl || "",
    resumeUrl: proxyResumeUrl || app.resumeUrl || "",
    resumeOriginalUrl: app.resumeUrl || "",
    resumeFileName: app.resumeFileName || "",
    bio:
      app.coverNote ||
      `${app.candidateExperienceLevel || "Experienced"} professional applying for ${app.jobTitle}.`,
    appliedDate: app.appliedAt ? new Date(app.appliedAt).toISOString() : "",
    currentCompany: app.candidateCurrentCompany || "Not disclosed",
    previousCompanies: [],
    education: educationText,
    phone: app.candidatePhone || "",
    email: app.candidateEmail || "",
    stage: app.stage || "Applied",
    status: app.status || "Applied",
    bookmarked: !!app.bookmarked,
    verified: {
      identity: true,
      phone: !!app.candidatePhone,
      email: !!app.candidateEmail,
      experience: !!app.candidateCurrentCompany,
      education: !!app.candidateEducation?.collegeName,
    },
    notes: app.recruiterNotes || [],
    jobId: String(app.jobId),
    jobTitle: app.jobTitle || "",
    jobCompany: app.jobCompany || "",
  };
};

// ═══════════════════════════════════════════════════════
// TRANSFORM APPLICATION TO FULL DETAIL VIEW
// ✅ Uses proxy URL for resume
// ═══════════════════════════════════════════════════════
const transformApplicationToFullDetail = (app) => {
  const name = app.candidateName || "Anonymous";
  const avatarBg = AVATAR_COLORS[Math.abs(name.charCodeAt(0)) % AVATAR_COLORS.length];

  // ✅ Build proxy URL for resume (fixes corrupted/insecure Cloudinary URLs)
  const userIdStr = app.userId ? String(app.userId) : "";
  const proxyResumeUrl = userIdStr ? buildResumeProxyUrl(userIdStr) : "";

  return {
    _id: String(app._id),
    id: String(app._id),
    jobId: String(app.jobId),
    userId: String(app.userId),

    // Candidate Info
    candidateName: name,
    candidatePhone: app.candidatePhone || "",
    candidateEmail: app.candidateEmail || "",
    candidateCity: app.candidateCity || "",
    candidateSubLocation: app.candidateSubLocation || "",
    candidateAvatarUrl: app.candidateAvatarUrl || "",
    avatarBg,

    // ✅ RESUME FIELDS — Now using proxy URL
    resumeUrl: proxyResumeUrl || app.resumeUrl || "",
    resumeOriginalUrl: app.resumeUrl || "",
    resumeFileName: app.resumeFileName || "",

    // Skills & Languages
    candidateSkills: app.candidateSkills || [],
    candidateLanguages: app.candidateLanguages || [],
    candidateEnglishLevel: app.candidateEnglishLevel || "",

    // Experience
    candidateExperience: app.candidateExperience || "",
    candidateExperienceLevel: app.candidateExperienceLevel || "",
    candidateJobTitle: app.candidateJobTitle || "",
    candidateCurrentCompany: app.candidateCurrentCompany || "",
    candidateCurrentSalary: app.candidateCurrentSalary || "",

    // Education
    candidateEducation: app.candidateEducation || {
      collegeName: "",
      degree: "",
      specialization: "",
      endYear: "",
    },

    // Assets & Certifications
    candidateAssets: app.candidateAssets || [],
    candidateCertifications: app.candidateCertifications || [],

    // Job Info
    jobTitle: app.jobTitle || "",
    jobCompany: app.jobCompany || "",
    jobCompanyLogo: app.jobCompanyLogo || "",
    jobSalary: app.jobSalary || "",
    jobLocation: app.jobLocation || "",

    // Recruiter Info
    jobHrName: app.jobHrName || "",
    jobHrRole: app.jobHrRole || "",
    jobHrPhone: app.jobHrPhone || "",
    jobHrWhatsapp: app.jobHrWhatsapp || "",

    // Match & Status
    matchPercentage: app.matchPercentage || 0,
    coverNote: app.coverNote || "",
    status: app.status || "Applied",
    stage: app.stage || "Applied",
    category: app.category || "pending",
    bookmarked: !!app.bookmarked,

    // Notes & Milestones
    hrNotes: app.hrNotes || "",
    recruiterNotes: app.recruiterNotes || [],
    milestones: app.milestones || [],

    // Timestamps
    appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString() : "",
    viewedAt: app.viewedAt ? new Date(app.viewedAt).toISOString() : null,
    shortlistedAt: app.shortlistedAt ? new Date(app.shortlistedAt).toISOString() : null,
    interviewAt: app.interviewAt ? new Date(app.interviewAt).toISOString() : null,
    createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : "",
    updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : "",
  };
};

// ═══════════════════════════════════════════════════════
// WORKFLOW STATUS TRANSITIONS
// ═══════════════════════════════════════════════════════
const STATUS_WORKFLOW = {
  Applied: ["Viewed", "Shortlisted", "Rejected"],
  Viewed: ["Shortlisted", "Rejected"],
  Shortlisted: ["Interview", "Rejected"],
  Interview: ["Offered", "Rejected"],
  Offered: ["Hired", "Rejected"],
  Hired: [],
  Rejected: [],
  Withdrawn: [],
};

const TERMINAL_STATUSES = ["Hired", "Rejected", "Withdrawn"];

const getWorkflowMeta = (currentStatus) => {
  const allowedNextStatuses = STATUS_WORKFLOW[currentStatus] || [];
  const stages = ["Applied", "Viewed", "Shortlisted", "Interview", "Offered", "Hired"];
  const currentStepIndex = stages.indexOf(currentStatus);

  return {
    currentStatus,
    allowedNextStatuses,
    currentStepIndex,
    totalSteps: stages.length,
    isTerminal: TERMINAL_STATUSES.includes(currentStatus),
  };
};

class CandidateController {
  // ═══════════════════════════════════════════════════════
  // GET ALL CANDIDATES (LIST VIEW)
  // ═══════════════════════════════════════════════════════
  async getMyCandidates(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const Job = getJobModel();
      const Application = getApplicationModel();

      const myJobs = await Job.find({ recruiterId }).select("_id").lean();
      const myJobIds = myJobs.map((j) => j._id);

      if (myJobIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No jobs posted yet"));
      }

      const applications = await Application.find({ jobId: { $in: myJobIds } })
        .sort({ appliedAt: -1 })
        .lean();

      const rawCandidates = applications.map(transformApplicationToCandidate);

      // Apply subscription-based masking
      const maskedCandidates = await quotaService.enforceCandidateAccessRules(
        recruiterId,
        rawCandidates
      );

      res.status(200).json(new ApiResponse(200, maskedCandidates, "Candidates fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getCandidateFullDetails(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { id } = req.params;

      const Job = getJobModel();
      const Application = getApplicationModel();

      const application = await Application.findById(id).lean();
      if (!application) throw new ApiError(404, "Application not found");

      // ✅ DEBUG LOG
      console.log("═══════════════════════════════════════════════");
      console.log("📄 CANDIDATE DETAILS REQUEST");
      console.log("Application ID:", id);
      console.log("Candidate Name:", application.candidateName);
      console.log("Resume URL from DB:", application.resumeUrl);
      console.log("Resume Filename:", application.resumeFileName);
      console.log("Avatar URL:", application.candidateAvatarUrl);
      console.log("User ID (for proxy):", application.userId);
      console.log("═══════════════════════════════════════════════");

      const job = await Job.findById(application.jobId).lean();
      if (!job || String(job.recruiterId) !== String(recruiterId)) {
        throw new ApiError(403, "Not authorized to view this candidate");
      }

      // Auto-mark as viewed if in Applied status
      if (application.status === "Applied") {
        await Application.findByIdAndUpdate(id, {
          status: "Viewed",
          viewedAt: new Date(),
        });
        application.status = "Viewed";
        application.viewedAt = new Date();
      }

      const fullDetails = transformApplicationToFullDetail(application);

      // ✅ DEBUG LOG
      console.log("📤 SENDING TO FRONTEND:");
      console.log("resumeUrl (proxy):", fullDetails.resumeUrl);
      console.log("resumeOriginalUrl:", fullDetails.resumeOriginalUrl);
      console.log("resumeFileName:", fullDetails.resumeFileName);
      console.log("═══════════════════════════════════════════════");

      // Apply subscription-based masking
      const maskedDetails = await quotaService.enforceCandidateAccessRules(
        recruiterId,
        fullDetails
      );

      // ✅ CHECK IF MASKING IS STRIPPING RESUME
      console.log("📦 AFTER MASKING:");
      console.log("resumeUrl:", maskedDetails.resumeUrl);
      console.log("═══════════════════════════════════════════════\n");

      // Add job details
      maskedDetails.jobDetails = {
        id: String(job._id),
        title: job.title,
        companyName: job.companyName,
        companyLogo: job.companyLogo?.url || "",
        companyWebsite: job.companyWebsite || "",
        location: job.location || {},
        workMode: job.workMode || "",
        jobType: job.jobType || "",
        contactPerson: job.contactPerson || {},
      };

      // Add workflow metadata
      maskedDetails.workflow = getWorkflowMeta(application.status);

      res.status(200).json(new ApiResponse(200, maskedDetails, "Full candidate details fetched"));
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE STATUS (WORKFLOW STAGE)
  // ═══════════════════════════════════════════════════════
  async updateCandidateStatus(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "Applied", "Viewed", "Shortlisted", "Interview",
        "Offered", "Hired", "Rejected", "Withdrawn",
      ];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      }

      const Job = getJobModel();
      const Application = getApplicationModel();

      const application = await Application.findById(id);
      if (!application) throw new ApiError(404, "Application not found");

      const job = await Job.findById(application.jobId);
      if (!job || String(job.recruiterId) !== String(recruiterId)) {
        throw new ApiError(403, "Not authorized to update this candidate");
      }

      // Validate workflow transition
      const currentStatus = application.status || "Applied";
      const allowedNext = STATUS_WORKFLOW[currentStatus] || [];

      if (!allowedNext.includes(status) && status !== currentStatus) {
        throw new ApiError(
          400,
          `Cannot move from ${currentStatus} to ${status}. Allowed: ${allowedNext.join(", ") || "None"}`
        );
      }

      application.status = status;

      const stageMap = {
        Applied: "Applied",
        Viewed: "Screening",
        Shortlisted: "Shortlisted",
        Interview: "Interview",
        Offered: "Selected",
        Hired: "Hired",
      };
      if (stageMap[status]) {
        application.stage = stageMap[status];
      }

      if (status === "Viewed") application.viewedAt = new Date();
      if (status === "Shortlisted") application.shortlistedAt = new Date();
      if (status === "Interview") application.interviewAt = new Date();

      if (!application.milestones) application.milestones = [];
      application.milestones.push({
        title: `Status changed to ${status}`,
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        completed: true,
        statusText: status,
        isHighlight: ["Shortlisted", "Interview", "Offered", "Hired"].includes(status),
      });

      await application.save();

      const fullDetails = transformApplicationToFullDetail(application.toObject());
      const maskedDetails = await quotaService.enforceCandidateAccessRules(
        recruiterId,
        fullDetails
      );
      maskedDetails.workflow = getWorkflowMeta(status);

      res.status(200).json(new ApiResponse(200, maskedDetails, `Status updated to ${status}`));
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE STAGE (LEGACY)
  // ═══════════════════════════════════════════════════════
  async updateCandidateStage(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { id } = req.params;
      const { stage } = req.body;

      const validStages = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Hired"];
      if (!validStages.includes(stage)) {
        throw new ApiError(400, `Invalid stage. Must be one of: ${validStages.join(", ")}`);
      }

      const Job = getJobModel();
      const Application = getApplicationModel();

      const application = await Application.findById(id);
      if (!application) throw new ApiError(404, "Application not found");

      const job = await Job.findById(application.jobId);
      if (!job || String(job.recruiterId) !== String(recruiterId)) {
        throw new ApiError(403, "Not authorized to update this candidate");
      }

      application.stage = stage;

      const statusMap = {
        Applied: "Applied",
        Screening: "Viewed",
        Shortlisted: "Shortlisted",
        Interview: "Interview",
        Selected: "Offered",
        Hired: "Hired",
      };
      if (statusMap[stage]) {
        application.status = statusMap[stage];
      }

      if (stage === "Shortlisted") application.shortlistedAt = new Date();
      if (stage === "Interview") application.interviewAt = new Date();

      await application.save();

      const candidate = transformApplicationToCandidate(application.toObject());
      const maskedCandidate = await quotaService.enforceCandidateAccessRules(
        recruiterId,
        candidate
      );

      res.status(200).json(new ApiResponse(200, maskedCandidate, "Stage updated"));
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // BULK UPDATE STATUS
  // ═══════════════════════════════════════════════════════
  async bulkUpdateStatus(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, "Please provide an array of application IDs");
      }

      const validStatuses = [
        "Applied", "Viewed", "Shortlisted", "Interview",
        "Offered", "Hired", "Rejected", "Withdrawn",
      ];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status: ${status}`);
      }

      const Job = getJobModel();
      const Application = getApplicationModel();

      const applications = await Application.find({ _id: { $in: ids } });

      let updated = 0;
      let unauthorized = 0;

      for (const app of applications) {
        const job = await Job.findById(app.jobId);
        if (!job || String(job.recruiterId) !== String(recruiterId)) {
          unauthorized++;
          continue;
        }

        app.status = status;
        if (status === "Shortlisted") app.shortlistedAt = new Date();
        if (status === "Interview") app.interviewAt = new Date();

        if (!app.milestones) app.milestones = [];
        app.milestones.push({
          title: `Bulk status changed to ${status}`,
          time: new Date().toLocaleString("en-IN"),
          completed: true,
          statusText: status,
          isHighlight: false,
        });

        await app.save();
        updated++;
      }

      res.status(200).json(
        new ApiResponse(
          200,
          { updated, unauthorized, total: ids.length },
          `${updated} applications updated to ${status}`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // TOGGLE BOOKMARK
  // ═══════════════════════════════════════════════════════
  async toggleBookmark(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { id } = req.params;

      const Job = getJobModel();
      const Application = getApplicationModel();

      const application = await Application.findById(id);
      if (!application) throw new ApiError(404, "Application not found");

      const job = await Job.findById(application.jobId);
      if (!job || String(job.recruiterId) !== String(recruiterId)) {
        throw new ApiError(403, "Not authorized");
      }

      application.bookmarked = !application.bookmarked;
      await application.save();

      res.status(200).json(new ApiResponse(200, { bookmarked: application.bookmarked }, "Bookmark toggled"));
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // ADD NOTE
  // ═══════════════════════════════════════════════════════
  async addNote(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { id } = req.params;
      const { note } = req.body;

      if (!note || !note.trim()) throw new ApiError(400, "Note text is required");

      const Job = getJobModel();
      const Application = getApplicationModel();

      const application = await Application.findById(id);
      if (!application) throw new ApiError(404, "Application not found");

      const job = await Job.findById(application.jobId);
      if (!job || String(job.recruiterId) !== String(recruiterId)) {
        throw new ApiError(403, "Not authorized");
      }

      application.recruiterNotes.push(note.trim());
      await application.save();

      res.status(200).json(new ApiResponse(200, { notes: application.recruiterNotes }, "Note added"));
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // DELETE APPLICATION
  // ═══════════════════════════════════════════════════════
  async deleteApplication(req, res, next) {
    try {
      const recruiterId = req.user._id;
      const { id } = req.params;

      const Job = getJobModel();
      const Application = getApplicationModel();

      const application = await Application.findById(id);
      if (!application) throw new ApiError(404, "Application not found");

      const job = await Job.findById(application.jobId);
      if (!job || String(job.recruiterId) !== String(recruiterId)) {
        throw new ApiError(403, "Not authorized to delete this application");
      }

      await Application.findByIdAndDelete(id);

      res.status(200).json(new ApiResponse(200, { deleted: true }, "Application deleted"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CandidateController();