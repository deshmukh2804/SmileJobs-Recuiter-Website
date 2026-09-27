const authService = require("../services/authService");
const ApiResponse = require("../utils/apiResponse");

class AuthController {
  async sendOtp(req, res, next) {
    try {
      const { phone, email } = req.body;
      const result = await authService.sendOtp({ phone, email });
      res.status(200).json(new ApiResponse(200, result, "Demo OTP generated"));
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { phone, email, otp, name } = req.body;
      const result = await authService.verifyOtp({ phone, email, otp, name });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(new ApiResponse(200, result, "Recruiter verified successfully"));
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

      res.status(200).json(new ApiResponse(200, result, "Google authentication successful"));
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
      res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();