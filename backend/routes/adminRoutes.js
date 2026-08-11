const express = require('express');

const {
  getPendingHotels,
  getAdminHotels,
  approveHotel,
  rejectHotel,
  updateHotelStatus,
} = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/hotels', getAdminHotels);
router.get('/hotels/pending', getPendingHotels);
router.patch('/hotels/:id/approve', approveHotel);
router.patch('/hotels/:id/reject', rejectHotel);
router.patch('/hotels/:id/status', updateHotelStatus);

module.exports = router;
