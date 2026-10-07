// backend/src/scripts/fixIndexes.js
require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  const mongoURI = process.env.MONGO_URI_RECRUITER || process.env.MONGO_URI || "mongodb://localhost:27017/recruiter_db";
  console.log(`📡 Connecting to MongoDB: ${mongoURI}...`);

  try {
    await mongoose.connect(mongoURI);
    const db = mongoose.connection.db;
    const collection = db.collection("recruiters");

    console.log("🔍 Checking existing indexes on 'recruiters' collection...");
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(idx => idx.name));

    // Drop the old strict email index
    if (indexes.some(idx => idx.name === "email_1")) {
      console.log("🗑️ Dropping old strict unique index 'email_1'...");
      await collection.dropIndex("email_1");
      console.log("✅ Dropped index 'email_1' successfully!");
    }

    // Drop old phone index if exists
    if (indexes.some(idx => idx.name === "phone_1")) {
      console.log("🗑️ Dropping old index 'phone_1'...");
      await collection.dropIndex("phone_1");
    }

    // Drop old googleId index if exists
    if (indexes.some(idx => idx.name === "googleId_1")) {
      console.log("🗑️ Dropping old index 'googleId_1'...");
      await collection.dropIndex("googleId_1");
    }

    console.log("⚡ Creating production-grade sparse unique indexes...");
    
    // Create new sparse unique indexes
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true, background: true });
    await collection.createIndex({ phone: 1 }, { unique: true, sparse: true, background: true });
    await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true, background: true });

    console.log("🎉 Successfully created sparse unique indexes!");
    
    const newIndexes = await collection.indexes();
    console.log("New indexes on database:", JSON.stringify(newIndexes, null, 2));

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
    process.exit(0);
  }
})();