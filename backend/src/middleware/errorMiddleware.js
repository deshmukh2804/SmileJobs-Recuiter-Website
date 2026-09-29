const ApiError = require("../utils/apiError");

const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ✅ CRITICAL: Log full error details in dev for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("\n═══ ERROR HANDLER ═══");
    console.error("URL:", req.method, req.originalUrl);
    console.error("Status:", statusCode);
    console.error("Message:", message);
    console.error("Error Name:", err.name);
    console.error("Error Code:", err.code);
    if (err.keyValue) console.error("Duplicate Key:", err.keyValue);
    if (err.errors) console.error("Validation Errors:", err.errors);
    console.error("Stack:", err.stack);
    console.error("═══════════════════════\n");
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Resource not found. Invalid ID.";
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    
    if (value === null || value === "" || value === undefined) {
      message = `Database index conflict on ${field}. Please run: node src/scripts/fixRecruiterIndexes.js`;
    } else {
      message = `This ${field} is already registered. Please use a different one.`;
    }
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };