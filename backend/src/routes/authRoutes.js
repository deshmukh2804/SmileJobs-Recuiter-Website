const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/google", authController.googleLogin);
router.post("/logout", authController.logout);

// ✅ Protected routes — recruiter profile
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);

module.exports = router;