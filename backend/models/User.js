const mongoose = require('mongoose');

const ROLES = ['customer', 'hotel_owner', 'admin'];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // Store bcrypt hash from the auth controller — do not put plaintext here
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be customer, hotel_owner, or admin',
      },
      default: 'customer',
      required: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    // Shown once after hotel approval for hotel_owner accounts
    hasSeenApprovalAlert: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
