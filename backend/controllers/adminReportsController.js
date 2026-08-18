const Hotel = require('../models/Hotel');
const Hall = require('../models/Hall');
const Booking = require('../models/Booking');
const User = require('../models/User');

const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'confirmed',
  'cancelled',
  'rejected',
];

/**
 * Bookings that still reference an existing hall and hotel
 * (ignores orphaned / test rows).
 */
const loadValidBookings = async () =>
  Booking.aggregate([
    {
      $lookup: {
        from: 'halls',
        localField: 'hallId',
        foreignField: '_id',
        as: 'hall',
      },
    },
    {
      $lookup: {
        from: 'hotels',
        localField: 'hotelId',
        foreignField: '_id',
        as: 'hotel',
      },
    },
    { $match: { hall: { $size: 1 }, hotel: { $size: 1 } } },
    {
      $addFields: {
        hallDoc: { $arrayElemAt: ['$hall', 0] },
      },
    },
    {
      $project: {
        status: 1,
        depositPaid: 1,
        depositAmount: 1,
        pricePerDay: '$hallDoc.pricePerDay',
      },
    },
  ]);

/**
 * GET /api/admin/reports/overview
 * Platform-wide overview counts for the admin dashboard / reports hub.
 */
const getReportsOverview = async (req, res) => {
  try {
    const existingHotelIds = await Hotel.distinct('_id');
    const ownerIdsWithHotels = await Hotel.distinct('ownerId');

    const [
      customers,
      admins,
      hotelOwnersWithHotels,
      usersTotal,
      hotelsTotal,
      hotelsPending,
      hotelsApproved,
      hotelsRejected,
      hallsTotal,
      hallsAvailable,
      validBookings,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        role: 'hotel_owner',
        _id: { $in: ownerIdsWithHotels },
      }),
      User.countDocuments({}),
      Hotel.countDocuments({}),
      Hotel.countDocuments({ verificationStatus: 'pending' }),
      Hotel.countDocuments({ verificationStatus: 'approved' }),
      Hotel.countDocuments({ verificationStatus: 'rejected' }),
      Hall.countDocuments({ hotelId: { $in: existingHotelIds } }),
      Hall.countDocuments({
        hotelId: { $in: existingHotelIds },
        isAvailable: true,
      }),
      loadValidBookings(),
    ]);

    const bookings = {
      total: validBookings.length,
      pending: 0,
      accepted: 0,
      confirmed: 0,
      cancelled: 0,
      rejected: 0,
    };

    let depositsCollected = 0;
    let confirmedHallValue = 0;

    validBookings.forEach((booking) => {
      const status = String(booking.status || '').toLowerCase();
      if (BOOKING_STATUSES.includes(status)) {
        bookings[status] += 1;
      }

      if (status === 'confirmed') {
        const price = Number(booking.pricePerDay) || 0;
        confirmedHallValue += price;

        if (booking.depositPaid) {
          depositsCollected += Number(booking.depositAmount) || 0;
        }
      }
    });

    return res.status(200).json({
      users: {
        total: usersTotal,
        customers,
        hotel_owners: hotelOwnersWithHotels,
        hotelOwners: hotelOwnersWithHotels,
        admins,
        note: 'hotel_owners counts users with role hotel_owner who own at least one hotel',
      },
      hotels: {
        total: hotelsTotal,
        pending: hotelsPending,
        approved: hotelsApproved,
        rejected: hotelsRejected,
      },
      halls: {
        total: hallsTotal,
        available: hallsAvailable,
        unavailable: Math.max(0, hallsTotal - hallsAvailable),
      },
      bookings,
      revenue: {
        definition:
          'Primary total is depositsCollected: sum of depositAmount on confirmed bookings where depositPaid is true. confirmedHallValue is the sum of linked hall pricePerDay for all confirmed bookings (estimated booking value). Only bookings with a valid hall and hotel are included.',
        depositsCollected,
        confirmedHallValue,
        total: depositsCollected,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to generate admin reports overview',
      error: error.message,
    });
  }
};

/** Alias for GET /api/admin/reports */
const getAdminReports = getReportsOverview;

/**
 * GET /api/admin/stats
 * Shape expected by the admin dashboard KPIs.
 */
const getAdminStats = async (req, res) => {
  try {
    const [
      pendingApprovals,
      approvedHotels,
      rejectedHotels,
      totalLiveHalls,
      platformBookings,
    ] = await Promise.all([
      Hotel.countDocuments({ verificationStatus: 'pending' }),
      Hotel.countDocuments({ verificationStatus: 'approved' }),
      Hotel.countDocuments({ verificationStatus: 'rejected' }),
      Hall.countDocuments({ isAvailable: true }),
      Booking.countDocuments({}),
    ]);

    return res.status(200).json({
      stats: {
        pendingApprovals,
        approvedHotels,
        rejectedHotels,
        totalLiveHalls,
        platformBookings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load admin stats',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/venues
 * All hotels + halls for the admin venues directory.
 */
const getAdminVenues = async (req, res) => {
  try {
    const [hotels, halls] = await Promise.all([
      Hotel.find()
        .populate('ownerId', 'fullName email phone')
        .sort({ createdAt: -1 }),
      Hall.find()
        .populate('hotelId', 'hotelName city verificationStatus')
        .sort({ hallName: 1 }),
    ]);

    return res.status(200).json({ hotels, halls });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load venues',
      error: error.message,
    });
  }
};

module.exports = {
  getReportsOverview,
  getAdminReports,
  getAdminStats,
  getAdminVenues,
};
