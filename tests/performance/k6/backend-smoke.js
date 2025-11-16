import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000/api/v1';
const API_KEY = __ENV.K6_API_KEY || '';
const SLEEP_BETWEEN_CALLS = Number(__ENV.K6_SLEEP ?? 1);

const latency = new Trend('backend_http_latency', true);
const failures = new Rate('backend_http_failures');

export const options = {
  scenarios: {
    steady_load: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.K6_RATE ?? 50), // requests per second
      timeUnit: '1s',
      duration: __ENV.K6_DURATION || '2m',
      preAllocatedVUs: Number(__ENV.K6_VUS ?? 20),
      maxVUs: Number(__ENV.K6_MAX_VUS ?? 50),
    },
  },
  thresholds: {
    backend_http_failures: ['rate<0.02'],
    backend_http_latency: ['p(95)<800', 'avg<300'],
  },
};

function authHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  return headers;
}

export default function () {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/orders`, {
    headers: authHeaders(),
    timeout: '30s',
  });

  const duration = Date.now() - start;
  latency.add(duration);

  const ok = check(res, {
    'status 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
    'payload not empty': (r) => r.body && r.body.length > 0,
  });

  failures.add(!ok);

  if (!ok) {
    console.error(`Request failed: status=${res.status} body=${res.body}`);
  }

  // Fire secondary endpoints to exercise cache / queue metrics
  http.get(`${BASE_URL}/metrics`, { headers: authHeaders() });
  http.get(`${BASE_URL}/analytics/dashboard`, { headers: authHeaders() });

  sleep(SLEEP_BETWEEN_CALLS);
}

