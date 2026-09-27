const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const { protect, recruiterOnly } = require("../middleware/authMiddleware");

router.use(protect);
router.use(recruiterOnly);

router.get("/", candidateController.getMyCandidates);
router.patch("/:id/stage", candidateController.updateCandidateStage);
router.patch("/:id/bookmark", candidateController.toggleBookmark);
router.post("/:id/notes", candidateController.addNote);

module.exports = router;