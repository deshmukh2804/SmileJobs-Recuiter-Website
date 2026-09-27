const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const {
  protect,
  recruiterOnly,
  requireVerified,
} = require("../middleware/authMiddleware");

router.use(protect);
router.use(recruiterOnly);

router.post("/", requireVerified, jobController.createJob);
router.put("/:jobId", requireVerified, jobController.updateJob);   // <-- NEW
router.get("/", jobController.listMyJobs);
router.get("/:jobId", jobController.getJob);
router.patch("/:jobId/status", jobController.updateJobStatus);
router.delete("/:jobId", jobController.deleteJob);

module.exports = router;