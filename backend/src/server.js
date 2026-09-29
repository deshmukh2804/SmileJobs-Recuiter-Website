require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err.message, err.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("🔥 UNHANDLED REJECTION:", reason);
});

const PORT = process.env.PORT || 5000;

// ✅ AGGRESSIVE index & data cleanup on startup
const autoFixRecruiterCollection = async () => {
  try {
    const collection = mongoose.connection.collection("recruiters");

    console.log("\n🔧 Running recruiter collection health check...");

    // Step 1: Clean up ALL null/empty identifier fields
    const emailCleanup = await collection.updateMany(
      { $or: [{ email: null }, { email: "" }] },
      { $unset: { email: "" } }
    );
    if (emailCleanup.modifiedCount > 0) {
      console.log(`   🧹 Cleaned ${emailCleanup.modifiedCount} docs with null/empty email`);
    }

    const phoneCleanup = await collection.updateMany(
      { $or: [{ phone: null }, { phone: "" }] },
      { $unset: { phone: "" } }
    );
    if (phoneCleanup.modifiedCount > 0) {
      console.log(`   🧹 Cleaned ${phoneCleanup.modifiedCount} docs with null/empty phone`);
    }

    const googleIdCleanup = await collection.updateMany(
      { $or: [{ googleId: null }, { googleId: "" }] },
      { $unset: { googleId: "" } }
    );
    if (googleIdCleanup.modifiedCount > 0) {
      console.log(`   🧹 Cleaned ${googleIdCleanup.modifiedCount} docs with null/empty googleId`);
    }

    // Step 2: Get all current indexes
    const indexes = await collection.indexes();

    // Step 3: Drop ALL non-_id indexes if they don't have partialFilter
    for (const idx of indexes) {
      if (idx.name === "_id_") continue;

      // If it's a partial index for our fields, keep it
      if (
        (idx.name === "email_1_partial" ||
          idx.name === "phone_1_partial" ||
          idx.name === "googleId_1_partial") &&
        idx.partialFilterExpression
      ) {
        continue;
      }

      // Otherwise, drop it
      try {
        await collection.dropIndex(idx.name);
        console.log(`   🗑️ Dropped old index: ${idx.name}`);
      } catch (e) {}
    }

    // Step 4: Create partial indexes (safe to run multiple times)
    const currentIndexes = await collection.indexes();
    const indexNames = currentIndexes.map((i) => i.name);

    if (!indexNames.includes("email_1_partial")) {
      await collection.createIndex(
        { email: 1 },
        {
          unique: true,
          partialFilterExpression: { email: { $type: "string" } },
          name: "email_1_partial",
        }
      );
      console.log("   ✅ Created email_1_partial index");
    }

    if (!indexNames.includes("phone_1_partial")) {
      await collection.createIndex(
        { phone: 1 },
        {
          unique: true,
          partialFilterExpression: { phone: { $type: "string" } },
          name: "phone_1_partial",
        }
      );
      console.log("   ✅ Created phone_1_partial index");
    }

    if (!indexNames.includes("googleId_1_partial")) {
      await collection.createIndex(
        { googleId: 1 },
        {
          unique: true,
          partialFilterExpression: { googleId: { $type: "string" } },
          name: "googleId_1_partial",
        }
      );
      console.log("   ✅ Created googleId_1_partial index");
    }

    console.log("✅ Recruiter collection is healthy\n");
  } catch (err) {
    console.error("⚠️ Auto-fix failed (non-fatal):", err.message);
  }
};

// ✅ Auto-sync verification snapshots
const autoSyncVerifications = async () => {
  try {
    const recruitersCol = mongoose.connection.collection("recruiters");
    const verificationsCol = mongoose.connection.collection("verifications");

    const staleVerifications = await verificationsCol
      .find({
        $or: [
          { companyName: { $in: ["", null] } },
          { recruiterName: { $in: ["", null] } },
          { "companySnapshot.name": { $in: ["", null] } },
        ],
      })
      .toArray();

    if (staleVerifications.length === 0) {
      console.log("✅ Verification snapshots are synced");
      return;
    }

    console.log(`\n🔧 Auto-syncing ${staleVerifications.length} verification snapshot(s)...`);

    let synced = 0;
    for (const v of staleVerifications) {
      const recruiter = await recruitersCol.findOne({ _id: v.recruiterId });
      if (!recruiter) continue;

      const p = recruiter.companyProfile || {};
      await verificationsCol.updateOne(
        { _id: v._id },
        {
          $set: {
            recruiterName: recruiter.name || "",
            recruiterEmail: recruiter.email || "",
            recruiterPhone: recruiter.phone || "",
            companyName: recruiter.companyName || p.name || "",
            companySnapshot: {
              name: p.name || "",
              industry: p.industry || "",
              website: p.website || "",
              about: p.about || "",
              city: p.city || "",
              state: p.state || "",
              country: p.country || "",
              registrationNumber: p.registrationNumber || "",
              gstNumber: p.gstNumber || "",
              panNumber: p.panNumber || "",
              logoUrl: p.logo?.url || "",
              contactEmail: p.contactEmail || "",
              contactPhone: p.contactPhone || "",
              contactPersonName: p.contactPerson?.name || "",
              contactPersonDesignation: p.contactPerson?.designation || "",
              organizationSize: p.organizationSize || p.teamSize || "",
              establishedYear: p.establishedYear || null,
            },
          },
        }
      );
      synced++;
    }

    console.log(`✅ Auto-synced ${synced} verification snapshot(s)`);
  } catch (err) {
    console.error("⚠️ Auto-sync verifications failed:", err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    connectCloudinary();

    // Run auto-fixes AFTER DB connection
    await autoFixRecruiterCollection();
    await autoSyncVerifications();

    app.listen(PORT, () => {
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