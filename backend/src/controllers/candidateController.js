const getJobModel = require("../models/jobModel");
const getApplicationModel = require("../models/applicationModel");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

const AVATAR_COLORS = ["#42326E", "#6E5B9A", "#C58A3A", "#5A6E8F", "#8A6E4F", "#B29CFE", "#7B5FA0"];

const transformApplicationToCandidate = (app) => {
  const name = app.candidateName || "Anonymous";
  const avatarBg = AVATAR_COLORS[Math.abs(name.charCodeAt(0)) % AVATAR_COLORS.length];

  const educationText =
    [app.candidateEducation?.degree, app.candidateEducation?.collegeName]
      .filter(Boolean)
      .join(", ") || "Not disclosed";

  return {
    id: String(app._id),
    name,
    role: app.candidateJobTitle || app.jobTitle || "Applicant",
    department: app.candidateJobTitle || "General",
    location: [app.candidateCity, app.candidateSubLocation].filter(Boolean).join(", ") || app.jobLocation || "",
    experienceYears: parseInt(app.candidateExperience) || 0,
    skills: app.candidateSkills || [],
    matchScore: app.matchPercentage || 0,
    salaryExpected: app.candidateCurrentSalary || app.jobSalary || "Not disclosed",
    avatarBg,
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
    bookmarked: !!app.bookmarked,
    verified: {
      identity: true,
      phone: !!app.candidatePhone,
      email: !!app.candidateEmail,
      experience: !!app.candidateCurrentCompany,
      education: !!app.candidateEducation?.collegeName,
    },
    notes: app.recruiterNotes || [],
  };
};

class CandidateController {
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

      const candidates = applications.map(transformApplicationToCandidate);
      res.status(200).json(new ApiResponse(200, candidates, "Candidates fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

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
      if (stage === "Shortlisted") {
        application.status = "Shortlisted";
        application.shortlistedAt = new Date();
      } else if (stage === "Interview") {
        application.status = "Interview";
        application.interviewAt = new Date();
      } else if (stage === "Hired" || stage === "Selected") {
        application.status = "Offered";
      }
      await application.save();

      res.status(200).json(
        new ApiResponse(200, transformApplicationToCandidate(application.toObject()), "Stage updated")
      );
    } catch (error) {
      next(error);
    }
  }

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
}

module.exports = new CandidateController();