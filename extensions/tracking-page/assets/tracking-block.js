/**
 * Smart Order Tracking Block JavaScript
 * Handles order lookup functionality for the tracking block
 */

class TrackingBlock {
  constructor(blockId) {
    this.blockId = blockId;
    this.form = document.getElementById(`tracking-block-form-${blockId}`);
    this.resultsSection = document.getElementById(`tracking-results-${blockId}`);
    this.successSection = document.getElementById(`tracking-success-${blockId}`);
    this.notDispatchedSection = document.getElementById(`tracking-not-dispatched-${blockId}`);
    this.errorSection = document.getElementById(`tracking-error-${blockId}`);
    this.submitBtn = document.getElementById(`track-btn-${blockId}`);
    
    if (this.form && this.submitBtn) {
      this.btnText = this.submitBtn.querySelector('.btn-text');
      this.btnLoading = this.submitBtn.querySelector('.btn-loading');
      this.init();
    }
  }

  init() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const orderNumber = document.getElementById(`order-number-${this.blockId}`).value.trim();
    const contactInfo = document.getElementById(`contact-info-${this.blockId}`).value.trim();
    
    if (!orderNumber || !contactInfo) {
      alert('Please fill in all fields');
      return;
    }

    this.showLoading();
    this.hideResults();

    try {
      const response = await fetch(`/api/tracking/lookup/${Shopify.shop}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          email: contactInfo.includes('@') ? contactInfo : null,
          phone: !contactInfo.includes('@') ? contactInfo : null
        })
      });

      const data = await response.json();
      
      this.resultsSection.style.display = 'block';
      
      if (data.success && data.order) {
        if (data.order.fulfillments && data.order.fulfillments.length > 0) {
          this.displayTrackingInfo(data.order);
          this.successSection.style.display = 'block';
        } else {
          this.displayOrderSummary(data.order);
          this.notDispatchedSection.style.display = 'block';
        }
        
        // Load recommended products if container exists
        const recommendedContainer = document.getElementById(`recommended-products-${this.blockId}`);
        if (recommendedContainer) {
          this.loadRecommendedProducts();
        }
        
        // Record analytics
        this.recordAnalytics({
          event: 'order_lookup_success',
          order_number: orderNumber,
          has_tracking: data.order.fulfillments && data.order.fulfillments.length > 0
        });
      } else {
        this.errorSection.style.display = 'block';
        
        // Record analytics for failed lookup
        this.recordAnalytics({
          event: 'order_lookup_failed',
          order_number: orderNumber,
          error: data.error || 'Order not found'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      this.resultsSection.style.display = 'block';
      this.errorSection.style.display = 'block';
      
      // Record analytics for error
      this.recordAnalytics({
        event: 'order_lookup_error',
        order_number: orderNumber,
        error: error.message
      });
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.btnText.style.display = 'none';
    this.btnLoading.style.display = 'inline';
  }

  hideLoading() {
    this.submitBtn.disabled = false;
    this.btnText.style.display = 'inline';
    this.btnLoading.style.display = 'none';
  }

  hideResults() {
    this.resultsSection.style.display = 'none';
    this.successSection.style.display = 'none';
    this.notDispatchedSection.style.display = 'none';
    this.errorSection.style.display = 'none';
  }

  displayTrackingInfo(order) {
    const detailsContainer = document.getElementById(`tracking-details-${this.blockId}`);
    if (!detailsContainer) return;
    
    detailsContainer.innerHTML = '';
    
    order.fulfillments.forEach(fulfillment => {
      const trackingDiv = document.createElement('div');
      trackingDiv.className = 'tracking-detail';
      
      let trackingContent = `
        <div>
          <strong>Carrier:</strong> ${fulfillment.tracking_company || 'N/A'}<br>
          <strong>Tracking Number:</strong> ${fulfillment.tracking_number || 'N/A'}
        </div>
      `;
      
      if (fulfillment.tracking_url) {
        trackingContent += `
          <div>
            <a href="${fulfillment.tracking_url}" target="_blank" class="tracking-link">
              Track Package →
            </a>
          </div>
        `;
      }
      
      trackingDiv.innerHTML = trackingContent;
      detailsContainer.appendChild(trackingDiv);
    });
  }

  displayOrderSummary(order) {
    const summaryContainer = document.getElementById(`order-summary-${this.blockId}`);
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = `
      <div style="margin-top: 1rem; padding: 1rem; background: white; border-radius: 6px;">
        <strong>Order #${order.order_number}</strong><br>
        <span style="color: #666;">Placed on ${new Date(order.created_at).toLocaleDateString()}</span>
      </div>
    `;
  }

  async loadRecommendedProducts() {
    try {
      const response = await fetch(`/apps/smart-order-tracking/api/tracking/products/${Shopify.shop}`);
      const data = await response.json();
      
      if (data.success && data.products) {
        this.displayRecommendedProducts(data.products);
        document.getElementById(`recommended-products-${this.blockId}`).style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading recommended products:', error);
    }
  }

  displayRecommendedProducts(products) {
    const gridContainer = document.getElementById(`products-grid-${this.blockId}`);
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    // Get max products from block settings (default 4)
    const maxProducts = parseInt(gridContainer.dataset.maxProducts) || 4;
    
    products.slice(0, maxProducts).forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.innerHTML = `
        <img src="${product.featured_image}" alt="${product.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; line-height: 1.2;">${product.title}</h4>
        <p style="font-weight: 600; margin-bottom: 0.5rem;">$${product.price}</p>
        <a href="${product.url}" style="display: inline-block; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-size: 0.8rem; transition: all 0.2s;">View Product</a>
      `;
      gridContainer.appendChild(productCard);
    });
  }

  recordAnalytics(data) {
    // Send analytics data to the backend
    fetch('/apps/smart-order-tracking/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        block_id: this.blockId
      })
    }).catch(error => {
      console.error('Analytics error:', error);
    });
  }
}

// Initialize tracking blocks when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Find all tracking block forms and initialize them
  const trackingForms = document.querySelectorAll('[id^="tracking-block-form-"]');
  
  trackingForms.forEach(form => {
    const blockId = form.id.replace('tracking-block-form-', '');
    new TrackingBlock(blockId);
  });
});