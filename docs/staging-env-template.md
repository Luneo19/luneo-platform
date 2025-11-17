# 📋 Template Variables d'Environnement Staging

Copiez ces variables dans votre fichier `.env.staging` ou configurez-les dans Vercel/GitHub Secrets.

```bash
# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://user:password@staging-db-host:5432/luneo_staging
DIRECT_URL=postgresql://user:password@staging-db-host:5432/luneo_staging

# ========================================
# JWT AUTHENTICATION
# ========================================
JWT_SECRET=your-staging-jwt-secret-minimum-32-characters-long
JWT_PUBLIC_KEY=your-staging-jwt-public-key
JWT_REFRESH_SECRET=your-staging-refresh-secret-minimum-32-chars

# ========================================
# REDIS
# ========================================
REDIS_URL=redis://staging-redis-host:6379
UPSTASH_REDIS_REST_URL=https://your-upstash-redis.rest.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# ========================================
# SHOPIFY INTEGRATION
# ========================================
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_WEBHOOK_SECRET=your-shopify-webhook-secret

# ========================================
# ENCRYPTION
# ========================================
MASTER_ENCRYPTION_KEY=your-32-character-hex-encryption-key

# ========================================
# AWS
# ========================================
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# ========================================
# STRIPE (test keys for staging)
# ========================================
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# ========================================
# OPENAI
# ========================================
OPENAI_API_KEY=sk-your-openai-api-key

# ========================================
# SENTRY
# ========================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=staging

# ========================================
# APPLICATION
# ========================================
NODE_ENV=staging
APP_URL=https://staging.luneo.app
API_URL=https://api-staging.luneo.app

# ========================================
# SUPABASE (Frontend)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========================================
# CLOUDINARY
# ========================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# ========================================
# EMAIL
# ========================================
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
```

