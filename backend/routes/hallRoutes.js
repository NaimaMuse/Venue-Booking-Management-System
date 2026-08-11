const express = require('express');

const {
  getHalls,
  getMyHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
} = require('../controllers/hallController');
const {
  protect,
  optionalProtect,
  authorize,
} = require('../middleware/authMiddleware');
const { uploadHallImages } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public list (approved hotels only; optional ?hotelId=)
router.get('/', getHalls);

// Owner — define BEFORE /:id
router.get('/mine', protect, authorize('hotel_owner'), getMyHalls);
router.get('/my', protect, authorize('hotel_owner'), getMyHalls);

router.post(
  '/',
  protect,
  authorize('hotel_owner'),
  uploadHallImages.array('images', 5),
  createHall
);

router.put(
  '/:id',
  protect,
  authorize('hotel_owner'),
  uploadHallImages.array('images', 5),
  updateHall
);
router.patch(
  '/:id',
  protect,
  authorize('hotel_owner'),
  uploadHallImages.array('images', 5),
  updateHall
);

router.delete('/:id', protect, authorize('hotel_owner'), deleteHall);

// Public get-by-id (optional auth so owner/admin can see non-approved / unavailable)
router.get('/:id', optionalProtect, getHallById);

module.exports = router;
