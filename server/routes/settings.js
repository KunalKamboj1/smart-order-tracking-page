const express = require('express');
const router = express.Router();
const Database = require('../models/Database');

// Get merchant settings
router.get('/', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shopDomain = session.shop;
    const settings = await Database.getSettings(shopDomain);
    
    // Return default settings if none exist
    const defaultSettings = {
      shopDomain,
      trackingPageEnabled: true,
      trackingBlockEnabled: false,
      pageTitle: 'Track Your Order',
      notDispatchedMessage: 'Your order has not been dispatched yet. We will notify you once it ships.',
      trackingFoundMessage: 'Your tracking information:',
      showRecommendedProducts: false,
      showFaq: false,
      customFaqText: '',
      bannerText: '',
      logoUrl: '',
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      buttonColor: '#007ace',
      buttonTextColor: '#ffffff',
      fontFamily: 'inherit',
      borderRadius: '4px',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: settings || defaultSettings });
    
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      message: error.message 
    });
  }
});

// Update merchant settings
router.put('/', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shopDomain = session.shop;
    const settingsData = {
      ...req.body,
      shopDomain,
      updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!settingsData.pageTitle) {
      return res.status(400).json({ error: 'Page title is required' });
    }

    const settings = await Database.updateSettings(shopDomain, settingsData);
    
    res.json({ 
      message: 'Settings updated successfully',
      settings 
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      message: error.message 
    });
  }
});

// Reset settings to default
router.post('/reset', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shopDomain = session.shop;
    
    const defaultSettings = {
      shopDomain,
      trackingPageEnabled: true,
      trackingBlockEnabled: false,
      pageTitle: 'Track Your Order',
      notDispatchedMessage: 'Your order has not been dispatched yet. We will notify you once it ships.',
      trackingFoundMessage: 'Your tracking information:',
      showRecommendedProducts: false,
      showFaq: false,
      customFaqText: '',
      bannerText: '',
      logoUrl: '',
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      buttonColor: '#007ace',
      buttonTextColor: '#ffffff',
      fontFamily: 'inherit',
      borderRadius: '4px',
      updatedAt: new Date().toISOString()
    };

    const settings = await Database.updateSettings(shopDomain, defaultSettings);
    
    res.json({ 
      message: 'Settings reset to default successfully',
      settings 
    });
    
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ 
      error: 'Failed to reset settings',
      message: error.message 
    });
  }
});

// Upload logo
router.post('/upload-logo', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { logoData, fileName } = req.body;
    
    if (!logoData) {
      return res.status(400).json({ error: 'Logo data is required' });
    }

    // In a real implementation, you would upload to a file storage service
    // For now, we'll just store the base64 data
    const logoUrl = logoData;
    
    const shopDomain = session.shop;
    await Database.updateSettings(shopDomain, { 
      logoUrl,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Logo uploaded successfully',
      logoUrl 
    });
    
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ 
      error: 'Failed to upload logo',
      message: error.message 
    });
  }
});

// Get app analytics
router.get('/analytics', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { period = '30d' } = req.query;
    const days = parseInt(period.replace('d', ''));
    
    // Get real analytics data from database
    const analyticsData = await Database.getAnalytics(session.shop, days);
    
    // Get top searched orders
    const topOrders = await Database.getTopSearchedOrders(session.shop, days);
    
    const analytics = {
      totalTrackingViews: analyticsData.totalViews,
      uniqueVisitors: analyticsData.uniqueVisitors,
      topSearchedOrders: topOrders,
      conversionRate: analyticsData.totalViews > 0 ? 
        Math.round((analyticsData.uniqueOrders / analyticsData.totalViews) * 100 * 100) / 100 : 0,
      period: period
    };
    
    res.json({ analytics });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
});

module.exports = router;