const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    const dbPath = path.join(__dirname, '../../database.sqlite');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS merchant_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_domain TEXT UNIQUE NOT NULL,
        tracking_page_enabled BOOLEAN DEFAULT 1,
        tracking_block_enabled BOOLEAN DEFAULT 0,
        page_title TEXT DEFAULT 'Track Your Order',
        not_dispatched_message TEXT DEFAULT 'Your order has not been dispatched yet. We will notify you once it ships.',
        tracking_found_message TEXT DEFAULT 'Your tracking information:',
        show_recommended_products BOOLEAN DEFAULT 0,
        show_faq BOOLEAN DEFAULT 0,
        custom_faq_text TEXT DEFAULT '',
        banner_text TEXT DEFAULT '',
        logo_url TEXT DEFAULT '',
        primary_color TEXT DEFAULT '#000000',
        background_color TEXT DEFAULT '#ffffff',
        text_color TEXT DEFAULT '#333333',
        button_color TEXT DEFAULT '#007ace',
        button_text_color TEXT DEFAULT '#ffffff',
        font_family TEXT DEFAULT 'inherit',
        border_radius TEXT DEFAULT '4px',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createAnalyticsTable = `
      CREATE TABLE IF NOT EXISTS tracking_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_domain TEXT NOT NULL,
        order_number TEXT,
        user_agent TEXT,
        ip_address TEXT,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_domain) REFERENCES merchant_settings (shop_domain)
      )
    `;

    this.db.run(createSettingsTable, (err) => {
      if (err) {
        console.error('Error creating merchant_settings table:', err.message);
      } else {
        console.log('merchant_settings table ready');
      }
    });

    this.db.run(createAnalyticsTable, (err) => {
      if (err) {
        console.error('Error creating tracking_analytics table:', err.message);
      } else {
        console.log('tracking_analytics table ready');
      }
    });
  }

  // Get merchant settings
  async getSettings(shopDomain) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM merchant_settings WHERE shop_domain = ?';
      
      this.db.get(query, [shopDomain], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            // Convert database row to camelCase object
            const settings = {
              id: row.id,
              shopDomain: row.shop_domain,
              trackingPageEnabled: Boolean(row.tracking_page_enabled),
              trackingBlockEnabled: Boolean(row.tracking_block_enabled),
              pageTitle: row.page_title,
              notDispatchedMessage: row.not_dispatched_message,
              trackingFoundMessage: row.tracking_found_message,
              showRecommendedProducts: Boolean(row.show_recommended_products),
              showFaq: Boolean(row.show_faq),
              customFaqText: row.custom_faq_text,
              bannerText: row.banner_text,
              logoUrl: row.logo_url,
              primaryColor: row.primary_color,
              backgroundColor: row.background_color,
              textColor: row.text_color,
              buttonColor: row.button_color,
              buttonTextColor: row.button_text_color,
              fontFamily: row.font_family,
              borderRadius: row.border_radius,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
            resolve(settings);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  // Update or create merchant settings
  async updateSettings(shopDomain, settingsData) {
    return new Promise((resolve, reject) => {
      const upsertQuery = `
        INSERT OR REPLACE INTO merchant_settings (
          shop_domain, tracking_page_enabled, tracking_block_enabled,
          page_title, not_dispatched_message, tracking_found_message,
          show_recommended_products, show_faq, custom_faq_text,
          banner_text, logo_url, primary_color, background_color,
          text_color, button_color, button_text_color, font_family,
          border_radius, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        shopDomain,
        settingsData.trackingPageEnabled ? 1 : 0,
        settingsData.trackingBlockEnabled ? 1 : 0,
        settingsData.pageTitle || 'Track Your Order',
        settingsData.notDispatchedMessage || 'Your order has not been dispatched yet.',
        settingsData.trackingFoundMessage || 'Your tracking information:',
        settingsData.showRecommendedProducts ? 1 : 0,
        settingsData.showFaq ? 1 : 0,
        settingsData.customFaqText || '',
        settingsData.bannerText || '',
        settingsData.logoUrl || '',
        settingsData.primaryColor || '#000000',
        settingsData.backgroundColor || '#ffffff',
        settingsData.textColor || '#333333',
        settingsData.buttonColor || '#007ace',
        settingsData.buttonTextColor || '#ffffff',
        settingsData.fontFamily || 'inherit',
        settingsData.borderRadius || '4px',
        new Date().toISOString()
      ];

      this.db.run(upsertQuery, params, function(err) {
        if (err) {
          reject(err);
        } else {
          // Return the updated settings
          resolve({
            id: this.lastID,
            shopDomain,
            ...settingsData,
            updatedAt: new Date().toISOString()
          });
        }
      });
    });
  }

  // Record analytics data
  async recordView(shopDomain, orderNumber, userAgent, ipAddress) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO tracking_analytics (shop_domain, order_number, user_agent, ip_address)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(query, [shopDomain, orderNumber, userAgent, ipAddress], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Get analytics data
  async getAnalytics(shopDomain, days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT ip_address) as unique_visitors,
          COUNT(DISTINCT order_number) as unique_orders
        FROM tracking_analytics 
        WHERE shop_domain = ? 
        AND viewed_at >= datetime('now', '-' || ? || ' days')
      `;

      this.db.get(query, [shopDomain, days], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalViews: row.total_views || 0,
            uniqueVisitors: row.unique_visitors || 0,
            uniqueOrders: row.unique_orders || 0,
            period: `${days}d`
          });
        }
      });
    });
  }

  // Get top searched orders
  async getTopSearchedOrders(shopDomain, days = 30, limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          order_number,
          COUNT(*) as views,
          MAX(viewed_at) as last_viewed
        FROM tracking_analytics 
        WHERE shop_domain = ? 
        AND order_number IS NOT NULL
        AND viewed_at >= datetime('now', '-' || ? || ' days')
        GROUP BY order_number
        ORDER BY views DESC, last_viewed DESC
        LIMIT ?
      `;

      this.db.all(query, [shopDomain, days, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const orders = rows.map(row => ({
            orderNumber: row.order_number,
            views: row.views,
            lastViewed: new Date(row.last_viewed).toISOString().split('T')[0]
          }));
          resolve(orders);
        }
      });
    });
  }

  // Get shop data (access token, etc.)
  async getShopData(shopDomain) {
    return new Promise((resolve, reject) => {
      // For now, this is a placeholder
      // In a real implementation, you'd store shop access tokens after OAuth
      // and retrieve them here for public API calls
      const query = 'SELECT * FROM shop_data WHERE shop_domain = ?';
      
      this.db.get(query, [shopDomain], (err, row) => {
        if (err) {
          // Table might not exist yet - this is expected for now
          resolve(null);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Store shop data (access token, etc.)
  async storeShopData(shopDomain, accessToken, shopData = {}) {
    return new Promise((resolve, reject) => {
      // Create shop_data table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS shop_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_domain TEXT UNIQUE NOT NULL,
          access_token TEXT NOT NULL,
          shop_name TEXT,
          shop_email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.db.run(createTableQuery, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        const insertQuery = `
          INSERT OR REPLACE INTO shop_data 
          (shop_domain, access_token, shop_name, shop_email, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        this.db.run(insertQuery, [
          shopDomain,
          accessToken,
          shopData.name || null,
          shopData.email || null
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;