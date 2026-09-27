const jwt = require("jsonwebtoken");
const Recruiter = require("../models/recruiterModel");
const ApiError = require("../utils/apiError");

const JWT_SECRET = process.env.JWT_SECRET || "verihire_recruiter_jwt_secret_key_2026";

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token || token === "null" || token === "undefined") {
      console.warn("🔒 [AuthGuard] Request blocked: No token in Authorization header");
      throw new ApiError(401, "Not authorized, no token provided. Please log in.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      console.warn("🔒 [AuthGuard] JWT Verify failed:", jwtErr.message);
      throw new ApiError(401, "Session expired or invalid token signature. Please log in again.");
    }

    const account = await Recruiter.findById(decoded.id);

    if (!account) {
      console.warn(`🔒 [AuthGuard] Recruiter with ID ${decoded.id} not found in DB`);
      throw new ApiError(401, "Not authorized, recruiter account not found");
    }

    req.user = account;
    req.userRole = decoded.role || "recruiter";
    next();
  } catch (error) {
    next(error);
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else next(new ApiError(403, "Not authorized as admin"));
};

const recruiterOnly = (req, res, next) => {
  if (req.userRole === "recruiter") next();
  else next(new ApiError(403, "Recruiter access only"));
};

const requireVerified = (req, res, next) => {
  if (req.userRole !== "recruiter") {
    return next(new ApiError(403, "Recruiter access required"));
  }
  if (!req.user.isVerified || req.user.verificationStatus !== "approved") {
    return next(
      new ApiError(
        403,
        "Your company must be verified before performing this action. Please complete company verification."
      )
    );
  }
  next();
};

module.exports = { protect, admin, recruiterOnly, requireVerified };