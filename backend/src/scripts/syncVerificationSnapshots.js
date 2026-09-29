require("dotenv").config();
const mongoose = require("mongoose");

const syncSnapshots = async () => {
  try {
    const baseUri = process.env.MONGO_URI;
    const urlParts = baseUri.split("?");
    const pathParts = urlParts[0].split("/");
    if (pathParts.length > 3 && !pathParts[pathParts.length - 1].startsWith("?")) {
      pathParts.pop();
    }
    const rootUri = pathParts.join("/");
    const queryParams = urlParts[1] ? `?${urlParts[1]}` : "";
    const recruiterUri = `${rootUri}/recruiter_db${queryParams}`;

    console.log("🔌 Connecting to recruiter_db...");
    await mongoose.connect(recruiterUri);
    console.log("✅ Connected\n");

    const recruitersCol = mongoose.connection.collection("recruiters");
    const verificationsCol = mongoose.connection.collection("verifications");

    console.log("📋 Fetching all verification documents...");
    const verifications = await verificationsCol.find({}).toArray();
    console.log(`   Found ${verifications.length} verification documents\n`);

    let updated = 0;
    let missing = 0;

    for (const v of verifications) {
      const recruiter = await recruitersCol.findOne({ _id: v.recruiterId });
      if (!recruiter) {
        console.log(`   ⚠️ No recruiter found for verification ${v._id}`);
        missing++;
        continue;
      }

      const p = recruiter.companyProfile || {};

      const updateFields = {
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
      };

      await verificationsCol.updateOne({ _id: v._id }, { $set: updateFields });
      console.log(`   ✅ Synced verification for: ${recruiter.name || recruiter.email || recruiter.phone}`);
      updated++;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Missing recruiters: ${missing}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

syncSnapshots();