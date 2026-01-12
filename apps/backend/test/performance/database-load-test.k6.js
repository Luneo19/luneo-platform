/**
 * K6 Load Test - Database Load Testing
 * Tests database performance: 10000 queries simultanées
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('db_errors');
const queryTime = new Trend('db_query_time');

export const options = {
  stages: [
    { duration: '30s', target: 1000 },   // Ramp up to 1000 concurrent users
    { duration: '1m', target: 5000 },   // Ramp up to 5000 concurrent users
    { duration: '1m', target: 10000 },  // Ramp up to 10000 concurrent users
    { duration: '2m', target: 10000 },  // Stay at 10000 for 2 min
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    db_query_time: ['p(95)<500'], // 95% of queries should be below 500ms
    db_errors: ['rate<0.05'],      // Error rate should be less than 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Test database-heavy endpoints
  const endpoints = [
    '/api/v1/products?page=1&limit=100',
    '/api/v1/designs?page=1&limit=100',
    '/api/v1/orders?page=1&limit=100',
  ];

  for (const endpoint of endpoints) {
    const response = http.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const success = check(response, {
      [`${endpoint} status is 200 or 401`]: (r) => [200, 401].includes(r.status),
      [`${endpoint} has data`]: (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined || body.length !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    queryTime.add(response.timings.duration);
  }
}
