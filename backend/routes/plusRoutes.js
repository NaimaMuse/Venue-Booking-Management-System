const express = require('express');
const {
  getPlusPlans,
  getFeaturedHotels,
  getMyPlusSubscription,
  createPlusSubscription,
  confirmPlusPayment,
  adminCancelSubscription,
  cancelMySubscription,
  getAdminPlusSubscriptions,
} = require('../controllers/plusController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/plans', getPlusPlans);
router.get('/featured', getFeaturedHotels);

// Owner routes
router.get(
  '/my-subscription',
  protect,
  authorize('hotel_owner'),
  getMyPlusSubscription
);
router.post(
  '/subscribe',
  protect,
  authorize('hotel_owner'),
  createPlusSubscription
);
router.post(
  '/cancel',
  protect,
  authorize('hotel_owner'),
  cancelMySubscription
);

// Admin routes
router.get(
  '/admin/subscriptions',
  protect,
  authorize('admin'),
  getAdminPlusSubscriptions
);
router.patch(
  '/admin/confirm/:id',
  protect,
  authorize('admin'),
  confirmPlusPayment
);
router.patch(
  '/admin/cancel/:id',
  protect,
  authorize('admin'),
  adminCancelSubscription
);

module.exports = router;
