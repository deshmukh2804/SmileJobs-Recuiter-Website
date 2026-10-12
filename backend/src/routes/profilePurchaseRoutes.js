const express = require('express');
const router = express.Router();
const profilePurchaseController = require('../controllers/profilePurchaseController');
const { protect, recruiterOnly, requireVerified } = require('../middleware/authMiddleware');

router.use(protect);
router.use(recruiterOnly);
router.use(requireVerified);

router.get('/pricing', profilePurchaseController.getPricing.bind(profilePurchaseController));
router.get('/quote', profilePurchaseController.getQuote.bind(profilePurchaseController));
router.post('/orders', profilePurchaseController.createOrder.bind(profilePurchaseController));
router.post('/verify', profilePurchaseController.verifyPayment.bind(profilePurchaseController));
router.get('/credits', profilePurchaseController.getCredits.bind(profilePurchaseController));
router.post('/unlock', profilePurchaseController.unlockCandidate.bind(profilePurchaseController));
router.get('/unlocked-ids', profilePurchaseController.getUnlockedCandidateIds.bind(profilePurchaseController));
router.get('/unlocked-profiles', profilePurchaseController.getUnlockedProfiles.bind(profilePurchaseController));
router.get('/purchases', profilePurchaseController.listMyPurchases.bind(profilePurchaseController));
router.get('/resume/:candidateId', profilePurchaseController.streamResume.bind(profilePurchaseController));

module.exports = router;