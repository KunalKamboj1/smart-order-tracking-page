const express = require('express');
const router = express.Router();
const Database = require('../models/Database');
const shopifyService = require('../services/shopifyService');

// Public tracking lookup endpoint (no authentication required)
router.post('/lookup/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { orderNumber, email, phone } = req.body;
    
    if (!orderNumber || (!email && !phone)) {
      return res.status(400).json({ 
        error: 'Order number and email or phone are required' 
      });
    }

    // Get shop settings to verify tracking is enabled
    const settings = await Database.getSettings(shopDomain);
    
    if (!settings || (!settings.trackingPageEnabled && !settings.trackingBlockEnabled)) {
      return res.status(404).json({ error: 'Tracking service not available' });
    }

    // Get shop access token from database
    const accessToken = await getShopAccessToken(shopDomain);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Shop not authorized' });
    }

    // Use Shopify API to lookup order tracking
    const contactInfo = email || phone;
    const result = await shopifyService.findOrderByNumberAndContact(
      shopDomain,
      accessToken,
      orderNumber,
      contactInfo
    );
    
    if (result.success) {
      // Record analytics
      await Database.recordTrackingView(shopDomain, orderNumber, req.get('User-Agent'), req.ip);
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    console.error('Error in public tracking lookup:', error);
    res.status(500).json({ 
      error: 'Failed to lookup tracking information',
      message: 'Please try again later' 
    });
  }
});

// Get tracking page settings for public use
router.get('/settings/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    
    const settings = await Database.getSettings(shopDomain);
    
    if (!settings) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Return only public-facing settings
    const publicSettings = {
      pageTitle: settings.pageTitle,
      notDispatchedMessage: settings.notDispatchedMessage,
      trackingFoundMessage: settings.trackingFoundMessage,
      showRecommendedProducts: settings.showRecommendedProducts,
      showFaq: settings.showFaq,
      customFaqText: settings.customFaqText,
      bannerText: settings.bannerText,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      buttonColor: settings.buttonColor,
      buttonTextColor: settings.buttonTextColor,
      fontFamily: settings.fontFamily,
      borderRadius: settings.borderRadius,
      trackingPageEnabled: settings.trackingPageEnabled,
      trackingBlockEnabled: settings.trackingBlockEnabled
    };
    
    res.json({ settings: publicSettings });
    
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings' 
    });
  }
});

// Get recommended products for upselling
router.get('/products/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { limit = 4 } = req.query;
    
    const settings = await Database.getSettings(shopDomain);
    
    if (!settings || !settings.showRecommendedProducts) {
      return res.json({ products: [] });
    }

    // Get shop access token
    const accessToken = await getShopAccessToken(shopDomain);
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Shop not authorized'
      });
    }
    
    const result = await shopifyService.getRecommendedProducts(
      shopDomain,
      accessToken,
      { limit: parseInt(limit) }
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('Error fetching recommended products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products' 
    });
  }
});

// Record tracking page view (for analytics)
router.post('/analytics/:shopDomain/view', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { order_number, page_type } = req.body;
    
    // Get client IP address
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
      (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    const userAgent = req.get('User-Agent') || '';
    
    // Record the analytics data
    await Database.recordView(shopDomain, order_number, userAgent, ipAddress);
    
    res.json({ message: 'View recorded' });
    
  } catch (error) {
    console.error('Error recording analytics:', error);
    res.status(500).json({ 
      error: 'Failed to record view' 
    });
  }
});

// Record tracking block analytics
router.post('/analytics/track', async (req, res) => {
  try {
    const { event, order_number, block_id, timestamp } = req.body;
    
    // Extract shop domain from referrer or request
    const referrer = req.get('Referer') || '';
    const shopDomain = referrer.match(/https?:\/\/([^.]+)\.myshopify\.com/)?.[1] + '.myshopify.com' || 
                      req.get('X-Shop-Domain') || '';
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain not found' });
    }
    
    // Get client IP address
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
      (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    const userAgent = req.get('User-Agent') || '';
    
    // Only record successful lookups for analytics
    if (event === 'order_lookup_success' && order_number) {
      await Database.recordView(shopDomain, order_number, userAgent, ipAddress);
    }
    
    res.json({ message: 'Analytics recorded' });
    
  } catch (error) {
    console.error('Error recording analytics:', error);
    res.status(500).json({ 
      error: 'Failed to record analytics' 
    });
  }
});

// Helper function to get shop access token from database
async function getShopAccessToken(shopDomain) {
  try {
    // For now, we'll need to implement shop data storage in the database
    // This is a placeholder - in production, you'd store shop access tokens
    // after the OAuth flow and retrieve them here
    const shopData = await Database.getShopData?.(shopDomain);
    return shopData?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
  } catch (error) {
    console.error('Error getting shop access token:', error);
    return process.env.SHOPIFY_ACCESS_TOKEN; // Fallback for development
  }
}

module.exports = router;