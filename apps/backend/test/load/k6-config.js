import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% failures
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_KEY = __ENV.API_KEY || 'test-key';

export default function () {
  // Test public endpoints
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { 'health is 200': (r) => r.status === 200 });

  // Test marketplace listing
  const marketplaceRes = http.get(`${BASE_URL}/api/v1/marketplace`);
  check(marketplaceRes, { 'marketplace is 200': (r) => r.status === 200 });

  // Test public API with key
  const apiRes = http.get(`${BASE_URL}/api/v1/public/designs`, {
    headers: { 'x-api-key': API_KEY },
  });
  check(apiRes, { 'public API is 200': (r) => r.status === 200 });

  sleep(1);
}

export function checkout() {
  // Simulate checkout flow
  const checkoutRes = http.post(
    `${BASE_URL}/api/v1/billing/checkout`,
    JSON.stringify({
      plan: 'professional',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    },
  );
  check(checkoutRes, { 'checkout responds': (r) => r.status < 500 });

  sleep(2);
}
