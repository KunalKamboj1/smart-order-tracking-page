/**
 * Smart Order Tracking - Frontend JavaScript
 * Handles order lookup, API calls, and UI updates
 */

class OrderTracker {
  constructor(options = {}) {
    this.shopDomain = options.shopDomain || window.Shopify?.shop || '';
    this.apiBaseUrl = `/apps/smart-order-tracking/api/tracking`;
    this.form = null;
    this.resultsContainer = null;
    this.loadingState = false;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Find tracking forms
    const forms = document.querySelectorAll('.tracking-form, [data-tracking-form]');
    forms.forEach(form => this.bindForm(form));
  }

  bindForm(form) {
    if (!form) return;
    
    this.form = form;
    this.resultsContainer = form.querySelector('.tracking-results') || 
                           document.querySelector('.tracking-results');
    
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Auto-focus first input
    const firstInput = form.querySelector('input[type="text"], input[type="email"], input[type="tel"]');
    if (firstInput) {
      firstInput.focus();
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.loadingState) return;
    
    const formData = new FormData(this.form);
    const orderNumber = formData.get('order_number')?.trim();
    const contactInfo = formData.get('email')?.trim() || formData.get('phone')?.trim();
    
    // Validation
    if (!orderNumber) {
      this.showError('Please enter your order number');
      return;
    }
    
    if (!contactInfo) {
      this.showError('Please enter your email address or phone number');
      return;
    }
    
    // Show loading state
    this.setLoadingState(true);
    
    try {
      const result = await this.lookupOrder(orderNumber, contactInfo);
      
      if (result.success) {
        this.showSuccess(result.order);
        this.recordAnalytics(orderNumber);
      } else {
        this.showError(result.error || 'Order not found or contact information does not match');
      }
    } catch (error) {
      console.error('Tracking lookup error:', error);
      this.showError('Unable to lookup order. Please try again later.');
    } finally {
      this.setLoadingState(false);
    }
  }

  async lookupOrder(orderNumber, contactInfo) {
    const response = await fetch(`${this.apiBaseUrl}/lookup/${this.shopDomain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        order_number: orderNumber,
        contact_info: contactInfo
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  }

  setLoadingState(loading) {
    this.loadingState = loading;
    
    const submitBtn = this.form.querySelector('button[type="submit"], input[type="submit"]');
    const loadingIndicator = this.form.querySelector('.loading-indicator');
    
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Looking up...' : 'Track Order';
    }
    
    if (loadingIndicator) {
      loadingIndicator.style.display = loading ? 'block' : 'none';
    }
    
    // Add loading class to form
    this.form.classList.toggle('loading', loading);
  }

  showSuccess(order) {
    if (!this.resultsContainer) return;
    
    const hasTracking = order.fulfillments && order.fulfillments.length > 0;
    
    let html = `
      <div class="tracking-success">
        <div class="order-info">
          <h3>Order ${order.name || order.order_number}</h3>
          <p class="order-date">Placed on ${this.formatDate(order.created_at)}</p>
          <p class="order-status">
            <span class="status-badge status-${order.fulfillment_status}">
              ${this.formatStatus(order.fulfillment_status)}
            </span>
          </p>
        </div>
    `;
    
    if (hasTracking) {
      html += '<div class="tracking-info">';
      order.fulfillments.forEach(fulfillment => {
        html += `
          <div class="fulfillment">
            <h4>Shipment Details</h4>
            ${fulfillment.tracking_company ? `<p><strong>Carrier:</strong> ${fulfillment.tracking_company}</p>` : ''}
            ${fulfillment.tracking_number ? `<p><strong>Tracking Number:</strong> ${fulfillment.tracking_number}</p>` : ''}
            ${fulfillment.tracking_url ? `<p><a href="${fulfillment.tracking_url}" target="_blank" class="tracking-link">Track Package</a></p>` : ''}
            <p class="fulfillment-date">Shipped on ${this.formatDate(fulfillment.created_at)}</p>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += `
        <div class="no-tracking">
          <p>Your order has been received and is being processed. You'll receive tracking information once it ships.</p>
        </div>
      `;
    }
    
    // Add line items
    if (order.line_items && order.line_items.length > 0) {
      html += '<div class="order-items"><h4>Items Ordered</h4><ul>';
      order.line_items.forEach(item => {
        html += `<li>${item.quantity}x ${item.title}</li>`;
      });
      html += '</ul></div>';
    }
    
    html += '</div>';
    
    this.resultsContainer.innerHTML = html;
    this.resultsContainer.style.display = 'block';
    
    // Scroll to results
    this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showError(message) {
    if (!this.resultsContainer) return;
    
    this.resultsContainer.innerHTML = `
      <div class="tracking-error">
        <p class="error-message">${message}</p>
        <p class="error-help">Please check your order number and contact information, then try again.</p>
      </div>
    `;
    this.resultsContainer.style.display = 'block';
  }

  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  formatStatus(status) {
    const statusMap = {
      'fulfilled': 'Shipped',
      'partial': 'Partially Shipped',
      'unfulfilled': 'Processing',
      'pending': 'Pending',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
  }

  async recordAnalytics(orderNumber) {
    try {
      await fetch(`${this.apiBaseUrl}/analytics/${this.shopDomain}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_number: orderNumber,
          page_type: 'tracking_lookup'
        })
      });
    } catch (error) {
      // Analytics failure shouldn't affect user experience
      console.warn('Analytics recording failed:', error);
    }
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.OrderTracker = OrderTracker;
  
  // Auto-initialize if tracking forms are present
  const autoInit = () => {
    const trackingForms = document.querySelectorAll('.tracking-form, [data-tracking-form]');
    if (trackingForms.length > 0) {
      new OrderTracker();
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderTracker;
}