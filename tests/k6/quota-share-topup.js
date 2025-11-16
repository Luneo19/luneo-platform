import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, sleep } from 'k6';

const API_BASE = __ENV.API_BASE ?? 'http://localhost:3333/api/v1';
const FRONTEND_URL = __ENV.FRONTEND_URL ?? 'http://localhost:3000';
const BRAND_ID = __ENV.BRAND_ID ?? 'dev-brand';
const AUTH_TOKEN = __ENV.AUTH_TOKEN ?? 'replace-me';

const sharedPayload = {
  brandId: BRAND_ID,
  plan: 'starter',
  overage: 1200,
  recommendation: 'professional',
  pressure: {
    metric: 'ai_generations',
    percentage: 92,
  },
  timestamp: new Date().toISOString(),
};

const shareTokenDefault = encodeURIComponent(
  encoding.b64encode(JSON.stringify(sharedPayload)),
);

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<500'],
  },
};

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export default function () {
  const summaryRes = http.get(`${API_BASE}/usage-billing/summary/${BRAND_ID}`, {
    headers: authHeaders(),
  });
  check(summaryRes, {
    'summary 200': (res) => res.status === 200,
  });

  const historyRes = http.get(`${API_BASE}/usage-billing/topups/history?brandId=${BRAND_ID}`, {
    headers: authHeaders(),
  });
  check(historyRes, {
    'history 200': (res) => res.status === 200,
  });

  const simulateRes = http.post(
    `${API_BASE}/usage-billing/topups/simulate`,
    JSON.stringify({
      brandId: BRAND_ID,
      metric: 'ai_generations',
      units: 10,
    }),
    {
      headers: authHeaders(),
    },
  );
  check(simulateRes, {
    'simulate 200': (res) => res.status === 200,
  });

  const checkoutRes = http.post(
    `${API_BASE}/usage-billing/topups/checkout`,
    JSON.stringify({
      brandId: BRAND_ID,
      metric: 'ai_generations',
      units: 10,
      successUrl: `${FRONTEND_URL}/analytics?topup=success`,
      cancelUrl: `${FRONTEND_URL}/analytics?topup=cancel`,
    }),
    {
      headers: authHeaders(),
    },
  );
  check(checkoutRes, {
    'checkout 200': (res) => res.status === 200,
  });

  const shareTokenRes = http.post(
    `${API_BASE}/usage-billing/share`,
    JSON.stringify({
      brandId: BRAND_ID,
    }),
    {
      headers: authHeaders(),
    },
  );
  const token = shareTokenRes.json()?.token || shareTokenDefault;
  check(shareTokenRes, {
    'share token 201': (res) => res.status === 201,
  });

  const shareRes = http.get(`${FRONTEND_URL}/share/quota/${token}`);
  check(shareRes, {
    'share page 200': (res) => res.status === 200,
  });

  sleep(1);
}

