const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — require a valid Bearer JWT and attach the user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized, token invalid or expired',
    });
  }
};

/**
 * Optional auth — attach req.user when a valid token is present; never block.
 */
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || !process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return next();
    }

    const user = await User.findById(userId).select('-password');
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Ignore invalid tokens for public routes
  }

  return next();
};

/**
 * Restrict access to specific roles. Use after protect.
 * Example: authorize('admin', 'hotel_owner')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Role '${req.user.role}' is not allowed`,
    });
  }

  next();
};

module.exports = { protect, optionalProtect, authorize };
