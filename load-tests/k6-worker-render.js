/**
 * k6 Load Test: Worker Render Pipeline (500 Concurrent Renders)
 * 
 * Simulates 500 concurrent render jobs being enqueued and processed.
 * Tests:
 * - Job enqueue endpoint
 * - Queue processing capacity
 * - Worker concurrency limits
 * - Job completion rates
 * 
 * Usage:
 *   k6 run --vus 500 --duration 10m k6-worker-render.js
 * 
 * Or gradual ramp-up:
 *   k6 run --stage 1m:100 --stage 2m:300 --stage 2m:500 k6-worker-render.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const enqueueSuccessRate = new Rate('enqueue_success');
const enqueueLatency = new Trend('enqueue_latency');
const jobCompletionRate = new Rate('job_completion');
const jobProcessingTime = new Trend('job_processing_time');
const queueDepth = new Gauge('queue_depth');
const errors = new Counter('errors');
const rateLimitHits = new Counter('rate_limit_hits');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.luneo.app';
const API_KEY = __ENV.API_KEY || ''; // Bearer token for auth

// Test data
const RENDER_TYPES = ['2d', '3d', 'ar'];
const TEST_PROMPTS = [
  'A modern minimalist design',
  'Vintage retro style',
  'Bold geometric patterns',
  'Elegant floral arrangement',
  'Abstract artistic composition',
];

function getRandomRenderType() {
  return RENDER_TYPES[Math.floor(Math.random() * RENDER_TYPES.length)];
}

function getRandomPrompt() {
  return TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)];
}

function generateDesignId() {
  return `test-design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 concurrent jobs
    { duration: '2m', target: 300 },   // Ramp up to 300 concurrent jobs
    { duration: '2m', target: 500 },   // Ramp up to 500 concurrent jobs
    { duration: '10m', target: 500 },  // Stay at 500 for 10 minutes
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    'http_req_failed': ['rate<0.05'],                   // < 5% errors
    'enqueue_success': ['rate>0.95'],                  // > 95% success
    'enqueue_latency': ['p(95)<500', 'p(99)<1000'],
    'job_completion': ['rate>0.90'],                    // > 90% completion
  },
};

export default function () {
  const renderType = getRandomRenderType();
  const prompt = getRandomPrompt();
  const designId = generateDesignId();
  
  group('Render Job Enqueue', () => {
    // Enqueue render job
    const enqueueStart = Date.now();
    const enqueueResponse = http.post(
      `${BASE_URL}/api/designs/${designId}/render`,
      JSON.stringify({
        type: renderType,
        prompt: prompt,
        options: {
          quality: 'standard',
          format: 'png',
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        tags: { name: 'render_enqueue', type: renderType },
      }
    );
    
    const enqueueDuration = Date.now() - enqueueStart;
    enqueueLatency.add(enqueueDuration);
    
    const enqueueSuccess = check(enqueueResponse, {
      'enqueue status is 200 or 202': (r) => r.status === 200 || r.status === 202,
      'enqueue returns job ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.jobId || body.id;
        } catch {
          return false;
        }
      },
    });
    
    enqueueSuccessRate.add(enqueueSuccess);
    
    if (enqueueResponse.status === 429) {
      rateLimitHits.add(1);
      sleep(1); // Back off on rate limit
      return;
    }
    
    if (!enqueueSuccess) {
      errors.add(1);
      return;
    }
    
    const jobData = JSON.parse(enqueueResponse.body);
    const jobId = jobData.jobId || jobData.id;
    
    // Poll for job completion (simulate monitoring)
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait
    let jobCompleted = false;
    
    while (attempts < maxAttempts && !jobCompleted) {
      sleep(5); // Poll every 5 seconds
      attempts++;
      
      const statusResponse = http.get(
        `${BASE_URL}/api/jobs/${jobId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
          tags: { name: 'job_status' },
        }
      );
      
      if (statusResponse.status === 200) {
        try {
          const statusData = JSON.parse(statusResponse.body);
          const status = statusData.status || statusData.state;
          
          if (status === 'completed' || status === 'done') {
            jobCompleted = true;
            jobCompletionRate.add(1);
            const processingTime = Date.now() - enqueueStart;
            jobProcessingTime.add(processingTime);
          } else if (status === 'failed' || status === 'error') {
            jobCompleted = true;
            jobCompletionRate.add(0);
            errors.add(1);
          }
        } catch (e) {
          // Continue polling
        }
      }
    }
    
    if (!jobCompleted) {
      // Job timed out
      jobCompletionRate.add(0);
      errors.add(1);
    }
  });
  
  // Simulate user behavior between renders
  sleep(Math.random() * 3 + 1); // 1-4 seconds between requests
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'worker-load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = '\n';
  summary += `${indent}Worker Render Load Test Summary\n`;
  summary += `${indent}================================\n\n`;
  
  // HTTP metrics
  summary += `${indent}HTTP Requests:\n`;
  summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}  Duration (p95): ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms\n`;
  summary += `${indent}  Duration (p99): ${data.metrics.http_req_duration.values.p99.toFixed(2)}ms\n\n`;
  
  // Enqueue metrics
  summary += `${indent}Job Enqueue:\n`;
  summary += `${indent}  Success Rate: ${(data.metrics.enqueue_success.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}  Latency (p95): ${data.metrics.enqueue_latency.values.p95.toFixed(2)}ms\n`;
  summary += `${indent}  Latency (p99): ${data.metrics.enqueue_latency.values.p99.toFixed(2)}ms\n\n`;
  
  // Job completion metrics
  summary += `${indent}Job Completion:\n`;
  summary += `${indent}  Completion Rate: ${(data.metrics.job_completion.values.rate * 100).toFixed(2)}%\n`;
  if (data.metrics.job_processing_time.values.count > 0) {
    summary += `${indent}  Avg Processing Time: ${(data.metrics.job_processing_time.values.avg / 1000).toFixed(2)}s\n`;
    summary += `${indent}  Processing Time (p95): ${(data.metrics.job_processing_time.values.p95 / 1000).toFixed(2)}s\n`;
  }
  
  // Rate limiting
  if (data.metrics.rate_limit_hits) {
    summary += `\n${indent}Rate Limiting:\n`;
    summary += `${indent}  Rate Limit Hits: ${data.metrics.rate_limit_hits.values.count}\n`;
  }
  
  summary += '\n';
  
  return summary;
}
