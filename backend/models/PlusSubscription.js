const mongoose = require('mongoose');

const SUBSCRIPTION_STATUSES = [
  'pending_payment',
  'active',
  'expired',
  'cancelled',
];

const PAYMENT_METHODS = [
  'zaad',
  'edahab',
  'telesom',
  'bank_transfer',
  'cash',
  'other',
];

const plusSubscriptionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel is required'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
      required: [true, 'Plan is required'],
    },
    planName: {
      type: String,
      default: 'HallHub Plus (Monthly)',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: SUBSCRIPTION_STATUSES,
        message: 'Status must be pending_payment, active, expired, or cancelled',
      },
      default: 'pending_payment',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'zaad',
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    features: {
      higherSearchPlacement: {
        type: Boolean,
        default: true,
      },
      featuredBadge: {
        type: Boolean,
        default: true,
      },
      homepageFeatured: {
        type: Boolean,
        default: true,
      },
      maxPhotos: {
        type: Number,
        default: 15,
      },
      analyticsBoost: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

plusSubscriptionSchema.index({ hotelId: 1, status: 1 });
plusSubscriptionSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('PlusSubscription', plusSubscriptionSchema);
module.exports.SUBSCRIPTION_STATUSES = SUBSCRIPTION_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
