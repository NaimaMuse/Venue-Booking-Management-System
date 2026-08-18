require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS: local Vite + CLIENT_URL / CLIENT_URLS + Railway frontends in production ---
const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ].filter(Boolean)
);

const isRailwayFrontendOrigin = (origin) => {
  if (!origin || process.env.NODE_ENV !== 'production') return false;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.up.railway.app') || hostname.endsWith('.railway.app');
  } catch {
    return false;
  }
};

const isLocalViteOrigin = (origin) => {
  try {
    const { hostname, port, protocol } = new URL(origin);
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const vitePort = Number(port);
    return (
      protocol === 'http:' &&
      isLocalHost &&
      vitePort >= 5173 &&
      vitePort <= 5180
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser / same-origin requests (no Origin header)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.has(origin) ||
        isLocalViteOrigin(origin) ||
        isRailwayFrontendOrigin(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded files (avatars, venue images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/halls', require('./routes/hallRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/owner', require('./routes/ownerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler (includes multer upload errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: 'Too many files. Maximum is 5 images.' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum is 5 MB per image.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field. Use field name "images".' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

const startServer = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  try {
    await connectDB(mongoUri);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server listen error:', err.message);
    process.exit(1);
  });
};

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
