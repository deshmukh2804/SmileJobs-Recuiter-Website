const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { protect, recruiterOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Recruiter endpoints
router.get("/profile", protect, recruiterOnly, companyController.getProfile);
router.put("/profile", protect, recruiterOnly, companyController.updateProfile);

// Logo & Gallery Uploads
router.post("/logo", protect, recruiterOnly, upload.single("file"), companyController.uploadLogo);

// ⭐ Single gallery upload (existing — kept for backward compatibility)
router.post("/gallery", protect, recruiterOnly, upload.single("file"), companyController.uploadGalleryImage);

// ⭐ NEW: Batch gallery upload — up to 5 photos at once
router.post("/gallery/batch", protect, recruiterOnly, upload.array("files", 5), companyController.uploadGalleryImagesBatch);

router.delete("/gallery/:imageId", protect, recruiterOnly, companyController.deleteGalleryImage);

// Verification documents
router.post("/documents", protect, recruiterOnly, upload.single("file"), companyController.uploadDocument);
router.delete("/documents/:documentId", protect, recruiterOnly, companyController.deleteDocument);

// Verification workflow
router.post("/submit-verification", protect, recruiterOnly, companyController.submitVerification);
router.post("/auto-approve", protect, recruiterOnly, companyController.autoApprove);

// 🛠️ DIRECT ADMIN JSON VERIFICATION ENDPOINT
router.post("/review/:recruiterId", protect, companyController.reviewVerification);

module.exports = router;