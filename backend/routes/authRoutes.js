const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  adminAvailable,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/admin-available', adminAvailable);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.patch('/profile', protect, uploadAvatar.single('avatar'), updateProfile);

module.exports = router;
