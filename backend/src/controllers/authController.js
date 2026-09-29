const authService = require("../services/authService");
const ApiResponse = require("../utils/apiResponse");

class AuthController {
  async sendOtp(req, res, next) {
    try {
      const { phone, email } = req.body;
      const result = await authService.sendOtp({ phone, email });
      
      // Return different messages for email vs phone
      if (result.method === "email") {
        res.status(200).json(
          new ApiResponse(200, result, "Verification code sent to your email")
        );
      } else {
        res.status(200).json(
          new ApiResponse(200, result, "Demo OTP generated")
        );
      }
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { phone, email, otp } = req.body;
      const result = await authService.verifyOtp({ phone, email, otp });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Recruiter verified successfully"));
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req, res, next) {
    try {
      const { accessToken } = req.body;
      const result = await authService.googleLogin({ accessToken });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Google authentication successful")
        );
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
      res
        .status(200)
        .json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

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
        .json(
          new ApiResponse(200, { user: enrichedUser }, "Profile fetched")
        );
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user._id, req.body);
      res
        .status(200)
        .json(
          new ApiResponse(200, { user }, "Profile updated successfully")
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();