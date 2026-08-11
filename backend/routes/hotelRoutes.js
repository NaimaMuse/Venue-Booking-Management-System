const express = require('express');

const {
  getHotels,
  getHotelById,
  createHotel,
  getMyHotel,
  updateMyHotel,
  markApprovalAlertSeen,
  approveHotel,
  rejectHotel,
} = require('../controllers/hotelController');
const { getHallsByHotelId } = require('../controllers/hallController');
const {
  protect,
  optionalProtect,
  authorize,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/', getHotels);
router.get('/approved', getHotels);

// Owner — define BEFORE /:id
router.get('/mine', protect, authorize('hotel_owner'), getMyHotel);
router.get('/my', protect, authorize('hotel_owner'), getMyHotel);
router.get('/my-hotel', protect, authorize('hotel_owner'), getMyHotel);
router.put('/mine', protect, authorize('hotel_owner'), updateMyHotel);
router.patch('/mine', protect, authorize('hotel_owner'), updateMyHotel);
router.put('/my-hotel', protect, authorize('hotel_owner'), updateMyHotel);
router.patch('/my-hotel', protect, authorize('hotel_owner'), updateMyHotel);
router.patch(
  '/my-hotel/approval-alert-seen',
  protect,
  authorize('hotel_owner'),
  markApprovalAlertSeen
);

router.post('/', protect, authorize('hotel_owner'), createHotel);

// Admin approve/reject on hotel resource
router.patch('/:id/approve', protect, authorize('admin'), approveHotel);
router.patch('/:id/reject', protect, authorize('admin'), rejectHotel);

// Nested halls for a hotel (public if approved; owner/admin otherwise)
router.get('/:id/halls', optionalProtect, getHallsByHotelId);

// Public get-by-id (optional auth so owner/admin can see non-approved)
router.get('/:id', optionalProtect, getHotelById);

module.exports = router;
