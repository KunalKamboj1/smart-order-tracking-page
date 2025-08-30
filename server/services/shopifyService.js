const { shopifyApi } = require('@shopify/shopify-api');
const { ApiVersion } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

class ShopifyService {
  constructor() {
    this.shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: process.env.SCOPES?.split(',') || ['read_orders', 'read_fulfillments'],
      hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
      apiVersion: ApiVersion.October23,
      isEmbeddedApp: true,
      logger: {
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      },
    });
  }

  /**
   * Get a GraphQL client for the given shop
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @returns {Object} GraphQL client
   */
  getGraphQLClient(shop, accessToken) {
    return new this.shopify.clients.Graphql({ session: { shop, accessToken } });
  }

  /**
   * Get a REST client for the given shop
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @returns {Object} REST client
   */
  getRestClient(shop, accessToken) {
    return new this.shopify.clients.Rest({ session: { shop, accessToken } });
  }

  /**
   * Find orders by order number and customer contact info
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @param {string} orderNumber - Order number (with or without #)
   * @param {string} contactInfo - Email or phone number
   * @returns {Promise<Object>} Order data with fulfillments
   */
  async findOrderByNumberAndContact(shop, accessToken, orderNumber, contactInfo) {
    try {
      const client = this.getRestClient(shop, accessToken);
      
      // Clean order number (remove # if present)
      const cleanOrderNumber = orderNumber.replace(/^#/, '');
      
      // First, try to find the order by order number
      const ordersResponse = await client.get({
        path: 'orders',
        query: {
          name: cleanOrderNumber,
          status: 'any',
          limit: 10
        }
      });

      if (!ordersResponse.body.orders || ordersResponse.body.orders.length === 0) {
        return { success: false, error: 'Order not found' };
      }

      // Find the order that matches the contact info
      const matchingOrder = ordersResponse.body.orders.find(order => {
        const email = order.email?.toLowerCase();
        const phone = order.phone;
        const contactLower = contactInfo.toLowerCase();
        
        // Check if contact info matches email or phone
        return email === contactLower || phone === contactInfo;
      });

      if (!matchingOrder) {
        return { success: false, error: 'Order not found with provided contact information' };
      }

      // Get fulfillments for this order
      const fulfillments = await this.getOrderFulfillments(shop, accessToken, matchingOrder.id);
      
      return {
        success: true,
        order: {
          id: matchingOrder.id,
          order_number: matchingOrder.order_number,
          name: matchingOrder.name,
          email: matchingOrder.email,
          phone: matchingOrder.phone,
          created_at: matchingOrder.created_at,
          financial_status: matchingOrder.financial_status,
          fulfillment_status: matchingOrder.fulfillment_status,
          total_price: matchingOrder.total_price,
          currency: matchingOrder.currency,
          line_items: matchingOrder.line_items?.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            variant_title: item.variant_title,
            product_id: item.product_id,
            variant_id: item.variant_id
          })),
          fulfillments: fulfillments
        }
      };
    } catch (error) {
      console.error('Error finding order:', error);
      return { success: false, error: 'Failed to search for order' };
    }
  }

  /**
   * Get fulfillments for a specific order
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @param {number} orderId - Order ID
   * @returns {Promise<Array>} Array of fulfillments with tracking info
   */
  async getOrderFulfillments(shop, accessToken, orderId) {
    try {
      const client = this.getRestClient(shop, accessToken);
      
      const fulfillmentsResponse = await client.get({
        path: `orders/${orderId}/fulfillments`
      });

      if (!fulfillmentsResponse.body.fulfillments) {
        return [];
      }

      return fulfillmentsResponse.body.fulfillments.map(fulfillment => ({
        id: fulfillment.id,
        status: fulfillment.status,
        created_at: fulfillment.created_at,
        updated_at: fulfillment.updated_at,
        tracking_company: fulfillment.tracking_company,
        tracking_number: fulfillment.tracking_number,
        tracking_url: fulfillment.tracking_url,
        tracking_urls: fulfillment.tracking_urls,
        shipment_status: fulfillment.shipment_status,
        location_id: fulfillment.location_id,
        line_items: fulfillment.line_items?.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          product_id: item.product_id,
          variant_id: item.variant_id
        }))
      }));
    } catch (error) {
      console.error('Error getting fulfillments:', error);
      return [];
    }
  }

  /**
   * Get all orders for admin dashboard
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Orders data
   */
  async getOrders(shop, accessToken, options = {}) {
    try {
      const client = this.getRestClient(shop, accessToken);
      
      const query = {
        status: options.status || 'any',
        limit: options.limit || 50,
        fields: 'id,order_number,name,email,created_at,financial_status,fulfillment_status,total_price,currency',
        ...options.query
      };

      const ordersResponse = await client.get({
        path: 'orders',
        query
      });

      return {
        success: true,
        orders: ordersResponse.body.orders || [],
        count: ordersResponse.body.orders?.length || 0
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      return { success: false, error: 'Failed to fetch orders' };
    }
  }

  /**
   * Get order details by ID
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Order details with fulfillments
   */
  async getOrderById(shop, accessToken, orderId) {
    try {
      const client = this.getRestClient(shop, accessToken);
      
      const orderResponse = await client.get({
        path: `orders/${orderId}`
      });

      if (!orderResponse.body.order) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderResponse.body.order;
      const fulfillments = await this.getOrderFulfillments(shop, accessToken, orderId);
      
      return {
        success: true,
        order: {
          ...order,
          fulfillments: fulfillments
        }
      };
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return { success: false, error: 'Failed to fetch order details' };
    }
  }

  /**
   * Get recommended products for upselling
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products data
   */
  async getRecommendedProducts(shop, accessToken, options = {}) {
    try {
      const client = this.getRestClient(shop, accessToken);
      
      const query = {
        limit: options.limit || 12,
        published_status: 'published',
        fields: 'id,title,handle,images,variants,product_type,tags',
        ...options.query
      };

      const productsResponse = await client.get({
        path: 'products',
        query
      });

      const products = productsResponse.body.products || [];
      
      // Transform products for frontend consumption
      const transformedProducts = products.map(product => {
        const firstVariant = product.variants?.[0];
        const firstImage = product.images?.[0];
        
        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          product_type: product.product_type,
          tags: product.tags,
          price: firstVariant?.price || '0.00',
          compare_at_price: firstVariant?.compare_at_price,
          featured_image: firstImage?.src || null,
          url: `/products/${product.handle}`,
          available: firstVariant?.inventory_quantity > 0 || firstVariant?.inventory_policy === 'continue'
        };
      });

      return {
        success: true,
        products: transformedProducts
      };
    } catch (error) {
      console.error('Error getting recommended products:', error);
      return { success: false, error: 'Failed to fetch products' };
    }
  }

  /**
   * Get shop information
   * @param {string} shop - Shop domain
   * @param {string} accessToken - Shop access token
   * @returns {Promise<Object>} Shop data
   */
  async getShopInfo(shop, accessToken) {
    try {
      const client = this.getRestClient(shop, accessToken);
      
      const shopResponse = await client.get({
        path: 'shop'
      });

      return {
        success: true,
        shop: shopResponse.body.shop
      };
    } catch (error) {
      console.error('Error getting shop info:', error);
      return { success: false, error: 'Failed to fetch shop information' };
    }
  }

  /**
   * Validate webhook
   * @param {string} body - Raw webhook body
   * @param {string} signature - Webhook signature header
   * @returns {boolean} Whether webhook is valid
   */
  validateWebhook(body, signature) {
    try {
      return this.shopify.webhooks.validate({
        rawBody: body,
        headers: { 'x-shopify-hmac-sha256': signature }
      });
    } catch (error) {
      console.error('Error validating webhook:', error);
      return false;
    }
  }

  /**
   * Create a tracking URL for common carriers
   * @param {string} carrier - Carrier name
   * @param {string} trackingNumber - Tracking number
   * @returns {string|null} Tracking URL or null if carrier not supported
   */
  createTrackingUrl(carrier, trackingNumber) {
    if (!carrier || !trackingNumber) return null;
    
    const carrierLower = carrier.toLowerCase();
    const trackingUrls = {
      'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      'canada post': `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${trackingNumber}`,
      'royal mail': `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
      'australia post': `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`,
    };
    
    // Try exact match first
    if (trackingUrls[carrierLower]) {
      return trackingUrls[carrierLower];
    }
    
    // Try partial matches
    for (const [key, url] of Object.entries(trackingUrls)) {
      if (carrierLower.includes(key) || key.includes(carrierLower)) {
        return url;
      }
    }
    
    return null;
  }
}

module.exports = new ShopifyService();