const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopifyService');

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
  if (res.locals?.shopify?.session) {
    const session = res.locals.shopify.session;
    return {
      shop: session.shop,
      accessToken: session.accessToken
    };
  }
  
  // Fallback for development
  return {
    shop: process.env.SHOPIFY_SHOP_DOMAIN,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN
  };
}

// Get order by order number and email/phone
router.post('/lookup', async (req, res) => {
  try {
    const { order_number, contact_info } = req.body;
    
    if (!order_number || !contact_info) {
      return res.status(400).json({
        success: false,
        error: 'Order number and contact information are required'
      });
    }
    
    const { shop, accessToken } = getSessionFromRequest(req);
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
    console.error('Error looking up order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all orders (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const { shop, accessToken } = getSessionFromRequest(req);
    const options = {
      limit: parseInt(req.query.limit) || 50,
      status: req.query.status || 'any'
    };
    
    const result = await shopifyService.getOrders(shop, accessToken, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get specific order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shop, accessToken } = getSessionFromRequest(req);
    
    const result = await shopifyService.getOrderById(shop, accessToken, parseInt(orderId));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;