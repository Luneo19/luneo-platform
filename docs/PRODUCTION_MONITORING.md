# Production Monitoring Setup

## Sentry Configuration

### Backend
- DSN: Set `SENTRY_DSN` env var in Railway
- Environment: Set `NODE_ENV=production`
- Traces sample rate: 0.1 (10% of transactions)

### Frontend
- DSN: Set `NEXT_PUBLIC_SENTRY_DSN` env var in Vercel
- Source maps: Uploaded during build

### Recommended Alerts (configure in Sentry dashboard)
1. **Error Spike**: Alert when error count > 10x baseline in 1 hour
2. **New Issue**: Alert on first occurrence of new error types
3. **Performance Degradation**: Alert when p95 latency > 2s
4. **Unhandled Rejection**: Alert on unhandled promise rejections

## Uptime Monitoring

Recommended services: Better Stack (betterstack.com) or Pingdom

### Endpoints to Monitor
- `GET https://api.luneo.app/health` -- Backend health (expect 200)
- `GET https://api.luneo.app/health/terminus` -- Detailed health (expect 200)
- `GET https://luneo.app` -- Frontend (expect 200)
- `GET https://luneo.app/login` -- Auth page (expect 200)

### Check intervals
- Health endpoints: Every 1 minute
- Frontend pages: Every 5 minutes

## Slack Notifications

Set `SLACK_WEBHOOK_URL` in GitHub Actions secrets for deployment notifications.
Configure Sentry to send alerts to a #alerts Slack channel.

## Prometheus Metrics

Available at `GET /health/metrics` on the backend.
Can be scraped by Grafana Cloud or self-hosted Prometheus.

Key metrics:
- `http_requests_total` -- Total HTTP requests
- `http_request_duration_seconds` -- Request latency
- `prisma_client_queries_total` -- Database queries
- `bullmq_jobs_total` -- Background job counts
