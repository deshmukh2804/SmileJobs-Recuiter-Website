const axios = require('axios');
const entitlementService = require('./entitlementService');
const { getApplicationModel } = require('../../config/db');

const APPLICATION_SERVICE_BASE_URL =
  process.env.APPLICATION_SERVICE_URL || 'https://smilejobs-application-backend.onrender.com';

class ResumeProxyService {
  async streamResume({ recruiterId, candidateId, res, req }) {
    if (!recruiterId || !candidateId) {
      return res.status(400).json({ success: false, message: 'recruiterId and candidateId are required' });
    }

    const Application = getApplicationModel();
    const application = await Application.findById(candidateId).lean();
    if (!application) {
      return res.status(404).json({ success: false, message: 'Candidate application not found' });
    }

    const isOwner = application.recruiterId && application.recruiterId.toString() === recruiterId.toString();
    const isEntitled = await entitlementService.hasEntitlement(recruiterId, candidateId);

    if (!isOwner && !isEntitled) {
      return res.status(403).json({
        success: false,
        code: 'RESUME_LOCKED',
        message: 'You must unlock this candidate profile using 1 credit to access their resume.',
      });
    }

    const candidateUserId = application.applicantId || application.candidateId || application.userId;
    if (!candidateUserId) {
      return res.status(404).json({
        success: false,
        message: 'No applicant profile linked to this candidate',
      });
    }

    const upstreamUrl = `${APPLICATION_SERVICE_BASE_URL}/api/profile/resume/view/${candidateUserId}`;

    try {
      const response = await axios({
        method: 'get',
        url: upstreamUrl,
        responseType: 'stream',
        headers: {
          ...(req?.headers?.authorization ? { Authorization: req.headers.authorization } : {}),
        },
        timeout: 30000,
      });

      if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
      }
      if (response.headers['content-disposition']) {
        res.setHeader('Content-Disposition', response.headers['content-disposition']);
      } else {
        res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      }

      response.data.pipe(res);
    } catch (err) {
      console.error('[ResumeProxy] Upstream resume fetch error:', err.message);
      return res.status(err.response?.status || 502).json({
        success: false,
        message: 'Failed to fetch resume from upstream application service',
        error: err.message,
      });
    }
  }

  buildProxyUrl(candidateId) {
    return `/api/v1/profile-purchase/resume/${candidateId}`;
  }
}

module.exports = new ResumeProxyService();