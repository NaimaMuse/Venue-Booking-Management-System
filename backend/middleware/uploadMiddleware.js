const fs = require('fs');
const path = require('path');
const multer = require('multer');

const hallsUploadDir = path.join(__dirname, '..', 'uploads', 'halls');
const avatarsUploadDir = path.join(__dirname, '..', 'uploads', 'avatars');

fs.mkdirSync(hallsUploadDir, { recursive: true });
fs.mkdirSync(avatarsUploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
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

const hallMediaFileFilter = (_req, file, cb) => {
  if (file.fieldname === 'images' && ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }

  if (file.fieldname === 'video' && ALLOWED_VIDEO_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }

  const err = new Error(
    file.fieldname === 'video'
      ? 'Only MP4, WEBM, or MOV videos are allowed'
      : 'Only jpeg, png, and webp images are allowed'
  );
  err.status = 400;
  return cb(err, false);
};

/**
 * Multipart fields:
 * - `images` up to 5 files
 * - `video` up to 1 file
 */
const uploadHallMedia = multer({
  storage: hallImageStorage,
  fileFilter: hallMediaFileFilter,
  limits: {
    files: 6,
    fileSize: 25 * 1024 * 1024, // allow one short hall video
  },
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const avatarFileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }
  const err = new Error('Only jpeg, png, and webp images are allowed');
  err.status = 400;
  return cb(err, false);
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadHallMedia,
  uploadAvatar,
  hallsUploadDir,
  avatarsUploadDir,
};
