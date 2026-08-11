const Hotel = require('../models/Hotel');
const Hall = require('../models/Hall');
const Booking = require('../models/Booking');

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const parseDay = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }
  const day = String(value).slice(0, 10);
  if (!ISO_DAY.test(day)) {
    return null;
  }
  return endOfDay
    ? new Date(`${day}T23:59:59.999Z`)
    : new Date(`${day}T00:00:00.000Z`);
};

const getDateBounds = (range, from, to) => {
  if (range === 'custom') {
    return {
      start: parseDay(from, false),
      end: parseDay(to, true),
    };
  }
  return { start: null, end: null };
};

const buildBookingDateMatch = (bounds) => {
  if (!bounds.start && !bounds.end) {
    return {};
  }
  const window = {};
  if (bounds.start) window.$gte = bounds.start;
  if (bounds.end) window.$lte = bounds.end;
  return {
    $or: [{ eventDate: { ...window } }, { createdAt: { ...window } }],
  };
};

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
  const [year, month] = key.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const getOwnerHotelReport = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ ownerId: req.user._id }).lean();
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const range = req.query.range || 'all';
    const from = req.query.from || '';
    const to = req.query.to || '';
    const bounds = getDateBounds(range, from, to);
    const dateMatch = buildBookingDateMatch(bounds);

    const [halls, bookings] = await Promise.all([
      Hall.find({ hotelId: hotel._id }).lean(),
      Booking.find({ hotelId: hotel._id, ...dateMatch })
        .populate('hallId', 'hallName capacity pricePerDay')
        .populate('customerId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const statusCounts = {
      pending: 0,
      accepted: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
    };

    let depositRevenue = 0;
    let upcomingVisits = 0;
    const hallStatsMap = {};

    halls.forEach((hall) => {
      hallStatsMap[String(hall._id)] = {
        hallId: hall._id,
        hallName: hall.hallName,
        capacity: hall.capacity,
        pricePerDay: hall.pricePerDay,
        isAvailable: hall.isAvailable !== false,
        bookings: 0,
        confirmed: 0,
        revenue: 0,
      };
    });

    const timelineMap = {};

    bookings.forEach((booking) => {
      const status = booking.status || 'pending';
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      const deposit = Number(booking.depositAmount) || 0;
      if (
        (status === 'confirmed' || status === 'accepted') &&
        deposit > 0
      ) {
        depositRevenue += deposit;
      }

      if (status === 'accepted' && booking.appointment?.scheduledDate) {
        upcomingVisits += 1;
      }

      const hallId = String(booking.hallId?._id || booking.hallId || '');
      if (hallId && hallStatsMap[hallId]) {
        hallStatsMap[hallId].bookings += 1;
        if (status === 'confirmed') {
          hallStatsMap[hallId].confirmed += 1;
        }
        if (
          (status === 'confirmed' || status === 'accepted') &&
          deposit > 0
        ) {
          hallStatsMap[hallId].revenue += deposit;
        }
      }

      const key = monthKey(booking.eventDate || booking.createdAt);
      if (!timelineMap[key]) {
        timelineMap[key] = { key, label: monthLabel(key), bookings: 0, revenue: 0 };
      }
      timelineMap[key].bookings += 1;
      if (
        (status === 'confirmed' || status === 'accepted') &&
        deposit > 0
      ) {
        timelineMap[key].revenue += deposit;
      }
    });

    const byHall = Object.values(hallStatsMap).sort(
      (a, b) => b.revenue - a.revenue || b.bookings - a.bookings
    );

    const timeline = Object.values(timelineMap).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    const totalBookings = bookings.length;
    const won =
      statusCounts.accepted + statusCounts.confirmed;
    const lost = statusCounts.rejected + statusCounts.cancelled;
    const conversionRate =
      totalBookings > 0 ? Math.round((won / totalBookings) * 100) : 0;

    const recent = bookings.slice(0, 8).map((booking) => ({
      id: booking._id,
      customerName: booking.customerId?.fullName || 'Customer',
      hallName: booking.hallId?.hallName || 'Hall',
      eventDate: booking.eventDate,
      status: booking.status,
      guestCount: booking.guestCount,
      depositAmount: booking.depositAmount || 0,
      createdAt: booking.createdAt,
    }));

    return res.status(200).json({
      hotel: {
        id: hotel._id,
        hotelName: hotel.hotelName,
        city: hotel.city,
        address: hotel.address,
        verificationStatus: hotel.verificationStatus,
      },
      filter: { range, from, to },
      summary: {
        totalHalls: halls.length,
        availableHalls: halls.filter((h) => h.isAvailable !== false).length,
        totalBookings,
        pending: statusCounts.pending,
        accepted: statusCounts.accepted,
        confirmed: statusCounts.confirmed,
        rejected: statusCounts.rejected,
        cancelled: statusCounts.cancelled,
        depositRevenue,
        upcomingVisits,
        conversionRate,
        won,
        lost,
      },
      statusBreakdown: [
        { name: 'Pending', key: 'pending', value: statusCounts.pending },
        { name: 'Accepted', key: 'accepted', value: statusCounts.accepted },
        { name: 'Confirmed', key: 'confirmed', value: statusCounts.confirmed },
        { name: 'Rejected', key: 'rejected', value: statusCounts.rejected },
        { name: 'Cancelled', key: 'cancelled', value: statusCounts.cancelled },
      ],
      byHall,
      timeline,
      recent,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load hotel report',
      error: error.message,
    });
  }
};

module.exports = {
  getOwnerHotelReport,
};
