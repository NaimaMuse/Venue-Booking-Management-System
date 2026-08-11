const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Hall = require('../models/Hall');
const User = require('../models/User');

const OWNER_UPDATABLE_FIELDS = [
  'hotelName',
  'city',
  'address',
  'contactPhone',
  'description',
  'coverImage',
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const attachHallCounts = async (hotels) => {
  if (!hotels.length) {
    return hotels;
  }

  const hotelIds = hotels.map((hotel) => hotel._id);
  const counts = await Hall.aggregate([
    { $match: { hotelId: { $in: hotelIds } } },
    { $group: { _id: '$hotelId', hallCount: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((row) => [String(row._id), row.hallCount])
  );

  return hotels.map((hotel) => {
    const plain = typeof hotel.toObject === 'function' ? hotel.toObject() : hotel;
    return {
      ...plain,
      hallCount: countMap.get(String(plain._id)) || 0,
    };
  });
};

/**
 * Public: list approved hotels. Optional ?q= search on hotelName / city.
 */
const getHotels = async (req, res) => {
  try {
    const filter = { verificationStatus: 'approved' };
    const q = (req.query.q || req.query.search || '').trim();

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ hotelName: regex }, { city: regex }];
    }

    const hotels = await Hotel.find(filter)
      .populate('ownerId', 'fullName email phone')
      .sort({ hotelName: 1 });

    const hotelsWithCounts = await attachHallCounts(hotels);

    return res.status(200).json({
      count: hotelsWithCounts.length,
      hotels: hotelsWithCounts,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

/**
 * Public approved hotel details + halls.
 * Owner of the hotel or admin may also view pending/rejected.
 */
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hotel id' });
    }

    const hotel = await Hotel.findById(id).populate(
      'ownerId',
      'fullName email phone role avatarUrl'
    );

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const isApproved = hotel.verificationStatus === 'approved';
    const isAdmin = req.user?.role === 'admin';
    const isOwner =
      req.user &&
      hotel.ownerId &&
      String(hotel.ownerId._id || hotel.ownerId) === String(req.user._id);

    if (!isApproved && !isAdmin && !isOwner) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const halls = await Hall.find({ hotelId: hotel._id }).sort({ hallName: 1 });

    return res.status(200).json({
      hotel,
      halls,
      hallCount: halls.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get hotel',
      error: error.message,
    });
  }
};

/**
 * Owner: create hotel application (one hotel per owner).
 */
const createHotel = async (req, res) => {
  try {
    const { hotelName, address, city, contactPhone, description, coverImage } =
      req.body;

    if (!hotelName || !address || !contactPhone) {
      return res.status(400).json({
        message: 'Hotel name, address, and contact phone are required',
      });
    }

    const existingHotel = await Hotel.findOne({ ownerId: req.user._id });
    if (existingHotel) {
      return res.status(400).json({
        message: 'You have already registered a hotel',
        hotel: existingHotel,
      });
    }

    const hotel = await Hotel.create({
      ownerId: req.user._id,
      hotelName: String(hotelName).trim(),
      address: String(address).trim(),
      city: city ? String(city).trim() : 'Hargeisa',
      contactPhone: String(contactPhone).trim(),
      description: description ? String(description).trim() : '',
      coverImage: coverImage ? String(coverImage).trim() : '',
      verificationStatus: 'pending',
      rejectionReason: '',
    });

    return res.status(201).json({
      message: 'Hotel submitted for approval',
      hotel,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create hotel',
      error: error.message,
    });
  }
};

/**
 * Owner: get own hotel (+ halls).
 */
const getMyHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ ownerId: req.user._id }).populate(
      'ownerId',
      'fullName email phone role avatarUrl hasSeenApprovalAlert'
    );

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const halls = await Hall.find({ hotelId: hotel._id }).sort({ hallName: 1 });

    return res.status(200).json({
      hotel,
      halls,
      hallCount: halls.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get hotel',
      error: error.message,
    });
  }
};

/**
 * Owner: update own hotel profile.
 * If previously rejected, resubmits as pending.
 */
const updateMyHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ ownerId: req.user._id });
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    let touched = false;
    for (const field of OWNER_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        hotel[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
        touched = true;
      }
    }

    if (!touched) {
      return res.status(400).json({
        message:
          'Provide at least one field to update: hotelName, city, address, contactPhone, description, coverImage',
      });
    }

    if (hotel.verificationStatus === 'rejected') {
      hotel.verificationStatus = 'pending';
      hotel.rejectionReason = '';
    }

    await hotel.save();

    return res.status(200).json({
      message: 'Hotel updated successfully',
      hotel,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update hotel',
      error: error.message,
    });
  }
};

/**
 * Owner: dismiss one-time approval alert on the user account.
 */
const markApprovalAlertSeen = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { hasSeenApprovalAlert: true },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      message: 'Approval alert marked as seen',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update approval alert',
      error: error.message,
    });
  }
};

/**
 * Admin: list pending hotel applications.
 */
const getPendingHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ verificationStatus: 'pending' })
      .populate('ownerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get pending hotels',
      error: error.message,
    });
  }
};

/**
 * Admin: list all hotels, optional ?status=pending|approved|rejected.
 */
const getAdminHotels = async (req, res) => {
  try {
    const filter = {};
    const status = req.query.status || req.query.verificationStatus;

    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          message: 'status must be pending, approved, or rejected',
        });
      }
      filter.verificationStatus = status;
    }

    const hotels = await Hotel.find(filter)
      .populate('ownerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    const hotelsWithCounts = await attachHallCounts(hotels);

    return res.status(200).json({
      count: hotelsWithCounts.length,
      hotels: hotelsWithCounts,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

/**
 * Admin: approve a hotel.
 */
const approveHotel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hotel id' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    hotel.verificationStatus = 'approved';
    hotel.rejectionReason = '';
    await hotel.save();

    // Reset so owner sees the approval banner once
    await User.findByIdAndUpdate(hotel.ownerId, {
      hasSeenApprovalAlert: false,
    });

    const populated = await Hotel.findById(hotel._id).populate(
      'ownerId',
      'fullName email phone hasSeenApprovalAlert'
    );

    return res.status(200).json({
      message: 'Hotel approved successfully',
      hotel: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to approve hotel',
      error: error.message,
    });
  }
};

/**
 * Admin: reject a hotel (optional rejectionReason).
 */
const rejectHotel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hotel id' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const reason =
      req.body.rejectionReason !== undefined
        ? String(req.body.rejectionReason).trim()
        : hotel.rejectionReason || '';

    hotel.verificationStatus = 'rejected';
    hotel.rejectionReason = reason;
    await hotel.save();

    const populated = await Hotel.findById(hotel._id).populate(
      'ownerId',
      'fullName email phone'
    );

    return res.status(200).json({
      message: 'Hotel rejected',
      hotel: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reject hotel',
      error: error.message,
    });
  }
};

/**
 * Admin: set verificationStatus (approved | rejected | pending) + optional reason.
 */
const updateHotelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, rejectionReason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hotel id' });
    }

    if (!verificationStatus || !['approved', 'rejected', 'pending'].includes(verificationStatus)) {
      return res.status(400).json({
        message: 'verificationStatus must be approved, rejected, or pending',
      });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    hotel.verificationStatus = verificationStatus;

    if (verificationStatus === 'rejected') {
      hotel.rejectionReason =
        rejectionReason !== undefined
          ? String(rejectionReason).trim()
          : hotel.rejectionReason || '';
    } else {
      hotel.rejectionReason = '';
    }

    await hotel.save();

    if (verificationStatus === 'approved') {
      await User.findByIdAndUpdate(hotel.ownerId, {
        hasSeenApprovalAlert: false,
      });
    }

    const populated = await Hotel.findById(hotel._id).populate(
      'ownerId',
      'fullName email phone hasSeenApprovalAlert'
    );

    return res.status(200).json({
      message: `Hotel status updated to ${verificationStatus}`,
      hotel: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update hotel status',
      error: error.message,
    });
  }
};

module.exports = {
  getHotels,
  getAllApprovedHotels: getHotels,
  getHotelById,
  createHotel,
  createMyHotel: createHotel,
  getMyHotel,
  updateMyHotel,
  markApprovalAlertSeen,
  getPendingHotels,
  getAdminHotels,
  approveHotel,
  rejectHotel,
  updateHotelStatus,
};
