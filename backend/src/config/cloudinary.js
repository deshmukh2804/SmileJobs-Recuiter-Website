const cloudinary = require("cloudinary").v2;

const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log("✅ Cloudinary Connected");
};

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = "uploads") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
    };
  } catch (error) {
    throw new Error(`Cloudinary Upload Error: ${error.message}`);
  }
};

// ─── Helper: Extract public_id from a full Cloudinary URL ───
const extractPublicIdFromUrl = (urlOrId) => {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  // If it's already a public_id (no http prefix), return as-is
  if (!urlOrId.startsWith("http")) return urlOrId;

  try {
    const parts = urlOrId.split("/upload/");
    if (parts.length < 2) return null;

    // Remove any dynamic version segments (e.g. "v1790660232/")
    const cleanPath = parts[1].replace(/^v\d+\//, "");

    // Strip out the file extension
    const lastDotIndex = cleanPath.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return cleanPath.substring(0, lastDotIndex);
    }
    return cleanPath;
  } catch (error) {
    return null;
  }
};

// Delete file from Cloudinary (SAFE-GUARDED: prevents deleting shared logos or throwing on missing assets)
const deleteFromCloudinary = async (publicIdOrUrl, JobModel = null, currentJobId = null) => {
  const publicId = extractPublicIdFromUrl(publicIdOrUrl);

  if (!publicId) {
    console.warn(
      "⚠️ deleteFromCloudinary: No valid publicId provided — skipping Cloudinary deletion"
    );
    return { result: "skipped", reason: "no_valid_public_id" };
  }

  try {
    // If JobModel is passed, check if any other job is still using this asset
    if (JobModel) {
      const query = {
        $or: [
          { "companyLogo.publicId": publicId },
          { "companyImages.publicId": publicId },
        ],
      };

      if (currentJobId) {
        query._id = { $ne: currentJobId };
      }

      const stillUsedCount = await JobModel.countDocuments(query);

      if (stillUsedCount > 0) {
        console.log(`ℹ️ Asset [${publicId}] is shared by other jobs. Skipping physical deletion.`);
        return { result: "skipped", reason: "shared_asset_in_use" };
      }
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    // Handle Cloudinary 404 responses gracefully instead of causing API errors
    if (result && result.result === "not found") {
      console.log(`ℹ️ Asset [${publicId}] is not present on Cloudinary server (already deleted). Skipping.`);
      return { result: "skipped", reason: "not_found" };
    }

    console.log(`✅ Asset [${publicId}] successfully deleted from Cloudinary.`);
    return result;
  } catch (error) {
    // Log error but do NOT throw — prevents blocking database deletions
    console.error(
      `❌ Cloudinary Delete Error for [${publicId}]:`,
      error.message
    );
    return { result: "error", error: error.message };
  }
};

module.exports = {
  connectCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  cloudinary,
};