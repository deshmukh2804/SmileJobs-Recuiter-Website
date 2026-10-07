require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI_RECRUITER || process.env.MONGO_URI);
  const indexes = await mongoose.connection.collection("recruiters").indexes();
  console.log("📋 Recruiter Collection Indexes:");
  console.log(JSON.stringify(indexes, null, 2));

  // Check for duplicate null emails/googleIds (common corruption)
  const nullEmails = await mongoose.connection
    .collection("recruiters")
    .countDocuments({ email: null });
  const nullGoogleIds = await mongoose.connection
    .collection("recruiters")
    .countDocuments({ googleId: null });
  const nullPhones = await mongoose.connection
    .collection("recruiters")
    .countDocuments({ phone: null });

  console.log(`\n⚠️ Docs with email: null → ${nullEmails}`);
  console.log(`⚠️ Docs with googleId: null → ${nullGoogleIds}`);
  console.log(`⚠️ Docs with phone: null → ${nullPhones}`);

  // Find your specific phone number
  const yourDoc = await mongoose.connection
    .collection("recruiters")
    .findOne({ phone: { $regex: "5896856586" } });
  console.log("\n🔍 Your phone record:", yourDoc);

  await mongoose.disconnect();
  process.exit(0);
})();