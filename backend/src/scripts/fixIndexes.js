// backend/src/scripts/fixIndexes.js
const mongoose = require("mongoose");
require("dotenv").config();

const fixRecruiterIndexes = async () => {
  try {
    const RECRUITER_DB_URI = process.env.MONGO_URI_RECRUITER || process.env.MONGO_URI;
    
    if (!RECRUITER_DB_URI) {
      throw new Error("MONGO_URI_RECRUITER or MONGO_URI not set in .env");
    }

    console.log("🔌 Connecting to Recruiter DB...");
    await mongoose.connect(RECRUITER_DB_URI);
    console.log("✅ Connected\n");

    const collection = mongoose.connection.collection("recruiters");

    // ═══ STEP 1: Show current indexes ═══
    console.log("📋 Current indexes:");
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), 
        idx.sparse ? "(sparse)" : "", 
        idx.unique ? "(unique)" : "");
    });
    console.log("");

    // ═══ STEP 2: Drop ALL broken indexes ═══
    const indexesToDrop = ["email_1", "phone_1", "googleId_1"];
    
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped broken index: ${indexName}`);
      } catch (err) {
        if (err.codeName === "IndexNotFound" || err.code === 27) {
          console.log(`ℹ️  Index ${indexName} does not exist (skipping)`);
        } else {
          console.warn(`⚠️  Could not drop ${indexName}:`, err.message);
        }
      }
    }
    console.log("");

    // ═══ STEP 3: Clean up documents with null identifiers ═══
    console.log("🧹 Cleaning documents with null identifiers...");
    const unsetNullEmail = await collection.updateMany(
      { email: null },
      { $unset: { email: "" } }
    );
    console.log(`  ✅ Removed null email from ${unsetNullEmail.modifiedCount} docs`);

    const unsetNullPhone = await collection.updateMany(
      { phone: null },
      { $unset: { phone: "" } }
    );
    console.log(`  ✅ Removed null phone from ${unsetNullPhone.modifiedCount} docs`);

    const unsetNullGoogle = await collection.updateMany(
      { googleId: null },
      { $unset: { googleId: "" } }
    );
    console.log(`  ✅ Removed null googleId from ${unsetNullGoogle.modifiedCount} docs`);

    // Also clean empty strings
    const unsetEmptyEmail = await collection.updateMany(
      { email: "" },
      { $unset: { email: "" } }
    );
    console.log(`  ✅ Removed empty email from ${unsetEmptyEmail.modifiedCount} docs`);

    const unsetEmptyPhone = await collection.updateMany(
      { phone: "" },
      { $unset: { phone: "" } }
    );
    console.log(`  ✅ Removed empty phone from ${unsetEmptyPhone.modifiedCount} docs\n`);

    // ═══ STEP 4: Create NEW sparse unique indexes ═══
    console.log("🔨 Creating new sparse unique indexes...");

    await collection.createIndex(
      { email: 1 },
      { unique: true, sparse: true, name: "email_1" }
    );
    console.log("  ✅ Created email_1 (sparse unique)");

    await collection.createIndex(
      { phone: 1 },
      { unique: true, sparse: true, name: "phone_1" }
    );
    console.log("  ✅ Created phone_1 (sparse unique)");

    await collection.createIndex(
      { googleId: 1 },
      { unique: true, sparse: true, name: "googleId_1" }
    );
    console.log("  ✅ Created googleId_1 (sparse unique)\n");

    // ═══ STEP 5: Verify ═══
    console.log("📋 Final indexes:");
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), 
        idx.sparse ? "(sparse)" : "", 
        idx.unique ? "(unique)" : "");
    });

    console.log("\n✅✅✅ ALL FIXED! You can now sign up without conflicts.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Script failed:", err);
    process.exit(1);
  }
};

fixRecruiterIndexes();