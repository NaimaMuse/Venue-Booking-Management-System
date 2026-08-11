const fs = require('fs');
const path = require('path');
const multer = require('multer');

const hallsUploadDir = path.join(__dirname, '..', 'uploads', 'halls');

fs.mkdirSync(hallsUploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const hallImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, hallsUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }

  const err = new Error('Only jpeg, png, and webp images are allowed');
  err.status = 400;
  return cb(err, false);
};

/**
 * Multipart field name: `images` (up to 5 files).
 */
const uploadHallImages = multer({
  storage: hallImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
});

module.exports = {
  uploadHallImages,
  hallsUploadDir,
};
