const express = require('express');

const {
  getPendingHotels,
  getAdminHotels,
  approveHotel,
  rejectHotel,
  updateHotelStatus,
} = require('../controllers/hotelController');
const {
  getReportsOverview,
  getAdminReports,
  getAdminStats,
  getAdminVenues,
} = require('../controllers/adminReportsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/reports/overview', getReportsOverview);
router.get('/reports', getAdminReports);
router.get('/stats', getAdminStats);
router.get('/venues', getAdminVenues);

router.get('/hotels', getAdminHotels);
router.get('/hotels/pending', getPendingHotels);
router.patch('/hotels/:id/approve', approveHotel);
router.patch('/hotels/:id/reject', rejectHotel);
router.patch('/hotels/:id/status', updateHotelStatus);

module.exports = router;
