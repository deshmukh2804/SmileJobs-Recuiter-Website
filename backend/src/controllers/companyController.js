const companyService = require("../services/companyService");
const ApiResponse = require("../utils/apiResponse");

class CompanyController {
  async getProfile(req, res, next) {
    try {
      const data = await companyService.getCompanyProfile(req.user._id);
      res.status(200).json(new ApiResponse(200, data, "Company profile fetched"));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const data = await companyService.updateCompanyProfile(req.user._id, req.body);
      res.status(200).json(new ApiResponse(200, data, "Company profile updated"));
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req, res, next) {
    try {
      const data = await companyService.uploadLogo(req.user._id, req.file);
      res.status(201).json(new ApiResponse(201, data, "Logo uploaded"));
    } catch (error) {
      next(error);
    }
  }

  async uploadGalleryImage(req, res, next) {
    try {
      const data = await companyService.uploadGalleryImage(req.user._id, req.file);
      res.status(201).json(new ApiResponse(201, data, "Gallery image uploaded"));
    } catch (error) {
      next(error);
    }
  }

  // ⭐ NEW: Batch upload multiple gallery images
  async uploadGalleryImagesBatch(req, res, next) {
    try {
      const data = await companyService.uploadGalleryImagesBatch(req.user._id, req.files);
      res.status(201).json(
        new ApiResponse(201, data, `${data.uploaded} gallery image(s) uploaded successfully`)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteGalleryImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const data = await companyService.deleteGalleryImage(req.user._id, imageId);
      res.status(200).json(new ApiResponse(200, data, "Gallery image deleted"));
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const { docType, docName } = req.body;
      const data = await companyService.uploadDocument(
        req.user._id,
        req.file,
        docType,
        docName
      );
      res.status(201).json(new ApiResponse(201, data, "Document uploaded"));
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const data = await companyService.deleteDocument(req.user._id, documentId);
      res.status(200).json(new ApiResponse(200, data, "Document deleted"));
    } catch (error) {
      next(error);
    }
  }

  async submitVerification(req, res, next) {
    try {
      const data = await companyService.submitForVerification(req.user._id);
      res.status(200).json(new ApiResponse(200, data, "Verification submitted"));
    } catch (error) {
      next(error);
    }
  }

  async autoApprove(req, res, next) {
    try {
      const data = await companyService.autoApproveDemo(req.user._id);
      res.status(200).json(new ApiResponse(200, data, "Company auto-approved (demo)"));
    } catch (error) {
      next(error);
    }
  }

  // 🛠️ ADMIN JSON REVIEW
  async reviewVerification(req, res, next) {
    try {
      const { recruiterId } = req.params;
      const { decision, rejectionReason, reviewer } = req.body;
      const data = await companyService.reviewVerification(
        recruiterId,
        decision,
        rejectionReason,
        reviewer || req.user?.name || "Admin"
      );
      res.status(200).json(new ApiResponse(200, data, `Verification ${decision}d`));
    } catch (error) {
      next(error);
    }
  }

  // 🛠️ ADMIN: List all verifications with status filter
  async listVerifications(req, res, next) {
    try {
      const { status } = req.query;
      const data = await companyService.listAllVerifications({ status });
      res.status(200).json(new ApiResponse(200, data, "Verifications list fetched"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanyController();