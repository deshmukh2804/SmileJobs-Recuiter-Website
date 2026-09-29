const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const { protect, recruiterOnly } = require("../middleware/authMiddleware");

router.use(protect);
router.use(recruiterOnly);

// List all candidates
router.get("/", candidateController.getMyCandidates);

// Bulk operations (MUST come before /:id routes)
router.post("/bulk-status", candidateController.bulkUpdateStatus);

// Get full candidate details with resume, job info, workflow
router.get("/:id/full-details", candidateController.getCandidateFullDetails);

// Status/Stage updates
router.patch("/:id/status", candidateController.updateCandidateStatus);
router.patch("/:id/stage", candidateController.updateCandidateStage);

// Bookmark
router.patch("/:id/bookmark", candidateController.toggleBookmark);

// Notes
router.post("/:id/notes", candidateController.addNote);

// Delete
router.delete("/:id", candidateController.deleteApplication);

module.exports = router;