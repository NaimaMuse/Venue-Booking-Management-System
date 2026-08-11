const mongoose = require('mongoose');

const HOTEL_STATUSES = ['pending', 'approved', 'rejected'];

const hotelSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hotel owner is required'],
    },
    hotelName: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
      maxlength: [150, 'Hotel name cannot exceed 150 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      default: 'Hargeisa',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: HOTEL_STATUSES,
        message: 'Status must be pending, approved, or rejected',
      },
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

hotelSchema.index({ ownerId: 1 });
hotelSchema.index({ city: 1 });
hotelSchema.index({ verificationStatus: 1 });
hotelSchema.index({ ownerId: 1, verificationStatus: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
module.exports.HOTEL_STATUSES = HOTEL_STATUSES;
