const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel');

const ALLOWED_REGISTER_ROLES = ['customer', 'hotel_owner'];

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  avatarUrl: user.avatarUrl || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      role,
      hotelName,
      city,
      address,
      contactPhone,
      description,
    } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    const requestedRole = role || 'customer';
    if (!ALLOWED_REGISTER_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        message: 'Role must be either customer or hotel_owner',
      });
    }

    if (requestedRole === 'hotel_owner') {
      if (!hotelName || !String(hotelName).trim()) {
        return res.status(400).json({ message: 'Hotel name is required' });
      }
      if (!city || !String(city).trim()) {
        return res.status(400).json({ message: 'City is required' });
      }
      if (!address || !String(address).trim()) {
        return res.status(400).json({ message: 'Address is required' });
      }
      if (!contactPhone || !String(contactPhone).trim()) {
        return res.status(400).json({ message: 'Contact phone is required' });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? String(phone).trim() : undefined,
      role: requestedRole,
    });

    if (requestedRole === 'hotel_owner') {
      try {
        await Hotel.create({
          ownerId: user._id,
          hotelName: String(hotelName).trim(),
          city: String(city).trim(),
          address: String(address).trim(),
          contactPhone: String(contactPhone).trim(),
          description: description ? String(description).trim() : '',
          verificationStatus: 'pending',
          rejectionReason: '',
        });
      } catch (hotelError) {
        await User.findByIdAndDelete(user._id).catch(() => null);
        throw hotelError;
      }
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(user),
      awaitingApproval: requestedRole === 'hotel_owner',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me — protect middleware required
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
};

const removeLocalAvatar = (avatarUrl) => {
  if (!avatarUrl || !String(avatarUrl).startsWith('/uploads/avatars/')) {
    return;
  }

  const filePath = path.join(
    __dirname,
    '..',
    'uploads',
    'avatars',
    path.basename(avatarUrl)
  );
  fs.unlink(filePath, () => {});
};

/**
 * PUT /api/auth/profile — protect middleware required
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { fullName, email, phone, password } = req.body;

    if (fullName !== undefined) {
      if (!String(fullName).trim()) {
        return res.status(400).json({ message: 'Full name is required' });
      }
      user.fullName = String(fullName).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email' });
      }

      const taken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (taken) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (password && String(password).trim()) {
      if (String(password).trim().length < 6) {
        return res
          .status(400)
          .json({ message: 'Password must be at least 6 characters' });
      }
      user.password = await bcrypt.hash(String(password).trim(), 10);
    }

    if (req.file) {
      removeLocalAvatar(user.avatarUrl);
      user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
};

/**
 * GET /api/auth/admin-available
 */
const adminAvailable = async (_req, res) => {
  try {
    const count = await User.countDocuments({ role: 'admin' });
    return res.status(200).json({ adminAvailable: count === 0 });
  } catch (error) {
    return res.status(200).json({ adminAvailable: false });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  adminAvailable,
  generateToken,
};
