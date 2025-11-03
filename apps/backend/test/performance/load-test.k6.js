import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up to 10 users
    { duration: '1m', target: 50 },   // Ramp-up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    errors: ['rate<0.05'],             // Custom error rate must be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Auth token (should be obtained from login in real scenario)
let authToken = __ENV.AUTH_TOKEN || '';

export function setup() {
  // Login to get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'test-password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    authToken = body.accessToken;
  }

  return { authToken };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  // Test 1: Get product rules
  {
    const res = http.get(`${BASE_URL}/product-engine/products/test-id/rules`, {
      headers,
    });

    const success = check(res, {
      'get product rules status is 200': (r) => r.status === 200,
      'get product rules duration < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
  }

  sleep(1);

  // Test 2: Validate design
  {
    const payload = JSON.stringify({
      productId: 'test-id',
      zones: [
        {
          zoneId: 'logo',
          type: 'image',
          value: {
            url: 'https://example.com/logo.png',
            width: 300,
            format: 'png',
          },
        },
      ],
    });

    const res = http.post(`${BASE_URL}/product-engine/validate/design`, payload, {
      headers,
    });

    const success = check(res, {
      'validate design status is 200': (r) => r.status === 200,
      'validate design duration < 100ms': (r) => r.timings.duration < 100,
      'validation result is valid': (r) => {
        const body = JSON.parse(r.body);
        return body.isValid === true;
      },
    });

    errorRate.add(!success);
  }

  sleep(1);

  // Test 3: Calculate pricing
  {
    const payload = JSON.stringify({
      productId: 'test-id',
      zones: [{ zoneId: 'logo', type: 'image' }],
      quantity: 10,
      material: 'cotton',
    });

    const res = http.post(`${BASE_URL}/product-engine/pricing/calculate`, payload, {
      headers,
    });

    const success = check(res, {
      'calculate pricing status is 200': (r) => r.status === 200,
      'calculate pricing duration < 50ms': (r) => r.timings.duration < 50,
      'pricing has total': (r) => {
        const body = JSON.parse(r.body);
        return body.totalPrice !== undefined;
      },
    });

    errorRate.add(!success);
  }

  sleep(1);

  // Test 4: Usage billing check quota
  {
    const payload = JSON.stringify({
      brandId: 'test-brand',
      metric: 'designs_created',
      requestedAmount: 1,
    });

    const res = http.post(`${BASE_URL}/usage-billing/check-quota`, payload, {
      headers,
    });

    const success = check(res, {
      'check quota status is 200': (r) => r.status === 200,
      'check quota duration < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(!success);
  }

  sleep(1);

  // Test 5: Get usage summary
  {
    const res = http.get(`${BASE_URL}/usage-billing/summary/test-brand`, {
      headers,
    });

    const success = check(res, {
      'get usage summary status is 200': (r) => r.status === 200,
      'get usage summary duration < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors !== false;

  let summary = '\n';
  summary += `${indent}✓ checks.........................: ${data.metrics.checks.passes}/${data.metrics.checks.passes + data.metrics.checks.fails}\n`;
  summary += `${indent}✓ http_req_duration.............: avg=${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}✓ http_req_failed...............: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}✓ http_reqs.....................: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}✓ iterations....................: ${data.metrics.iterations.values.count}\n`;
  
  return summary;
}

