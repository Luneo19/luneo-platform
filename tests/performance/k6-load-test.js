import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const p95Latency = new Rate('p95_latency');

// Configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

// Test data
const testUser = {
  email: __ENV.TEST_EMAIL || 'loadtest@example.com',
  password: __ENV.TEST_PASSWORD || 'TestPassword123!',
};

let authToken = null;

// Setup: Login once
export function setup() {
  const loginRes = http.post(`${BASE_URL}${API_PREFIX}/auth/login`, JSON.stringify({
    email: testUser.email,
    password: testUser.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const cookies = loginRes.cookies;
    // Extract token from cookies (httpOnly cookies)
    authToken = cookies.accessToken ? cookies.accessToken[0].value : null;
  }

  return { token: authToken };
}

// Main test function
export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Cookie': `accessToken=${token}` }),
  };

  // Test 1: Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  // Test 2: Get products (public endpoint)
  const productsRes = http.get(`${BASE_URL}${API_PREFIX}/products?limit=10`, { headers });
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
    'products response time < 500ms': (r) => r.timings.duration < 500,
    'products has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  if (productsRes.timings.duration > 500) {
    p95Latency.add(1);
  }

  // Test 3: Get user profile (authenticated)
  if (token) {
    const profileRes = http.get(`${BASE_URL}${API_PREFIX}/auth/me`, { headers });
    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
  }

  // Test 4: Analytics endpoint (if authenticated)
  if (token) {
    const analyticsRes = http.get(`${BASE_URL}${API_PREFIX}/analytics/overview`, { headers });
    check(analyticsRes, {
      'analytics status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'analytics response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
  }

  sleep(1); // Wait 1 second between requests
}

// Teardown
export function teardown(data) {
  console.log('Load test completed');
}
