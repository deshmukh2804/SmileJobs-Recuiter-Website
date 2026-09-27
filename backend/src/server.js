require("dotenv").config();
const { connectDB } = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  connectCloudinary();

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   Env: ${process.env.NODE_ENV || "development"}\n`);
  });
};

startServer();