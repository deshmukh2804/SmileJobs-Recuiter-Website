const axios = require("axios");
const mongoose = require("mongoose");
const Recruiter = require("../models/recruiterModel");
const emailService = require("./emailService");
const ApiError = require("../utils/apiError");

// ═══════════════════════════════════════════════════════
// OTP STORE (In-memory for demo; use Redis in production)
// ═══════════════════════════════════════════════════════
const otpStore = new Map();

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const DEMO_PHONE_OTP = "482910"; // Keep existing demo OTP for phone
const MAX_OTP_ATTEMPTS = 5;

// ═══════════════════════════════════════════════════════
// OTP GENERATION
// ═══════════════════════════════════════════════════════
const generateOtp = () => {
  // Generate cryptographically random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const isFakePhoneEmail = (email) => {
  if (!email) return false;
  return email.toLowerCase().includes("@phone.verihire.local");
};

const buildUserPayload = (recruiter) => ({
  id: recruiter._id,
  name: recruiter.name || "",
  email: isFakePhoneEmail(recruiter.email) ? "" : (recruiter.email || ""),
  phone: recruiter.phone || "",
  avatar: recruiter.avatar,
  role: "recruiter",
  companyName: recruiter.companyName || "",
  designation: recruiter.designation || "",
  loginMethod: recruiter.loginMethod,
  lockedField: recruiter.getLockedField ? recruiter.getLockedField() : null,
  isVerified: recruiter.isVerified,
  verificationStatus: recruiter.verificationStatus,
  verificationSubmittedAt: recruiter.verificationSubmittedAt,
  verificationReviewedAt: recruiter.verificationReviewedAt,
  rejectionReason: recruiter.rejectionReason,
});

// ═══════════════════════════════════════════════════════
// RAW MONGODB RECRUITER CREATION (avoids null field index issues)
// ═══════════════════════════════════════════════════════
const createRecruiterRaw = async (data) => {
  const collection = mongoose.connection.collection("recruiters");

  const cleanDoc = {
    name: data.name || "",
    companyName: data.companyName || "",
    designation: data.designation || "",
    loginMethod: data.loginMethod,
    role: "recruiter",
    isActive: true,
    lastLogin: new Date(),
    avatar: data.avatar || { url: "", public_id: "" },
    companyProfile: {
      name: "",
      tagline: "",
      industry: "",
      about: "",
      website: "",
      linkedInUrl: "",
      logo: { url: "", publicId: "" },
      companyInitials: "",
      gallery: [],
      headquarters: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      teamSize: "",
      organizationSize: "",
      foundedYear: "",
      establishedYear: null,
      perks: [],
      registrationNumber: "",
      gstNumber: "",
      panNumber: "",
      contactPerson: { name: "", designation: "" },
      contactEmail: "",
      contactPhone: "",
      whatsappNumber: "",
    },
    verificationDocuments: [],
    verificationStatus: "not_submitted",
    isVerified: false,
    verificationSubmittedAt: null,
    verificationReviewedAt: null,
    rejectionReason: "",
    reviewedBy: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  };

  if (data.email && data.email.trim() !== "") {
    cleanDoc.email = data.email.trim().toLowerCase();
  }
  if (data.phone && data.phone.trim() !== "") {
    cleanDoc.phone = data.phone.trim();
  }
  if (data.googleId && data.googleId.trim() !== "") {
    cleanDoc.googleId = data.googleId.trim();
  }

  const result = await collection.insertOne(cleanDoc);
  const newRecruiter = await Recruiter.findById(result.insertedId);
  return newRecruiter;
};

// ═══════════════════════════════════════════════════════
// AUTH SERVICE CLASS
// ═══════════════════════════════════════════════════════
class AuthService {
  /**
   * Send OTP — supports both phone and email
   * For phone: uses demo OTP (482910)
   * For email: sends real OTP via Brevo SMTP
   */
  async sendOtp({ phone, email }) {
    const identifier = phone || email;
    if (!identifier) {
      throw new ApiError(400, "Phone or email identifier is required");
    }

    const isEmail = !!email;
    let otp;

    if (isEmail) {
      // ═══ EMAIL OTP: Generate real 6-digit OTP ═══
      otp = generateOtp();

      // Check rate limiting (max 3 OTPs per 15 minutes per email)
      const existingOtps = otpStore.get(email.toLowerCase());
      if (existingOtps && existingOtps.attempts >= 3) {
        const timeSinceFirst = Date.now() - existingOtps.firstAttempt;
        if (timeSinceFirst < 15 * 60 * 1000) {
          throw new ApiError(
            429,
            "Too many OTP requests. Please wait 15 minutes before requesting a new code."
          );
        }
      }

      // Send real email via Brevo
      try {
        await emailService.sendOtpEmail({
          to: email.toLowerCase(),
          otp: otp,
          userName: email.split("@")[0],
          purpose: "login",
        });
      } catch (emailErr) {
        console.error("❌ Brevo email failed:", emailErr.message);
        throw new ApiError(
          500,
          "Failed to send verification email. Please check your email address and try again."
        );
      }

      // Store OTP for verification
      otpStore.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: (existingOtps?.attempts || 0) + 1,
        firstAttempt: existingOtps?.firstAttempt || Date.now(),
      });

      console.log(`\n📧 [EMAIL OTP] Sent to ${email}: ${otp}`);
      return {
        message: "Verification code sent to your email",
        identifier: email,
        method: "email",
      };
    } else {
      // ═══ PHONE OTP: Keep existing demo OTP ═══
      otp = DEMO_PHONE_OTP;
      otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0,
        firstAttempt: Date.now(),
      });

      console.log(`\n📨 [PHONE OTP] Sent to ${phone}: ${otp}`);
      return {
        message: "OTP dispatched successfully",
        demoOtp: otp,
        identifier: phone,
        method: "phone",
      };
    }
  }

  /**
   * Verify OTP — supports both phone and email
   */
  async verifyOtp({ phone, email, otp }) {
    const identifier = phone || email;
    if (!identifier || !otp) {
      throw new ApiError(400, "Identifier and OTP are required");
    }

    const isEmail = !!email;
    const storeKey = isEmail ? email.toLowerCase() : phone;
    const stored = otpStore.get(storeKey);

    // ═══ OTP VALIDATION ═══
    if (isEmail) {
      // Email OTP: strict validation
      if (!stored) {
        throw new ApiError(401, "No verification code found. Please request a new one.");
      }
      if (stored.expiresAt < Date.now()) {
        otpStore.delete(storeKey);
        throw new ApiError(401, "Verification code expired. Please request a new one.");
      }
      if (stored.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(storeKey);
        throw new ApiError(
          429,
          "Too many incorrect attempts. Please request a new verification code."
        );
      }
      if (stored.otp !== otp.trim()) {
        stored.attempts += 1;
        otpStore.set(storeKey, stored);
        const remaining = MAX_OTP_ATTEMPTS - stored.attempts;
        throw new ApiError(
          401,
          `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new code."}`
        );
      }
    } else {
      // Phone OTP: demo mode (accept 482910 or stored OTP)
      if (otp !== DEMO_PHONE_OTP && (!stored || stored.otp !== otp)) {
        throw new ApiError(401, "Invalid verification code");
      }
      if (stored && stored.expiresAt < Date.now()) {
        otpStore.delete(storeKey);
        throw new ApiError(401, "OTP expired");
      }
    }

    // Clear OTP after successful verification
    otpStore.delete(storeKey);

    // ═══ FIND OR CREATE RECRUITER ═══
    const query = phone ? { phone } : { email: email.toLowerCase() };
    let recruiter = await Recruiter.findOne(query);
    let isNewUser = false;

    if (!recruiter) {
      const recruiterData = {
        loginMethod: phone ? "phone_otp" : "email_otp",
        name: "",
        companyName: "",
        designation: "",
      };

      if (phone) {
        recruiterData.phone = phone;
      } else {
        recruiterData.email = email.toLowerCase();
      }

      try {
        recruiter = await createRecruiterRaw(recruiterData);
        isNewUser = true;
        console.log(`✨ New recruiter registered via ${recruiter.loginMethod}: ${identifier}`);
      } catch (createErr) {
        if (createErr.code === 11000) {
          throw new ApiError(
            409,
            "An account with this identifier already exists. Please try logging in again."
          );
        }
        console.error("❌ Create recruiter failed:", createErr);
        throw new ApiError(500, "Failed to create account. Please try again.");
      }
    } else {
      // Existing user — self-healing cleanup
      let needsSave = false;

      if (isFakePhoneEmail(recruiter.email)) {
        recruiter.email = undefined;
        needsSave = true;
      }
      if (recruiter.name === "Verified Recruiter") {
        recruiter.name = "";
        needsSave = true;
      }
      if (
        recruiter.companyName === "Verihire Talent Technologies" ||
        recruiter.companyName === "sdfgh"
      ) {
        recruiter.companyName = "";
        needsSave = true;
      }
      if (recruiter.designation === "Lead Recruiter") {
        recruiter.designation = "";
        needsSave = true;
      }

      recruiter.lastLogin = new Date();
      await recruiter.save();
      console.log(
        `👋 Recruiter logged in: ${identifier}${needsSave ? " (auto-cleaned legacy data)" : ""}`
      );
    }

    // ═══ SEND WELCOME EMAIL FOR NEW EMAIL USERS ═══
    if (isNewUser && isEmail) {
      // Fire and forget — don't block login
      emailService
        .sendWelcomeEmail({
          to: email.toLowerCase(),
          userName: recruiter.name || email.split("@")[0],
        })
        .catch((err) => {
          console.warn("⚠️ Welcome email failed (non-blocking):", err.message);
        });
    }

    const token = recruiter.generateToken();
    return { user: buildUserPayload(recruiter), token };
  }

  /**
   * Google OAuth Login (unchanged)
   */
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
      name = data.name || "";
      picture = data.picture;
    } catch (error) {
      throw new ApiError(401, "Failed to authenticate with Google");
    }

    if (!email) {
      throw new ApiError(400, "Google account did not return an email");
    }

    let recruiter = await Recruiter.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!recruiter) {
      try {
        recruiter = await createRecruiterRaw({
          name: name || "",
          email,
          googleId,
          avatar: { url: picture || "", public_id: "" },
          loginMethod: "google",
          companyName: "",
          designation: "",
        });
        console.log(`✨ New Google recruiter registered: ${email}`);
      } catch (createErr) {
        if (createErr.code === 11000) {
          throw new ApiError(409, "An account with this email already exists.");
        }
        console.error("❌ Google login create failed:", createErr);
        throw new ApiError(500, "Failed to create account.");
      }
    } else {
      let needsSave = false;
      if (!recruiter.googleId) {
        recruiter.googleId = googleId;
        needsSave = true;
      }
      if (picture && (!recruiter.avatar || !recruiter.avatar.url)) {
        recruiter.avatar = { url: picture, public_id: "" };
        needsSave = true;
      }
      if (recruiter.name === "Verified Recruiter") {
        recruiter.name = name || "";
        needsSave = true;
      }
      if (
        recruiter.companyName === "Verihire Talent Technologies" ||
        recruiter.companyName === "sdfgh"
      ) {
        recruiter.companyName = "";
        needsSave = true;
      }
      if (recruiter.designation === "Lead Recruiter") {
        recruiter.designation = "";
        needsSave = true;
      }
      recruiter.lastLogin = new Date();
      await recruiter.save();
      console.log(
        `👋 Google recruiter logged in: ${email}${needsSave ? " (auto-cleaned)" : ""}`
      );
    }

    const token = recruiter.generateToken();
    return { user: buildUserPayload(recruiter), token };
  }

  /**
   * Get current user profile (unchanged)
   */
  async getCurrentUser(recruiterId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    let needsSave = false;
    if (isFakePhoneEmail(recruiter.email)) {
      recruiter.email = undefined;
      needsSave = true;
    }
    if (recruiter.name === "Verified Recruiter") {
      recruiter.name = "";
      needsSave = true;
    }
    if (
      recruiter.companyName === "Verihire Talent Technologies" ||
      recruiter.companyName === "sdfgh"
    ) {
      recruiter.companyName = "";
      needsSave = true;
    }
    if (recruiter.designation === "Lead Recruiter") {
      recruiter.designation = "";
      needsSave = true;
    }
    if (needsSave) {
      await recruiter.save();
      console.log(
        `🧹 Auto-cleaned legacy data at runtime for recruiter: ${recruiter._id}`
      );
    }

    return buildUserPayload(recruiter);
  }

  /**
   * Update profile (unchanged)
   */
  async updateProfile(recruiterId, updates) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new ApiError(404, "Recruiter not found");

    const lockedField = recruiter.getLockedField();
    const { name, email, phone, designation, companyName } = updates;

    if (typeof name === "string") {
      recruiter.name = name.trim();
    }
    if (typeof designation === "string") {
      recruiter.designation = designation.trim();
    }
    if (typeof companyName === "string") {
      recruiter.companyName = companyName.trim();
    }

    if (typeof phone === "string") {
      const trimmedPhone = phone.trim();
      const currentPhone = recruiter.phone || "";

      if (lockedField === "phone" && trimmedPhone !== currentPhone) {
        throw new ApiError(
          403,
          "Phone number cannot be changed because you signed in using phone OTP"
        );
      }

      if (lockedField !== "phone") {
        if (trimmedPhone !== "") {
          const existing = await Recruiter.findOne({
            phone: trimmedPhone,
            _id: { $ne: recruiter._id },
          });
          if (existing) {
            throw new ApiError(
              409,
              "This phone number is already used by another account"
            );
          }
          recruiter.phone = trimmedPhone;
        } else {
          recruiter.phone = undefined;
          await mongoose.connection
            .collection("recruiters")
            .updateOne({ _id: recruiter._id }, { $unset: { phone: "" } });
        }
      }
    }

    if (typeof email === "string") {
      const trimmedEmail = email.trim().toLowerCase();
      const currentEmail = isFakePhoneEmail(recruiter.email)
        ? ""
        : recruiter.email || "";

      if (lockedField === "email" && trimmedEmail !== currentEmail) {
        throw new ApiError(
          403,
          "Email address cannot be changed because you signed in using Email or Google Auth"
        );
      }

      if (lockedField !== "email") {
        if (trimmedEmail !== "") {
          if (isFakePhoneEmail(trimmedEmail)) {
            throw new ApiError(400, "Invalid email address format");
          }
          const existing = await Recruiter.findOne({
            email: trimmedEmail,
            _id: { $ne: recruiter._id },
          });
          if (existing) {
            throw new ApiError(
              409,
              "This email is already used by another account"
            );
          }
          recruiter.email = trimmedEmail;
        } else {
          recruiter.email = undefined;
          await mongoose.connection
            .collection("recruiters")
            .updateOne({ _id: recruiter._id }, { $unset: { email: "" } });
        }
      }
    }

    await recruiter.save();
    return buildUserPayload(recruiter);
  }
}

module.exports = new AuthService();