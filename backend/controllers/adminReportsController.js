const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Hall = require('../models/Hall');
const Booking = require('../models/Booking');
const User = require('../models/User');
const PlusSubscription = require('../models/PlusSubscription');

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
        bookingAmount: 1,
        platformFee: 1,
        ownerAmount: 1,
        commissionRate: 1,
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
    let platformFeeTotal = 0;
    let ownerPayoutTotal = 0;

    validBookings.forEach((booking) => {
      const status = String(booking.status || '').toLowerCase();
      if (BOOKING_STATUSES.includes(status)) {
        bookings[status] += 1;
      }

      if (status === 'confirmed') {
        const price = Number(booking.pricePerDay) || 0;
        confirmedHallValue += price;

        if (booking.depositPaid) {
          const deposit = Number(booking.depositAmount) || 0;
          depositsCollected += deposit;
          const fee =
            booking.platformFee !== undefined &&
            booking.platformFee !== null &&
            booking.platformFee > 0
              ? booking.platformFee
              : Math.round(deposit * 0.05 * 100) / 100;
          const ownerNet =
            booking.ownerAmount !== undefined &&
            booking.ownerAmount !== null &&
            booking.ownerAmount > 0
              ? booking.ownerAmount
              : Math.round((deposit - fee) * 100) / 100;
          platformFeeTotal += fee;
          ownerPayoutTotal += ownerNet;
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
          'Primary total is depositsCollected: sum of depositAmount on confirmed bookings where depositPaid is true. confirmedHallValue is the sum of linked hall pricePerDay for all confirmed bookings (estimated booking value). Platform fee is 5% commission; owner payout is the remaining 95%.',
        depositsCollected,
        confirmedHallValue,
        total: depositsCollected,
        platformFeeTotal,
        ownerPayoutTotal,
        commissionRate: 0.05,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to generate admin reports overview',
      error: error.message,
    });
  }
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const inRange = (value, fromDate, toDate) => {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  if (fromDate && time < fromDate.getTime()) return false;
  if (toDate && time > toDate.getTime()) return false;
  return true;
};

const bookingInRange = (booking, fromDate, toDate) => {
  if (!fromDate && !toDate) return true;
  return (
    inRange(booking.eventDate, fromDate, toDate) ||
    inRange(booking.createdAt, fromDate, toDate)
  );
};

const earningStatuses = new Set(['accepted', 'confirmed']);

const bookingRevenue = (booking) => {
  const status = String(booking.status || '').toLowerCase();
  if (!earningStatuses.has(status)) return 0;
  const deposit = Number(booking.depositAmount) || 0;
  if (booking.depositPaid && deposit > 0) return deposit;
  const price = Number(booking.pricePerDay);
  if (Number.isFinite(price) && price > 0) return price;
  return deposit;
};

const monthLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

const loadReportBookings = async () =>
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
        hotelDoc: { $arrayElemAt: ['$hotel', 0] },
      },
    },
    {
      $project: {
        status: 1,
        depositPaid: 1,
        depositAmount: 1,
        bookingAmount: 1,
        platformFee: 1,
        ownerAmount: 1,
        commissionRate: 1,
        eventDate: 1,
        createdAt: 1,
        hotelId: 1,
        hallId: 1,
        pricePerDay: '$hallDoc.pricePerDay',
        hallName: '$hallDoc.hallName',
        hotelName: '$hotelDoc.hotelName',
        city: '$hotelDoc.city',
      },
    },
  ]);

/**
 * GET /api/admin/reports
 * Query: ?range=all|custom&from=&to=&hotelId=
 */
const getAdminReports = async (req, res) => {
  try {
    const range = String(req.query.range || 'all');
    const fromDate =
      range === 'custom' && req.query.from ? startOfDay(req.query.from) : null;
    const toDate =
      range === 'custom' && req.query.to ? endOfDay(req.query.to) : null;
    const hotelId = req.query.hotelId ? String(req.query.hotelId) : '';
    const hotelObjectId =
      hotelId && mongoose.Types.ObjectId.isValid(hotelId)
        ? new mongoose.Types.ObjectId(hotelId)
        : null;

    const hotelQuery = {};
    const hallQuery = {};
    if (fromDate && toDate) {
      hotelQuery.createdAt = { $gte: fromDate, $lte: toDate };
      hallQuery.createdAt = { $gte: fromDate, $lte: toDate };
    }
    if (hotelObjectId) {
      hotelQuery._id = hotelObjectId;
      hallQuery.hotelId = hotelObjectId;
    }

    const [hotels, halls, allHotels, validBookings, customers, hotelOwners] =
      await Promise.all([
        Hotel.find(hotelQuery).select(
          'hotelName city verificationStatus createdAt'
        ),
        Hall.find(hallQuery).select('isAvailable hotelId createdAt'),
        Hotel.find().select('hotelName city').sort({ hotelName: 1 }),
        loadReportBookings(),
        User.countDocuments({ role: 'customer' }),
        User.countDocuments({ role: 'hotel_owner' }),
      ]);

    const hotelOptions = allHotels.map((hotel) => ({
      id: String(hotel._id),
      hotelName: hotel.hotelName,
      city: hotel.city || '',
    }));

    const filteredBookings = validBookings.filter((booking) => {
      if (hotelId && String(booking.hotelId) !== hotelId) return false;
      return bookingInRange(booking, fromDate, toDate);
    });

    const bookings = {
      total: filteredBookings.length,
      pending: 0,
      accepted: 0,
      confirmed: 0,
      cancelled: 0,
      rejected: 0,
    };

    const byHotelMap = new Map();
    const byHallMap = new Map();
    const byMonthMap = new Map();
    let revenueTotal = 0;
    let platformFeeTotal = 0;
    let ownerPayoutTotal = 0;

    filteredBookings.forEach((booking) => {
      const status = String(booking.status || '').toLowerCase();
      if (BOOKING_STATUSES.includes(status)) {
        bookings[status] += 1;
      }

      const revenue = bookingRevenue(booking);
      const fee =
        booking.platformFee !== undefined &&
        booking.platformFee !== null &&
        booking.platformFee > 0
          ? booking.platformFee
          : Math.round(revenue * 0.05 * 100) / 100;
      const ownerAmt =
        booking.ownerAmount !== undefined &&
        booking.ownerAmount !== null &&
        booking.ownerAmount > 0
          ? booking.ownerAmount
          : Math.round((revenue - fee) * 100) / 100;

      revenueTotal += revenue;
      platformFeeTotal += fee;
      ownerPayoutTotal += ownerAmt;

      const hid = String(booking.hotelId);
      const hotelRow = byHotelMap.get(hid) || {
        hotelId: hid,
        hotelName: booking.hotelName || 'Hotel',
        city: booking.city || '',
        bookings: 0,
        revenue: 0,
        platformFee: 0,
        ownerAmount: 0,
      };
      hotelRow.bookings += 1;
      hotelRow.revenue += revenue;
      hotelRow.platformFee += fee;
      hotelRow.ownerAmount += ownerAmt;
      byHotelMap.set(hid, hotelRow);

      const lid = String(booking.hallId);
      const hallRow = byHallMap.get(lid) || {
        hallId: lid,
        hallName: booking.hallName || 'Hall',
        hotelName: booking.hotelName || 'Hotel',
        bookings: 0,
        revenue: 0,
        platformFee: 0,
        ownerAmount: 0,
      };
      hallRow.bookings += 1;
      hallRow.revenue += revenue;
      hallRow.platformFee += fee;
      hallRow.ownerAmount += ownerAmt;
      byHallMap.set(lid, hallRow);

      const month = monthLabel(booking.eventDate || booking.createdAt);
      const monthRow = byMonthMap.get(month) || {
        month,
        bookings: 0,
        revenue: 0,
        platformFee: 0,
        ownerAmount: 0,
      };
      monthRow.bookings += 1;
      monthRow.revenue += revenue;
      monthRow.platformFee += fee;
      monthRow.ownerAmount += ownerAmt;
      byMonthMap.set(month, monthRow);
    });

    const byHotel = [...byHotelMap.values()].sort(
      (a, b) => b.revenue - a.revenue || b.bookings - a.bookings
    );
    const topHotels = [...byHotel].slice(0, 5);
    const topHalls = [...byHallMap.values()]
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
      .slice(0, 5);
    const timeline = [...byMonthMap.values()];

    const hotelsApproved = hotels.filter(
      (hotel) => hotel.verificationStatus === 'approved'
    ).length;
    const hotelsPending = hotels.filter(
      (hotel) => hotel.verificationStatus === 'pending'
    ).length;
    const hotelsRejected = hotels.filter(
      (hotel) => hotel.verificationStatus === 'rejected'
    ).length;
    const hallsAvailable = halls.filter((hall) => hall.isAvailable).length;

    return res.status(200).json({
      hotels: {
        total: hotels.length,
        pending: hotelsPending,
        approved: hotelsApproved,
        rejected: hotelsRejected,
      },
      halls: {
        total: halls.length,
        available: hallsAvailable,
        unavailable: Math.max(0, halls.length - hallsAvailable),
      },
      bookings,
      revenue: {
        total: revenueTotal,
        platformFeeTotal,
        ownerPayoutTotal,
        commissionRate: 0.05,
        byHotel,
        byMonth: timeline,
      },
      users: {
        customers,
        hotelOwners,
        hotel_owners: hotelOwners,
      },
      timeline,
      topHalls,
      topHotels,
      hotelOptions,
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    return res.status(500).json({
      message: 'Failed to generate admin reports',
      error: error.message,
    });
  }
};

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
      activePlusSubscriptions,
      paidPlusSubs,
    ] = await Promise.all([
      Hotel.countDocuments({ verificationStatus: 'pending' }),
      Hotel.countDocuments({ verificationStatus: 'approved' }),
      Hotel.countDocuments({ verificationStatus: 'rejected' }),
      Hall.countDocuments({ isAvailable: true }),
      Booking.countDocuments({}),
      Hotel.countDocuments({
        isFeatured: true,
        featuredExpiresAt: { $gt: new Date() },
      }),
      PlusSubscription.find({ paymentStatus: 'paid' }).select('price'),
    ]);

    const plusRevenue = paidPlusSubs.reduce(
      (sum, s) => sum + (Number(s.price) || 0),
      0
    );

    return res.status(200).json({
      stats: {
        pendingApprovals,
        approvedHotels,
        rejectedHotels,
        totalLiveHalls,
        platformBookings,
        activePlusSubscriptions,
        plusRevenue,
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
