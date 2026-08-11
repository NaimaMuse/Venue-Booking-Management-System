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

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser / same-origin requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || isRailwayFrontendOrigin(origin)) {
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

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Future route mounts (hotels, venues, bookings, users, …)
// app.use('/api/hotels', require('./routes/hotelRoutes'));
// app.use('/api/venues', require('./routes/venueRoutes'));
// app.use('/api/bookings', require('./routes/bookingRoutes'));

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
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

  const server = app.listen(PORT, () => {
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
