const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    'https://smartordertracking.netlify.app'
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test environment variables
console.log('🚀 Starting Shopify Tracking App Server');
console.log('Environment variables:');
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ Not set');
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? '✅ Set' : '❌ Not set');
console.log('HOST:', process.env.HOST);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Shopify Tracking App Server is running',
    timestamp: new Date().toISOString(),
    environment: {
      shopifyApiKey: process.env.SHOPIFY_API_KEY ? 'Set' : 'Not set',
      host: process.env.HOST,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Analytics endpoint - real data from Shopify orders
app.get('/api/analytics', async (req, res) => {
  try {
    const { shop, accessToken } = getSessionFromRequest(req);
    const { days = 30 } = req.query;
    
    if (!shop || !accessToken) {
      console.log('⚠️ No valid Shopify session found');
      return res.status(401).json({
        success: false,
        error: 'No valid Shopify session found'
      });
          ],
          financialStatuses: Object.entries(financialStatuses).map(([status, count]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count,
            percentage: totalOrders > 0 ? Math.round((count / totalOrders * 100) * 100) / 100 : 0
          })),
          trends,
          summary: {
            period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            totalOrders,
            totalRevenue,
            fulfillmentRate
          }
        }
      });
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    // Get orders for the specified period
    const ordersResult = await shopifyService.getOrders(shop, accessToken, {
      created_at_min: startDate.toISOString(),
      created_at_max: endDate.toISOString(),
      limit: 250,
      status: 'any'
    });
    
    if (!ordersResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders for analytics'
      });
    }
    
    const orders = ordersResult.orders || [];
    
    // Calculate analytics metrics
    const totalOrders = orders.length;
    const fulfilledOrders = orders.filter(order => order.fulfillment_status === 'fulfilled').length;
    const partiallyFulfilledOrders = orders.filter(order => order.fulfillment_status === 'partial').length;
    const unfulfilledOrders = orders.filter(order => order.fulfillment_status === null || order.fulfillment_status === 'unfulfilled').length;
    
    // Calculate fulfillment rate
    const fulfillmentRate = totalOrders > 0 ? ((fulfilledOrders + partiallyFulfilledOrders) / totalOrders * 100) : 0;
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    
    // Group orders by status
    const orderStatuses = [
      { status: 'Fulfilled', count: fulfilledOrders, percentage: totalOrders > 0 ? (fulfilledOrders / totalOrders * 100) : 0 },
      { status: 'Partially Fulfilled', count: partiallyFulfilledOrders, percentage: totalOrders > 0 ? (partiallyFulfilledOrders / totalOrders * 100) : 0 },
      { status: 'Unfulfilled', count: unfulfilledOrders, percentage: totalOrders > 0 ? (unfulfilledOrders / totalOrders * 100) : 0 }
    ];
    
    // Group orders by financial status
    const financialStatuses = {};
    orders.forEach(order => {
      const status = order.financial_status || 'unknown';
      financialStatuses[status] = (financialStatuses[status] || 0) + 1;
    });
    
    // Daily order trends
    const dailyTrends = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyTrends[date]) {
        dailyTrends[date] = { date, orders: 0, revenue: 0 };
      }
      dailyTrends[date].orders += 1;
      dailyTrends[date].revenue += parseFloat(order.total_price || 0);
    });
    
    const trends = Object.values(dailyTrends).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      analytics: {
        overview: {
          totalOrders,
          fulfilledOrders,
          fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
          period: `${days} days`
        },
        orderStatuses,
        financialStatuses: Object.entries(financialStatuses).map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count,
          percentage: totalOrders > 0 ? Math.round((count / totalOrders * 100) * 100) / 100 : 0
        })),
        trends,
        summary: {
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          totalOrders,
          totalRevenue,
          fulfillmentRate
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
});

// Order lookup endpoint for customer tracking page
app.post('/api/orders/lookup', async (req, res) => {
  try {
    const { order_number, contact_info } = req.body;
    const { shop, accessToken } = getSessionFromRequest(req);
    
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

// Get specific order details
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shop, accessToken } = getSessionFromRequest(req);
    
    if (!shop || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'No valid Shopify session found'
      });
    }
    
    const result = await shopifyService.getOrderById(shop, accessToken, parseInt(orderId));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Settings endpoint
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
    data: req.body
  });
});

// Import services
const shopifyService = require('./services/shopifyService');
const trackingService = require('./services/trackingService');

// Enhanced tracking endpoint with real carrier APIs
app.get('/api/tracking/enhanced/:carrier/:trackingNumber', async (req, res) => {
  try {
    const { carrier, trackingNumber } = req.params;
    
    if (!carrier || !trackingNumber) {
      return res.status(400).json({
        success: false,
        error: 'Carrier and tracking number are required'
      });
    }
    
    console.log(`🚚 Fetching enhanced tracking for ${carrier}: ${trackingNumber}`);
    
    const trackingInfo = await trackingService.getTrackingInfo(carrier, trackingNumber);
    
    res.json({
      success: trackingInfo.success,
      tracking: trackingInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching enhanced tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced tracking information'
    });
  }
});

// Get supported carriers endpoint
app.get('/api/tracking/carriers', (req, res) => {
  try {
    const carriers = trackingService.getSupportedCarriers();
    res.json({
      success: true,
      carriers: carriers
    });
  } catch (error) {
    console.error('❌ Error fetching carriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported carriers'
    });
  }
});

// Helper function to extract session information from request
function getSessionFromRequest(req) {
  // Try to get from Shopify session first
  if (req.session?.shop && req.session?.accessToken) {
    return {
      shop: req.session.shop,
      accessToken: req.session.accessToken
    };
  }
  
  // Try to get from headers (for API calls)
  const shop = req.headers['x-shopify-shop-domain'] || req.query.shop;
  const accessToken = req.headers['x-shopify-access-token'] || req.query.access_token;
  
  if (shop && accessToken) {
    return { shop, accessToken };
  }
  
  // Try to get from Shopify app bridge session
  if (req.session?.shopify) {
    const session = req.session.shopify;
    return {
      shop: session.shop,
      accessToken: session.accessToken
    };
  }
  
  // Return null if no valid session found - don't use env variables for API calls
  return {
    shop: null,
    accessToken: null
  };
}

// Demo orders data for development/testing
const demoOrders = [
  {
    id: 5001234567890,
    order_number: 1001,
    name: '#1001',
    email: 'customer@example.com',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    total_price: '129.99',
    currency: 'USD'
  },
  {
    id: 5001234567891,
    order_number: 1002,
    name: '#1002',
    email: 'john.doe@example.com',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    financial_status: 'paid',
    fulfillment_status: 'partial',
    total_price: '89.50',
    currency: 'USD'
  },
  {
    id: 5001234567892,
    order_number: 1003,
    name: '#1003',
    email: 'jane.smith@example.com',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    financial_status: 'paid',
    fulfillment_status: null,
    total_price: '199.99',
    currency: 'USD'
  },
  {
    id: 5001234567893,
    order_number: 1004,
    name: '#1004',
    email: 'mike.wilson@example.com',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    total_price: '75.25',
    currency: 'USD'
  },
  {
    id: 5001234567894,
    order_number: 1005,
    name: '#1005',
    email: 'sarah.johnson@example.com',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    financial_status: 'pending',
    fulfillment_status: null,
    total_price: '45.00',
    currency: 'USD'
  }
];

// Orders endpoint - now using real Shopify API with demo fallback
app.get('/api/orders', async (req, res) => {
  try {
    const { shop, accessToken } = getSessionFromRequest(req);
    
    if (!shop || !accessToken) {
      console.log('⚠️ No valid Shopify session found');
      return res.status(401).json({
        success: false,
        error: 'No valid Shopify session found'
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
      res.json({ orders: [] });
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.json({ orders: [] });
  }
});

// Tracking endpoint - now using real Shopify API
app.get('/api/tracking/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { shop, accessToken } = getSessionFromRequest(req);
    
    if (!shop || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'No valid Shopify session found'
      });
    }
    
    // Find order by order number
    const result = await shopifyService.getOrders(shop, accessToken, {
      name: orderNumber.replace(/^#/, ''),
      limit: 1
    });
    
    if (!result.success || !result.orders || result.orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const order = result.orders[0];
    
    // Get fulfillments for tracking information
    const fulfillments = await shopifyService.getOrderFulfillments(shop, accessToken, order.id);
    
    // Enhanced tracking with real carrier data
    let enhancedTracking = null;
    if (fulfillments.length > 0 && fulfillments[0].tracking_number && fulfillments[0].tracking_company) {
      try {
        enhancedTracking = await trackingService.getTrackingInfo(
          fulfillments[0].tracking_company,
          fulfillments[0].tracking_number
        );
      } catch (error) {
        console.log('⚠️ Enhanced tracking failed, using basic info:', error.message);
      }
    }
    
    res.json({
      success: true,
      orderNumber: order.name || order.order_number,
      status: order.fulfillment_status || 'unfulfilled',
      trackingNumber: fulfillments.length > 0 ? fulfillments[0].tracking_number : null,
      trackingCompany: fulfillments.length > 0 ? fulfillments[0].tracking_company : null,
      trackingUrl: fulfillments.length > 0 ? fulfillments[0].tracking_url : null,
      fulfillments: fulfillments,
      order: {
        id: order.id,
        created_at: order.created_at,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        total_price: order.total_price,
        currency: order.currency
      },
      // Enhanced tracking data from carrier APIs
      enhancedTracking: enhancedTracking
    });
  } catch (error) {
    console.error('❌ Error fetching tracking info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking information'
    });
  }
});

// Shopify OAuth routes
app.get('/auth', (req, res) => {
  const { shop, hmac, code, state, timestamp } = req.query;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  // Build OAuth URL
  const shopifyApiKey = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SCOPES || 'read_orders,write_orders';
  const redirectUri = `${process.env.HOST}/auth/callback`;
  const nonce = Math.random().toString(36).substring(7);
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${shopifyApiKey}&` +
    `scope=${scopes}&` +
    `redirect_uri=${redirectUri}&` +
    `state=${nonce}`;

  console.log('🔐 Redirecting to Shopify OAuth:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, hmac, shop, state, timestamp } = req.query;
  
  console.log('🔄 OAuth callback received:', { shop, code: code ? 'present' : 'missing' });
  
  if (!code || !shop) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token obtained for shop:', shop);
    
    // Store access token in database
    try {
      const Database = require('./models/Database');
      await Database.init();
      await Database.storeShopData(shop, tokenData.access_token, {
        name: shop,
        email: null
      });
      console.log('✅ Access token stored in database for shop:', shop);
    } catch (dbError) {
      console.error('❌ Error storing access token:', dbError);
    }
    
    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://tracking-app-frontend.loca.lt';
    res.redirect(`${frontendUrl}?shop=${shop}&installed=true`);
    
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.status(500).send('OAuth authentication failed');
  }
});

app.get('/auth/shopify/callback', (req, res) => {
  // Alternative callback route
  res.redirect(`/auth/callback?${new URLSearchParams(req.query).toString()}`);
});

app.get('/api/auth/callback', (req, res) => {
  // API callback route
  res.redirect(`/auth/callback?${new URLSearchParams(req.query).toString()}`);
});

// Root route for app installation
app.get('/', (req, res) => {
  const { shop } = req.query;
  
  if (shop) {
    // Redirect to OAuth if shop parameter is present
    return res.redirect(`/auth?shop=${shop}`);
  }
  
  // Default response
  res.json({
    message: 'Shopify Tracking App Server',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/auth?shop=yourstore.myshopify.com',
      frontend: process.env.FRONTEND_URL
    }
  });
});

// Webhook endpoints
app.post('/api/webhooks/orders/create', (req, res) => {
  console.log('📦 New order webhook received:', req.body);
  res.status(200).send('OK');
});
app.post('/api/webhooks/orders/updated', (req, res) => {
  console.log('📝 Order update webhook received:', req.body);
  res.status(200).send('OK');
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Only serve React app for non-API routes
  app.get('*', (req, res) => {
    // Don't serve React app for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`\n🎉 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Tunnel: ${process.env.HOST}`);
  console.log(`🔗 Health check: ${process.env.HOST}/api/health`);
  console.log(`🔗 OAuth: ${process.env.HOST}/auth?shop=yourstore.myshopify.com`);
  console.log(`\n🛍️  Ready for Shopify integration!`);
});