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
    bookingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Booking amount cannot be negative'],
    },
    commissionRate: {
      type: Number,
      default: 0.05,
      min: [0, 'Commission rate cannot be negative'],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, 'Platform fee cannot be negative'],
    },
    ownerAmount: {
      type: Number,
      default: 0,
      min: [0, 'Owner amount cannot be negative'],
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

const round2 = (val) => Math.round((Number(val) || 0) * 100) / 100;

const calculateCommission = (bookingAmount, rate = 0.05) => {
  const amount = round2(bookingAmount);
  const platformFee = round2(amount * rate);
  const ownerAmount = round2(amount - platformFee);
  return {
    bookingAmount: amount,
    commissionRate: rate,
    platformFee,
    ownerAmount,
  };
};

// Automatically calculate 5% platform fee and 95% owner amount before save
bookingSchema.pre('save', function (next) {
  if ((!this.bookingAmount || this.bookingAmount === 0) && this.depositAmount > 0) {
    this.bookingAmount = this.depositAmount;
  }
  const base = this.bookingAmount || this.depositAmount || 0;
  const rate =
    this.commissionRate !== undefined && this.commissionRate !== null
      ? this.commissionRate
      : 0.05;
  const computed = calculateCommission(base, rate);
  this.platformFee = computed.platformFee;
  this.ownerAmount = computed.ownerAmount;
  if (typeof next === 'function') {
    next();
  }
});

// Conflict checks: one active booking per hall per event date
bookingSchema.index({ hallId: 1, eventDate: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.calculateCommission = calculateCommission;
