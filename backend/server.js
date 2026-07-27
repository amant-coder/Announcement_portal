const express = require('express');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require('./config/db');
const { apiRateLimiter } = require('./middleware/rateLimiter');

const courseRoutes = require('./routes/courseRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Disable X-Powered-By header for security obfuscation
app.disable('x-powered-by');

// Enable Helmet HTTP Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API server so static assets/cross-origin calls function smoothly
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Express Body Parsers with DoS-prevention payload size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Attach Clerk authentication context middleware
app.use(clerkMiddleware());

// Apply global rate limiting to API routes (DDoS protection)
app.use('/api', apiRateLimiter);

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Ghanshyamdas Saraf College Announcement Portal API is running cleanly.',
    timestamp: new Date(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Express Error Handler]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server if called directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[Server Running]: http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
