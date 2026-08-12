const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getOwnerHotelReport } = require('../controllers/ownerReportsController');

const router = express.Router();

router.use(protect, authorize('hotel_owner'));

router.get('/reports', getOwnerHotelReport);
router.get('/reports/hotel', getOwnerHotelReport);

module.exports = router;
