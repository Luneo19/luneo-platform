# Prometheus Instrumentation Guide

This guide documents the Prometheus metrics instrumentation added to the Luneo platform.

## Overview

The monitoring system tracks key performance indicators (KPIs) across:
- Worker queue wait times
- OpenAI API request durations and errors
- Render operation durations
- Embed handshake failures
- AR conversion times
- Cost tracking for spike detection

## Metrics Exposed

### Worker Queue Metrics

- `luneo_worker_queue_wait_time_seconds` (Histogram)
  - Time jobs spend waiting in queue before processing
  - Labels: `queue_name`
  - Buckets: [1, 5, 10, 30, 60, 120, 300, 600] seconds

- `luneo_worker_queue_wait_time_current_seconds` (Gauge)
  - Current wait time for oldest waiting job per queue
  - Labels: `queue_name`

### OpenAI Metrics

- `luneo_openai_request_duration_seconds` (Histogram)
  - Duration of OpenAI API requests
  - Labels: `model`, `operation`, `status`
  - Buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60] seconds

- `luneo_openai_requests_total` (Counter)
  - Total number of OpenAI API requests
  - Labels: `model`, `operation`

- `luneo_openai_requests_error_total` (Counter)
  - Total number of failed OpenAI API requests
  - Labels: `model`, `operation`, `error_type`

- `luneo_openai_cost_cents` (Gauge)
  - Current OpenAI API cost in cents
  - Labels: `model`, `operation`

### Render Metrics

- `luneo_render_duration_seconds` (Histogram)
  - Duration of render operations
  - Labels: `render_type`, `quality`, `status`
  - Buckets: [1, 5, 10, 30, 60, 120, 300, 600] seconds

- `luneo_renders_total` (Counter)
  - Total number of render operations
  - Labels: `render_type`, `quality`

- `luneo_renders_error_total` (Counter)
  - Total number of failed render operations
  - Labels: `render_type`, `quality`, `error_type`

### Embed Handshake Metrics

- `luneo_embed_handshake_failures_total` (Counter)
  - Total number of embed handshake failures
  - Labels: `failure_reason`, `shop_domain`

- `luneo_embed_handshakes_total` (Counter)
  - Total number of embed handshake attempts
  - Labels: `status`

- `luneo_embed_handshake_duration_seconds` (Histogram)
  - Duration of embed handshake operations
  - Labels: `status`
  - Buckets: [0.01, 0.05, 0.1, 0.5, 1, 2] seconds

### AR Conversion Metrics

- `luneo_ar_conversion_duration_seconds` (Histogram)
  - Duration of AR conversion operations
  - Labels: `conversion_type`, `status`
  - Buckets: [1, 5, 10, 30, 60, 120, 300] seconds

- `luneo_ar_conversions_total` (Counter)
  - Total number of AR conversion operations
  - Labels: `conversion_type`

- `luneo_ar_conversions_error_total` (Counter)
  - Total number of failed AR conversion operations
  - Labels: `conversion_type`, `error_type`

### Cost Tracking Metrics

- `luneo_ai_cost_baseline_cents` (Gauge)
  - Baseline AI cost in cents (calculated from historical average)
  - Labels: `time_window` (e.g., "1h", "24h")

- `luneo_ai_cost_current_cents` (Gauge)
  - Current AI cost in cents (for current time window)
  - Labels: `time_window`

## Instrumentation Locations

### Backend (NestJS)

1. **Queue Wait Time**: `apps/backend/src/modules/observability/queue-metrics.service.ts`
   - Automatically recorded when queue health is refreshed

2. **OpenAI Requests**: Add instrumentation in:
   - `apps/backend/src/modules/ai/ai.service.ts` (if making direct OpenAI calls)
   - Worker processes (see Worker section)

3. **Render Operations**: `apps/backend/src/modules/render/services/render-2d.service.ts`
   - Add `CustomMetricsService` injection to record metrics

4. **Embed Handshakes**: `apps/backend/src/modules/widget/widget.service.ts`
   - Already instrumented with success/failure tracking

### Worker (worker-ia)

For worker processes, metrics can be sent to the backend metrics endpoint:

```typescript
// Example: Record OpenAI request duration
const startTime = Date.now();
try {
  const response = await openai.images.generate({...});
  const duration = (Date.now() - startTime) / 1000;
  // Send to backend metrics endpoint
  await fetch(`${BACKEND_URL}/api/metrics/openai`, {
    method: 'POST',
    body: JSON.stringify({
      model: 'dall-e-3',
      operation: 'image_generation',
      durationSeconds: duration,
      costCents: calculateCost(response),
    }),
  });
} catch (error) {
  // Record error
}
```

### Frontend (Next.js)

AR conversion metrics are sent to backend:

```typescript
// apps/frontend/src/app/api/ar/convert-usdz/route.ts
await recordARConversionMetric('glb_to_usdz', durationSeconds, success);
```

## Grafana Dashboards

Two dashboards are provided:

1. **Luneo Overview** (`monitoring/grafana/dashboards/luneo-overview.json`)
   - General system metrics
   - API performance
   - Resource usage

2. **Luneo KPIs** (`monitoring/grafana/dashboards/luneo-kpis.json`)
   - Worker queue wait times
   - OpenAI request metrics
   - Render durations
   - Embed handshake failures
   - AR conversion times
   - Cost tracking

## Alert Rules

Three critical alerts are configured:

1. **QueueWaitTimeHigh**: Queue wait time > 60s for 2 minutes
2. **ErrorRateHigh**: Overall error rate > 1% over 5 minutes
3. **CostSpikeDetected**: AI cost > 2x baseline for 5 minutes

See `monitoring/prometheus/alerts.yml` for full alert definitions.

## Accessing Metrics

### Prometheus Endpoint

Backend exposes metrics at: `http://backend:4000/metrics`

### Grafana

Dashboards are available at: `http://grafana:3000`

Default credentials:
- Username: `admin`
- Password: `admin` (change in production)

## Sentry Integration

Sentry is configured for error tracking:

- **Backend**: `apps/backend/sentry.config.js`
- **Frontend**: `apps/frontend/sentry.client.config.ts`, `sentry.server.config.ts`
- **Worker**: Add Sentry SDK to worker processes

Source maps are configured for frontend error tracking.

## Next Steps

1. **Worker Instrumentation**: Add Prometheus client to worker-ia or send metrics to backend
2. **Cost Baseline Calculation**: Implement periodic baseline calculation from historical data
3. **Alert Notifications**: Configure Alertmanager to send alerts to Slack/PagerDuty
4. **Dashboard Customization**: Adjust dashboard panels based on actual usage patterns
