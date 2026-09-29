const getJobModel = require("../models/jobModel");
const Recruiter = require("../models/recruiterModel");
const ApiError = require("../utils/apiError");

// ─── Foolproof Dynamic Cloudinary Module Resolver ───
let deleteFromCloudinary;
try {
  // Try config/cloudinary
  deleteFromCloudinary = require("../config/cloudinary").deleteFromCloudinary;
} catch (e1) {
  try {
    // Try utils/cloudinary
    deleteFromCloudinary = require("../utils/cloudinary").deleteFromCloudinary;
  } catch (e2) {
    try {
      // Try config/cloudinaryConfig
      deleteFromCloudinary = require("../config/cloudinaryConfig").deleteFromCloudinary;
    } catch (e3) {
      try {
        // Try utils/cloudinaryConfig
        deleteFromCloudinary = require("../utils/cloudinaryConfig").deleteFromCloudinary;
      } catch (e4) {
        console.warn("⚠️ Warning: Could not locate Cloudinary helper helper automatically. Safe fallback initiated.");
        // Fallback placeholder to prevent crashes
        deleteFromCloudinary = async () => ({ result: "skipped", reason: "cloudinary_module_not_found" });
      }
    }
  }
}

const parseSalaryRange = (str = "") => {
  const nums = String(str)
    .replace(/[^\d–\-,]/g, "")
    .split(/[–\-]/)
    .map((s) => Number(s.replace(/,/g, "")))
    .filter((n) => !isNaN(n));
  return {
    min: nums[0] || 0,
    max: nums[1] || nums[0] || 0,
  };
};

const parseExperience = (str = "") => {
  const match = String(str).match(/(\d+)\s*(?:\+|-|to)?\s*(\d+)?/);
  if (!match) return { min: 0, max: 0 };
  return {
    min: Number(match[1]) || 0,
    max: match[2] ? Number(match[2]) : Number(match[1]) || 0,
  };
};

const splitCSV = (str = "") => {
  if (Array.isArray(str)) return str;
  return String(str)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const mapSalaryPeriod = (type) => {
  if (type === "Annual") return "year";
  if (type === "Hourly") return "hour";
  return "month";
};

const mapJobType = (t) => {
  if (t === "Full-time") return "Full-Time";
  if (t === "Part-time") return "Part-Time";
  return t || "Full-Time";
};

const mapStatus = (s) => {
  if (s === "active" || s === "Live") return "Live";
  if (s === "draft" || s === "Draft") return "Draft";
  if (s === "paused" || s === "Paused") return "Paused";
  if (s === "closed" || s === "Closed") return "Closed";
  return "Live";
};

class JobService {
  async createJob(recruiterId, payload) {
    const Job = getJobModel();
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    if (!recruiter.canRecruit()) {
      throw new ApiError(
        403,
        "Please complete company verification before posting jobs"
      );
    }
    if (!recruiter.isProfileComplete()) {
      throw new ApiError(
        400,
        "Please complete your company profile (logo, contact person, address) before posting"
      );
    }

    const cp = recruiter.companyProfile;

    // Determine values, prioritizing payload customizations over profile fallbacks
    const companyName = payload.companyName || cp.name || recruiter.companyName;
    const companyWebsite = payload.companyWebsite || cp.website || "";
    const industry = payload.industry || cp.industry || "";
    const establishedYear = payload.establishedYear || cp.establishedYear || null;
    const organizationSize = payload.organizationSize || cp.organizationSize || cp.teamSize || "";

    // Parse location details
    const location = payload.location ? {
      address: payload.location.address || "",
      city: payload.location.city,
      state: payload.location.state,
      country: payload.location.country || "India",
    } : {
      address: payload.area || cp.address || "",
      city: payload.city || cp.city,
      state: payload.state || cp.state,
      country: payload.country || cp.country || "India",
    };

    // Parse salary details
    let salary = { min: 0, max: 0, currency: "INR", period: "month" };
    if (payload.salary) {
      salary = {
        min: Number(payload.salary.min) || 0,
        max: Number(payload.salary.max) || 0,
        currency: payload.salary.currency || "INR",
        period: payload.salary.period || "month"
      };
    } else {
      const parsedRange = parseSalaryRange(payload.salaryRange);
      salary = {
        min: parsedRange.min,
        max: parsedRange.max,
        currency: "INR",
        period: mapSalaryPeriod(payload.salaryType),
      };
    }

    // Parse experience details
    let experience = { min: 0, max: 0, text: "" };
    if (payload.experience) {
      experience = {
        min: Number(payload.experience.min) || 0,
        max: Number(payload.experience.max) || 0,
        text: payload.experience.text || ""
      };
    } else {
      const parsedExp = parseExperience(payload.requiredExperience);
      experience = {
        min: parsedExp.min,
        max: parsedExp.max,
        text: payload.requiredExperience || "",
      };
    }

    const skills = splitCSV(payload.skills);
    const languages = splitCSV(payload.languages || "");
    const benefits = splitCSV(payload.benefits);
    const responsibilities = Array.isArray(payload.responsibilities)
      ? payload.responsibilities
      : String(payload.responsibilities || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const requirements = Array.isArray(payload.requirements)
      ? payload.requirements
      : String(payload.requirements || "").split("\n").map((s) => s.trim()).filter(Boolean);

    const contactPerson = payload.contactPerson ? {
      name: payload.contactPerson.name || cp.contactPerson?.name || recruiter.name,
      designation: payload.contactPerson.designation || cp.contactPerson?.designation || recruiter.designation
    } : {
      name: cp.contactPerson?.name || recruiter.name,
      designation: cp.contactPerson?.designation || recruiter.designation
    };

    const recruiterWhatsappNumber = payload.recruiterWhatsappNumber || cp.whatsappNumber || cp.contactPhone || "";
    const recruiterMobileNumber = payload.recruiterMobileNumber || cp.contactPhone || recruiter.phone || "";
    const recruiterEmail = payload.recruiterEmail || cp.contactEmail || recruiter.email;

    const contactVisibility = payload.contactVisibility ? {
      whatsapp: !!payload.contactVisibility.whatsapp,
      mobile: !!payload.contactVisibility.mobile
    } : {
      whatsapp: true,
      mobile: true
    };

    const jobDoc = {
      title: payload.title,
      recruiterId: recruiter._id,

      companyName,
      companyWebsite,
      companyLogo: payload.companyLogo || {
        url: cp.logo?.url || "",
        publicId: cp.logo?.publicId || "",
      },
      companyImages: payload.companyImages || (cp.gallery || []).map((g) => ({
        url: g.url,
        publicId: g.publicId,
      })),
      companyInitials: payload.companyInitials || cp.companyInitials || "",
      industry,
      establishedYear,
      organizationSize,

      location,
      salary,
      experience,

      jobType: payload.jobType ? payload.jobType : mapJobType(payload.employmentType),
      workMode: payload.workMode || "On-site",
      department: payload.department || "",
      role: payload.role || payload.title,
      qualification: payload.qualification || payload.education || "",

      skills,
      languages,

      jobDescription: payload.jobDescription || payload.description || "",
      responsibilities,
      requirements,
      benefits,

      jobTiming: payload.jobTiming || "",
      workingDays: payload.workingDays || "",
      noticePeriod: payload.noticePeriod || payload.availability || "",

      contactPerson,
      recruiterWhatsappNumber,
      recruiterMobileNumber,
      recruiterEmail,

      applicationUrl: payload.applicationUrl || "",
      noPaymentInvolved: payload.noPaymentInvolved !== false,
      contactVisibility,
      whatsappContactEnabled: true,

      status: mapStatus(payload.status),
      isActive: mapStatus(payload.status) !== "Closed",
      featured: !!payload.featured,
      isNew: true,
      isCompanyVerified: recruiter.isVerified,

      applicantsCount: 0,
      applicantsCap: payload.applicantsCap || 100,
      postedAt: new Date(),
    };

    const job = await Job.create(jobDoc);
    console.log(`✅ Job created in careerflow_admin.jobs: "${job.title}" by ${recruiter.name}`);
    return job;
  }

  async updateJob(recruiterId, jobId, payload) {
    const Job = getJobModel();
    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) throw new ApiError(404, "Job not found or unauthorized");

    // Map skills, languages, benefits, requirements, and responsibilities arrays
    const skills = splitCSV(payload.skills);
    const languages = splitCSV(payload.languages || "");
    const benefits = splitCSV(payload.benefits);
    const responsibilities = Array.isArray(payload.responsibilities)
      ? payload.responsibilities
      : String(payload.responsibilities || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const requirements = Array.isArray(payload.requirements)
      ? payload.requirements
      : String(payload.requirements || "").split("\n").map((s) => s.trim()).filter(Boolean);

    // Apply mutable fields
    job.title = payload.title || job.title;
    job.companyName = payload.companyName || job.companyName;
    job.companyWebsite = payload.companyWebsite !== undefined ? payload.companyWebsite : job.companyWebsite;
    job.industry = payload.industry || job.industry;
    job.establishedYear = payload.establishedYear !== undefined ? payload.establishedYear : job.establishedYear;
    job.organizationSize = payload.organizationSize || job.organizationSize;
    job.department = payload.department !== undefined ? payload.department : job.department;
    job.role = payload.role || job.role;
    job.qualification = payload.qualification !== undefined ? payload.qualification : job.qualification;
    job.jobType = payload.jobType || job.jobType;
    job.workMode = payload.workMode || job.workMode;
    job.jobDescription = payload.jobDescription || job.jobDescription;
    job.jobTiming = payload.jobTiming !== undefined ? payload.jobTiming : job.jobTiming;
    job.workingDays = payload.workingDays !== undefined ? payload.workingDays : job.workingDays;
    job.noticePeriod = payload.noticePeriod !== undefined ? payload.noticePeriod : job.noticePeriod;
    job.applicationUrl = payload.applicationUrl !== undefined ? payload.applicationUrl : job.applicationUrl;
    job.noPaymentInvolved = payload.noPaymentInvolved !== undefined ? payload.noPaymentInvolved : job.noPaymentInvolved;
    job.featured = payload.featured !== undefined ? payload.featured : job.featured;
    job.status = payload.status ? mapStatus(payload.status) : job.status;
    job.isActive = job.status !== "Closed";

    // Set updated arrays
    job.skills = skills;
    job.languages = languages;
    job.benefits = benefits;
    job.responsibilities = responsibilities;
    job.requirements = requirements;

    // Update nested objects
    if (payload.location) {
      job.location = {
        address: payload.location.address || "",
        city: payload.location.city || job.location.city,
        state: payload.location.state || job.location.state,
        country: payload.location.country || "India",
      };
    }

    if (payload.salary) {
      job.salary = {
        min: Number(payload.salary.min) || 0,
        max: Number(payload.salary.max) || 0,
        currency: payload.salary.currency || "INR",
        period: payload.salary.period || "month",
      };
    }

    if (payload.experience) {
      job.experience = {
        min: Number(payload.experience.min) || 0,
        max: Number(payload.experience.max) || 0,
        text: payload.experience.text || "",
      };
    }

    if (payload.contactPerson) {
      job.contactPerson = {
        name: payload.contactPerson.name || job.contactPerson.name,
        designation: payload.contactPerson.designation || job.contactPerson.designation,
      };
    }

    if (payload.contactVisibility) {
      job.contactVisibility = {
        whatsapp: !!payload.contactVisibility.whatsapp,
        mobile: !!payload.contactVisibility.mobile,
      };
    }

    job.recruiterEmail = payload.recruiterEmail || job.recruiterEmail;
    job.recruiterMobileNumber = payload.recruiterMobileNumber || job.recruiterMobileNumber;
    job.recruiterWhatsappNumber = payload.recruiterWhatsappNumber || job.recruiterWhatsappNumber;

    await job.save();
    console.log(`✅ Job updated in careerflow_admin.jobs: "${job.title}" [ID: ${job._id}]`);
    return job;
  }

  async listMyJobs(recruiterId) {
    const Job = getJobModel();
    return await Job.find({ recruiterId }).sort({ createdAt: -1 });
  }

  async getJob(recruiterId, jobId) {
    const Job = getJobModel();
    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) throw new ApiError(404, "Job not found");
    return job;
  }

  async updateJobStatus(recruiterId, jobId, status) {
    const Job = getJobModel();
    const job = await Job.findOneAndUpdate(
      { _id: jobId, recruiterId },
      { status: mapStatus(status), isActive: status !== "closed" && status !== "Closed" },
      { new: true }
    );
    if (!job) throw new ApiError(404, "Job not found");
    return job;
  }

  async deleteJob(recruiterId, jobId) {
    const Job = getJobModel();
    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) throw new ApiError(404, "Job not found");

    // Fetch recruiter profile to avoid deleting shared profile-level assets
    const recruiter = await Recruiter.findById(recruiterId).select("companyProfile");
    const profileOwnedPublicIds = new Set();

    if (recruiter && recruiter.companyProfile) {
      const cp = recruiter.companyProfile;
      if (cp.logo?.publicId) {
        profileOwnedPublicIds.add(cp.logo.publicId);
      }
      if (Array.isArray(cp.gallery)) {
        cp.gallery.forEach((g) => {
          if (g.publicId) profileOwnedPublicIds.add(g.publicId);
        });
      }
    }

    // Collect specific job assets
    const jobAssetPublicIds = [];
    if (job.companyLogo?.publicId) {
      jobAssetPublicIds.push(job.companyLogo.publicId);
    }
    if (Array.isArray(job.companyImages)) {
      job.companyImages.forEach((img) => {
        if (img.publicId) jobAssetPublicIds.push(img.publicId);
      });
    }

    // Safely delete non-shared assets
    for (const publicId of jobAssetPublicIds) {
      if (profileOwnedPublicIds.has(publicId)) {
        console.log(`ℹ️ Skipping profile logo/gallery deletion from Cloudinary: [${publicId}]`);
        continue;
      }
      // Delete from Cloudinary passing model context to check if shared with other jobs
      await deleteFromCloudinary(publicId, Job, jobId);
    }

    const result = await Job.deleteOne({ _id: jobId, recruiterId });
    if (result.deletedCount === 0) throw new ApiError(404, "Job not found");
    return { deleted: true };
  }
}

module.exports = new JobService();