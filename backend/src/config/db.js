const mongoose = require("mongoose");

let jobsConnection = null;
let applicationsConnection = null;
let adminConnection = null;

const connectDB = async () => {
  try {
    const baseUri = process.env.MONGO_URI;
    if (!baseUri) throw new Error("MONGO_URI is not defined in .env");

    const urlParts = baseUri.split("?");
    const pathParts = urlParts[0].split("/");

    if (pathParts.length > 3 && !pathParts[pathParts.length - 1].startsWith("?")) {
      pathParts.pop();
    }

    const rootUri = pathParts.join("/");
    const queryParams = urlParts[1] ? `?${urlParts[1]}` : "";

    const recruiterUri = `${rootUri}/recruiter_db${queryParams}`;
    const jobsUri = `${rootUri}/Job_db${queryParams}`;
    const applicationsUri = `${rootUri}/application_db${queryParams}`;
    const adminUri = `${rootUri}/careerflow_admin${queryParams}`;

    await mongoose.connect(recruiterUri);
    console.log(`✅ Recruiter DB Connected: recruiter_db`);

    jobsConnection = await mongoose.createConnection(jobsUri).asPromise();
    console.log(`✅ Jobs DB Connected: Job_db`);

    applicationsConnection = await mongoose.createConnection(applicationsUri).asPromise();
    console.log(`✅ Applications DB Connected: application_db`);

    adminConnection = await mongoose.createConnection(adminUri).asPromise();
    console.log(`✅ Admin DB Connected: careerflow_admin`);

    return { jobsConnection, applicationsConnection, adminConnection };
  } catch (err) {
    console.error(`❌ DB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

const getJobsConnection = () => {
  if (!jobsConnection) throw new Error("Jobs DB (Job_db) not initialized");
  return jobsConnection;
};

const getApplicationsConnection = () => {
  if (!applicationsConnection) throw new Error("Applications DB (application_db) not initialized");
  return applicationsConnection;
};

const getAdminConnection = () => {
  if (!adminConnection) throw new Error("Admin DB (careerflow_admin) not initialized");
  return adminConnection;
};

module.exports = {
  connectDB,
  getJobsConnection,
  getApplicationsConnection,
  getAdminConnection,
};