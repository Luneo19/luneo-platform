# Luneo Backend API

## Architecture

- NestJS 10 with TypeScript
- Prisma 5.22 ORM with PostgreSQL
- Redis for caching and BullMQ job queues
- JWT authentication with httpOnly cookies
- Stripe for payments and subscriptions
- OpenAI and Replicate for AI generation
- Cloudinary for storage
- SendGrid for emails
- WebSocket (Socket.IO) for real-time features

## Project Structure

```
src/
├── common/           # Guards, decorators, interceptors, pipes, filters
├── config/           # Configuration files and env validation
├── jobs/             # BullMQ workers and schedulers
├── libs/             # Shared libraries (AI providers, credits, metrics, tracing)
├── modules/          # Feature modules
│   ├── admin/        # Super admin panel
│   ├── ai/           # AI generation services
│   ├── analytics/    # Analytics and reporting
│   ├── auth/         # Authentication (JWT, OAuth, 2FA)
│   ├── billing/      # Stripe subscriptions, invoices, credit packs
│   ├── brands/       # Brand management
│   ├── collaboration/# Real-time collaboration
│   ├── designs/      # Design CRUD
│   ├── enterprise/   # White-label, SSO, SLA
│   ├── experiments/  # A/B testing
│   ├── integrations/ # Shopify, WooCommerce, Zapier
│   ├── marketplace/  # Template marketplace
│   ├── notifications/# Push + email notifications
│   ├── orders/       # Order management
│   ├── print-on-demand/ # PoD providers (Printful, Printify, Gelato)
│   ├── products/     # Product catalog
│   ├── public-api/   # External API with API key auth
│   ├── referral/     # Referral program
│   ├── render/       # 3D rendering
│   ├── search/       # Full-text search
│   ├── security/     # Security settings, 2FA
│   ├── support/      # Ticket system
│   ├── trust-safety/ # Content moderation, anti-fraud
│   ├── try-on/       # Virtual try-on
│   ├── widget/       # Embeddable widget
│   └── ...
├── prisma/           # Schema, migrations, seed
├── monitoring/       # Grafana dashboards, Prometheus alerts
└── websocket/        # Real-time gateway
```

## Setup

### Prerequisites
- Node.js >= 22
- PostgreSQL 15+
- Redis 7+
- pnpm 8+

### Installation
```bash
cd apps/backend
cp env.example .env
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### Environment Variables
See `env.example` for all required variables. Critical ones:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - MUST be set (no default in production)
- `STRIPE_SECRET_KEY` - Stripe API key
- `OPENAI_API_KEY` - OpenAI API key

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm start:dev` | Start in development mode (watch) |
| `pnpm build` | Build for production |
| `pnpm start:prod` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:cov` | Run tests with coverage |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm test:integration` | Run integration tests |
| `pnpm test:load` | Run k6 load tests |
| `pnpm lint` | Run ESLint |
| `pnpm exec prisma studio` | Open Prisma Studio |
| `pnpm exec prisma migrate dev` | Run database migrations |

## API Documentation

- Swagger UI: `http://localhost:3001/api/docs`
- Public API docs: `http://localhost:3001/api/public/docs`

## Authentication

- JWT access tokens (15min) + refresh tokens (7d)
- httpOnly secure cookies in production
- OAuth providers: Google, GitHub
- 2FA with TOTP
- API keys for external integrations (`lun_` prefix)

## Security

- Helmet with CSP headers
- CORS with strict origin validation
- Rate limiting (express-rate-limit + express-slow-down)
- CSRF protection
- HPP protection
- Input sanitization
- Setup key for admin endpoint
- Class-level JWT guards on all controllers

## Monitoring

- Prometheus metrics at `/metrics`
- Grafana dashboards in `src/monitoring/dashboards/`
- OpenTelemetry tracing
- Sentry error tracking
- Health check at `/health`

## Testing

- 200+ unit tests
- 12 E2E tests
- k6 load tests
- 80%+ coverage target

## Deployment

- Docker multi-stage build
- Railway for hosting
- GitHub Actions CI/CD
- Prisma migrations auto-applied
