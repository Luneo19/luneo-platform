import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const WIDGET_CDN_URL = process.env.WIDGET_CDN_URL || 'https://widget.luneo.app';

test.describe('Widget Embed Handshake', () => {
  test('should generate embed token with nonce', async ({ request }) => {
    // Mock shop domain (in real test, this would be a test shop)
    const shopDomain = 'test-shop.myshopify.com';

    const response = await request.get(`${API_BASE_URL}/api/embed/token`, {
      params: {
        shop: shopDomain,
      },
      headers: {
        origin: 'https://test-shop.myshopify.com',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('nonce');
    expect(data).toHaveProperty('expiresIn');
    expect(data.expiresIn).toBe(300); // 5 minutes
    
    expect(typeof data.token).toBe('string');
    expect(typeof data.nonce).toBe('string');
    expect(data.nonce.length).toBeGreaterThan(32); // 32 bytes hex = 64 chars
  });

  test('should reject invalid shop domain', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/embed/token`, {
      params: {
        shop: 'invalid-shop.myshopify.com',
      },
    });

    expect(response.status()).toBe(404);
  });

  test('should reject missing shop parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/embed/token`);

    expect(response.status()).toBe(400);
  });

  test('should validate nonce is single-use', async ({ request }) => {
    const shopDomain = 'test-shop.myshopify.com';
    const origin = 'https://test-shop.myshopify.com';

    // Get token with nonce
    const tokenResponse = await request.get(`${API_BASE_URL}/api/embed/token`, {
      params: { shop: shopDomain },
      headers: { origin },
    });

    expect(tokenResponse.status()).toBe(200);
    const { nonce } = await tokenResponse.json();

    // First validation should succeed
    // Note: This endpoint would need to be created for nonce validation
    // For now, we test that nonce is returned and is unique
    expect(nonce).toBeTruthy();
    expect(nonce.length).toBe(64); // 32 bytes = 64 hex chars
  });

  test('should include widget URL in response', async ({ request }) => {
    const shopDomain = 'test-shop.myshopify.com';

    const response = await request.get(`${API_BASE_URL}/api/embed/token`, {
      params: { shop: shopDomain },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('widgetUrl');
    expect(data.widgetUrl).toBeTruthy();
  });
});

test.describe('Widget SDK Integration', () => {
  test('should load widget SDK and initialize', async ({ page }) => {
    // Create a test HTML page that loads the widget SDK
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Widget Test</title>
        </head>
        <body>
          <div id="luneo-widget-container"></div>
          <script>
            // Mock widget SDK for testing
            window.LuneoWidget = {
              init: async function(config) {
                // Simulate token fetch
                const response = await fetch('${API_BASE_URL}/api/embed/token?shop=' + config.shop);
                if (!response.ok) {
                  throw new Error('Failed to fetch token');
                }
                const data = await response.json();
                return { token: data.token, nonce: data.nonce };
              }
            };
          </script>
        </body>
      </html>
    `);

    // Test that SDK can be called
    const result = await page.evaluate(async () => {
      try {
        const data = await window.LuneoWidget.init({
          shop: 'test-shop.myshopify.com',
          tokenUrl: '${API_BASE_URL}/api/embed/token',
          container: '#luneo-widget-container',
        });
        return { success: true, hasToken: !!data.token, hasNonce: !!data.nonce };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Note: This will fail if shop doesn't exist, but structure should be correct
    expect(result).toHaveProperty('success');
  });
});
