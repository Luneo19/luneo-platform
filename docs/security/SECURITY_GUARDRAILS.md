# 🔒 Security Guardrails Documentation

This document describes the global security guardrails implemented in the Luneo platform.

## Table of Contents

1. [Rate Limiting](#rate-limiting)
2. [JWT Rotation](#jwt-rotation)
3. [Webhook Verification](#webhook-verification)
4. [Secrets Encryption](#secrets-encryption)
5. [OWASP ZAP Integration](#owasp-zap-integration)
6. [Pre-commit Secret Scanning](#pre-commit-secret-scanning)

---

## Rate Limiting

### Overview

Per-tenant rate limiting using Redis-backed token bucket algorithm. Prevents abuse and ensures fair resource allocation.

### Implementation

**Service:** `RateLimiterService`  
**Guard:** `TenantRateLimitGuard`  
**Location:** `apps/backend/src/modules/security/services/rate-limiter.service.ts`

### Features

- **Token Bucket Algorithm**: Leaky bucket with configurable refill rate
- **Per-Tenant Isolation**: Each tenant (brandId) has independent rate limits
- **Redis-Backed**: Distributed rate limiting across multiple instances
- **Atomic Operations**: Lua scripts ensure thread-safe operations
- **Configurable**: Per-tenant or per-route configuration

### Usage

#### Basic Usage (Guard)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantRateLimitGuard, RateLimit } from '@/modules/security/guards/tenant-rate-limit.guard';

@Controller('api')
@UseGuards(TenantRateLimitGuard)
export class ApiController {
  @Get('endpoint')
  @RateLimit({ capacity: 100, refillRate: 10, refillInterval: 60 })
  async getData() {
    // 100 requests max, refill 10 tokens per 60 seconds
  }
}
```

#### Programmatic Usage

```typescript
import { RateLimiterService } from '@/modules/security/services/rate-limiter.service';

constructor(private rateLimiter: RateLimiterService) {}

async checkLimit(tenantId: string) {
  const result = await this.rateLimiter.checkRateLimit(tenantId);
  
  if (!result.allowed) {
    throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
  }
  
  // Request allowed
}
```

### Configuration

Default configuration (can be overridden per tenant):

```typescript
{
  capacity: 100,        // Max tokens in bucket
  refillRate: 10,       // Tokens added per interval
  refillInterval: 60,  // Refill interval in seconds
}
```

### API Endpoints

- `GET /api/security/rate-limit/status/:tenantId` - Get rate limit status
- `POST /api/security/rate-limit/reset/:tenantId` - Reset rate limit (admin)

---

## JWT Rotation

### Overview

JWT secret rotation with grace period support. Allows rotating embed keys and JWT secrets without service interruption.

### Implementation

**Service:** `JwtRotationService`  
**Location:** `apps/backend/src/modules/security/services/jwt-rotation.service.ts`

### Features

- **Rotation Plans**: Create rotation schedules with grace periods
- **Embed Key Rotation**: Rotate embed keys for brands/shops
- **Grace Period**: Old tokens remain valid during transition
- **Automatic Expiry**: Old keys are automatically revoked

### Usage

#### Create Rotation Plan

```typescript
const plan = await jwtRotation.createRotationPlan();
// Plan includes:
// - currentSecret
// - newSecret
// - rotationStartAt
// - gracePeriodEndAt (7 days)
// - rotationCompleteAt
```

#### Rotate Embed Key

```typescript
const result = await jwtRotation.rotateEmbedKey(brandId, shopDomain);
// Returns:
// - oldKeyId (if existed)
// - newKeyId
// - token (new JWT)
// - expiresAt
```

#### Expire Embed Keys

```typescript
const count = await jwtRotation.expireEmbedKeys(brandId, shopDomain);
// Revokes all active embed keys for the brand/shop
```

### API Endpoints

- `POST /api/security/jwt/rotation/plan` - Create rotation plan
- `GET /api/security/jwt/rotation/status` - Get rotation status
- `POST /api/security/jwt/rotation/complete` - Complete rotation
- `POST /api/security/jwt/embed-key/rotate` - Rotate embed key
- `POST /api/security/jwt/embed-key/expire` - Expire embed keys

### Rotation Process

1. **Create Plan**: Generate new secret, set grace period
2. **Grace Period**: Both old and new secrets are valid (7 days)
3. **Update Environment**: Update `JWT_SECRET` environment variable
4. **Complete Rotation**: Remove old secret support after grace period

---

## Webhook Verification

### Overview

HMAC signature verification with replay protection using nonces and timestamps.

### Implementation

**Utility:** `WebhookVerificationUtil`  
**Location:** `apps/backend/src/modules/security/utils/webhook-verification.util.ts`

### Features

- **HMAC Verification**: SHA-256/512 signature validation
- **Replay Protection**: Nonce tracking prevents duplicate requests
- **Timestamp Validation**: Rejects requests outside tolerance window
- **Redis-Backed**: Distributed nonce storage for multi-instance deployments
- **Constant-Time Comparison**: Prevents timing attacks

### Usage

```typescript
import { createWebhookVerifier } from '@/modules/security/utils/webhook-verification.util';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const verifier = createWebhookVerifier({
  secret: process.env.WEBHOOK_SECRET,
  algorithm: 'sha256',
  timestampTolerance: 300, // 5 minutes
  nonceExpiry: 3600,       // 1 hour
  redis,                    // Optional, falls back to in-memory
});

// Verify webhook
const result = await verifier.verify(
  requestBody,
  signatureHeader,
  nonceHeader,
  timestampHeader,
);

if (!result.valid) {
  throw new UnauthorizedException(result.error);
}

// Request is valid and not a replay
```

### Headers Required

- `X-Signature`: HMAC signature (hex)
- `X-Nonce`: Unique nonce (optional but recommended)
- `X-Timestamp`: Unix timestamp (optional but recommended)

### Example Integration

```typescript
@Post('webhook')
async handleWebhook(
  @Body() body: string,
  @Headers('x-signature') signature: string,
  @Headers('x-nonce') nonce: string,
  @Headers('x-timestamp') timestamp: string,
) {
  const result = await this.webhookVerifier.verify(
    body,
    signature,
    nonce,
    timestamp,
  );
  
  if (!result.valid) {
    throw new UnauthorizedException(result.error);
  }
  
  // Process webhook
}
```

---

## Secrets Encryption

### Overview

AWS KMS integration for encrypting secrets at rest. Secrets are stored in AWS Secrets Manager and decrypted using KMS keys.

### Implementation

**Terraform Example:** `infrastructure/terraform/examples/kms-secrets-integration.tf`

### Features

- **KMS Encryption**: All secrets encrypted with AWS KMS
- **Automatic Rotation**: KMS key rotation enabled
- **IAM Integration**: Fine-grained access control
- **Secrets Manager**: Centralized secret storage

### Setup

1. **Deploy KMS Module**:

```bash
cd infrastructure/terraform/examples
terraform init
terraform plan -var="jwt_secret_value=your-secret"
terraform apply
```

2. **Configure IAM Roles**: Attach `secrets_access` policy to application roles

3. **Use in Application**:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getJWTSecret(): Promise<string> {
  const command = new GetSecretValueCommand({
    SecretId: 'luneo/jwt-secret',
  });
  const response = await client.send(command);
  const secret = JSON.parse(response.SecretString || '{}');
  return secret.secret;
}
```

### Secrets Stored

- JWT signing secret
- API keys (Stripe, OpenAI, etc.)
- Database passwords
- Redis passwords

---

## OWASP ZAP Integration

### Overview

Automated security scanning using OWASP ZAP baseline scan. Integrated into CI/CD pipeline.

### Implementation

**Script:** `scripts/security/run-zap-baseline.sh`  
**Workflow:** `.github/workflows/security-owasp.yml`

### Features

- **Baseline Scanning**: Automated security vulnerability detection
- **CI Integration**: Runs on schedule and manual trigger
- **Report Generation**: HTML and JSON reports
- **Threshold Enforcement**: Fail builds on high/medium risk findings

### Usage

#### Manual Run

```bash
chmod +x scripts/security/run-zap-baseline.sh
./scripts/security/run-zap-baseline.sh https://app.luneo.app ./reports
```

#### CI Integration

The workflow runs automatically:
- **Schedule**: Every Monday at 03:00 UTC
- **Manual**: Via GitHub Actions UI
- **On PR**: Can be triggered for PRs

### Configuration

Environment variables:

- `ZAP_TIMEOUT`: Scan timeout in seconds (default: 600)
- `ZAP_FAIL_ON_HIGH`: Fail build on high risk (default: true)
- `ZAP_FAIL_ON_MEDIUM`: Fail build on medium risk (default: false)

### Reports

Reports are uploaded as GitHub Actions artifacts:
- HTML report: `zap-report-YYYYMMDD-HHMMSS.html`
- JSON report: `zap-report-YYYYMMDD-HHMMSS.json`

---

## Pre-commit Secret Scanning

### Overview

Pre-commit hook that scans staged files for potential secrets before committing.

### Implementation

**Hook:** `.githooks/pre-commit-secrets.sh`

### Features

- **Pattern Matching**: Detects common secret patterns
- **Gitleaks Integration**: Uses gitleaks if available
- **File Exclusion**: Excludes build artifacts, lock files, etc.
- **Configurable**: Can fail or warn on secrets

### Installation

#### Option 1: Git Hooks Path

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit-secrets.sh
```

#### Option 2: Manual Copy

```bash
cp .githooks/pre-commit-secrets.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Configuration

Environment variables:

- `PRE_COMMIT_FAIL_ON_SECRETS`: Fail commit on secrets (default: true)
- `PRE_COMMIT_VERBOSE`: Show detailed output (default: false)

### Detected Patterns

- API keys (various formats)
- AWS access keys
- Private keys (RSA, etc.)
- Passwords
- JWT secrets
- Stripe keys
- GitHub tokens
- Database connection strings

### Example Output

```
⚠ SECRET DETECTION FAILED

Potential secrets were detected in your staged changes.
Please review and remove any secrets before committing.

Common issues:
  - Hardcoded API keys
  - Database passwords
  - Private keys
  - JWT secrets

Solutions:
  - Use environment variables
  - Use secret management (AWS Secrets Manager, etc.)
  - Add to .gitignore if file should not be tracked
```

---

## Performance Considerations

### Rate Limiting

- **Token Bucket**: O(1) operations with Redis
- **Lua Scripts**: Atomic operations reduce Redis round-trips
- **Connection Pooling**: Reuses Redis connections

### Webhook Verification

- **Nonce Storage**: Redis TTL handles cleanup automatically
- **Constant-Time Comparison**: Prevents timing attacks
- **Batch Operations**: Can verify multiple webhooks efficiently

### JWT Rotation

- **Grace Period**: Allows zero-downtime rotation
- **Cache Invalidation**: Automatically clears Redis cache
- **Database Updates**: Batch operations for efficiency

---

## Best Practices

1. **Rate Limits**: Set appropriate limits per tenant tier
2. **Rotation**: Rotate secrets regularly (every 90 days)
3. **Monitoring**: Monitor rate limit violations and rotation status
4. **Secrets**: Never commit secrets to git
5. **Webhooks**: Always verify signatures and check nonces
6. **Scanning**: Run OWASP ZAP scans regularly

---

## Troubleshooting

### Rate Limit Issues

- Check Redis connectivity
- Verify tenant ID extraction
- Review rate limit configuration

### JWT Rotation Issues

- Ensure grace period hasn't expired
- Check Redis for rotation plan
- Verify environment variables

### Webhook Verification Failures

- Verify secret matches sender
- Check timestamp tolerance
- Ensure nonce isn't reused

---

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
