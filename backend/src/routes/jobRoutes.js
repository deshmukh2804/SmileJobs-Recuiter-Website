const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const {
  protect,
  recruiterOnly,
  requireVerified,
} = require("../middleware/authMiddleware");
const { requireJobQuota } = require("../middleware/subscriptionMiddleware");

router.use(protect);
router.use(recruiterOnly);

router.post("/", requireVerified, requireJobQuota, jobController.createJob);
router.put("/:jobId", requireVerified, jobController.updateJob);
router.get("/", jobController.listMyJobs);
router.get("/:jobId", jobController.getJob);
router.patch(
  "/:jobId/status",
  requireVerified,
  requireJobQuota,
  jobController.updateJobStatus
);
router.delete("/:jobId", jobController.deleteJob);

module.exports = router;