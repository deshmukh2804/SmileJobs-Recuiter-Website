const pricingService = require('../services/profilePurchase/pricingService');
const profilePurchaseService = require('../services/profilePurchase/profilePurchaseService');
const entitlementService = require('../services/profilePurchase/entitlementService');
const resumeProxyService = require('../services/profilePurchase/resumeProxyService');

class ProfilePurchaseController {
  async getPricing(req, res) {
    try {
      const pricing = await pricingService.getActivePricing();
      return res.status(200).json({ success: true, data: pricing });
    } catch (err) {
      console.error('[ProfilePurchase] getPricing error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch active profile pricing', error: err.message });
    }
  }

  async getQuote(req, res) {
    try {
      const quantity = parseInt(req.query.quantity || '1', 10);
      const quote = await pricingService.quote(quantity);
      return res.status(200).json({ success: true, data: quote });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async createOrder(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { quantity } = req.body;
      if (!quantity || parseInt(quantity, 10) <= 0) {
        return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
      }
      const orderData = await profilePurchaseService.createPurchaseOrder({
        recruiterId,
        quantity: parseInt(quantity, 10),
      });
      return res.status(201).json({ success: true, data: orderData });
    } catch (err) {
      console.error('[ProfilePurchase] createOrder error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async verifyPayment(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ success: false, message: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required' });
      }
      const result = await profilePurchaseService.verifyAndCapturePayment({
        recruiterId, razorpayOrderId, razorpayPaymentId, razorpaySignature,
      });
      return res.status(200).json({ success: true, message: 'Payment verified successfully. Credits granted.', data: result });
    } catch (err) {
      console.error('[ProfilePurchase] verifyPayment error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getCredits(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const credits = await profilePurchaseService.getRecruiterCredits(recruiterId);
      return res.status(200).json({ success: true, data: credits });
    } catch (err) {
      console.error('[ProfilePurchase] getCredits error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch recruiter credits', error: err.message });
    }
  }

  async unlockCandidate(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { candidateId } = req.body;
      if (!candidateId) {
        return res.status(400).json({ success: false, message: 'candidateId is required' });
      }
      const result = await profilePurchaseService.unlockCandidate({ recruiterId, candidateId });
      return res.status(200).json({
        success: true,
        message: result.alreadyUnlocked ? 'Profile already unlocked' : 'Profile unlocked successfully',
        data: result,
      });
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        return res.status(402).json({ success: false, code: 'INSUFFICIENT_CREDITS', message: err.message, balance: err.balance });
      }
      console.error('[ProfilePurchase] unlockCandidate error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getUnlockedCandidateIds(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const unlockedIdSet = await entitlementService.getUnlockedCandidateIdSet(recruiterId);
      return res.status(200).json({ success: true, data: Array.from(unlockedIdSet) });
    } catch (err) {
      console.error('[ProfilePurchase] getUnlockedCandidateIds error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch unlocked candidate IDs', error: err.message });
    }
  }

  async listMyPurchases(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const purchases = await profilePurchaseService.listPurchases(recruiterId);
      return res.status(200).json({ success: true, data: purchases });
    } catch (err) {
      console.error('[ProfilePurchase] listMyPurchases error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch purchase history', error: err.message });
    }
  }

  async streamResume(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const { candidateId } = req.params;
      return await resumeProxyService.streamResume({ recruiterId, candidateId, res, req });
    } catch (err) {
      console.error('[ProfilePurchase] streamResume error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to stream candidate resume', error: err.message });
    }
  }

  async getUnlockedProfiles(req, res) {
    try {
      const recruiterId = req.user._id || req.user.id;
      const result = await profilePurchaseService.getUnlockedProfilesWithAutoReveal(recruiterId);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('[ProfilePurchase] getUnlockedProfiles error:', err.message);
      console.error('[ProfilePurchase] getUnlockedProfiles stack:', err.stack);
      return res.status(500).json({ success: false, message: 'Failed to fetch unlocked profiles', error: err.message });
    }
  }
}

module.exports = new ProfilePurchaseController();