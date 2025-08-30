// API Configuration Utility
// Centralized API endpoint management for consistent usage across the app

// Get the base API URL from environment variables
const getApiBaseUrl = () => {
  // In production, use the environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || '/api';
  }
  
  // In development, use localhost with fallback
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoint builders
export const apiEndpoints = {
  // Settings endpoints
  settings: {
    get: () => `${API_BASE_URL}/settings`,
    update: () => `${API_BASE_URL}/settings`,
  },
  
  // Orders endpoints
  orders: {
    list: () => `${API_BASE_URL}/orders`,
    get: (id) => `${API_BASE_URL}/orders/${id}`,
    update: (id) => `${API_BASE_URL}/orders/${id}`,
  },
  
  // Tracking endpoints
  tracking: {
    get: (trackingNumber) => `${API_BASE_URL}/tracking/${trackingNumber}`,
    update: (trackingNumber) => `${API_BASE_URL}/tracking/${trackingNumber}`,
    enhanced: (carrier, trackingNumber) => `${API_BASE_URL}/tracking/enhanced/${encodeURIComponent(carrier)}/${encodeURIComponent(trackingNumber)}`,
    carriers: () => `${API_BASE_URL}/tracking/carriers`,
  },
  
  // Health check
  health: () => `${API_BASE_URL}/health`,
};

// HTTP client with error handling
export const apiClient = {
  async get(url, options = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async post(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async put(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async delete(url, options = {}) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
};

const api = { API_BASE_URL, apiEndpoints, apiClient };
export default api;