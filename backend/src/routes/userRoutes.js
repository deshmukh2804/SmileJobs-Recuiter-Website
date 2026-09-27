const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ─── Public Routes ──────────────────────────────────────────
router.post("/register", upload.single("avatar"), userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// ─── Protected Routes ───────────────────────────────────────
router.get("/profile", protect, userController.getProfile);
router.put(
  "/profile",
  protect,
  upload.single("avatar"),
  userController.updateProfile
);
router.delete("/profile", protect, userController.deleteAccount);

// ─── Admin Routes ───────────────────────────────────────────
router.get("/admin/users", protect, admin, userController.getAllUsers);
router.delete("/admin/users/:id", protect, admin, userController.adminDeleteUser);

module.exports = router;