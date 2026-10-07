const authService = require("../services/authService");
const ApiResponse = require("../utils/apiResponse");

class AuthController {
  // ─────────────────────────────────────────────────────
  // SEND OTP
  // ─────────────────────────────────────────────────────
  async sendOtp(req, res, next) {
    try {
      const { phone, email } = req.body;

      // Input sanitization
      const cleanPhone = phone ? String(phone).trim() : undefined;
      const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

      if (!cleanPhone && !cleanEmail) {
        return res.status(400).json(
          new ApiResponse(400, null, "Phone or email is required")
        );
      }

      const result = await authService.sendOtp({
        phone: cleanPhone,
        email: cleanEmail,
      });

      const message =
        result.method === "email"
          ? "Verification code sent to your email"
          : "Demo OTP generated";

      res.status(200).json(new ApiResponse(200, result, message));
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────────────
  // VERIFY OTP
  // ─────────────────────────────────────────────────────
  async verifyOtp(req, res, next) {
    try {
      const { phone, email, otp } = req.body;

      // Input sanitization
      const cleanPhone = phone ? String(phone).trim() : undefined;
      const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
      const cleanOtp = otp ? String(otp).trim() : undefined;

      if (!cleanOtp) {
        return res.status(400).json(
          new ApiResponse(400, null, "OTP is required")
        );
      }

      const result = await authService.verifyOtp({
        phone: cleanPhone,
        email: cleanEmail,
        otp: cleanOtp,
      });

      // Set HTTP-only cookie for session persistence
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Recruiter verified successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────────────────
  async googleLogin(req, res, next) {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json(
          new ApiResponse(400, null, "Google access token is required")
        );
      }

      const result = await authService.googleLogin({ accessToken });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Google authentication successful"));
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────
  async logout(req, res, next) {
    try {
      res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: new Date(0),
        path: "/",
      });
      res
        .status(200)
        .json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────────────
  // GET CURRENT USER (with subscription enrichment)
  // ─────────────────────────────────────────────────────
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user._id);

      let subscriptionData = null;
      let usageData = null;

      try {
        const usageService = require("../services/subscription/usageService");
        const usage = await usageService.getRecruiterJobUsage(req.user._id);
        subscriptionData = usage.subscription || null;
        usageData = {
          jobsUsed: usage.jobsUsed,
          jobLimit: usage.jobLimit,
          remainingJobs: usage.remainingJobs,
          subscriptionActive: usage.subscriptionActive,
        };
      } catch (subErr) {
        console.warn("⚠️ Could not fetch subscription data:", subErr.message);
      }

      const enrichedUser = {
        ...user,
        subscription: subscriptionData,
        usage: usageData,
      };

      res
        .status(200)
        .json(new ApiResponse(200, { user: enrichedUser }, "Profile fetched"));
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────────────
  // UPDATE PROFILE
  // ─────────────────────────────────────────────────────
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user._id, req.body);
      res
        .status(200)
        .json(new ApiResponse(200, { user }, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();