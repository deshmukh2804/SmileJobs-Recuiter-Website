const axios = require("axios");
const mongoose = require("mongoose");
const Recruiter = require("../models/recruiterModel");
const emailService = require("./emailService");
const ApiError = require("../utils/apiError");

// ═══════════════════════════════════════════════════════
// OTP STORE (In-memory with auto-cleanup for production)
// For 1M+ users: replace with Redis (ioredis) in production
// ═══════════════════════════════════════════════════════
const otpStore = new Map();

// Auto-cleanup expired OTPs every 5 minutes to prevent memory leaks
const OTP_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 OTP Store cleanup: removed ${cleaned} expired entries. Active: ${otpStore.size}`);
  }
}, OTP_CLEANUP_INTERVAL_MS).unref(); // .unref() prevents keeping process alive

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const DEMO_PHONE_OTP = "482910";
const MAX_OTP_ATTEMPTS = 5;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const OTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// ═══════════════════════════════════════════════════════
// OTP GENERATION
// ═══════════════════════════════════════════════════════
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const isFakePhoneEmail = (email) => {
  if (!email) return false;
  return String(email).toLowerCase().includes("@phone.verihire.local");
};

const buildUserPayload = (recruiter) => ({
  id: recruiter._id,
  name: recruiter.name || "",
  email: isFakePhoneEmail(recruiter.email) ? "" : (recruiter.email || ""),
  phone: recruiter.phone || "",
  avatar: recruiter.avatar,
  role: recruiter.role || "recruiter",
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
// RAW MONGODB RECRUITER CREATION
// Bypasses Mongoose to avoid null field index collisions
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

  // ✅ Only set fields that have real values (sparse index compatibility)
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
// RECOVERY: Re-fetch recruiter after duplicate key error
// ═══════════════════════════════════════════════════════
const recoverDuplicateRecruiter = async (query, createErr) => {
  // Attempt 1: Re-fetch using original query (concurrent write scenario)
  let recruiter = await Recruiter.findOne(query);
  if (recruiter) {
    console.log(`✅ Recovered via re-fetch (concurrent write): ${recruiter._id}`);
    return recruiter;
  }

  // Attempt 2: Check the specific duplicate field from MongoDB error
  if (createErr.keyPattern && createErr.keyValue) {
    const duplicateField = Object.keys(createErr.keyPattern)[0];
    const duplicateValue = createErr.keyValue[duplicateField];

    if (duplicateField && duplicateValue != null) {
      recruiter = await Recruiter.findOne({ [duplicateField]: duplicateValue });
      if (recruiter) {
        console.log(`✅ Recovered via alt field (${duplicateField}): ${recruiter._id}`);
        return recruiter;
      }
    }
  }

  // Attempt 3: Broad search across all identifiers
  const orConditions = [];
  if (query.phone) orConditions.push({ phone: query.phone });
  if (query.email) orConditions.push({ email: query.email });

  if (orConditions.length > 0) {
    recruiter = await Recruiter.findOne({ $or: orConditions });
    if (recruiter) {
      console.log(`✅ Recovered via broad search: ${recruiter._id}`);
      return recruiter;
    }
  }

  return null;
};

// ═══════════════════════════════════════════════════════
// AUTH SERVICE CLASS
// ═══════════════════════════════════════════════════════
class AuthService {

  // ─────────────────────────────────────────────────────
  // SEND OTP
  // ─────────────────────────────────────────────────────
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
      const storeKey = email.toLowerCase();

      // Rate limiting: max 3 OTPs per 15 minutes per email
      const existingOtps = otpStore.get(storeKey);
      if (existingOtps && existingOtps.attempts >= MAX_OTP_REQUESTS_PER_WINDOW) {
        const timeSinceFirst = Date.now() - existingOtps.firstAttempt;
        if (timeSinceFirst < OTP_RATE_LIMIT_WINDOW_MS) {
          const waitMinutes = Math.ceil((OTP_RATE_LIMIT_WINDOW_MS - timeSinceFirst) / 60000);
          throw new ApiError(
            429,
            `Too many OTP requests. Please wait ${waitMinutes} minute(s) before requesting a new code.`
          );
        }
        // Window expired, reset
        otpStore.delete(storeKey);
      }

      // Send real email via Brevo
      try {
        await emailService.sendOtpEmail({
          to: storeKey,
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

      // Store OTP
      const prevAttempts = existingOtps?.attempts || 0;
      const prevFirst = existingOtps?.firstAttempt || Date.now();
      otpStore.set(storeKey, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: prevAttempts + 1,
        firstAttempt: prevFirst,
      });

      console.log(`\n📧 [EMAIL OTP] Sent to ${storeKey}: ${otp}`);
      return {
        message: "Verification code sent to your email",
        identifier: storeKey,
        method: "email",
      };
    } else {
      // ═══ PHONE OTP: Demo mode ═══
      otp = DEMO_PHONE_OTP;
      const storeKey = phone.trim();

      otpStore.set(storeKey, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0,
        firstAttempt: Date.now(),
      });

      console.log(`\n📨 [PHONE OTP] Sent to ${storeKey}: ${otp}`);
      return {
        message: "OTP dispatched successfully",
        demoOtp: otp,
        identifier: storeKey,
        method: "phone",
      };
    }
  }

  // ─────────────────────────────────────────────────────
  // VERIFY OTP (Production-grade with race condition safety)
  // ─────────────────────────────────────────────────────
  async verifyOtp({ phone, email, otp }) {
    const identifier = phone || email;
    if (!identifier || !otp) {
      throw new ApiError(400, "Identifier and OTP are required");
    }

    const isEmail = !!email;
    const storeKey = isEmail ? email.toLowerCase() : phone.trim();
    const stored = otpStore.get(storeKey);

    // ═══ OTP VALIDATION ═══
    if (isEmail) {
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
          `Invalid verification code. ${
            remaining > 0
              ? `${remaining} attempt(s) remaining.`
              : "Please request a new code."
          }`
        );
      }
    } else {
      // Phone OTP: demo mode (accept 482910 or stored OTP)
      if (otp.trim() !== DEMO_PHONE_OTP && (!stored || stored.otp !== otp.trim())) {
        throw new ApiError(401, "Invalid verification code");
      }
      if (stored && stored.expiresAt < Date.now()) {
        otpStore.delete(storeKey);
        throw new ApiError(401, "OTP expired. Please request a new one.");
      }
    }

    // Clear OTP after successful verification
    otpStore.delete(storeKey);

    // ═══ NORMALIZE IDENTIFIERS ═══
    const normalizedPhone = phone ? phone.trim() : null;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    // ═══ FIND OR CREATE RECRUITER ═══
    const query = normalizedPhone
      ? { phone: normalizedPhone }
      : { email: normalizedEmail };

    let recruiter = await Recruiter.findOne(query).lean(false);
    let isNewUser = false;

    if (!recruiter) {
      // ── NEW USER: Create account ──
      const recruiterData = {
        loginMethod: normalizedPhone ? "phone_otp" : "email_otp",
        name: "",
        companyName: "",
        designation: "",
      };

      if (normalizedPhone) {
        recruiterData.phone = normalizedPhone;
      } else {
        recruiterData.email = normalizedEmail;
      }

      try {
        recruiter = await createRecruiterRaw(recruiterData);
        isNewUser = true;
        console.log(`✨ New recruiter registered via ${recruiter.loginMethod}: ${identifier}`);
      } catch (createErr) {
        // ═══ DUPLICATE KEY RECOVERY (E11000) ═══
        if (createErr.code === 11000) {
          console.warn(
            `⚠️ Duplicate key conflict for ${identifier}.`,
            `KeyPattern:`, createErr.keyPattern,
            `KeyValue:`, createErr.keyValue
          );

          recruiter = await recoverDuplicateRecruiter(query, createErr);

          if (!recruiter) {
            console.error(
              "❌ CRITICAL: Duplicate key but no document found. Index corruption likely.",
              createErr
            );
            throw new ApiError(
              500,
              "Account creation failed due to a database conflict. Please contact support."
            );
          }

          // Attach missing identifier to recovered account
          let needsUpdate = false;
          if (normalizedPhone && !recruiter.phone) {
            recruiter.phone = normalizedPhone;
            needsUpdate = true;
          }
          if (normalizedEmail && !recruiter.email) {
            recruiter.email = normalizedEmail;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await recruiter.save();
          }

          console.log(`✅ Recovered existing recruiter: ${recruiter._id}`);
        } else {
          console.error("❌ Create recruiter failed:", createErr);
          throw new ApiError(500, "Failed to create account. Please try again.");
        }
      }
    }

    // ── EXISTING USER: Self-healing cleanup + update lastLogin ──
    let needsSave = isNewUser ? false : true; // always update lastLogin for existing

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

    if (needsSave) {
      try {
        await recruiter.save();
      } catch (saveErr) {
        // If save fails due to validation, use raw update
        console.warn("⚠️ Mongoose save failed, using raw update:", saveErr.message);
        await mongoose.connection.collection("recruiters").updateOne(
          { _id: recruiter._id },
          { $set: { lastLogin: new Date() } }
        );
      }
    }

    console.log(
      `👋 Recruiter ${isNewUser ? "signed up" : "logged in"}: ${identifier}`
    );

    // ═══ SEND WELCOME EMAIL FOR NEW EMAIL USERS ═══
    if (isNewUser && isEmail) {
      emailService
        .sendWelcomeEmail({
          to: normalizedEmail,
          userName: recruiter.name || normalizedEmail.split("@")[0],
        })
        .catch((err) => {
          console.warn("⚠️ Welcome email failed (non-blocking):", err.message);
        });
    }

    const token = recruiter.generateToken();
    return { user: buildUserPayload(recruiter), token };
  }

  // ─────────────────────────────────────────────────────
  // GOOGLE OAUTH LOGIN
  // ─────────────────────────────────────────────────────
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

    const normalizedEmail = email.trim().toLowerCase();

    let recruiter = await Recruiter.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (!recruiter) {
      try {
        recruiter = await createRecruiterRaw({
          name: name || "",
          email: normalizedEmail,
          googleId,
          avatar: { url: picture || "", public_id: "" },
          loginMethod: "google",
          companyName: "",
          designation: "",
        });
        console.log(`✨ New Google recruiter registered: ${normalizedEmail}`);
      } catch (createErr) {
        if (createErr.code === 11000) {
          console.warn(`⚠️ Google duplicate key for ${normalizedEmail}. Recovering...`);
          recruiter = await recoverDuplicateRecruiter(
            { email: normalizedEmail },
            createErr
          );

          if (!recruiter) {
            recruiter = await Recruiter.findOne({ googleId });
          }

          if (!recruiter) {
            throw new ApiError(
              409,
              "An account with this email already exists. Please use OTP login."
            );
          }
        } else {
          console.error("❌ Google login create failed:", createErr);
          throw new ApiError(500, "Failed to create account.");
        }
      }
    }

    // Self-healing cleanup for existing Google users
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

    try {
      await recruiter.save();
    } catch (saveErr) {
      console.warn("⚠️ Google user save warning:", saveErr.message);
      await mongoose.connection.collection("recruiters").updateOne(
        { _id: recruiter._id },
        { $set: { lastLogin: new Date() } }
      );
    }

    console.log(
      `👋 Google recruiter logged in: ${normalizedEmail}${
        needsSave ? " (auto-cleaned)" : ""
      }`
    );

    const token = recruiter.generateToken();
    return { user: buildUserPayload(recruiter), token };
  }

  // ─────────────────────────────────────────────────────
  // GET CURRENT USER
  // ─────────────────────────────────────────────────────
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
      try {
        await recruiter.save();
        console.log(`🧹 Auto-cleaned legacy data for recruiter: ${recruiter._id}`);
      } catch (err) {
        console.warn("⚠️ Cleanup save warning:", err.message);
      }
    }

    return buildUserPayload(recruiter);
  }

  // ─────────────────────────────────────────────────────
  // UPDATE PROFILE
  // ─────────────────────────────────────────────────────
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

    // ── PHONE UPDATE ──
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
            throw new ApiError(409, "This phone number is already used by another account");
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

    // ── EMAIL UPDATE ──
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
            throw new ApiError(409, "This email is already used by another account");
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