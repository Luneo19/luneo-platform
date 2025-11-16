/**
 * k6 Load Test: Embed Widget Load (10k Concurrent Users)
 * 
 * Simulates 10,000 concurrent users loading the embed widget on product pages.
 * Tests:
 * - Token generation endpoint (/api/embed/token)
 * - Nonce validation endpoint (/api/embed/validate)
 * - Widget handshake flow
 * 
 * Usage:
 *   k6 run --vus 10000 --duration 5m k6-embed-widget.js
 * 
 * Or gradual ramp-up:
 *   k6 run --stage 2m:1000 --stage 5m:5000 --stage 5m:10000 k6-embed-widget.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const tokenSuccessRate = new Rate('token_success');
const validateSuccessRate = new Rate('validate_success');
const tokenLatency = new Trend('token_latency');
const validateLatency = new Trend('validate_latency');
const handshakeLatency = new Trend('handshake_latency');
const errors = new Counter('errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.luneo.app';
const WIDGET_BASE_URL = __ENV.WIDGET_URL || 'https://widget.luneo.app';

// Test shop domains (simulate different shops)
const SHOP_DOMAINS = [
  'test-shop-1.myshopify.com',
  'test-shop-2.myshopify.com',
  'test-shop-3.myshopify.com',
  'test-shop-4.myshopify.com',
  'test-shop-5.myshopify.com',
];

// Random shop selector
function getRandomShop() {
  return SHOP_DOMAINS[Math.floor(Math.random() * SHOP_DOMAINS.length)];
}

// Random origin (simulating different storefronts)
function getRandomOrigin() {
  const shop = getRandomShop();
  return `https://${shop.replace('.myshopify.com', '.com')}`;
}

export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // Ramp up to 1k users
    { duration: '5m', target: 5000 },   // Ramp up to 5k users
    { duration: '5m', target: 10000 },   // Ramp up to 10k users
    { duration: '10m', target: 10000 }, // Stay at 10k for 10 minutes
    { duration: '2m', target: 0 },       // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.01'],                  // < 1% errors
    'token_success': ['rate>0.99'],                   // > 99% success
    'validate_success': ['rate>0.99'],                // > 99% success
    'token_latency': ['p(95)<300', 'p(99)<500'],
    'validate_latency': ['p(95)<200', 'p(99)<400'],
    'handshake_latency': ['p(95)<600', 'p(99)<1000'],
  },
};

export default function () {
  const shop = getRandomShop();
  const origin = getRandomOrigin();
  
  group('Widget Handshake Flow', () => {
    // Step 1: Get embed token
    const tokenStart = Date.now();
    const tokenResponse = http.get(`${BASE_URL}/api/embed/token`, {
      params: { shop },
      headers: {
        'Origin': origin,
        'User-Agent': 'Mozilla/5.0 (k6-load-test)',
      },
      tags: { name: 'embed_token' },
    });
    
    const tokenDuration = Date.now() - tokenStart;
    tokenLatency.add(tokenDuration);
    
    const tokenSuccess = check(tokenResponse, {
      'token status is 200': (r) => r.status === 200,
      'token has token field': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token && body.nonce;
        } catch {
          return false;
        }
      },
    });
    
    tokenSuccessRate.add(tokenSuccess);
    
    if (!tokenSuccess) {
      errors.add(1);
      return;
    }
    
    const tokenData = JSON.parse(tokenResponse.body);
    const { token, nonce } = tokenData;
    
    // Simulate small delay (iframe creation)
    sleep(Math.random() * 0.5);
    
    // Step 2: Validate nonce
    const validateStart = Date.now();
    const validateResponse = http.post(
      `${BASE_URL}/api/embed/validate`,
      JSON.stringify({ nonce }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': origin,
          'Authorization': `Bearer ${token}`,
        },
        tags: { name: 'embed_validate' },
      }
    );
    
    const validateDuration = Date.now() - validateStart;
    validateLatency.add(validateDuration);
    
    const validateSuccess = check(validateResponse, {
      'validate status is 200': (r) => r.status === 200,
      'validate returns valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.valid === true;
        } catch {
          return false;
        }
      },
    });
    
    validateSuccessRate.add(validateSuccess);
    
    if (!validateSuccess) {
      errors.add(1);
    }
    
    // Total handshake latency
    const handshakeDuration = Date.now() - tokenStart;
    handshakeLatency.add(handshakeDuration);
    
    // Simulate user viewing widget (read-only operations)
    sleep(Math.random() * 2 + 1); // 1-3 seconds
  });
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}==================\n\n`;
  
  // HTTP metrics
  summary += `${indent}HTTP Requests:\n`;
  summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}  Duration (p95): ${data.metrics.http_req_duration.values.p95}ms\n`;
  summary += `${indent}  Duration (p99): ${data.metrics.http_req_duration.values.p99}ms\n\n`;
  
  // Token metrics
  summary += `${indent}Token Generation:\n`;
  summary += `${indent}  Success Rate: ${data.metrics.token_success.values.rate * 100}%\n`;
  summary += `${indent}  Latency (p95): ${data.metrics.token_latency.values.p95}ms\n`;
  summary += `${indent}  Latency (p99): ${data.metrics.token_latency.values.p99}ms\n\n`;
  
  // Validate metrics
  summary += `${indent}Nonce Validation:\n`;
  summary += `${indent}  Success Rate: ${data.metrics.validate_success.values.rate * 100}%\n`;
  summary += `${indent}  Latency (p95): ${data.metrics.validate_latency.values.p95}ms\n`;
  summary += `${indent}  Latency (p99): ${data.metrics.validate_latency.values.p99}ms\n\n`;
  
  // Handshake metrics
  summary += `${indent}Full Handshake:\n`;
  summary += `${indent}  Latency (p95): ${data.metrics.handshake_latency.values.p95}ms\n`;
  summary += `${indent}  Latency (p99): ${data.metrics.handshake_latency.values.p99}ms\n\n`;
  
  return summary;
}
