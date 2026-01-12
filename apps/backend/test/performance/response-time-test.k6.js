/**
 * K6 Load Test - Response Time Testing
 * Tests response time: p95 < 200ms
 */

import http from 'k6/http';
import { check, Trend } from 'k6/metrics';

const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    response_time: ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  const endpoints = [
    '/health',
    '/api/v1/products',
    '/api/v1/collections',
  ];

  for (const endpoint of endpoints) {
    const response = http.get(`${BASE_URL}${endpoint}`);
    
    check(response, {
      'status is 200 or 401': (r) => [200, 401].includes(r.status),
    });
    
    responseTime.add(response.timings.duration);
  }
}
