require("dotenv").config();
const { connectDB } = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");
const app = require("./app");

// Global Process Error Handlers
process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err.message, err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("🔥 UNHANDLED REJECTION:", reason);
});

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Cloudinary
    connectCloudinary();

    // 3. Start Express Server (Listen on 0.0.0.0 for public access)
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Env: ${process.env.NODE_ENV || "development"}`);
      console.log(`   API Endpoint: http://localhost:${PORT}/api/v1\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();