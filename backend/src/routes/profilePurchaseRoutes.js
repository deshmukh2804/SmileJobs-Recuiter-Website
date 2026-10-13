const express = require('express');
const router = express.Router();
const profilePurchaseController = require('../controllers/profilePurchaseController');
const { protect } = require('../middleware/authMiddleware');

// Public pricing route
router.get('/pricing', profilePurchaseController.getPricing);

// Protected routes (require recruiter login)
router.use(protect);

router.get('/quote', profilePurchaseController.getQuote);
router.post('/orders', profilePurchaseController.createOrder);
router.post('/verify', profilePurchaseController.verifyPayment);
router.get('/credits', profilePurchaseController.getCredits);
router.post('/unlock', profilePurchaseController.unlockCandidate);
router.get('/unlocked-ids', profilePurchaseController.getUnlockedIds);
router.get('/unlocked-profiles', profilePurchaseController.getUnlockedProfiles);
router.get('/purchases', profilePurchaseController.getPurchases);
router.get('/resume/:candidateId', profilePurchaseController.downloadResume);

module.exports = router;