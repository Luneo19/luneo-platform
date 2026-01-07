/**
 * Luneo Customizer - Helper Script
 * Utilitaires pour l'intégration Shopify
 */

(function() {
  'use strict';
  
  // Check if running in Shopify theme
  if (typeof Shopify === 'undefined') {
    console.warn('Luneo: Shopify object not found');
    return;
  }
  
  // Helper function to get product variant
  window.LuneoShopify = {
    getCurrentVariant: function() {
      if (typeof window.currentVariant !== 'undefined') {
        return window.currentVariant;
      }
      
      // Try to get from variant selector
      const variantSelect = document.querySelector('[name="id"]');
      if (variantSelect) {
        return parseInt(variantSelect.value, 10);
      }
      
      // Try to get from first available variant
      const firstVariant = document.querySelector('[data-variant-id]');
      if (firstVariant) {
        return parseInt(firstVariant.dataset.variantId, 10);
      }
      
      return null;
    },
    
    getProductId: function() {
      const productIdMeta = document.querySelector('meta[property="product:retailer_item_id"]');
      if (productIdMeta) {
        return productIdMeta.content;
      }
      
      // Try to get from data attribute
      const productElement = document.querySelector('[data-product-id]');
      if (productElement) {
        return productElement.dataset.productId;
      }
      
      return null;
    },
    
    addToCart: function(variantId, quantity, properties) {
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: quantity || 1,
            properties: properties || {},
          }],
        }),
      })
      .then(response => response.json())
      .then(data => {
        // Dispatch cart update event
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
        return data;
      });
    },
    
    updateCartItem: function(key, quantity, properties) {
      return fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            [key]: quantity,
          },
          attributes: properties || {},
        }),
      })
      .then(response => response.json());
    },
  };
  
  // Listen for variant changes
  document.addEventListener('change', function(e) {
    if (e.target.name === 'id' || e.target.closest('[name="id"]')) {
      document.dispatchEvent(new CustomEvent('variant:changed', {
        detail: { variantId: e.target.value }
      }));
    }
  });
  
  console.log('Luneo Shopify helpers loaded');
})();





