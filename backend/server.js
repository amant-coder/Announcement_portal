const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require('./config/db');
const { apiRateLimiter } = require('./middleware/rateLimiter');

const courseRoutes = require('./routes/courseRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Clerk authentication context middleware
app.use(clerkMiddleware());

// Apply global rate limiting to API routes
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
    message: 'Ghanshyamdas Saraf College Announcement Portal API is running.',
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
