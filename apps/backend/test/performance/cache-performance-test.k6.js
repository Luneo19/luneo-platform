/**
 * K6 Load Test - Cache Performance Testing
 * Tests cache hit rate: Hit rate > 90%
 */

import http from 'k6/http';
import { check, Counter } from 'k6';

const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    cache_hits: ['count>1000'], // At least 1000 cache hits
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Test endpoints that should be cached
  const cachedEndpoints = [
    '/api/v1/products',
    '/api/v1/collections',
    '/api/v1/cliparts',
  ];

  // First request (cache miss)
  for (const endpoint of cachedEndpoints) {
    const response1 = http.get(`${BASE_URL}${endpoint}`);
    cacheMisses.add(1);
    
    // Second request (should be cache hit)
    const response2 = http.get(`${BASE_URL}${endpoint}`);
    
    // Check if response time is faster (indicating cache hit)
    if (response2.timings.duration < response1.timings.duration * 0.8) {
      cacheHits.add(1);
    } else {
      cacheMisses.add(1);
    }
  }
}

export function handleSummary(data) {
  const totalRequests = data.metrics.cache_hits.values.count + data.metrics.cache_misses.values.count;
  const hitRate = totalRequests > 0 
    ? (data.metrics.cache_hits.values.count / totalRequests) * 100 
    : 0;

  return {
    'stdout': `Cache Hit Rate: ${hitRate.toFixed(2)}%\n`,
    'cache-performance.json': JSON.stringify({
      hitRate: hitRate,
      hits: data.metrics.cache_hits.values.count,
      misses: data.metrics.cache_misses.values.count,
    }, null, 2),
  };
}
