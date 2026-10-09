const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Automatically calculate and update a hotel's overall star rating
 * and review count based on all reviews submitted for that hotel.
 */
const updateHotelRating = async (hotelId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
      {
        $group: {
          _id: '$hotelId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    let averageRating = 0;
    let reviewCount = 0;

    if (stats.length > 0) {
      averageRating = Math.round(stats[0].averageRating * 10) / 10;
      reviewCount = stats[0].reviewCount;
    }

    await Hotel.findByIdAndUpdate(hotelId, {
      averageRating,
      reviewCount,
    });

    return { averageRating, reviewCount };
  } catch (err) {
    console.error('Error updating hotel rating:', err);
    return null;
  }
};

/**
 * Check if a booking is completed and service has been provided.
 * Eligibility: Status is 'confirmed' (or 'completed') and eventDate is in the past.
 */
const isBookingEligibleForReview = (booking) => {
  if (!booking) return false;
  const isCompletedStatus =
    booking.status === 'confirmed' || booking.status === 'completed';
  if (!isCompletedStatus) return false;

  const eventDate = new Date(booking.eventDate);
  const now = new Date();
  // Set now to end of day or compare timestamps
  return !Number.isNaN(eventDate.getTime()) && eventDate <= now;
};

/**
 * Customer: Submit a review and star rating.
 * Enforces strict review eligibility: customer must have completed service.
 */
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res
        .status(400)
        .json({ message: 'Star rating must be an integer between 1 and 5' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('hotelId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure booking belongs to the current user
    if (String(booking.customerId) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You can only review your own bookings',
      });
    }

    // Enforce Review Eligibility (Requirement 4)
    if (!isBookingEligibleForReview(booking)) {
      return res.status(400).json({
        message:
          'Review eligibility: You can only submit a review and star rating after your booking is confirmed and the hotel service has been completed (event date has passed).',
      });
    }

    // Check if review already exists for this booking
    let existingReview = await Review.findOne({ bookingId: booking._id });
    if (existingReview) {
      // Update existing review
      existingReview.rating = numRating;
      existingReview.comment = comment ? String(comment).trim() : '';
      await existingReview.save();

      await updateHotelRating(booking.hotelId._id || booking.hotelId);

      const populated = await Review.findById(existingReview._id)
        .populate('customerId', 'fullName avatarUrl')
        .populate('hotelId', 'hotelName city coverImage');

      return res.status(200).json({
        message: 'Review updated successfully',
        review: populated,
      });
    }

    // Create new review
    const review = await Review.create({
      hotelId: booking.hotelId._id || booking.hotelId,
      customerId: req.user._id,
      bookingId: booking._id,
      rating: numRating,
      comment: comment ? String(comment).trim() : '',
    });

    // Automatically calculate & update hotel's overall star rating (Requirement 5)
    await updateHotelRating(booking.hotelId._id || booking.hotelId);

    const populated = await Review.findById(review._id)
      .populate('customerId', 'fullName avatarUrl')
      .populate('hotelId', 'hotelName city coverImage');

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: populated,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({
      message: 'Failed to submit review',
      error: error.message,
    });
  }
};

/**
 * Customer: Update an existing review.
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (String(review.customerId) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You can only update your own review',
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res
          .status(400)
          .json({ message: 'Star rating must be between 1 and 5' });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      review.comment = String(comment).trim();
    }

    await review.save();
    await updateHotelRating(review.hotelId);

    const populated = await Review.findById(review._id)
      .populate('customerId', 'fullName avatarUrl')
      .populate('hotelId', 'hotelName city coverImage');

    return res.status(200).json({
      message: 'Review updated successfully',
      review: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

/**
 * Customer or Admin: Delete a review.
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const isOwner = String(review.customerId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'You are not authorized to delete this review',
      });
    }

    const hotelId = review.hotelId;
    await Review.findByIdAndDelete(id);

    await updateHotelRating(hotelId);

    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

/**
 * Public: Get reviews for a specific hotel.
 */
const getHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({ message: 'Invalid hotel ID' });
    }

    const hotel = await Hotel.findById(hotelId).select(
      'hotelName averageRating reviewCount'
    );
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const reviews = await Review.find({ hotelId })
      .populate('customerId', 'fullName avatarUrl')
      .sort({ createdAt: -1 });

    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    });

    return res.status(200).json({
      hotelId: hotel._id,
      hotelName: hotel.hotelName,
      averageRating: hotel.averageRating || 0,
      reviewCount: reviews.length,
      distribution,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
};

/**
 * Customer: Get all reviews submitted by the authenticated customer.
 */
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customerId: req.user._id })
      .populate('hotelId', 'hotelName city address coverImage averageRating')
      .populate('bookingId', 'eventDate guestCount bookingAmount status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get customer reviews',
      error: error.message,
    });
  }
};

/**
 * Customer: Get all completed bookings eligible for review,
 * including any review that has already been submitted for them.
 */
const getEligibleBookingsForReview = async (req, res) => {
  try {
    const now = new Date();

    // Find confirmed or completed bookings where eventDate <= now
    const bookings = await Booking.find({
      customerId: req.user._id,
      status: { $in: ['confirmed', 'completed'] },
      eventDate: { $lte: now },
    })
      .populate('hotelId', 'hotelName city address coverImage averageRating')
      .populate('hallId', 'hallName pricePerDay images')
      .sort({ eventDate: -1 });

    // Find all reviews written by this customer
    const reviews = await Review.find({ customerId: req.user._id });
    const reviewByBookingId = new Map(
      reviews.map((r) => [String(r.bookingId), r])
    );

    const result = bookings.map((b) => {
      const plain = typeof b.toObject === 'function' ? b.toObject() : b;
      const review = reviewByBookingId.get(String(b._id)) || null;
      return {
        ...plain,
        hasReviewed: Boolean(review),
        review,
      };
    });

    return res.status(200).json({
      count: result.length,
      pendingReviewCount: result.filter((b) => !b.hasReviewed).length,
      bookings: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get eligible bookings',
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getHotelReviews,
  getMyReviews,
  getEligibleBookingsForReview,
  updateHotelRating,
  isBookingEligibleForReview,
};
