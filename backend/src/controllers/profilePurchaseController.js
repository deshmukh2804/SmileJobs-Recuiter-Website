const profilePurchaseService = require('../services/profilePurchase/profilePurchaseService');

class ProfilePurchaseController {
  async getPricing(req, res, next) {
    try {
      const pricing = await profilePurchaseService.getActivePricing();
      res.status(200).json({ success: true, data: pricing });
    } catch (error) {
      next(error);
    }
  }

  async getQuote(req, res, next) {
    try {
      const { quantity } = req.query;
      const quote = await profilePurchaseService.getQuote(quantity);
      res.status(200).json({ success: true, data: quote });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { quantity } = req.body;
      const order = await profilePurchaseService.createOrder(recruiterId, quantity);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const result = await profilePurchaseService.verifyPayment(recruiterId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCredits(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const credits = await profilePurchaseService.getRecruiterCredits(recruiterId);
      res.status(200).json({ success: true, data: credits });
    } catch (error) {
      next(error);
    }
  }

  async unlockCandidate(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { candidateId } = req.body;
      const result = await profilePurchaseService.unlockCandidate(recruiterId, candidateId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getUnlockedIds(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const recruiterEmail = req.user.email || '';
      const entitlements = await profilePurchaseService.getUnlockedProfilesWithAutoReveal(recruiterId, recruiterEmail);
      const ids = (entitlements.profiles || []).map((p) => p.candidateId);
      res.status(200).json({ success: true, data: ids });
    } catch (error) {
      next(error);
    }
  }

  async getUnlockedProfiles(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const recruiterEmail = req.user.email || '';
      console.log(`[ProfilePurchaseController] getUnlockedProfiles called for ${recruiterId} (email: ${recruiterEmail})`);
      const result = await profilePurchaseService.getUnlockedProfilesWithAutoReveal(recruiterId, recruiterEmail);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[ProfilePurchaseController] getUnlockedProfiles error:', error);
      next(error);
    }
  }

  async getPurchases(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const purchases = await profilePurchaseService.getPurchases(recruiterId);
      res.status(200).json({ success: true, data: purchases });
    } catch (error) {
      next(error);
    }
  }

  async downloadResume(req, res, next) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { candidateId } = req.params;
      const result = await profilePurchaseService.unlockCandidate(recruiterId, candidateId);
      res.status(200).json({ success: true, data: { message: 'Resume access granted', candidateId } });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new ProfilePurchaseController();

module.exports = {
  getPricing: controller.getPricing.bind(controller),
  getQuote: controller.getQuote.bind(controller),
  createOrder: controller.createOrder.bind(controller),
  verifyPayment: controller.verifyPayment.bind(controller),
  getCredits: controller.getCredits.bind(controller),
  unlockCandidate: controller.unlockCandidate.bind(controller),
  getUnlockedIds: controller.getUnlockedIds.bind(controller),
  getUnlockedCandidateIds: controller.getUnlockedIds.bind(controller), // Alias to prevent any naming crashes
  getUnlockedProfiles: controller.getUnlockedProfiles.bind(controller),
  getPurchases: controller.getPurchases.bind(controller),
  downloadResume: controller.downloadResume.bind(controller),
};