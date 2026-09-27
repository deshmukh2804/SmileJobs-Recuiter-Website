const userService = require("../services/userService");
const ApiResponse = require("../utils/apiResponse");

class UserController {
  // ─── Register ──────────────────────────────────────────────
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const avatarPath = req.file ? req.file.path : null;

      const result = await userService.registerUser({
        name,
        email,
        password,
        avatarPath,
      });

      res
        .status(201)
        .json(new ApiResponse(201, result, "User registered successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Login ────────────────────────────────────────────────
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await userService.loginUser({ email, password });

      // Set cookie
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Login successful"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Logout ───────────────────────────────────────────────
  async logout(req, res, next) {
    try {
      res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
      });

      res
        .status(200)
        .json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Get Profile ──────────────────────────────────────────
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user._id);

      res
        .status(200)
        .json(new ApiResponse(200, user, "Profile fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Update Profile ───────────────────────────────────────
  async updateProfile(req, res, next) {
    try {
      const updateData = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;

      const avatarPath = req.file ? req.file.path : null;

      const user = await userService.updateUserProfile(
        req.user._id,
        updateData,
        avatarPath
      );

      res
        .status(200)
        .json(new ApiResponse(200, user, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Delete Account ───────────────────────────────────────
  async deleteAccount(req, res, next) {
    try {
      const result = await userService.deleteUser(req.user._id);

      res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
      });

      res.status(200).json(new ApiResponse(200, result, "Account deleted"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Get All Users (Admin) ────────────────────────────────
  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Users fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin Delete User ────────────────────────────────────
  async adminDeleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);

      res.status(200).json(new ApiResponse(200, result, "User deleted by admin"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();