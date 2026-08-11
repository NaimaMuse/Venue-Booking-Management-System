const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel reference is required'],
    },
    hallName: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
      maxlength: [150, 'Hall name cannot exceed 150 characters'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price per day cannot be negative'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

hallSchema.index({ hotelId: 1 });
hallSchema.index({ capacity: 1 });
hallSchema.index({ pricePerDay: 1 });
hallSchema.index({ hotelId: 1, isAvailable: 1 });

module.exports = mongoose.model('Hall', hallSchema);
