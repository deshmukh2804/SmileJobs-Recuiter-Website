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

// ✅ CRITICAL: Sync recruiter data into verification document
const syncVerificationSnapshot = async (recruiter, verification) => {
  const p = recruiter.companyProfile || {};

  verification.recruiterName = recruiter.name || "";
  verification.recruiterEmail = recruiter.email || "";
  verification.recruiterPhone = recruiter.phone || "";
  verification.companyName = p.name || recruiter.companyName || "";

  verification.companySnapshot = {
    name: p.name || "",
    industry: p.industry || "",
    website: p.website || "",
    about: p.about || "",
    city: p.city || "",
    state: p.state || "",
    country: p.country || "",
    companyType: p.companyType || "",
    registrationNumber: p.registrationNumber || "",
    gstNumber: p.gstNumber || "",
    panNumber: p.panNumber || "",
    tanNumber: p.tanNumber || "",
    logoUrl: p.logo?.url || "",
    contactEmail: p.contactEmail || "",
    contactPhone: p.contactPhone || "",
    contactPersonName: p.contactPerson?.name || "",
    contactPersonDesignation: p.contactPerson?.designation || "",
    organizationSize: p.organizationSize || p.teamSize || "",
    establishedYear: p.establishedYear || null,
  };

  return verification;
};

// ✅ Get or create verification with automatic snapshot sync
const getOrCreateVerification = async (recruiterId) => {
  const recruiter = await Recruiter.findById(recruiterId);
  if (!recruiter) throw new ApiError(404, "Recruiter not found");

  let v = await Verification.findOne({ recruiterId });
  if (!v) {
    v = new Verification({
      recruiterId,
      status: "not_submitted",
    });
  }

  await syncVerificationSnapshot(recruiter, v);
  await v.save();

  return v;
};

const buildVerificationView = (recruiter, verification) => ({
  recruiterId: recruiter._id,
  recruiterName: recruiter.name || "",
  recruiterEmail: recruiter.email || "",
  recruiterPhone: recruiter.phone || "",
  companyName: recruiter.companyName || recruiter.companyProfile?.name || "",
  companySnapshot: {
    name: recruiter.companyProfile?.name || "",
    industry: recruiter.companyProfile?.industry || "",
    website: recruiter.companyProfile?.website || "",
    about: recruiter.companyProfile?.about || "",
    city: recruiter.companyProfile?.city || "",
    state: recruiter.companyProfile?.state || "",
    country: recruiter.companyProfile?.country || "",
    companyType: recruiter.companyProfile?.companyType || "",
    registrationNumber: recruiter.companyProfile?.registrationNumber || "",
    gstNumber: recruiter.companyProfile?.gstNumber || "",
    panNumber: recruiter.companyProfile?.panNumber || "",
    tanNumber: recruiter.companyProfile?.tanNumber || "",
    logoUrl: recruiter.companyProfile?.logo?.url || "",
    contactEmail: recruiter.companyProfile?.contactEmail || "",
    contactPhone: recruiter.companyProfile?.contactPhone || "",
    contactPersonName: recruiter.companyProfile?.contactPerson?.name || "",
    contactPersonDesignation: recruiter.companyProfile?.contactPerson?.designation || "",
    organizationSize: recruiter.companyProfile?.organizationSize || recruiter.companyProfile?.teamSize || "",
    establishedYear: recruiter.companyProfile?.establishedYear || null,
  },
  documents: verification.documents,
  status: verification.status,
  submittedAt: verification.submittedAt,
  reviewedAt: verification.reviewedAt,
  reviewedBy: verification.reviewedBy,
  rejectionReason: verification.rejectionReason,
  adminNotes: verification.adminNotes,
  clarificationDocs: verification.clarificationDocs || [],
  clarificationMessage: verification.clarificationMessage || "",
});

class CompanyService {
  async getCompanyProfile(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter._id);

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

    // ✅ SYNC verification snapshot after profile update
    let verification = await Verification.findOne({ recruiterId: recruiter._id });
    if (!verification) {
      verification = new Verification({
        recruiterId: recruiter._id,
        status: "not_submitted",
      });
    }
    await syncVerificationSnapshot(recruiter, verification);
    await verification.save();

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

    // ✅ SYNC verification snapshot
    let verification = await Verification.findOne({ recruiterId: recruiter._id });
    if (verification) {
      await syncVerificationSnapshot(recruiter, verification);
      await verification.save();
    }

    return { logo: recruiter.companyProfile.logo };
  }

  async uploadGalleryImage(recruiterId, file) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");
    if (!file) throw new ApiError(400, "No file uploaded");

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

  async uploadGalleryImagesBatch(recruiterId, files) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");
    if (!files || files.length === 0) throw new ApiError(400, "No files uploaded");

    if (!recruiter.companyProfile) recruiter.companyProfile = {};
    if (!recruiter.companyProfile.gallery) recruiter.companyProfile.gallery = [];

    const currentCount = recruiter.companyProfile.gallery.length;
    const availableSlots = MAX_GALLERY_PHOTOS - currentCount;

    if (availableSlots <= 0) {
      files.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      throw new ApiError(
        400,
        `Maximum ${MAX_GALLERY_PHOTOS} company photos allowed. Delete existing photos first.`
      );
    }

    const filesToProcess = files.slice(0, availableSlots);
    const skippedCount = files.length - filesToProcess.length;

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

    if (uploadedImages.length > 0) {
      recruiter.companyProfile.gallery.push(...uploadedImages);
      await recruiter.save();
    }

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

  async deleteGalleryImage(recruiterId, imageId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const img = recruiter.companyProfile?.gallery?.id(imageId);
    if (!img) throw new ApiError(404, "Gallery image not found");

    const cloudinaryIdentifier = img.publicId || img.url;

    if (cloudinaryIdentifier) {
      try {
        await deleteFromCloudinary(cloudinaryIdentifier);
      } catch (e) {
        console.warn("Cloudinary delete warning:", e.message);
      }
    }

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

    const verification = await getOrCreateVerification(recruiter._id);
    verification.documents.push(newDoc);

    await syncVerificationSnapshot(recruiter, verification);
    await verification.save();

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

    const verification = await getOrCreateVerification(recruiter._id);
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

    const mirrorDoc = recruiter.verificationDocuments.find(
      (d) => d.public_id === doc.public_id
    );
    if (mirrorDoc) recruiter.verificationDocuments.pull(mirrorDoc._id);
    await recruiter.save();

    return { totalDocuments: verification.documents.length };
  }

  // ✅ UPDATED: Submit verification with new required document types
  async submitForVerification(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    // Validate recruiter identity
    if (!recruiter.name || recruiter.name.trim() === "") {
      throw new ApiError(400, "Please add your name on the Settings page first");
    }
    if (!recruiter.email && !recruiter.phone) {
      throw new ApiError(400, "Please add an email or phone number to your profile");
    }

    // Validate company profile completeness
    const p = recruiter.companyProfile || {};
    const missingFields = [];

    if (!p.name || p.name.trim() === "") missingFields.push("Company Name");
    if (!p.industry || p.industry.trim() === "") missingFields.push("Industry");
    if (!p.about || p.about.trim() === "") missingFields.push("About");
    if (!p.city || p.city.trim() === "") missingFields.push("City");
    if (!p.state || p.state.trim() === "") missingFields.push("State");
    if (!p.country || p.country.trim() === "") missingFields.push("Country");
    if (!p.companyType || p.companyType.trim() === "") missingFields.push("Company Type");
    if (!p.gstNumber || p.gstNumber.trim() === "") missingFields.push("GST Number");
    if (!p.panNumber || p.panNumber.trim() === "") missingFields.push("PAN Number");
    if (!p.tanNumber || p.tanNumber.trim() === "") missingFields.push("TAN Number");
    if (!p.logo?.url) missingFields.push("Company Logo");
    if (!p.contactPerson?.name || p.contactPerson.name.trim() === "") {
      missingFields.push("Contact Person Name");
    }
    if (!p.contactPerson?.designation || p.contactPerson.designation.trim() === "") {
      missingFields.push("Contact Person Designation");
    }
    if (!p.contactEmail || p.contactEmail.trim() === "") missingFields.push("Contact Email");
    if (!p.contactPhone || p.contactPhone.trim() === "") missingFields.push("Contact Phone");

    if (missingFields.length > 0) {
      throw new ApiError(
        400,
        `Please complete these required fields before submitting: ${missingFields.join(", ")}`
      );
    }

    // Get or create verification and validate documents
    const verification = await getOrCreateVerification(recruiter._id);
    if (verification.documents.length === 0) {
      throw new ApiError(400, "Please upload at least one verification document");
    }

    // ✅ UPDATED: New required document types
    const REQUIRED_DOCS = ["shop_act_msme", "gst_certificate", "pan_card", "tan_card"];
    const uploadedTypes = new Set(verification.documents.map((d) => d.docType));
    const missingDocs = REQUIRED_DOCS.filter((type) => !uploadedTypes.has(type));

    if (missingDocs.length > 0) {
      const docLabels = {
        shop_act_msme: "Shop Act / MSME Certificate",
        gst_certificate: "GST Certificate",
        pan_card: "PAN Card",
        tan_card: "TAN Card",
      };
      const missingLabels = missingDocs.map((d) => docLabels[d] || d);
      throw new ApiError(
        400,
        `Please upload all required documents: ${missingLabels.join(", ")}`
      );
    }

    if (verification.status === "pending") {
      throw new ApiError(400, "Your verification is already under review");
    }
    if (verification.status === "approved") {
      throw new ApiError(400, "Your company is already verified");
    }

    // Update verification status to pending
    verification.status = "pending";
    verification.submittedAt = new Date();
    verification.rejectionReason = "";

    await syncVerificationSnapshot(recruiter, verification);
    await verification.save();

    recruiter.verificationStatus = "pending";
    recruiter.verificationSubmittedAt = verification.submittedAt;
    recruiter.rejectionReason = "";
    await recruiter.save();

    console.log(`📋 Verification submitted by: ${recruiter.name} (${recruiter.email || recruiter.phone})`);

    return {
      verificationStatus: verification.status,
      verificationSubmittedAt: verification.submittedAt,
      message: "Your verification request has been submitted. Our team will review within 24-48 hours.",
    };
  }

  async reviewVerification(recruiterId, decision, rejectionReason, reviewer) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter._id);

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

    await syncVerificationSnapshot(recruiter, verification);
    await verification.save();

    recruiter.verificationReviewedAt = verification.reviewedAt;
    recruiter.reviewedBy = verification.reviewedBy;
    await recruiter.save();

    console.log(`✅ [Admin Review] Recruiter ${recruiter.email || recruiter.phone} marked as ${decision.toUpperCase()}`);

    return buildVerificationView(recruiter, verification);
  }

  async autoApproveDemo(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const verification = await getOrCreateVerification(recruiter._id);

    verification.status = "approved";
    verification.submittedAt = verification.submittedAt || new Date();
    verification.reviewedAt = new Date();
    verification.reviewedBy = "Demo Auto-Approve";
    verification.rejectionReason = "";

    await syncVerificationSnapshot(recruiter, verification);
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

  // ✅ ADMIN: List all verifications with full populated data
  async listAllVerifications(filter = {}) {
    const query = {};
    if (filter.status) query.status = filter.status;

    const list = await Verification.find(query)
      .sort({ submittedAt: -1, createdAt: -1 })
      .populate({
        path: "recruiterId",
        select: "name email phone companyName companyProfile isVerified loginMethod verificationStatus",
      })
      .lean();

    return list.map((v) => {
      const r = v.recruiterId;
      if (!r || typeof r === "string") {
        return {
          _id: v._id,
          recruiterId: r,
          recruiterName: v.recruiterName || "",
          recruiterEmail: v.recruiterEmail || "",
          recruiterPhone: v.recruiterPhone || "",
          companyName: v.companyName || "",
          companySnapshot: v.companySnapshot || {},
          documents: v.documents,
          status: v.status,
          submittedAt: v.submittedAt,
          reviewedAt: v.reviewedAt,
          reviewedBy: v.reviewedBy,
          rejectionReason: v.rejectionReason,
          adminNotes: v.adminNotes,
          clarificationDocs: v.clarificationDocs || [],
          clarificationMessage: v.clarificationMessage || "",
        };
      }

      const p = r.companyProfile || {};
      return {
        _id: v._id,
        recruiterId: r._id,
        recruiterName: r.name || v.recruiterName || "",
        recruiterEmail: r.email || v.recruiterEmail || "",
        recruiterPhone: r.phone || v.recruiterPhone || "",
        companyName: r.companyName || p.name || v.companyName || "",
        companySnapshot: {
          name: p.name || v.companySnapshot?.name || "",
          industry: p.industry || v.companySnapshot?.industry || "",
          website: p.website || v.companySnapshot?.website || "",
          about: p.about || v.companySnapshot?.about || "",
          city: p.city || v.companySnapshot?.city || "",
          state: p.state || v.companySnapshot?.state || "",
          country: p.country || v.companySnapshot?.country || "",
          companyType: p.companyType || v.companySnapshot?.companyType || "",
          registrationNumber: p.registrationNumber || v.companySnapshot?.registrationNumber || "",
          gstNumber: p.gstNumber || v.companySnapshot?.gstNumber || "",
          panNumber: p.panNumber || v.companySnapshot?.panNumber || "",
          tanNumber: p.tanNumber || v.companySnapshot?.tanNumber || "",
          logoUrl: p.logo?.url || v.companySnapshot?.logoUrl || "",
          contactEmail: p.contactEmail || v.companySnapshot?.contactEmail || "",
          contactPhone: p.contactPhone || v.companySnapshot?.contactPhone || "",
          contactPersonName: p.contactPerson?.name || v.companySnapshot?.contactPersonName || "",
          contactPersonDesignation: p.contactPerson?.designation || v.companySnapshot?.contactPersonDesignation || "",
          organizationSize: p.organizationSize || p.teamSize || v.companySnapshot?.organizationSize || "",
          establishedYear: p.establishedYear || v.companySnapshot?.establishedYear || null,
        },
        documents: v.documents,
        status: v.status,
        submittedAt: v.submittedAt,
        reviewedAt: v.reviewedAt,
        reviewedBy: v.reviewedBy,
        rejectionReason: v.rejectionReason,
        adminNotes: v.adminNotes,
        clarificationDocs: v.clarificationDocs || [],
        clarificationMessage: v.clarificationMessage || "",
      };
    });
  }
}

module.exports = new CompanyService();