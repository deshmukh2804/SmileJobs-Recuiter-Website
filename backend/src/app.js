const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentWebhookRoutes = require("./routes/paymentWebhookRoutes");

const app = express();

// Trust reverse proxies (Nginx / DigitalOcean)
app.set("trust proxy", 1);

// ═══ Allowed Origins Configuration ═══
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
  "https://smilejobs.in",
  "https://www.smilejobs.in",
  "https://recruiter.smilejobs.in",
  "https://admin.smilejobs.in",
];

// Add any custom CLIENT_URL from .env
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(",").forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

// ═══ CORS Middleware ═══
app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow non-browser requests (Postman, mobile, curl)
      if (!origin) return callback(null, true);

      // 2. Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // 3. Allow all Vercel preview & production deployments (*.vercel.app)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Fallback: log warning and permit in development/testing
      console.warn(`[CORS] Request from unknown origin: ${origin}`);
      callback(null, true);
    },
    credentials: true, // Required for cookies and authorization headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "x-access-token",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

// ═══ CRITICAL: Webhook routes registered BEFORE express.json() ═══
// Razorpay webhook signature verification requires raw body
app.use("/api/v1/payments", paymentWebhookRoutes);

// ═══ Standard Body & Cookie Parsers ═══
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ═══ Root & Health Check Routes ═══
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Smile Jobs Recruiter Engine API is running smoothly!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smile Jobs Recruiter API v1",
    status: "healthy",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ═══ API Routes ═══
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes); // Alias for safety

// ═══ Error Handling Middleware ═══
app.use(notFound);
app.use(errorHandler);

module.exports = app;