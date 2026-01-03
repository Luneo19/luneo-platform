jQuery(document).ready(function($) {
  'use strict';

  // Luneo WooCommerce Widget
  const LuneoWooWidget = {
    widgetLoaded: false,
    widgetUrl: luneoConfig.widgetUrl || 'https://cdn.luneo.app/widget/v1/luneo-widget.iife.js',
    
    init: function() {
      this.setupCustomizeButton();
    },

    setupCustomizeButton: function() {
      const self = this;
      $(document).on('click', '[data-luneo-customize]', function(e) {
        e.preventDefault();
        const productId = $(this).data('product-id');
        const variantId = $(this).data('variant-id') || '';
        self.openCustomizer(productId, variantId);
      });
    },

    loadWidgetScript: function() {
      return new Promise((resolve, reject) => {
        if (window.LuneoWidget) {
          resolve();
          return;
        }
        
        if (this.widgetLoaded) {
          // Wait a bit for script to load
          setTimeout(() => {
            if (window.LuneoWidget) {
              resolve();
            } else {
              reject(new Error('Widget script failed to load'));
            }
          }, 500);
          return;
        }
        
        this.widgetLoaded = true;
        const script = document.createElement('script');
        script.src = this.widgetUrl;
        script.async = true;
        script.onload = () => {
          if (window.LuneoWidget) {
            resolve();
          } else {
            reject(new Error('LuneoWidget not available after script load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load widget script'));
        document.head.appendChild(script);
      });
    },

    openCustomizer: async function(productId, variantId) {
      try {
        await this.loadWidgetScript();
        
        // Create modal
        const modal = $('<div>', {
          id: 'luneo-modal',
          css: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        });
        
        const modalContent = $('<div>', {
          css: {
            background: 'white',
            width: '90%',
            maxWidth: '1200px',
            height: '90%',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden'
          }
        });
        
        const closeBtn = $('<button>', {
          class: 'luneo-modal-close',
          html: '&times;',
          css: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            fontSize: '28px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10
          }
        });
        
        const widgetContainer = $('<div>', {
          id: 'luneo-widget-container',
          css: {
            width: '100%',
            height: '100%'
          }
        });
        
        modalContent.append(closeBtn).append(widgetContainer);
        modal.append(modalContent);
        $('body').append(modal);
        
        // Initialize widget
        window.LuneoWidget.init({
          container: '#luneo-widget-container',
          apiKey: luneoConfig.apiKey,
          productId: productId.toString(),
          locale: luneoConfig.locale || 'en',
          theme: 'light',
          onSave: (designData) => {
            this.addDesignToCart(designData, productId, variantId);
            modal.remove();
          },
          onError: (error) => {
            console.error('Luneo Widget Error:', error);
            alert(luneoConfig.i18n?.error || 'Une erreur est survenue. Veuillez réessayer.');
          },
          onReady: () => {
            console.log('Luneo Widget ready');
          }
        });
        
        // Close handlers
        closeBtn.on('click', () => modal.remove());
        modal.on('click', function(e) {
          if (e.target === this) {
            $(this).remove();
          }
        });
        
      } catch (error) {
        console.error('Luneo: Failed to open customizer:', error);
        alert('Impossible de charger l\'éditeur de personnalisation. Veuillez réessayer.');
      }
    },

    addDesignToCart: function(designData, productId, variantId) {
      const form = $('<form>', {
        method: 'POST',
        action: wc_add_to_cart_params?.wc_ajax_url?.toString().replace('%%endpoint%%', 'add_to_cart') || window.location.href
      });

      form.append($('<input>', { type: 'hidden', name: 'product_id', value: productId }));
      if (variantId) {
        form.append($('<input>', { type: 'hidden', name: 'variation_id', value: variantId }));
      }
      form.append($('<input>', { type: 'hidden', name: 'quantity', value: '1' }));
      form.append($('<input>', { type: 'hidden', name: 'luneo_design_id', value: designData.id || 'temp-' + Date.now() }));
      form.append($('<input>', { type: 'hidden', name: 'luneo_preview_url', value: designData.previewUrl || '' }));
      form.append($('<input>', { type: 'hidden', name: 'luneo_design_data', value: JSON.stringify(designData) }));

      $('body').append(form);
      
      // Use AJAX if available
      if (typeof wc_add_to_cart_params !== 'undefined') {
        $.ajax({
          type: 'POST',
          url: wc_add_to_cart_params.wc_ajax_url.toString().replace('%%endpoint%%', 'add_to_cart'),
          data: form.serialize(),
          success: function(response) {
            if (response.error && response.product_url) {
              window.location = response.product_url;
              return;
            }
            // Trigger cart update
            $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $('button[name="add-to-cart"]')]);
            // Show notice
            if (response.fragments && response.fragments['div.widget_shopping_cart_content']) {
              // Cart updated
            }
          }
        });
      } else {
        form.submit();
      }
    }
  };

  // Initialize
  LuneoWooWidget.init();
});

