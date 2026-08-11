const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const Hotel = require('../models/Hotel');

const ACTIVE_STATUSES = ['pending', 'accepted', 'confirmed'];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return fallback;
};

/** Inclusive UTC calendar-day bounds for an event date string/Date. */
const getDayRange = (eventDate) => {
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const populateBooking = (query) =>
  query
    .populate('customerId', 'fullName email phone')
    .populate('hallId', 'hallName capacity pricePerDay images isAvailable')
    .populate('hotelId', 'hotelName city address contactPhone');

const findOwnedHotel = async (ownerId) => Hotel.findOne({ ownerId });

/**
 * Returns an existing active booking for the same hall + calendar day, or null.
 */
const findConflict = async (hallId, eventDate, excludeBookingId = null) => {
  const range = getDayRange(eventDate);
  if (!range) return { invalidDate: true };

  const filter = {
    hallId,
    status: { $in: ACTIVE_STATUSES },
    eventDate: { $gte: range.start, $lte: range.end },
  };

  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(filter).select(
    '_id status eventDate customerId'
  );
  return { conflict, range };
};

/**
 * Public: booked (unavailable) dates for a hall.
 * Active statuses only: pending | accepted | confirmed.
 */
const getUnavailableDates = async (req, res) => {
  try {
    const hallId = req.params.hallId || req.params.id;

    if (!isValidObjectId(hallId)) {
      return res.status(400).json({ message: 'Invalid hall id' });
    }

    const hall = await Hall.findById(hallId).select('_id hotelId isAvailable');
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    const bookings = await Booking.find({
      hallId: hall._id,
      status: { $in: ACTIVE_STATUSES },
    }).select('eventDate status');

    const dateSet = new Set();
    for (const booking of bookings) {
      const key = toDateKey(booking.eventDate);
      if (key) dateSet.add(key);
    }

    const unavailableDates = Array.from(dateSet).sort();

    return res.status(200).json({
      hallId: hall._id,
      count: unavailableDates.length,
      unavailableDates,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get unavailable dates',
      error: error.message,
    });
  }
};

/**
 * Customer: request a booking for an approved, available hall.
 */
const createBooking = async (req, res) => {
  try {
    const { hallId, eventDate, guestCount, specialNotes } = req.body;

    if (!hallId || !eventDate || guestCount === undefined || guestCount === null || guestCount === '') {
      return res.status(400).json({
        message: 'hallId, eventDate, and guestCount are required',
      });
    }

    if (!isValidObjectId(hallId)) {
      return res.status(400).json({ message: 'Invalid hall id' });
    }

    const guests = Number(guestCount);
    if (Number.isNaN(guests) || guests < 1) {
      return res.status(400).json({
        message: 'guestCount must be a number of at least 1',
      });
    }

    const range = getDayRange(eventDate);
    if (!range) {
      return res.status(400).json({ message: 'Invalid eventDate' });
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    if (hall.isAvailable === false) {
      return res.status(400).json({ message: 'This hall is not available for booking' });
    }

    if (guests > hall.capacity) {
      return res.status(400).json({
        message: `Guest count exceeds hall capacity of ${hall.capacity}`,
      });
    }

    const hotel = await Hotel.findById(hall.hotelId);
    if (!hotel || hotel.verificationStatus !== 'approved') {
      return res.status(400).json({
        message: 'Hall belongs to a hotel that is not approved for bookings',
      });
    }

    const { conflict } = await findConflict(hall._id, eventDate);
    if (conflict) {
      return res.status(409).json({
        message: 'This hall is already booked for the selected date',
        conflict: {
          bookingId: conflict._id,
          status: conflict.status,
          eventDate: conflict.eventDate,
        },
      });
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      hallId: hall._id,
      hotelId: hotel._id,
      eventDate: range.start,
      guestCount: guests,
      specialNotes: specialNotes ? String(specialNotes).trim() : '',
      status: 'pending',
    });

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(201).json({
      message: 'Booking request submitted successfully',
      booking: populated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

/**
 * Customer: list own bookings.
 */
const getMyBookings = async (req, res) => {
  try {
    const filter = { customerId: req.user._id };
    const status = req.query.status;

    if (status) {
      if (!Booking.BOOKING_STATUSES.includes(status)) {
        return res.status(400).json({
          message:
            'status must be pending, accepted, confirmed, cancelled, or rejected',
        });
      }
      filter.status = status;
    }

    const bookings = await populateBooking(
      Booking.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
};

/**
 * Customer: cancel own pending booking (soft cancel → cancelled).
 */
const cancelBookingByCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findOne({
      _id: id,
      customerId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending booking requests can be cancelled by the customer',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

/**
 * Owner: list bookings for their hotel.
 */
const getOwnerBookings = async (req, res) => {
  try {
    const hotel = await findOwnedHotel(req.user._id);
    if (!hotel) {
      return res.status(404).json({
        message: 'Hotel not found. Register a hotel first.',
      });
    }

    const filter = { hotelId: hotel._id };
    const status = req.query.status;

    if (status) {
      if (!Booking.BOOKING_STATUSES.includes(status)) {
        return res.status(400).json({
          message:
            'status must be pending, accepted, confirmed, cancelled, or rejected',
        });
      }
      filter.status = status;
    }

    const bookings = await populateBooking(
      Booking.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      count: bookings.length,
      hotelId: hotel._id,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get owner bookings',
      error: error.message,
    });
  }
};

/**
 * Shared helper: load booking + ensure it belongs to the owner's hotel.
 */
const getOwnerManagedBooking = async (bookingId, ownerId) => {
  if (!isValidObjectId(bookingId)) {
    return { error: { status: 400, message: 'Invalid booking id' } };
  }

  const hotel = await findOwnedHotel(ownerId);
  if (!hotel) {
    return {
      error: {
        status: 404,
        message: 'Hotel not found. Register a hotel first.',
      },
    };
  }

  const booking = await Booking.findById(bookingId);
  if (!booking || String(booking.hotelId) !== String(hotel._id)) {
    return { error: { status: 404, message: 'Booking not found' } };
  }

  return { booking, hotel };
};

/**
 * Owner: accept a pending booking (re-checks date conflict).
 */
const acceptBooking = async (req, res) => {
  try {
    const result = await getOwnerManagedBooking(req.params.id, req.user._id);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { booking } = result;

    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: `Only pending bookings can be accepted (current status: ${booking.status})`,
      });
    }

    const { conflict, invalidDate } = await findConflict(
      booking.hallId,
      booking.eventDate,
      booking._id
    );

    if (invalidDate) {
      return res.status(400).json({ message: 'Booking has an invalid event date' });
    }

    if (conflict) {
      return res.status(409).json({
        message:
          'Cannot accept: another active booking already exists for this hall on the same date',
        conflict: {
          bookingId: conflict._id,
          status: conflict.status,
          eventDate: conflict.eventDate,
        },
      });
    }

    booking.status = 'accepted';
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      message: 'Booking accepted successfully',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to accept booking',
      error: error.message,
    });
  }
};

/**
 * Owner: reject a pending booking.
 */
const rejectBooking = async (req, res) => {
  try {
    const result = await getOwnerManagedBooking(req.params.id, req.user._id);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { booking } = result;

    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: `Only pending bookings can be rejected (current status: ${booking.status})`,
      });
    }

    booking.status = 'rejected';
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      message: 'Booking rejected',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reject booking',
      error: error.message,
    });
  }
};

/**
 * Owner: confirm an accepted booking (+ deposit / agreement details).
 */
const confirmBooking = async (req, res) => {
  try {
    const result = await getOwnerManagedBooking(req.params.id, req.user._id);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { booking } = result;

    if (booking.status !== 'accepted') {
      return res.status(400).json({
        message: `Only accepted bookings can be confirmed (current status: ${booking.status})`,
      });
    }

    const { depositPaid, depositAmount, agreementNotes } = req.body;

    if (depositPaid !== undefined) {
      booking.depositPaid = parseBoolean(depositPaid, booking.depositPaid);
    }

    if (depositAmount !== undefined) {
      const amount = Number(depositAmount);
      if (Number.isNaN(amount) || amount < 0) {
        return res.status(400).json({
          message: 'depositAmount must be a non-negative number',
        });
      }
      booking.depositAmount = amount;
    }

    if (agreementNotes !== undefined) {
      booking.agreementNotes = String(agreementNotes).trim();
    }

    booking.status = 'confirmed';
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      message: 'Booking confirmed successfully',
      booking: populated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to confirm booking',
      error: error.message,
    });
  }
};

/**
 * Owner: cancel a pending or accepted booking for their hotel.
 */
const cancelBookingByOwner = async (req, res) => {
  try {
    const result = await getOwnerManagedBooking(req.params.id, req.user._id);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { booking } = result;

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        message: `Only pending or accepted bookings can be cancelled (current status: ${booking.status})`,
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      message: 'Booking cancelled by owner',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

/**
 * Role-aware cancel: customer (own pending) or owner (hotel pending/accepted).
 */
const cancelBooking = async (req, res) => {
  if (req.user.role === 'hotel_owner') {
    return cancelBookingByOwner(req, res);
  }
  return cancelBookingByCustomer(req, res);
};

/**
 * Owner (optional): schedule an inspection visit on an accepted booking.
 */
const scheduleAppointment = async (req, res) => {
  try {
    const result = await getOwnerManagedBooking(req.params.id, req.user._id);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { booking } = result;

    if (booking.status !== 'accepted') {
      return res.status(400).json({
        message: 'Appointments can only be scheduled for accepted bookings',
      });
    }

    const { scheduledDate, locationNotes } = req.body;
    if (!scheduledDate) {
      return res.status(400).json({ message: 'scheduledDate is required' });
    }

    const when = new Date(scheduledDate);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduledDate' });
    }

    booking.appointment = {
      scheduledDate: when,
      locationNotes: locationNotes ? String(locationNotes).trim() : '',
    };
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      message: 'Appointment scheduled successfully',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to schedule appointment',
      error: error.message,
    });
  }
};

module.exports = {
  getUnavailableDates,
  createBooking,
  getMyBookings,
  cancelBooking,
  cancelBookingByCustomer,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  confirmBooking,
  cancelBookingByOwner,
  scheduleAppointment,
  ACTIVE_STATUSES,
};
