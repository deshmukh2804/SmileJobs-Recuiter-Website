require("dotenv").config();
const { connectDB } = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5002;
let server;

// ═══════════════════════════════════════════════════════
// GLOBAL ERROR HANDLERS (Prevents orphan processes)
// ═══════════════════════════════════════════════════════
process.on("uncaughtException", (err) => {
  console.error("🔥 CRITICAL UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 UNHANDLED REJECTION AT:", promise, "REASON:", reason);
});

// ═══════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN (Required for horizontal scalability)
// ═══════════════════════════════════════════════════════
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log("✅ HTTP Server closed. Releasing resources...");
      try {
        // Disconnect Mongoose pools gracefully
        await mongoose.disconnect();
        console.log("✅ MongoDB connections terminated safely.");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error closing DB during shutdown:", err.message);
        process.exit(1);
      }
    });

    // Force shutdown timeout protection (15 seconds limit)
    setTimeout(() => {
      console.error("⚠️ Graceful shutdown timed out. Forcing termination.");
      process.exit(1);
    }, 15000);
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ═══════════════════════════════════════════════════════
// STARTUP ENGINE
// ═══════════════════════════════════════════════════════
const startServer = async () => {
  try {
    // 1. Establish Database Connection (With production configurations)
    await connectDB();

    // 2. Initialize Cloudinary configs
    connectCloudinary();

    // 3. Start Express Engine listening on all interfaces (0.0.0.0)
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Smile Jobs Recruiter Engine Running!`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Local Access: http://localhost:${PORT}/api/v1\n`);
    });

    // 4. Set network timeouts optimized for multi-tenant heavy loads
    server.timeout = 60000;          // 60 seconds connection timeout
    server.keepAliveTimeout = 65000;  // Keep connections alive past active cycles
    server.headersTimeout = 66000;    // Prevent Slowloris security vulnerabilities

  } catch (err) {
    console.error("❌ Server initialization crashed:", err.message);
    process.exit(1);
  }
};

startServer();