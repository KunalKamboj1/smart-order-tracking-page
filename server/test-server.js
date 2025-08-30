const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      hasApiKey: !!process.env.SHOPIFY_API_KEY,
      hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
      hasScopes: !!process.env.SCOPES,
      hasHost: !!process.env.HOST
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const Database = require('./models/Database');
    await Database.init();
    res.json({ status: 'OK', message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Settings endpoint for onboarding
app.put('/api/settings', (req, res) => {
  console.log('Setup data received:', req.body);
  res.json({ 
    status: 'OK', 
    message: 'Setup completed successfully',
    data: req.body 
  });
});

app.get('/api/settings', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Settings retrieved',
    data: {
      storeName: '',
      brandColor: '#6366f1',
      trackingPageUrl: '/tracking',
      emailNotifications: true
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`Database test: http://localhost:${PORT}/api/test-db`);
});

module.exports = app;