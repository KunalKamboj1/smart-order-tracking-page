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
    'https://tracking-app-frontend.loca.lt',
    process.env.FRONTEND_URL
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

// Orders endpoint
app.get('/api/orders', (req, res) => {
  res.json({
    orders: [
      {
        id: '1001',
        orderNumber: '#SO1001',
        customerName: 'John Doe',
        status: 'shipped',
        trackingNumber: 'TRK123456789',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '1002',
        orderNumber: '#SO1002',
        customerName: 'Jane Smith',
        status: 'processing',
        trackingNumber: null,
        createdAt: '2024-01-16T14:30:00Z'
      }
    ]
  });
});

// Tracking endpoint
app.get('/api/tracking/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  res.json({
    orderNumber,
    status: 'shipped',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-01-20',
    trackingEvents: [
      { date: '2024-01-15', status: 'Order placed', location: 'Online' },
      { date: '2024-01-16', status: 'Processing', location: 'Warehouse' },
      { date: '2024-01-17', status: 'Shipped', location: 'Distribution Center' },
      { date: '2024-01-18', status: 'In transit', location: 'Local facility' }
    ]
  });
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
  
  app.get('*', (req, res) => {
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