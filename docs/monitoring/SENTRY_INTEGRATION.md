# Sentry Integration Documentation

## Overview

Sentry is configured for error tracking and performance monitoring across:
- Backend (NestJS)
- Frontend (Next.js)
- Worker processes (worker-ia)

## Backend Integration

**Location**: `apps/backend/sentry.config.js`

**Configuration**:
- DSN: Configured via `SENTRY_DSN` environment variable
- Environment-specific settings (development/production/test)
- Performance monitoring: 100% traces in dev, 10% in production
- Profiling: Enabled

**Initialization**: `apps/backend/src/instrument.ts`

**Usage**:
```typescript
import * as Sentry from '@sentry/nestjs';

// Capture exception
Sentry.captureException(error);

// Add context
Sentry.setContext('user', { id: userId });
Sentry.setTag('operation', 'design_generation');
```

## Frontend Integration

**Client-side**: `apps/frontend/sentry.client.config.ts`
- Browser error tracking
- Session replay (10% of sessions, 100% on errors)
- Source maps enabled

**Server-side**: `apps/frontend/sentry.server.config.ts`
- Server-side error tracking
- Next.js API route errors

**Edge**: `apps/frontend/sentry.edge.config.ts`
- Edge runtime error tracking

**Source Maps**: Configured via `sentry.properties` and build process

## Worker Integration

**Status**: Not yet configured

**Recommended Setup**:
1. Install `@sentry/node` in `apps/worker-ia`
2. Initialize in `apps/worker-ia/src/main.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

## Verification

### Backend
1. Check Sentry dashboard for backend project
2. Trigger test error: `curl http://backend:4000/api/test-error`
3. Verify error appears in Sentry

### Frontend
1. Check Sentry dashboard for frontend project
2. Trigger client error in browser console
3. Verify error appears with source maps

### Source Maps
1. Check Sentry → Settings → Source Maps
2. Verify releases are uploaded
3. Verify stack traces show original source code

## Environment Variables

Required environment variables:

```bash
# Backend
SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/789012
SENTRY_ENVIRONMENT=production

# Frontend
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/789013
SENTRY_AUTH_TOKEN=xxx  # For source map uploads
```

## Monitoring

Key Sentry features enabled:
- Error tracking
- Performance monitoring
- Session replay (frontend)
- Release tracking
- User context
- Breadcrumbs

## Next Steps

1. **Worker Setup**: Add Sentry to worker-ia processes
2. **Release Tracking**: Configure automated release creation on deployments
3. **Alert Rules**: Set up Sentry alert rules for critical errors
4. **Integration**: Connect Sentry alerts to Slack/PagerDuty
