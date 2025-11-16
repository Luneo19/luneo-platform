import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:3333';
const BRAND_ID = __ENV.BRAND_ID ?? 'dev-brand';
const API_TOKEN = __ENV.API_TOKEN ?? 'replace-me';
const PUBLIC_API_KEY = __ENV.PUBLIC_API_KEY ?? 'pk_dev_token';

const quotaSummaryTrend = new Trend('quota_summary_latency');
const designRequestTrend = new Trend('design_queue_latency');
const renderRequestTrend = new Trend('render_queue_latency');

export const options = {
  scenarios: {
    ramped_quota_load: {
      executor: 'ramping-arrival-rate',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 5,
      stages: [
        { target: 5, duration: '1m' },
        { target: 15, duration: '2m' },
        { target: 2, duration: '1m' },
      ],
    },
  },
  thresholds: {
    quota_summary_latency: ['p90<400'],
    design_queue_latency: ['p95<800'],
    render_queue_latency: ['p95<1200'],
    http_req_failed: ['rate<0.02'],
  },
};

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export default function () {
  const summaryRes = http.get(`${BASE_URL}/usage-billing/summary/${BRAND_ID}`, {
    headers: authHeaders(),
  });
  quotaSummaryTrend.add(summaryRes.timings.duration);
  check(summaryRes, {
    'summary 200': (res) => res.status === 200,
    'alerts returned': (res) => (res.json()?.summary?.alerts?.length ?? 0) >= 0,
  });

  const designRes = http.post(
    `${BASE_URL}/designs`,
    JSON.stringify({
      brandId: BRAND_ID,
      prompt: 'Chair in walnut wood with Scandinavian inspiration',
      batchSize: 2,
    }),
    {
      headers: authHeaders({ 'x-public-api-key': PUBLIC_API_KEY }),
    },
  );
  designRequestTrend.add(designRes.timings.duration);
  check(designRes, {
    'design accepted': (res) => res.status === 201 || res.status === 202,
  });

  const renderRes = http.post(
    `${BASE_URL}/render/2d`,
    JSON.stringify({
      brandId: BRAND_ID,
      productId: 'perf-chair',
      designId: 'latest',
      options: { background: '#111', lighting: 'studio' },
    }),
    {
      headers: authHeaders(),
    },
  );
  renderRequestTrend.add(renderRes.timings.duration);
  check(renderRes, {
    'render queued': (res) => res.status === 202,
  });

  sleep(1);
}


