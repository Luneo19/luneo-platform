jQuery(document).ready(function($) {
  'use strict';

  // Luneo WooCommerce Widget
  const LuneoWooWidget = {
    init: function() {
      this.setupCustomizeButton();
      this.setupMessageListener();
    },

    setupCustomizeButton: function() {
      $(document).on('click', '[data-luneo-customize]', function(e) {
        e.preventDefault();
        const productId = $(this).data('product-id');
        LuneoWooWidget.openCustomizer(productId);
      });
    },

    openCustomizer: function(productId) {
      const url = `${luneoConfig.appUrl}/customize/${productId}?apiKey=${luneoConfig.apiKey}&platform=woocommerce`;
      
      // Create modal
      const modal = `
        <div id="luneo-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center;">
          <div style="width: 95%; height: 95%; max-width: 1400px; max-height: 900px; background: white; border-radius: 12px; position: relative;">
            <button id="luneo-close" style="position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; border: none; background: #ef4444; color: white; font-size: 24px; border-radius: 50%; cursor: pointer; z-index: 1;">&times;</button>
            <iframe src="${url}" style="width: 100%; height: 100%; border: none; border-radius: 12px;"></iframe>
          </div>
        </div>
      `;

      $('body').append(modal);

      // Close button
      $('#luneo-close').on('click', function() {
        $('#luneo-modal').remove();
      });

      // Close on overlay click
      $('#luneo-modal').on('click', function(e) {
        if (e.target.id === 'luneo-modal') {
          $(this).remove();
        }
      });
    },

    setupMessageListener: function() {
      window.addEventListener('message', function(event) {
        if (event.data.type === 'LUNEO_CUSTOMIZATION_COMPLETE') {
          const design = event.data.design;
          LuneoWooWidget.addDesignToCart(design);
          $('#luneo-modal').remove();
        }
      });
    },

    addDesignToCart: function(design) {
      // Create hidden form with custom design data
      const form = $('<form>', {
        method: 'POST',
        action: window.location.href
      });

      form.append($('<input>', { type: 'hidden', name: 'add-to-cart', value: design.product_id }));
      form.append($('<input>', { type: 'hidden', name: 'quantity', value: '1' }));
      form.append($('<input>', { type: 'hidden', name: 'luneo_design_id', value: design.id }));
      form.append($('<input>', { type: 'hidden', name: 'luneo_preview_url', value: design.preview_url }));
      form.append($('<input>', { type: 'hidden', name: 'luneo_print_ready_url', value: design.print_ready_url }));

      $('body').append(form);
      form.submit();
    }
  };

  // Initialize
  LuneoWooWidget.init();
});

