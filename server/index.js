const express = require('express');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { shopifyApp } = require('@shopify/shopify-app-express');
const { SQLiteSessionStorage } = require('@shopify/shopify-app-session-storage-sqlite');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

require('@shopify/shopify-api/adapters/node');
// Load environment variables
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '../.env.production' });
} else {
  require('dotenv').config({ path: '../.env' });
}

// Fallback for Render deployment - load production env if no NODE_ENV is set
if (!process.env.SHOPIFY_API_KEY) {
  require('dotenv').config({ path: '../.env.production' });
}

// Debug logging for environment variables
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SHOPIFY_API_KEY exists:', !!process.env.SHOPIFY_API_KEY);
console.log('HOST:', process.env.HOST);

const PORT = process.env.PORT || 3001;

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES?.split(',') || ['read_orders', 'write_orders', 'read_fulfillments'],
  hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Initialize session storage
const sessionStorage = new SQLiteSessionStorage('./database.sqlite');

// Initialize Shopify app
const app = express();

// Configure Shopify app middleware
const shopifyAppConfig = {
  api: shopify,
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage,
};

const shopifyAppInstance = shopifyApp(shopifyAppConfig);
console.log('shopifyAppInstance:', typeof shopifyAppInstance);

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Shopify middleware routes
  if (shopifyAppInstance && typeof shopifyAppInstance === 'object') {
    // Custom middleware to handle missing shop parameter for auth
    app.use('/api/auth', (req, res, next) => {
      if (!req.query.shop) {
        // If no shop parameter, check if we have a default or test shop
        const defaultShop = process.env.DEFAULT_SHOP || 'smart-order-tracking.myshopify.com';
        console.log('⚠️ No shop provided in auth request, using default:', defaultShop);
        req.query.shop = defaultShop;
      }
      next();
    });
    
    // Apply auth middleware
    app.use('/api/auth', shopifyAppInstance.auth.begin());
    app.use('/api/auth/callback', shopifyAppInstance.auth.callback());
    
    // Apply webhook processing with empty handlers for now
    app.use('/api/webhooks', shopifyAppInstance.processWebhooks({ webhookHandlers: {} }));
    
    // Apply session validation middleware to all API routes
    app.use('/api/*', shopifyAppInstance.validateAuthenticatedSession());
    
    // Ensure shop parameter is present for all API routes
    app.use('/api/*', (req, res, next) => {
      const shop = req.query.shop || req.headers['x-shopify-shop-domain'];
      
      // Skip validation for auth routes and health check
      if (req.path.startsWith('/api/auth') || req.path === '/api/health') {
        return next();
      }
      
      if (!shop) {
        console.log('⚠️ No shop parameter provided for path:', req.path);
        // Instead of 400 error, redirect to auth
        return res.status(401).json({ 
          success: false, 
          error: 'Shop parameter is required',
          redirectUrl: '/api/auth'
        });
      }
      next();
    });
  }

// Import services
const shopifyService = require('./services/shopifyService');

// No demo data - all data will come from Shopify API

// Helper function to get session from request
async function getSessionFromRequest(req, res) {
  // Try to get from Shopify app session (res.locals is set by shopify middleware)
  if (res?.locals?.shopify?.session) {
    const session = res.locals.shopify.session;
    console.log('✅ Found session in res.locals.shopify');
    return {
      shop: session.shop,
      accessToken: session.accessToken
    };
  }
  
  // Try to get from request session
  if (req.session?.shop && req.session?.accessToken) {
    console.log('✅ Found session in req.session');
    return {
      shop: req.session.shop,
      accessToken: req.session.accessToken
    };
  }
  
  // Try to get from headers or query parameters
  const shop = req.headers['x-shopify-shop-domain'] || req.query.shop;
  const accessToken = req.headers['x-shopify-access-token'] || req.query.access_token;
  
  if (shop && accessToken) {
    console.log('✅ Found shop and accessToken in headers/query');
    return { shop, accessToken };
  }
  
  // Try to get access token from database if we have shop domain
  if (shop) {
    try {
      console.log('🔍 Looking up shop in database:', shop);
      const Database = require('./models/Database');
      await Database.init();
      const shopData = await Database.getShopData(shop);
      if (shopData && shopData.access_token) {
        console.log('✅ Found shop data in database');
        return {
          shop: shop,
          accessToken: shopData.access_token
        };
      } else {
        console.log('❌ Shop found but no access token in database');
      }
    } catch (error) {
      console.error('❌ Error retrieving shop data from database:', error);
    }
  } else {
    console.log('❌ No shop parameter found in request');
  }
  
  return { shop: null, accessToken: null };
}

// API Routes
// Orders endpoint
app.get('/api/orders', async (req, res) => {
  try {
    const { shop, accessToken } = await getSessionFromRequest(req, res);
    
    if (!shop || !accessToken) {
      console.log('⚠️ No valid Shopify session found');
      return res.status(401).json({
        success: false,
        error: 'No valid Shopify session found',
        redirectUrl: `/api/auth?shop=${req.query.shop || req.headers['x-shopify-shop-domain'] || ''}`
      });
    }
    
    const options = {
      limit: parseInt(req.query.limit) || 50,
      status: req.query.status || 'any'
    };
    
    const result = await shopifyService.getOrders(shop, accessToken, options);
    
    if (result.success) {
      res.json({ orders: result.orders });
    } else {
      console.error('❌ Failed to fetch orders:', result.error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch orders',
        redirectUrl: `/api/auth?shop=${req.query.shop || ''}`
      });
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders',
      redirectUrl: `/api/auth?shop=${req.query.shop || ''}`
    });
  }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const { shop, accessToken } = await getSessionFromRequest(req, res);
    const days = parseInt(req.query.days) || 30;
    
    if (!shop || !accessToken) {
      console.log('⚠️ No valid Shopify session found');
      return res.status(401).json({
        success: false,
        error: 'No valid Shopify session found',
        redirectUrl: `/api/auth?shop=${req.query.shop || req.headers['x-shopify-shop-domain'] || ''}`
      });
    }
    
    const result = await shopifyService.getAnalytics(shop, accessToken, { days });
    
    if (result.success) {
      res.json(result);
    } else {
      console.error('❌ Failed to fetch analytics:', result.error);
      res.status(500).json({ success: false, error: 'Failed to fetch analytics data' });
    }
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics data' });
  }
});

// Order lookup endpoint
app.post('/api/orders/lookup', async (req, res) => {
  try {
    const { order_number, contact_info } = req.body;
    const { shop, accessToken } = await getSessionFromRequest(req, res);
    
    if (!order_number || !contact_info) {
      return res.status(400).json({
        success: false,
        error: 'Order number and contact information are required'
      });
    }
    
    if (!shop || !accessToken) {
      console.log('⚠️ No valid Shopify session found');
      return res.status(401).json({
        success: false,
        error: 'No valid Shopify session found'
      });
    }
    
    const result = await shopifyService.findOrderByNumberAndContact(
      shop, 
      accessToken, 
      order_number, 
      contact_info
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('❌ Error looking up order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json({
    trackingPageEnabled: true,
    pageTitle: 'Track Your Order',
    headerMessage: 'Enter your order details below to track your shipment',
    trackingMessage: 'Your order is being processed and will be shipped soon.',
    deliveredMessage: 'Your order has been delivered successfully!',
    supportEmail: 'support@yourstore.com'
  });
});

app.put('/api/settings', (req, res) => {
  console.log('📝 Settings update received:', req.body);
  res.json({
    success: true,
    message: 'Settings updated successfully',
    settings: req.body
  });
});

// Legacy API Routes (for compatibility)
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tracking', require('./routes/tracking'));

// Note: Static files are served by Netlify in production
// Frontend and backend are deployed separately

// Root route - redirect to auth with query parameters preserved
app.get('/', (req, res) => {
  // Ensure we have a shop parameter for the auth redirect
  const params = new URLSearchParams(req.query);
  if (!params.has('shop') && req.headers['x-shopify-shop-domain']) {
    params.set('shop', req.headers['x-shopify-shop-domain']);
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';
  res.redirect(`/api/auth${queryString}`);
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasApiKey: !!process.env.SHOPIFY_API_KEY,
      host: process.env.HOST,
      port: process.env.PORT
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Order Tracking app is running on port ${PORT}`);
  console.log(`📱 Admin URL: ${process.env.HOST}/api/auth`);
});

module.exports = app;