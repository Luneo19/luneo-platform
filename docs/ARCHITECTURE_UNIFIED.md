# 🏗️ ARCHITECTURE UNIFIÉE - LUNEO ENTERPRISE

## 📋 Vue d'ensemble

**Luneo Enterprise** est un SaaS B2B complet de personnalisation de produits avec IA, construit avec une architecture moderne, scalable et enterprise-ready.

---

## 🎯 Architecture Globale Unifiée

```mermaid
flowchart LR
  subgraph USER_SIDE
    C[Client Browser / Mobile App]
    AR[Mobile Camera (WebAR)]
  end

  subgraph FRONTEND
    FE[Next.js (app.luneo.app)]
    WIDGET[Personalization Widget (iframe/SDK)]
  end

  subgraph EDGE
    CDN[Vercel CDN / Cloudflare]
    WAF[WAF & DDoS Protection]
  end

  subgraph BACKEND
    API[API Gateway / NestJS API (api.luneo.app)]
    AUTH[Auth Service (JWT / OAuth / SAML)]
    WORKER[BullMQ Workers (Hetzner / Docker)]
    IA[AI Generation Service (OpenAI + Local fallback)]
    PROCESS[Image Processing (Sharp / custom)]
    STORAGE[Cloudinary / Object Storage]
    QUEUE[Redis]
  end

  subgraph DATA
    PG[(PostgreSQL)]
    S3[(Blob Storage - backups)]
    LOGS[(ELK / Loki)]
    METRICS[(Prometheus / Grafana)]
  end

  subgraph EXTERNAL
    STRIPE[Stripe]
    SENDGRID[SendGrid]
    SENTRY[Sentry]
    OPENAI[OpenAI API]
    SCM[SCIM/IdP]
  end

  C -->|loads| FE
  FE -->|widget requests| WIDGET
  WIDGET -->|api calls| CDN
  CDN --> API
  API --> AUTH
  API --> WORKER
  WORKER --> IA
  IA --> STORAGE
  IA --> PROCESS
  WORKER --> QUEUE
  API --> PG
  API --> STRIPE
  API --> SENDGRID
  API --> SENTRY
  API --> LOGS
  API --> METRICS
  STORAGE --> CDN
  AR --> FE
  OPENAI --> IA
  SCM --> AUTH
```

---

## 🔄 Flux Principal - Génération Image Personnalisée

```mermaid
sequenceDiagram
  participant User as Client (browser/mobile)
  participant FE as Next.js Widget
  participant API as NestJS API
  participant Auth as Auth Service
  participant Queue as BullMQ Worker
  participant AI as AI Engine (OpenAI)
  participant Proc as Image Processor
  participant Storage as Cloudinary
  participant DB as PostgreSQL

  User->>FE: Prompt ("grave 'Jessica' + script cursif + or")
  FE->>API: POST /v1/designs {prompt, productId, options, previewMode}
  API->>Auth: verify token
  Auth-->>API: ok
  API->>DB: create Design row (status: queued, promptHash)
  API->>Queue: enqueue job: generate-design (designId)
  Queue->>AI: request generation (masked product template + prompt)
  AI-->>Queue: generated image (preview)
  Queue->>Proc: high-res upgrade + compositing on product template
  Proc-->>Storage: upload preview & highRes
  Proc->>DB: update Design (status: completed, previewUrl, highResUrl, costCents)
  DB-->>API: design updated
  API->>FE: respond {designId, previewUrl}
  FE->>User: shows live preview
  User->>FE: add to cart / checkout
  FE->>API: POST /v1/orders {designId, productId, qty}
  API->>Stripe: create PaymentIntent
  Stripe-->>API: success
  API->>DB: create Order (link design)
  API->>SENDGRID: send confirmation
```

---

## 🚀 Déploiement & Infrastructure

```mermaid
graph TD
  subgraph CI_CD
    GH[GitHub Actions / CI]
    TF[Terraform]
  end
  subgraph VPC
    Hetzner[Hetzner / Provider]
    Docker[Docker Swarm / Nomad]
    KMS[HashiCorp Vault / KMS]
    PG[Managed PostgreSQL Cluster]
    Redis[Managed Redis]
  end
  GH -->|build| Vercel
  GH -->|deploy infra| TF
  Vercel --> CDN
  GH -->|deploy| Hetzner
  KMS --> API
  PG --> API
  Redis --> Worker
```

---

## 🗄️ Schéma ER Simplifié (Tables Clés)

```mermaid
erDiagram
  USER ||--o{ BRAND : belongs_to
  BRAND ||--o{ PRODUCT : owns
  PRODUCT ||--o{ DESIGN : has
  DESIGN ||--o{ ORDERITEM : used_in
  ORDER ||--o{ ORDERITEM : contains
  BRAND ||--o{ APIKEY : issues
  USER ||--o{ DESIGN : creates

  USER {
    uuid id PK
    string email
    string firstName
    string lastName
    enum role
    boolean isActive
    timestampts
  }

  BRAND {
    uuid id PK
    string name
    string slug
    enum status
    string stripeCustomerId
    string plan
    json settings
    string webhookUrl
    timestampts
  }

  PRODUCT {
    uuid id PK
    string name
    decimal price
    string currency
    string[] images
    string model3dUrl
    json customizationOptions
    boolean isActive
    timestampts
  }

  DESIGN {
    uuid id PK
    string name
    text prompt
    string promptHash
    string previewUrl
    string highResUrl
    int costCents
    enum status
    uuid productId FK
    uuid brandId FK
    uuid userId FK
    timestampts
  }

  ORDER {
    uuid id PK
    string orderNumber
    decimal totalAmount
    string currency
    enum status
    uuid brandId FK
    uuid userId FK
    timestampts
  }
```

---

## 🔌 API Contract Minimal

### Endpoints Clés

```yaml
# Authentification
POST /v1/auth/login
  body: {email, password}
  returns: {accessToken, refreshToken}

POST /v1/auth/sso/saml/callback
  # SSO callback

# Gestion des produits
GET /v1/brands/{brandId}/products
  # list products

# Génération de designs
POST /v1/designs
  body: {
    productId: "prod_123",
    prompt: "Grave en script cursif 'Jessica' centré sur le fermoir, couleur: or 18k, profondeur: 0.6mm",
    options: {
      font: "script-cursive",
      position: "center",
      material: "gold",
      finish: "polished"
    },
    previewMode: true
  }
  returns: {
    designId: "dsg_456",
    status: "queued",
    estimatedSeconds: 4
  }

GET /v1/designs/{designId}
  # get design status + urls

POST /v1/designs/{designId}/finalize
  # lock design for order (creates snapshot)

# Commandes
POST /v1/orders
  body: {designId, productId, shipping}
  # create order

# Webhooks
GET /v1/webhooks/verify
  # webhook receiver

# Administration
POST /v1/admin/ai/costs
  # admin cost reports

# WebSocket
WebSocket /v1/realtime
  # push updates (design ready)
```

---

## 🔒 Sécurité & Conformité

### Règles Machines + Checklist

#### Secrets Management
- ✅ **Secrets**: stocker dans Vault / KMS, pas d'env vars en clair dans repo
- ✅ **Rotation**: automatique des secrets avec TTL
- ✅ **Encryption**: chiffrement au repos et en transit

#### Webhooks
- ✅ **HMAC-SHA256**: signature + idempotency-key
- ✅ **Rate Limiting**: protection contre les attaques
- ✅ **Validation**: payload validation stricte

#### Prompts & Modération
- ✅ **Validation**: validation + blacklist/denylist
- ✅ **Moderation**: via OpenAI moderation endpoint
- ✅ **PII**: anonymisation des visages, consentement

#### Conformité
- ✅ **GDPR**: endpoint `DELETE /v1/brands/{id}/data` pour right-to-be-forgotten
- ✅ **PCI**: laisser Stripe gérer cartes (no raw PANs)
- ✅ **SSO**: SAML + SCIM provisioning

---

## 📊 Observabilité (Metrics & SLOs)

### SLI Examples
- **Design generation latency**: median < 2s preview, p95 < 7s
- **API error rate**: < 0.5%
- **Image delivery success**: > 99.9%

### SLOs
- **99.9% uptime** pour API (monthly)

### Logging & Tracing
- **Logs**: structured JSON logs (trace_id, brandId, userId, designId, promptHash)
- **Tracing**: OpenTelemetry → Jaeger/Datadog
- **Metrics**: Prometheus + Grafana

---

## 💰 Data Retention & Cost Control

### Retention Policy
- **Default retention**: 90 jours pour images générées
- **Option pay-to-keep**: par brand
- **Cost caps**: soft-limit alert à 75% budget, hard-limit block à 100%
- **Cache**: par promptHash pour éviter duplications

---

## 🗓️ 90-Day Dev Backlog

### Sprint A (0–2 weeks) — Infra & Safety Foundations
- [ ] Terraform skeleton pour Hetzner infra + managed PG + Redis
- [ ] Vault integration pour secrets (API keys, DB creds)
- [ ] Webhook HMAC verification et idempotency middleware
- [ ] Staging & sandbox environments (avec fake OpenAI credits)

### Sprint B (2–4 weeks) — Core Feature: Design Generation MVP
- [ ] API: POST /v1/designs, DB model, queue job skeleton
- [ ] Worker: call OpenAI DALL·E avec template mask + prompt, save preview to Cloudinary
- [ ] Frontend widget: prompt UI + show preview (websocket ou polling)
- [ ] Basic cost-tracking: record AICost rows et brandCost aggregation

### Sprint C (4–8 weeks) — Hardening & Integrations
- [ ] Prompt moderation & blacklist checks
- [ ] Billing: usage metering + invoice sample (Stripe usage-based)
- [ ] SSO: basic SAML integration + SCIM provisioning (one IdP test)
- [ ] Backups & restore test pour PostgreSQL

### Sprint D (8–12 weeks) — AR & 3D Pipeline Prototype
- [ ] Design → GLTF exporter (procedural engraving mapping)
- [ ] WebAR viewer integration (WebXR / 8thWall ou model-viewer fallback)
- [ ] Performance: LOD pipeline, CDN pour 3D assets

### Ongoing / Ops
- [ ] SLO monitoring + runbook pour incidents
- [ ] PenTest + SCA + SAST in CI
- [ ] SDK + Postman collection + developer sandbox docs

---

## 📁 Livrables pour Cursor

1. **Ce fichier** (architecture + diagrammes Mermaid)
2. **OpenAPI spec** (endpoints list ci-dessus) — générer openapi.yaml
3. **Terraform repo skeleton** (variables/outputs for Hetzner, PG, Redis, Vault)
4. **Repos séparés**:
   - frontend-widget (iframe + small JS SDK)
   - api (NestJS)
   - worker (node queue)
   - infra (terraform)
5. **Playbook d'onboarding** d'un brand (SSO steps, API key creation, sample prompt templates)

---

## 🛠️ Fichiers / Snippets Utiles

### Docker Compose Minimal pour Dev
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/luneo_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=luneo_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  localstack:
    image: localstack/localstack
    environment:
      - SERVICES=s3
    ports:
      - "4566:4566"

volumes:
  postgres_data:
  redis_data:
```

### Terraform Variables Example
```hcl
variable "hetzner_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
  default     = "api.luneo.app"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}
```

