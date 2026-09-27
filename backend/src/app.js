const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes"); // NEW

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Verihire Recruiter Engine API running...",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/candidates", candidateRoutes); // NEW

app.use(notFound);
app.use(errorHandler);

module.exports = app;