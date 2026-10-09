const express = require('express');

const {
  createReview,
  updateReview,
  deleteReview,
  getHotelReviews,
  getMyReviews,
  getEligibleBookingsForReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Customer protected routes (must be defined before /:id)
router.get('/my', protect, authorize('customer'), getMyReviews);
router.get(
  '/eligible-bookings',
  protect,
  authorize('customer'),
  getEligibleBookingsForReview
);
router.post('/', protect, authorize('customer'), createReview);
router.put('/:id', protect, authorize('customer'), updateReview);
router.delete('/:id', protect, authorize('customer', 'admin'), deleteReview);

// Public routes
router.get('/hotel/:hotelId', getHotelReviews);

module.exports = router;
