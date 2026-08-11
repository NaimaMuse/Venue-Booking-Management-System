const mongoose = require('mongoose');

const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'confirmed',
  'cancelled',
  'rejected',
];

const appointmentSchema = new mongoose.Schema(
  {
    scheduledDate: {
      type: Date,
    },
    locationNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: [true, 'Hall is required'],
    },
    // Denormalized for faster owner/admin queries
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel is required'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Guest count must be at least 1'],
    },
    specialNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message:
          'Status must be pending, accepted, confirmed, cancelled, or rejected',
      },
      default: 'pending',
    },
    depositPaid: {
      type: Boolean,
      default: false,
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: [0, 'Deposit amount cannot be negative'],
    },
    agreementNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Agreement notes cannot exceed 2000 characters'],
    },
    // Embedded inspection visit — not a separate Appointment collection
    appointment: {
      type: appointmentSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

// Conflict checks: one active booking per hall per event date
bookingSchema.index({ hallId: 1, eventDate: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
