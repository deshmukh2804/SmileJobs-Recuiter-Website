// backend/src/services/profilePurchase/resumeProxyService.js
// Streams candidate resume from external application-backend THROUGH this backend,
// enforcing entitlement check. External URL is never exposed to the client.

const axios = require("axios");
const mongoose = require("mongoose");

const entitlementService = require("./entitlementService");
const ApiError = require("../../utils/apiError");

const APPLICATION_SERVICE_BASE_URL =
  process.env.APPLICATION_SERVICE_URL ||
  process.env.APPLICATION_BACKEND_URL ||
  "https://smilejobs-application-backend.onrender.com";

let _getApplicationModel = null;
function getApplicationModel() {
  if (!_getApplicationModel) {
    _getApplicationModel = require("../../models/applicationModel");
  }
  if (typeof _getApplicationModel === "function") return _getApplicationModel();
  return _getApplicationModel;
}

class ResumeProxyService {
  /**
   * Streams the resume for `candidateId` (= application _id) to `res`.
   * Caller MUST have already verified recruiter authentication via middleware.
   */
  async streamResume({ recruiterId, candidateId, res, req }) {
    if (!recruiterId) throw new ApiError(401, "Authentication required.");
    if (!candidateId || !mongoose.isValidObjectId(candidateId)) {
      throw new ApiError(400, "Invalid candidate id.");
    }

    // Entitlement check — HARD gate
    const unlocked = await entitlementService.hasEntitlement(
      recruiterId,
      candidateId
    );
    if (!unlocked) {
      throw new ApiError(
        403,
        "You have not unlocked this candidate's resume. Purchase to view."
      );
    }

    // Look up application → get userId (the external resume key)
    const Application = getApplicationModel();
    const application = await Application.findById(candidateId)
      .select("userId resumeFileName candidateName")
      .lean();

    if (!application) {
      throw new ApiError(404, "Application record not found.");
    }
    if (!application.userId) {
      throw new ApiError(404, "Resume unavailable for this candidate.");
    }

    const externalUrl = `${APPLICATION_SERVICE_BASE_URL}/api/profile/resume/view/${application.userId}`;

    let upstream;
    try {
      upstream = await axios.get(externalUrl, {
        responseType: "stream",
        timeout: 30000,
        validateStatus: () => true, // handle non-2xx below
        headers: {
          Accept: "application/pdf,application/octet-stream,*/*",
        },
      });
    } catch (err) {
      console.error(
        "[resumeProxy] Upstream request failed:",
        err?.message || err
      );
      throw new ApiError(502, "Failed to fetch resume from storage service.");
    }

    if (upstream.status >= 400) {
      throw new ApiError(
        upstream.status === 404 ? 404 : 502,
        upstream.status === 404
          ? "Resume file not found."
          : "Resume service returned an error."
      );
    }

    // Mirror safe headers
    const contentType =
      upstream.headers["content-type"] || "application/pdf";
    const contentLength = upstream.headers["content-length"];

    const safeFileName = (
      application.resumeFileName ||
      `${(application.candidateName || "candidate").replace(/[^a-z0-9_-]/gi, "_")}_resume.pdf`
    ).replace(/"/g, "");

    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeFileName}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Handle client disconnect
    req.on("close", () => {
      try {
        upstream.data.destroy();
      } catch (_) {}
    });

    upstream.data.on("error", (err) => {
      console.error("[resumeProxy] Upstream stream error:", err?.message);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: "Resume stream interrupted.",
        });
      } else {
        try {
          res.destroy(err);
        } catch (_) {}
      }
    });

    upstream.data.pipe(res);
  }

  /**
   * Returns the PROXY url (served by this backend) for a given candidate.
   * This is the only URL ever sent to the frontend when a resume is unlocked.
   */
  buildProxyUrl(candidateId) {
    return `/api/v1/profile-purchase/resume/${candidateId}`;
  }
}

module.exports = new ResumeProxyService();