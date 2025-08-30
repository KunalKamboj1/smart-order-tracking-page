const axios = require('axios');

class TrackingService {
  constructor() {
    // API keys for different carriers (should be in environment variables)
    this.apiKeys = {
      ups: process.env.UPS_API_KEY,
      fedex: process.env.FEDEX_API_KEY,
      usps: process.env.USPS_API_KEY,
      dhl: process.env.DHL_API_KEY,
    };
  }

  /**
   * Get real-time tracking information from carrier APIs
   * @param {string} carrier - Carrier name
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object>} Tracking information
   */
  async getTrackingInfo(carrier, trackingNumber) {
    if (!carrier || !trackingNumber) {
      return {
        success: false,
        error: 'Carrier and tracking number are required'
      };
    }

    const carrierLower = carrier.toLowerCase();
    
    try {
      switch (true) {
        case carrierLower.includes('ups'):
          return await this.getUPSTracking(trackingNumber);
        case carrierLower.includes('fedex'):
          return await this.getFedExTracking(trackingNumber);
        case carrierLower.includes('usps'):
          return await this.getUSPSTracking(trackingNumber);
        case carrierLower.includes('dhl'):
          return await this.getDHLTracking(trackingNumber);
        default:
          return this.getFallbackTracking(carrier, trackingNumber);
      }
    } catch (error) {
      console.error(`Error fetching tracking for ${carrier}:`, error);
      return this.getFallbackTracking(carrier, trackingNumber);
    }
  }

  /**
   * UPS Tracking API integration
   */
  async getUPSTracking(trackingNumber) {
    if (!this.apiKeys.ups) {
      return this.getFallbackTracking('UPS', trackingNumber);
    }

    try {
      // UPS Tracking API endpoint
      const response = await axios.get(`https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.ups}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const trackInfo = response.data.trackResponse?.shipment?.[0];
      if (trackInfo) {
        return {
          success: true,
          carrier: 'UPS',
          trackingNumber,
          status: this.normalizeStatus(trackInfo.package?.[0]?.currentStatus?.description),
          estimatedDelivery: trackInfo.package?.[0]?.deliveryDate?.[0]?.date,
          location: trackInfo.package?.[0]?.currentStatus?.location?.address?.city,
          trackingUrl: `https://www.ups.com/track?tracknum=${trackingNumber}`,
          events: trackInfo.package?.[0]?.activity?.map(event => ({
            date: event.date,
            time: event.time,
            description: event.status?.description,
            location: event.location?.address?.city
          })) || []
        };
      }
    } catch (error) {
      console.error('UPS API error:', error.message);
    }

    return this.getFallbackTracking('UPS', trackingNumber);
  }

  /**
   * FedEx Tracking API integration
   */
  async getFedExTracking(trackingNumber) {
    if (!this.apiKeys.fedex) {
      return this.getFallbackTracking('FedEx', trackingNumber);
    }

    try {
      // FedEx Track API endpoint
      const response = await axios.post('https://apis.fedex.com/track/v1/trackingnumbers', {
        trackingInfo: [{
          trackingNumberInfo: {
            trackingNumber: trackingNumber
          }
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.fedex}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const trackInfo = response.data.output?.completeTrackResults?.[0]?.trackResults?.[0];
      if (trackInfo) {
        return {
          success: true,
          carrier: 'FedEx',
          trackingNumber,
          status: this.normalizeStatus(trackInfo.latestStatusDetail?.description),
          estimatedDelivery: trackInfo.estimatedDeliveryTimeWindow?.window?.ends,
          location: trackInfo.latestStatusDetail?.scanLocation?.city,
          trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
          events: trackInfo.scanEvents?.map(event => ({
            date: event.date,
            time: event.time,
            description: event.eventDescription,
            location: event.scanLocation?.city
          })) || []
        };
      }
    } catch (error) {
      console.error('FedEx API error:', error.message);
    }

    return this.getFallbackTracking('FedEx', trackingNumber);
  }

  /**
   * USPS Tracking API integration
   */
  async getUSPSTracking(trackingNumber) {
    if (!this.apiKeys.usps) {
      return this.getFallbackTracking('USPS', trackingNumber);
    }

    try {
      // USPS Tracking API endpoint
      const response = await axios.get(`https://secure.shippingapis.com/ShippingAPI.dll`, {
        params: {
          API: 'TrackV2',
          XML: `<TrackRequest USERID="${this.apiKeys.usps}"><TrackID ID="${trackingNumber}"></TrackID></TrackRequest>`
        },
        timeout: 10000
      });

      // Parse XML response (simplified)
      if (response.data.includes('<TrackSummary>')) {
        const summary = response.data.match(/<TrackSummary>(.*?)<\/TrackSummary>/)?.[1];
        return {
          success: true,
          carrier: 'USPS',
          trackingNumber,
          status: this.normalizeStatus(summary),
          trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
          events: []
        };
      }
    } catch (error) {
      console.error('USPS API error:', error.message);
    }

    return this.getFallbackTracking('USPS', trackingNumber);
  }

  /**
   * DHL Tracking API integration
   */
  async getDHLTracking(trackingNumber) {
    if (!this.apiKeys.dhl) {
      return this.getFallbackTracking('DHL', trackingNumber);
    }

    try {
      // DHL Tracking API endpoint
      const response = await axios.get(`https://api-eu.dhl.com/track/shipments`, {
        params: {
          trackingNumber: trackingNumber
        },
        headers: {
          'DHL-API-Key': this.apiKeys.dhl,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const trackInfo = response.data.shipments?.[0];
      if (trackInfo) {
        return {
          success: true,
          carrier: 'DHL',
          trackingNumber,
          status: this.normalizeStatus(trackInfo.status?.description),
          estimatedDelivery: trackInfo.estimatedTimeOfDelivery,
          location: trackInfo.events?.[0]?.location?.address?.addressLocality,
          trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
          events: trackInfo.events?.map(event => ({
            date: event.timestamp?.split('T')[0],
            time: event.timestamp?.split('T')[1]?.split('+')[0],
            description: event.description,
            location: event.location?.address?.addressLocality
          })) || []
        };
      }
    } catch (error) {
      console.error('DHL API error:', error.message);
    }

    return this.getFallbackTracking('DHL', trackingNumber);
  }

  /**
   * Fallback tracking info when API is not available
   */
  getFallbackTracking(carrier, trackingNumber) {
    const trackingUrls = {
      'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      'canada post': `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${trackingNumber}`,
      'royal mail': `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
      'australia post': `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`,
    };

    const carrierLower = carrier.toLowerCase();
    let trackingUrl = null;

    // Find matching URL
    for (const [key, url] of Object.entries(trackingUrls)) {
      if (carrierLower.includes(key) || key.includes(carrierLower)) {
        trackingUrl = url;
        break;
      }
    }

    return {
      success: true,
      carrier,
      trackingNumber,
      status: 'In Transit',
      message: 'Live tracking data not available. Please check the carrier website for updates.',
      trackingUrl: trackingUrl || `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + trackingNumber)}`,
      events: [],
      isLiveData: false
    };
  }

  /**
   * Normalize status across different carriers
   */
  normalizeStatus(status) {
    if (!status) return 'Unknown';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('delivered')) return 'Delivered';
    if (statusLower.includes('out for delivery')) return 'Out for Delivery';
    if (statusLower.includes('in transit') || statusLower.includes('on the way')) return 'In Transit';
    if (statusLower.includes('picked up') || statusLower.includes('collected')) return 'Picked Up';
    if (statusLower.includes('processing') || statusLower.includes('preparing')) return 'Processing';
    if (statusLower.includes('exception') || statusLower.includes('delayed')) return 'Exception';
    if (statusLower.includes('returned')) return 'Returned';
    
    return status; // Return original if no match
  }

  /**
   * Get supported carriers
   */
  getSupportedCarriers() {
    return [
      { name: 'UPS', code: 'ups', hasApi: !!this.apiKeys.ups },
      { name: 'FedEx', code: 'fedex', hasApi: !!this.apiKeys.fedex },
      { name: 'USPS', code: 'usps', hasApi: !!this.apiKeys.usps },
      { name: 'DHL', code: 'dhl', hasApi: !!this.apiKeys.dhl },
      { name: 'Canada Post', code: 'canada_post', hasApi: false },
      { name: 'Royal Mail', code: 'royal_mail', hasApi: false },
      { name: 'Australia Post', code: 'australia_post', hasApi: false }
    ];
  }
}

module.exports = new TrackingService();