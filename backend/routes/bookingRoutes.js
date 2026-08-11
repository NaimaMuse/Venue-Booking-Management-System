const express = require('express');

const {
  getUnavailableDates,
  createBooking,
  getMyBookings,
  cancelBooking,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  confirmBooking,
  scheduleAppointment,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public unavailable dates (aliases for frontend + suggested paths)
router.get('/unavailable-dates/:hallId', getUnavailableDates);
router.get('/halls/:hallId/unavailable-dates', getUnavailableDates);

// Customer — define BEFORE /:id
router.post('/', protect, authorize('customer'), createBooking);
router.get('/my', protect, authorize('customer'), getMyBookings);
router.get('/my-bookings', protect, authorize('customer'), getMyBookings);

// Owner — define BEFORE /:id
router.get('/owner', protect, authorize('hotel_owner'), getOwnerBookings);
router.get('/owner-requests', protect, authorize('hotel_owner'), getOwnerBookings);

// Customer cancel (PATCH preferred; DELETE kept for existing frontend)
router.patch(
  '/:id/cancel',
  protect,
  authorize('customer', 'hotel_owner'),
  cancelBooking
);
router.delete('/:id', protect, authorize('customer'), cancelBooking);

// Owner status actions
router.patch('/:id/accept', protect, authorize('hotel_owner'), acceptBooking);
router.patch('/:id/reject', protect, authorize('hotel_owner'), rejectBooking);
router.patch('/:id/confirm', protect, authorize('hotel_owner'), confirmBooking);
router.patch(
  '/:id/appointment',
  protect,
  authorize('hotel_owner'),
  scheduleAppointment
);

module.exports = router;
