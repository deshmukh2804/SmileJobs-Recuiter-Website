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
// e.g. "https://res.cloudinary.com/xxx/image/upload/v123/jobs/company/gallery/abc.jpg"
//   => "jobs/company/gallery/abc"
const extractPublicIdFromUrl = (urlOrId) => {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  // If it's already a public_id (no http), return as-is
  if (!urlOrId.startsWith("http")) return urlOrId;

  try {
    const afterUpload = urlOrId.split("/upload/")[1];
    if (!afterUpload) return null;

    const segments = afterUpload.split("/");
    // Skip the version segment like "v1698765432"
    const startIdx =
      segments[0].startsWith("v") && /^\d+$/.test(segments[0].slice(1)) ? 1 : 0;

    const pathParts = segments.slice(startIdx);
    const fullPath = pathParts.join("/");

    // Remove file extension
    const lastDot = fullPath.lastIndexOf(".");
    return lastDot > 0 ? fullPath.substring(0, lastDot) : fullPath;
  } catch {
    return null;
  }
};

// Delete file from Cloudinary (FIXED: handles undefined, null, and full URLs)
const deleteFromCloudinary = async (publicIdOrUrl) => {
  const publicId = extractPublicIdFromUrl(publicIdOrUrl);

  if (!publicId) {
    console.warn(
      "⚠️ deleteFromCloudinary: No valid publicId provided — skipping Cloudinary deletion"
    );
    return { result: "skipped", reason: "no_valid_public_id" };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    return result;
  } catch (error) {
    // Log but do NOT throw — prevents blocking DB delete operations
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
  cloudinary,
};