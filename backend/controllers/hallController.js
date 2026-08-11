const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Hall = require('../models/Hall');
const Hotel = require('../models/Hotel');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toPublicImagePath = (filename) => `/uploads/halls/${filename}`;

const mapUploadedImages = (files = []) =>
  files.map((file) => toPublicImagePath(file.filename));

/**
 * Amenities may arrive as JSON string, comma-separated string, or array
 * when using multipart/form-data.
 */
const parseAmenities = (value) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma-separated
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

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

const validateHallPayload = ({ hallName, capacity, pricePerDay }, { partial = false } = {}) => {
  const errors = [];

  if (!partial || hallName !== undefined) {
    if (!hallName || !String(hallName).trim()) {
      errors.push('hallName is required');
    }
  }

  if (!partial || capacity !== undefined) {
    const cap = Number(capacity);
    if (capacity === undefined || capacity === null || capacity === '' || Number.isNaN(cap) || cap < 1) {
      errors.push('capacity must be a number of at least 1');
    }
  }

  if (!partial || pricePerDay !== undefined) {
    const price = Number(pricePerDay);
    if (
      pricePerDay === undefined ||
      pricePerDay === null ||
      pricePerDay === '' ||
      Number.isNaN(price) ||
      price < 0
    ) {
      errors.push('pricePerDay must be a non-negative number');
    }
  }

  return errors;
};

const unlinkHallImages = (imagePaths = []) => {
  for (const imagePath of imagePaths) {
    if (!imagePath || typeof imagePath !== 'string') continue;
    const relative = imagePath.replace(/^\//, '');
    const absolute = path.join(__dirname, '..', relative);
    fs.promises.unlink(absolute).catch(() => {
      // Ignore missing files on disk
    });
  }
};

const getOwnedHotel = async (ownerId) => Hotel.findOne({ ownerId });

const canViewHallForHotel = (hotel, user) => {
  if (!hotel) return false;
  if (hotel.verificationStatus === 'approved') return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  return String(hotel.ownerId) === String(user._id);
};

/**
 * Public: list halls for approved hotels.
 * Optional filters: ?hotelId=&available=true&minCapacity=
 */
const getHalls = async (req, res) => {
  try {
    const { hotelId, available, minCapacity } = req.query;
    const filter = {};

    if (hotelId) {
      if (!isValidObjectId(hotelId)) {
        return res.status(400).json({ message: 'Invalid hotel id' });
      }

      const hotel = await Hotel.findById(hotelId);
      if (!hotel || hotel.verificationStatus !== 'approved') {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      filter.hotelId = hotel._id;
    } else {
      const approvedHotels = await Hotel.find({
        verificationStatus: 'approved',
      }).select('_id');
      filter.hotelId = { $in: approvedHotels.map((h) => h._id) };
    }

    if (available !== undefined) {
      filter.isAvailable = parseBoolean(available, true);
    }

    if (minCapacity !== undefined && minCapacity !== '') {
      const min = Number(minCapacity);
      if (Number.isNaN(min) || min < 1) {
        return res.status(400).json({ message: 'minCapacity must be a positive number' });
      }
      filter.capacity = { $gte: min };
    }

    const halls = await Hall.find(filter)
      .populate('hotelId', 'hotelName city address verificationStatus')
      .sort({ hallName: 1 });

    return res.status(200).json({
      count: halls.length,
      halls,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get halls',
      error: error.message,
    });
  }
};

/**
 * Public (approved hotel) or owner/admin: halls for a specific hotel.
 */
const getHallsByHotelId = async (req, res) => {
  try {
    const hotelId = req.params.hotelId || req.params.id;

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({ message: 'Invalid hotel id' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    if (!canViewHallForHotel(hotel, req.user)) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const filter = { hotelId: hotel._id };
    if (req.query.available !== undefined) {
      filter.isAvailable = parseBoolean(req.query.available, true);
    }

    const halls = await Hall.find(filter).sort({ hallName: 1 });

    return res.status(200).json({
      count: halls.length,
      hotelId: hotel._id,
      halls,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get halls',
      error: error.message,
    });
  }
};

/**
 * Owner: list halls for their hotel.
 */
const getMyHalls = async (req, res) => {
  try {
    const hotel = await getOwnedHotel(req.user._id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found. Register a hotel first.' });
    }

    const halls = await Hall.find({ hotelId: hotel._id }).sort({ hallName: 1 });

    return res.status(200).json({
      count: halls.length,
      hotelId: hotel._id,
      halls,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get halls',
      error: error.message,
    });
  }
};

/**
 * Public: get hall by id when hotel is approved (or available).
 * Owner/admin may view halls under non-approved hotels.
 */
const getHallById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hall id' });
    }

    const hall = await Hall.findById(id).populate(
      'hotelId',
      'hotelName city address contactPhone verificationStatus ownerId'
    );

    if (!hall || !hall.hotelId) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    const hotel = hall.hotelId;
    const isApproved = hotel.verificationStatus === 'approved';
    const isAdmin = req.user?.role === 'admin';
    const isOwner =
      req.user && String(hotel.ownerId) === String(req.user._id);

    if (!isApproved && !isAdmin && !isOwner) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Public consumers typically expect available halls; owners/admins see all
    if (
      isApproved &&
      !isAdmin &&
      !isOwner &&
      hall.isAvailable === false
    ) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    return res.status(200).json({ hall });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get hall',
      error: error.message,
    });
  }
};

/**
 * Owner: create a hall for their hotel (pending or approved is fine).
 */
const createHall = async (req, res) => {
  try {
    const hotel = await getOwnedHotel(req.user._id);
    if (!hotel) {
      return res.status(404).json({
        message: 'Hotel not found. Register a hotel before adding halls.',
      });
    }

    const { hallName, capacity, pricePerDay, amenities, isAvailable } = req.body;
    const errors = validateHallPayload({ hallName, capacity, pricePerDay });
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const images = mapUploadedImages(req.files);

    const hall = await Hall.create({
      hotelId: hotel._id,
      hallName: String(hallName).trim(),
      capacity: Number(capacity),
      pricePerDay: Number(pricePerDay),
      amenities: parseAmenities(amenities),
      images,
      isAvailable: parseBoolean(isAvailable, true),
    });

    return res.status(201).json({
      message: 'Hall created successfully',
      hall,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create hall',
      error: error.message,
    });
  }
};

/**
 * Owner: update own hall. Optional new images are appended (max 5 total).
 * Pass replaceImages=true to replace the images array with newly uploaded files.
 */
const updateHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hall id' });
    }

    const hotel = await getOwnedHotel(req.user._id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const hall = await Hall.findOne({ _id: id, hotelId: hotel._id });
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    const { hallName, capacity, pricePerDay, amenities, isAvailable, replaceImages } =
      req.body;

    const errors = validateHallPayload(
      {
        hallName: hallName !== undefined ? hallName : hall.hallName,
        capacity: capacity !== undefined ? capacity : hall.capacity,
        pricePerDay: pricePerDay !== undefined ? pricePerDay : hall.pricePerDay,
      },
      { partial: true }
    );

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    let touched = false;

    if (hallName !== undefined) {
      hall.hallName = String(hallName).trim();
      touched = true;
    }
    if (capacity !== undefined) {
      hall.capacity = Number(capacity);
      touched = true;
    }
    if (pricePerDay !== undefined) {
      hall.pricePerDay = Number(pricePerDay);
      touched = true;
    }
    if (amenities !== undefined) {
      hall.amenities = parseAmenities(amenities);
      touched = true;
    }
    if (isAvailable !== undefined) {
      hall.isAvailable = parseBoolean(isAvailable, hall.isAvailable);
      touched = true;
    }

    const newImages = mapUploadedImages(req.files);
    if (newImages.length) {
      const shouldReplace = parseBoolean(replaceImages, false);
      if (shouldReplace) {
        unlinkHallImages(hall.images);
        hall.images = newImages;
      } else {
        const merged = [...hall.images, ...newImages];
        if (merged.length > 5) {
          return res.status(400).json({
            message: `A hall can have at most 5 images (currently ${hall.images.length})`,
          });
        }
        hall.images = merged;
      }
      touched = true;
    }

    if (!touched) {
      return res.status(400).json({
        message:
          'Provide at least one field to update: hallName, capacity, pricePerDay, amenities, isAvailable, or images',
      });
    }

    await hall.save();

    return res.status(200).json({
      message: 'Hall updated successfully',
      hall,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update hall',
      error: error.message,
    });
  }
};

/**
 * Owner: delete own hall (and unlink image files).
 */
const deleteHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid hall id' });
    }

    const hotel = await getOwnedHotel(req.user._id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const hall = await Hall.findOneAndDelete({ _id: id, hotelId: hotel._id });
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    unlinkHallImages(hall.images);

    return res.status(200).json({
      message: 'Hall deleted successfully',
      hallId: hall._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete hall',
      error: error.message,
    });
  }
};

module.exports = {
  getHalls,
  getHallsByHotelId,
  getMyHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
};
