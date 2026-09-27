const Recruiter = require("../models/recruiterModel");
const Verification = require("../models/verificationModel");
const ApiError = require("../utils/apiError");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const fs = require("fs");

const MAX_GALLERY_PHOTOS = 5;

const computeInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// Helper: fetch or create verification doc for this recruiter
const getOrCreateVerification = async (recruiter) => {
  let v = await Verification.findOne({ recruiterId: recruiter._id });
  if (!v) {
    v = await Verification.create({
      recruiterId: recruiter._id,
      recruiterName: recruiter.name,
      recruiterEmail: recruiter.email,
      companyName: recruiter.companyName,
      status: "not_submitted",
    });
  }
  return v;
};

class CompanyService {
  async getCompanyProfile(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter);

    return {
      companyProfile: recruiter.companyProfile,
      verificationDocuments: verification.documents,
      verificationStatus: verification.status,
      isVerified: recruiter.isVerified,
      isProfileComplete: recruiter.isProfileComplete(),
      verificationSubmittedAt: verification.submittedAt,
      verificationReviewedAt: verification.reviewedAt,
      rejectionReason: verification.rejectionReason,
    };
  }

  async updateCompanyProfile(recruiterId, profileData) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const current = recruiter.companyProfile?.toObject
      ? recruiter.companyProfile.toObject()
      : recruiter.companyProfile || {};

    const mergedContactPerson = {
      ...(current.contactPerson || {}),
      ...(profileData.contactPerson || {}),
    };

    recruiter.companyProfile = {
      ...current,
      ...profileData,
      contactPerson: mergedContactPerson,
    };

    if (profileData.name) {
      recruiter.companyName = profileData.name;
      recruiter.companyProfile.companyInitials = computeInitials(profileData.name);
    }

    if (profileData.establishedYear) {
      recruiter.companyProfile.establishedYear = Number(profileData.establishedYear);
    }

    await recruiter.save();

    return {
      companyProfile: recruiter.companyProfile,
      verificationStatus: recruiter.verificationStatus,
      isVerified: recruiter.isVerified,
      isProfileComplete: recruiter.isProfileComplete(),
    };
  }

  async uploadLogo(recruiterId, file) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");
    if (!file) throw new ApiError(400, "No file uploaded");

    let uploaded;
    try {
      uploaded = await uploadToCloudinary(file.path, "jobs/company/logos");
    } catch (err) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ApiError(500, `Cloudinary logo upload failed: ${err.message}`);
    }
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    if (recruiter.companyProfile?.logo?.publicId) {
      try {
        await deleteFromCloudinary(recruiter.companyProfile.logo.publicId);
      } catch (e) {
        console.warn("Old logo delete warning:", e.message);
      }
    }

    if (!recruiter.companyProfile) recruiter.companyProfile = {};
    recruiter.companyProfile.logo = {
      url: uploaded.url,
      publicId: uploaded.public_id,
    };

    await recruiter.save();
    return { logo: recruiter.companyProfile.logo };
  }

  async uploadGalleryImage(recruiterId, file) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");
    if (!file) throw new ApiError(400, "No file uploaded");

    // Enforce max 5 photos
    const currentGalleryCount = recruiter.companyProfile?.gallery?.length || 0;
    if (currentGalleryCount >= MAX_GALLERY_PHOTOS) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ApiError(
        400,
        `Maximum ${MAX_GALLERY_PHOTOS} company photos allowed. Please delete an existing photo to upload a new one.`
      );
    }

    let uploaded;
    try {
      uploaded = await uploadToCloudinary(file.path, "jobs/company/gallery");
    } catch (err) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ApiError(500, `Cloudinary gallery upload failed: ${err.message}`);
    }
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    const newImg = {
      url: uploaded.url,
      publicId: uploaded.public_id,
      uploadedAt: new Date(),
    };

    if (!recruiter.companyProfile) recruiter.companyProfile = {};
    if (!recruiter.companyProfile.gallery) recruiter.companyProfile.gallery = [];
    recruiter.companyProfile.gallery.push(newImg);
    await recruiter.save();

    return {
      image: recruiter.companyProfile.gallery[recruiter.companyProfile.gallery.length - 1],
      gallery: recruiter.companyProfile.gallery,
      remaining: MAX_GALLERY_PHOTOS - recruiter.companyProfile.gallery.length,
    };
  }

  // ⭐ NEW: Batch upload multiple gallery images at once
  async uploadGalleryImagesBatch(recruiterId, files) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");
    if (!files || files.length === 0) throw new ApiError(400, "No files uploaded");

    if (!recruiter.companyProfile) recruiter.companyProfile = {};
    if (!recruiter.companyProfile.gallery) recruiter.companyProfile.gallery = [];

    const currentCount = recruiter.companyProfile.gallery.length;
    const availableSlots = MAX_GALLERY_PHOTOS - currentCount;

    if (availableSlots <= 0) {
      // Clean up all temp files before throwing
      files.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      throw new ApiError(
        400,
        `Maximum ${MAX_GALLERY_PHOTOS} company photos allowed. Delete existing photos first.`
      );
    }

    // Only process files that fit within remaining slots
    const filesToProcess = files.slice(0, availableSlots);
    const skippedCount = files.length - filesToProcess.length;

    // Upload all files in parallel for speed
    const results = await Promise.allSettled(
      filesToProcess.map(async (file) => {
        try {
          const uploaded = await uploadToCloudinary(file.path, "jobs/company/gallery");
          return {
            success: true,
            image: {
              url: uploaded.url,
              publicId: uploaded.public_id,
              uploadedAt: new Date(),
            },
          };
        } catch (err) {
          return {
            success: false,
            fileName: file.originalname,
            error: err.message,
          };
        } finally {
          // Always clean up temp disk file
          if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      })
    );

    const uploadedImages = [];
    const errors = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          uploadedImages.push(result.value.image);
        } else {
          errors.push({
            fileName: result.value.fileName,
            error: result.value.error,
          });
        }
      } else {
        errors.push({ error: result.reason?.message || "Unknown upload error" });
      }
    });

    // Save all successful uploads to DB in one operation
    if (uploadedImages.length > 0) {
      recruiter.companyProfile.gallery.push(...uploadedImages);
      await recruiter.save();
    }

    // If all uploads failed, throw an error
    if (uploadedImages.length === 0 && errors.length > 0) {
      throw new ApiError(500, `All uploads failed: ${errors[0].error}`);
    }

    return {
      gallery: recruiter.companyProfile.gallery,
      remaining: MAX_GALLERY_PHOTOS - recruiter.companyProfile.gallery.length,
      uploaded: uploadedImages.length,
      failed: errors.length,
      failedDetails: errors,
      skipped: skippedCount,
    };
  }

  // 🛠️ FIXED: Safe gallery image deletion (handles missing publicId)
  async deleteGalleryImage(recruiterId, imageId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const img = recruiter.companyProfile?.gallery?.id(imageId);
    if (!img) throw new ApiError(404, "Gallery image not found");

    // FIX: Use publicId first, fallback to extracting from URL
    const cloudinaryIdentifier = img.publicId || img.url;

    if (cloudinaryIdentifier) {
      try {
        await deleteFromCloudinary(cloudinaryIdentifier);
      } catch (e) {
        // Log warning but do NOT block the DB deletion
        console.warn("Cloudinary delete warning:", e.message);
      }
    } else {
      console.warn(
        `⚠️ Gallery image ${imageId} has no publicId or URL — skipping Cloudinary delete`
      );
    }

    // Always remove from DB regardless of Cloudinary result
    recruiter.companyProfile.gallery.pull(imageId);
    await recruiter.save();

    return {
      gallery: recruiter.companyProfile.gallery,
      remaining: MAX_GALLERY_PHOTOS - recruiter.companyProfile.gallery.length,
    };
  }

  async uploadDocument(recruiterId, file, docType, docName) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");
    if (!file) throw new ApiError(400, "No file uploaded");
    if (!docType) throw new ApiError(400, "Document type is required");

    let uploaded;
    try {
      uploaded = await uploadToCloudinary(
        file.path,
        `verihire/verification/${recruiterId}`
      );
    } catch (err) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ApiError(500, `Cloudinary document upload failed: ${err.message}`);
    }
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    const newDoc = {
      docType,
      docName: docName || file.originalname,
      public_id: uploaded.public_id,
      url: uploaded.url,
      format: uploaded.format,
      size: uploaded.size,
      uploadedAt: new Date(),
    };

    // Store in dedicated verifications collection
    const verification = await getOrCreateVerification(recruiter);
    verification.documents.push(newDoc);
    await verification.save();

    // Also mirror in recruiter document for backwards compatibility
    recruiter.verificationDocuments.push(newDoc);
    await recruiter.save();

    return {
      document: verification.documents[verification.documents.length - 1],
      totalDocuments: verification.documents.length,
    };
  }

  async deleteDocument(recruiterId, documentId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter);
    const doc = verification.documents.id(documentId);
    if (!doc) throw new ApiError(404, "Document not found");

    if (verification.status === "pending") {
      throw new ApiError(400, "Cannot delete documents while verification is under review");
    }
    if (verification.status === "approved") {
      throw new ApiError(400, "Cannot delete documents after verification is approved");
    }

    try {
      await deleteFromCloudinary(doc.public_id);
    } catch (err) {
      console.warn("Cloudinary delete failed:", err.message);
    }

    verification.documents.pull(documentId);
    await verification.save();

    // Also remove from recruiter mirror
    const mirrorDoc = recruiter.verificationDocuments.find(
      (d) => d.public_id === doc.public_id
    );
    if (mirrorDoc) recruiter.verificationDocuments.pull(mirrorDoc._id);
    await recruiter.save();

    return { totalDocuments: verification.documents.length };
  }

  async submitForVerification(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const p = recruiter.companyProfile;
    const required = [
      "name",
      "industry",
      "about",
      "city",
      "state",
      "country",
      "registrationNumber",
    ];
    for (const f of required) {
      if (!p[f] || String(p[f]).trim() === "") {
        throw new ApiError(400, `Please complete "${f}" before submitting`);
      }
    }

    if (!p.logo?.url) throw new ApiError(400, "Please upload your company logo");
    if (!p.contactPerson?.name || !p.contactPerson?.designation) {
      throw new ApiError(400, "Please add contact person details");
    }

    const verification = await getOrCreateVerification(recruiter);
    if (verification.documents.length === 0) {
      throw new ApiError(400, "Please upload at least one verification document");
    }
    if (verification.status === "pending") {
      throw new ApiError(400, "Your verification is already under review");
    }
    if (verification.status === "approved") {
      throw new ApiError(400, "Your company is already verified");
    }

    verification.status = "pending";
    verification.submittedAt = new Date();
    verification.rejectionReason = "";
    verification.companyName = recruiter.companyName;
    verification.recruiterName = recruiter.name;
    verification.recruiterEmail = recruiter.email;
    verification.companySnapshot = {
      name: p.name,
      industry: p.industry,
      website: p.website,
      city: p.city,
      state: p.state,
      country: p.country,
      registrationNumber: p.registrationNumber,
      gstNumber: p.gstNumber,
      panNumber: p.panNumber,
      logoUrl: p.logo?.url || "",
    };
    await verification.save();

    // Sync recruiter status
    recruiter.verificationStatus = "pending";
    recruiter.verificationSubmittedAt = verification.submittedAt;
    recruiter.rejectionReason = "";
    await recruiter.save();

    console.log(`📋 Verification submitted by: ${recruiter.name} (${recruiter.email})`);

    return {
      verificationStatus: verification.status,
      verificationSubmittedAt: verification.submittedAt,
      message: "Your verification request has been submitted. Our team will review within 24-48 hours.",
    };
  }

  // DIRECT ADMIN VERIFICATION via JSON API
  async reviewVerification(recruiterId, decision, rejectionReason, reviewer) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter);

    if (decision === "approve") {
      verification.status = "approved";
      verification.rejectionReason = "";
      recruiter.verificationStatus = "approved";
      recruiter.isVerified = true;
      recruiter.rejectionReason = "";
    } else if (decision === "reject") {
      verification.status = "rejected";
      verification.rejectionReason = rejectionReason || "Documents insufficient";
      recruiter.verificationStatus = "rejected";
      recruiter.isVerified = false;
      recruiter.rejectionReason = verification.rejectionReason;
    } else {
      throw new ApiError(400, "Invalid decision. Use 'approve' or 'reject'");
    }

    verification.reviewedAt = new Date();
    verification.reviewedBy = reviewer || "Admin Panel";
    await verification.save();

    recruiter.verificationReviewedAt = verification.reviewedAt;
    recruiter.reviewedBy = verification.reviewedBy;
    await recruiter.save();

    console.log(`✅ [Admin Review] Recruiter ${recruiter.email} marked as ${decision.toUpperCase()}`);

    return {
      recruiterId: recruiter._id,
      companyName: recruiter.companyName,
      verificationStatus: verification.status,
      isVerified: recruiter.isVerified,
      rejectionReason: verification.rejectionReason,
      reviewedAt: verification.reviewedAt,
    };
  }

  async autoApproveDemo(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter);

    verification.status = "approved";
    verification.submittedAt = verification.submittedAt || new Date();
    verification.reviewedAt = new Date();
    verification.reviewedBy = "Demo Auto-Approve";
    verification.rejectionReason = "";
    verification.companyName = recruiter.companyName;
    verification.recruiterName = recruiter.name;
    verification.recruiterEmail = recruiter.email;
    await verification.save();

    recruiter.verificationStatus = "approved";
    recruiter.isVerified = true;
    recruiter.verificationSubmittedAt = verification.submittedAt;
    recruiter.verificationReviewedAt = verification.reviewedAt;
    recruiter.reviewedBy = "Demo Auto-Approve";
    recruiter.rejectionReason = "";
    await recruiter.save();

    return {
      verificationStatus: verification.status,
      isVerified: recruiter.isVerified,
    };
  }

  // ADMIN: List all pending verifications
  async listAllVerifications(filter = {}) {
    const query = {};
    if (filter.status) query.status = filter.status;
    const list = await Verification.find(query).sort({ submittedAt: -1 });
    return list;
  }
}

module.exports = new CompanyService();