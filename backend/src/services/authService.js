const axios = require("axios");
const Recruiter = require("../models/recruiterModel");
const ApiError = require("../utils/apiError");

const otpStore = new Map();

const buildUserPayload = (recruiter) => ({
  id: recruiter._id,
  name: recruiter.name,
  email: recruiter.email,
  phone: recruiter.phone,
  avatar: recruiter.avatar,
  role: "recruiter",
  companyName: recruiter.companyName,
  loginMethod: recruiter.loginMethod,
  isVerified: recruiter.isVerified,
  verificationStatus: recruiter.verificationStatus,
  verificationSubmittedAt: recruiter.verificationSubmittedAt,
  verificationReviewedAt: recruiter.verificationReviewedAt,
  rejectionReason: recruiter.rejectionReason,
});

class AuthService {
  async sendOtp({ phone, email }) {
    const identifier = phone || email;
    if (!identifier) {
      throw new ApiError(400, "Phone or email identifier is required");
    }
    const otp = "482910";
    otpStore.set(identifier, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`\n📨 [RECRUITER DEMO OTP] Sent to ${identifier}: ${otp}`);
    return { message: "OTP dispatched successfully", demoOtp: otp, identifier };
  }

  async verifyOtp({ phone, email, otp, name }) {
    const identifier = phone || email;
    if (!identifier || !otp) {
      throw new ApiError(400, "Identifier and OTP are required");
    }
    const stored = otpStore.get(identifier);
    if (otp !== "482910" && (!stored || stored.otp !== otp)) {
      throw new ApiError(401, "Invalid verification code");
    }
    if (stored && stored.expiresAt < Date.now()) {
      otpStore.delete(identifier);
      throw new ApiError(401, "OTP expired");
    }
    otpStore.delete(identifier);

    const query = phone ? { phone } : { email };
    let recruiter = await Recruiter.findOne(query);

    if (!recruiter) {
      recruiter = await Recruiter.create({
        name: name || (email ? email.split("@")[0] : "New Recruiter"),
        email: email || `${phone.replace("+", "")}@phone.verihire.local`,
        phone: phone || null,
        loginMethod: phone ? "phone_otp" : "email_otp",
        companyName: "Verihire Talent Technologies",
      });
      console.log(`✨ New recruiter registered: ${recruiter.name} in recruiter_db`);
    } else {
      recruiter.lastLogin = new Date();
      await recruiter.save();
      console.log(`👋 Recruiter logged in: ${recruiter.email}`);
    }

    const token = recruiter.generateToken();
    return { user: buildUserPayload(recruiter), token };
  }

  async googleLogin({ accessToken }) {
    if (!accessToken) throw new ApiError(400, "Google access token required");

    let googleId, email, name, picture;
    try {
      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      googleId = data.sub;
      email = data.email;
      name = data.name;
      picture = data.picture;
    } catch (error) {
      throw new ApiError(401, "Failed to authenticate with Google");
    }

    let recruiter = await Recruiter.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!recruiter) {
      recruiter = await Recruiter.create({
        name,
        email,
        googleId,
        avatar: { url: picture || "", public_id: "" },
        loginMethod: "google",
        companyName: "Verihire Talent Technologies",
      });
    } else {
      if (!recruiter.googleId) recruiter.googleId = googleId;
      if (picture && (!recruiter.avatar || !recruiter.avatar.url)) {
        recruiter.avatar = { url: picture, public_id: "" };
      }
      recruiter.lastLogin = new Date();
      await recruiter.save();
    }

    const token = recruiter.generateToken();
    return { user: buildUserPayload(recruiter), token };
  }
}

module.exports = new AuthService();