const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const sitesRoutes = require('./routes/sites');
const pricingRoutes = require('./routes/pricing');
const requestsRoutes = require('./routes/requests');

// Mount routes
app.use('/api/admin', authRoutes);
app.use('/api', servicesRoutes);
app.use('/api', sitesRoutes);
app.use('/api', pricingRoutes);
app.use('/api', requestsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'JP Multysurvices API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Initialize database FIRST, then start the server
async function startServer() {
  try {
    await initializeDB();
    app.listen(PORT, () => {
      console.log(`🚀 JP Multysurvices API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
