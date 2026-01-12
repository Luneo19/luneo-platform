# 👑 SUPER ADMIN DASHBOARD - Architecture & Plan de Développement

> **Date**: Décembre 2024  
> **Status**: Architecture complète - Prêt pour développement

---

## 📋 VÉRIFICATION DES BIBLES CURSOR

### ✅ Règles Respectées

#### Architecture Monorepo
- ✅ Structure respectée : `apps/backend/` (NestJS) et `apps/frontend/` (Next.js 15)
- ✅ Packages partagés dans `packages/`
- ✅ Stack technique conforme : NestJS 10, Prisma 5.22, Next.js 15, TypeScript

#### Authentification & Autorisation
- ✅ Utilisation du système JWT existant
- ✅ Rôle `PLATFORM_ADMIN` déjà présent dans le schema Prisma
- ✅ Guards NestJS existants (`JwtAuthGuard`, `RolesGuard`)
- ✅ Middleware Next.js pour protection routes

#### Conventions de Code
- ✅ Backend : DTOs avec class-validator, Services pour logique métier
- ✅ Frontend : 'use client' pour interactivité, logger au lieu de console
- ✅ API Calls : Utilisation de `endpoints` depuis `@/lib/api/client`
- ✅ Styling : Tailwind CSS + shadcn/ui components

#### Base de Données
- ✅ Prisma ORM avec migrations
- ✅ Schema existant avec modèles User, Brand, Order, etc.
- ✅ Relations déjà définies

---

## 🏗️ ARCHITECTURE COMPLÈTE

### Structure des Fichiers

```
apps/frontend/src/
├── app/
│   ├── (super-admin)/              # ⚡ NOUVEAU GROUPE ROUTE ADMIN
│   │   ├── layout.tsx              # Layout Super Admin avec protection
│   │   └── admin/
│   │       ├── page.tsx            # Dashboard Overview ✅
│   │       ├── customers/
│   │       │   ├── page.tsx        # Liste clients ✅
│   │       │   ├── [customerId]/
│   │       │   │   └── page.tsx    # Détail client ✅
│   │       │   ├── segments/
│   │       │   │   └── page.tsx    # Segments clients
│   │       │   └── export/
│   │       │       └── page.tsx    # Export clients
│   │       ├── analytics/
│   │       │   ├── page.tsx        # Analytics Overview ✅
│   │       │   ├── revenue/
│   │       │   │   └── page.tsx    # Revenue analytics
│   │       │   ├── retention/
│   │       │   │   └── page.tsx    # Cohort retention
│   │       │   ├── ltv/
│   │       │   │   └── page.tsx    # LTV analysis
│   │       │   └── funnel/
│   │       │       └── page.tsx    # Funnel conversion
│   │       ├── marketing/
│   │       │   ├── page.tsx        # Marketing overview
│   │       │   ├── campaigns/
│   │       │   │   ├── page.tsx    # Liste campagnes
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [campaignId]/
│   │       │   │       └── page.tsx
│   │       │   ├── automations/
│   │       │   │   ├── page.tsx    # Liste automations ✅
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [automationId]/
│   │       │   │       ├── page.tsx
│   │       │   │       └── edit/
│   │       │   │           └── page.tsx
│   │       │   ├── templates/
│   │       │   │   ├── page.tsx    # Liste templates
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [templateId]/
│   │       │   │       └── page.tsx
│   │       │   └── analytics/
│   │       │       └── page.tsx    # Email analytics
│   │       ├── ads/
│   │       │   ├── page.tsx        # Ads Overview ✅
│   │       │   ├── meta/
│   │       │   │   ├── page.tsx    # Meta Ads dashboard
│   │       │   │   ├── connect/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── campaigns/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── conversions/
│   │       │   │       └── page.tsx
│   │       │   ├── google/
│   │       │   │   └── ... (même structure)
│   │       │   ├── tiktok/
│   │       │   │   └── ... (même structure)
│   │       │   ├── attribution/
│   │       │   │   └── page.tsx    # Attribution multi-touch
│   │       │   └── roi/
│   │       │       └── page.tsx    # ROI analysis
│   │       ├── webhooks/
│   │       │   ├── page.tsx        # Webhooks management ✅
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   ├── [webhookId]/
│   │       │   │   └── page.tsx
│   │       │   └── logs/
│   │       │       └── page.tsx    # Webhook logs
│   │       ├── events/
│   │       │   ├── page.tsx        # Event logs
│   │       │   └── [eventId]/
│   │       │       └── page.tsx
│   │       ├── integrations/
│   │       │   ├── page.tsx        # Integrations overview
│   │       │   ├── stripe/
│   │       │   │   └── page.tsx
│   │       │   ├── email-provider/
│   │       │   │   └── page.tsx
│   │       │   └── api-keys/
│   │       │       └── page.tsx
│   │       └── settings/
│   │           ├── page.tsx        # Admin settings
│   │           ├── security/
│   │           │   └── page.tsx
│   │           └── notifications/
│   │               └── page.tsx
│   │
│   └── api/
│       └── admin/                  # 🔒 API ROUTES ADMIN
│           ├── analytics/
│           │   ├── overview/
│           │   │   └── route.ts    # GET overview metrics ✅
│           │   ├── revenue/
│           │   │   └── route.ts    # GET revenue metrics
│           │   ├── mrr/
│           │   │   └── route.ts    # GET MRR data
│           │   ├── churn/
│           │   │   └── route.ts    # GET churn metrics
│           │   ├── cohort/
│           │   │   └── route.ts    # GET cohort data
│           │   └── funnel/
│           │       └── route.ts    # GET funnel data
│           ├── customers/
│           │   ├── route.ts        # GET customers list ✅
│           │   ├── [customerId]/
│           │   │   ├── route.ts   # GET, PATCH customer ✅
│           │   │   ├── activity/
│           │   │   │   └── route.ts
│           │   │   ├── metrics/
│           │   │   │   └── route.ts
│           │   │   └── emails/
│           │   │       └── route.ts
│           │   ├── segments/
│           │   │   └── route.ts
│           │   ├── export/
│           │   │   └── route.ts
│           │   └── ltv/
│           │       └── route.ts
│           ├── marketing/
│           │   ├── campaigns/
│           │   │   ├── route.ts
│           │   │   └── [campaignId]/
│           │   │       ├── route.ts
│           │   │       └── send/
│           │   │           └── route.ts
│           │   ├── automations/
│           │   │   ├── route.ts
│           │   │   └── [automationId]/
│           │   │       ├── route.ts
│           │   │       └── trigger/
│           │   │           └── route.ts
│           │   ├── templates/
│           │   │   ├── route.ts
│           │   │   └── [templateId]/
│           │   │       └── route.ts
│           │   └── send/
│           │       └── route.ts
│           ├── ads/
│           │   ├── meta/
│           │   │   ├── route.ts
│           │   │   ├── connect/
│           │   │   │   └── route.ts
│           │   │   ├── campaigns/
│           │   │   │   └── route.ts
│           │   │   └── insights/
│           │   │       └── route.ts
│           │   ├── google/
│           │   │   └── ... (même structure)
│           │   ├── tiktok/
│           │   │   └── ... (même structure)
│           │   └── attribution/
│           │       └── route.ts
│           ├── webhooks/
│           │   ├── route.ts
│           │   ├── [webhookId]/
│           │   │   └── route.ts
│           │   ├── incoming/
│           │   │   ├── stripe/
│           │   │   │   └── route.ts
│           │   │   └── custom/
│           │   │       └── route.ts
│           │   └── logs/
│           │       └── route.ts
│           ├── events/
│           │   └── route.ts
│           └── notifications/
│               └── route.ts
│
├── components/
│   └── admin/                      # 🎨 COMPOSANTS ADMIN
│       ├── layout/
│       │   ├── admin-sidebar.tsx   # ✅ Reçu
│       │   ├── admin-header.tsx    # ✅ Reçu
│       │   ├── admin-breadcrumbs.tsx # ✅ Reçu
│       │   └── admin-nav.tsx       # Navigation mobile
│       ├── customers/
│       │   ├── customers-table.tsx # ✅ Reçu
│       │   ├── customer-card.tsx   # Carte client (grid view)
│       │   ├── customer-detail.tsx # ✅ Reçu
│       │   ├── customer-activity-feed.tsx
│       │   ├── customer-metrics.tsx
│       │   ├── customer-ltv-card.tsx
│       │   ├── customer-timeline.tsx
│       │   ├── customer-filters.tsx
│       │   ├── customer-segments.tsx
│       │   └── customer-export-modal.tsx
│       ├── analytics/
│       │   ├── revenue-chart.tsx    # ✅ Reçu
│       │   ├── mrr-chart.tsx
│       │   ├── arr-display.tsx
│       │   ├── churn-chart.tsx
│       │   ├── cohort-table.tsx    # ✅ Reçu
│       │   ├── funnel-chart.tsx    # ✅ Reçu
│       │   ├── ltv-chart.tsx
│       │   ├── acquisition-chart.tsx
│       │   ├── retention-curve.tsx
│       │   ├── kpi-cards.tsx
│       │   └── metrics-comparison.tsx
│       ├── marketing/
│       │   ├── campaigns-table.tsx
│       │   ├── campaign-builder.tsx
│       │   ├── campaign-stats.tsx
│       │   ├── automation-builder.tsx # ✅ Reçu
│       │   ├── automation-flow.tsx
│       │   ├── automation-node.tsx
│       │   ├── email-template-editor.tsx # ✅ Reçu
│       │   ├── email-preview.tsx
│       │   ├── email-stats.tsx
│       │   ├── recipient-selector.tsx
│       │   └── send-test-modal.tsx
│       ├── ads/
│       │   ├── ads-overview.tsx    # ✅ Reçu
│       │   ├── platform-card.tsx   # ✅ Reçu
│       │   ├── connect-platform.tsx
│       │   ├── campaigns-list.tsx
│       │   ├── campaign-metrics.tsx
│       │   ├── conversion-tracking.tsx
│       │   ├── roi-calculator.tsx
│       │   ├── attribution-model.tsx
│       │   ├── spend-chart.tsx
│       │   ├── cpa-chart.tsx
│       │   ├── roas-display.tsx
│       │   └── platform-comparison.tsx
│       ├── webhooks/
│       │   ├── webhooks-table.tsx  # ✅ Reçu
│       │   ├── webhook-form.tsx
│       │   ├── webhook-logs.tsx    # ✅ Reçu
│       │   ├── webhook-test.tsx
│       │   └── event-log-viewer.tsx
│       └── widgets/
│           ├── kpi-card.tsx        # ✅ Reçu
│           ├── stat-card-admin.tsx # ✅ Reçu
│           ├── activity-feed.tsx   # ✅ Reçu
│           ├── quick-actions.tsx   # ✅ Reçu
│           ├── recent-customers.tsx # ✅ Reçu
│           ├── trend-indicator.tsx
│           ├── mini-chart.tsx
│           ├── alerts-panel.tsx
│           └── revenue-ticker.tsx
│
├── lib/
│   └── admin/                      # 🔧 UTILS ADMIN
│       ├── permissions.ts          # Vérification admin ✅
│       ├── metrics-calculator.ts   # Calculs métriques ✅
│       ├── export-utils.ts         # Export CSV/Excel
│       ├── integrations/
│       │   ├── meta-ads.ts         # Client Meta API
│       │   ├── google-ads.ts       # Client Google Ads API
│       │   ├── tiktok-ads.ts       # Client TikTok API
│       │   └── oauth-helpers.ts    # Helpers OAuth
│       ├── email/
│       │   ├── email-client.ts     # Client Resend/SendGrid
│       │   ├── templates.ts        # Templates par défaut
│       │   └── automation-engine.ts # Moteur automation
│       └── webhooks/
│           ├── webhook-handler.ts
│           ├── event-emitter.ts
│           └── signature-verify.ts
│
├── hooks/
│   └── admin/                      # 🎣 HOOKS ADMIN
│       ├── use-admin-auth.ts       # Hook auth admin
│       ├── use-admin-overview.ts   # ✅ Reçu
│       ├── use-customers.ts        # ✅ Reçu
│       ├── use-customer-detail.ts  # ✅ Reçu
│       ├── use-customer-metrics.ts
│       ├── use-revenue-analytics.ts
│       ├── use-campaigns.ts
│       ├── use-automations.ts
│       ├── use-ads-platforms.ts
│       ├── use-meta-ads.ts
│       ├── use-google-ads.ts
│       ├── use-tiktok-ads.ts
│       ├── use-webhooks.ts
│       └── use-admin-notifications.ts # ✅ Reçu
│
├── types/
│   └── admin/                      # 📝 TYPES ADMIN
│       ├── customer.ts
│       ├── analytics.ts
│       ├── marketing.ts
│       ├── ads.ts
│       ├── webhook.ts
│       └── events.ts
│
└── config/
    └── admin-navigation.ts         # Config navigation ✅

apps/backend/src/
├── modules/
│   └── admin/                      # Module admin existant (à étendre)
│       ├── admin.controller.ts      # Existant (basique)
│       ├── admin.service.ts        # Existant (basique)
│       ├── admin.module.ts         # Existant
│       ├── dto/
│       │   ├── customer-filter.dto.ts
│       │   ├── campaign-create.dto.ts
│       │   └── webhook-create.dto.ts
│       ├── services/
│       │   ├── customers-admin.service.ts
│       │   ├── analytics-admin.service.ts
│       │   ├── marketing-admin.service.ts
│       │   ├── ads-admin.service.ts
│       │   └── webhooks-admin.service.ts
│       └── guards/
│           └── super-admin.guard.ts # Guard Super Admin
│
└── prisma/
    └── schema.prisma               # Schema à étendre avec modèles admin
```

---

## 🗄️ EXTENSIONS SCHÉMA PRISMA REQUISES

### Modèles à Ajouter

```prisma
// ============================================
// SUPER ADMIN - GESTION CLIENTS ÉTENDUE
// ============================================

model Customer {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Métriques
  totalRevenue      Float    @default(0)
  ltv               Float    @default(0)
  engagementScore   Int      @default(100)
  churnRisk         String   @default("low") // low, medium, high
  
  // Tracking
  firstSeenAt       DateTime @default(now())
  lastSeenAt        DateTime @default(now())
  totalSessions     Int      @default(0)
  totalTimeSpent    Int      @default(0) // en secondes
  
  // Segments
  segments          CustomerSegment[]
  
  // Relations
  activities        CustomerActivity[]
  emailsSent        EmailLog[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
  @@index([churnRisk])
  @@index([engagementScore])
}

model CustomerActivity {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  type        String   // login, action, page_view, etc.
  action      String
  metadata    Json?
  
  createdAt   DateTime @default(now())
  
  @@index([customerId, createdAt])
  @@index([type, createdAt])
}

model CustomerSegment {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  // Critères dynamiques
  criteria    Json     // { engagementScore: { gte: 80 }, plan: "pro" }
  
  customers   Customer[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([name])
}

// ============================================
// EMAIL MARKETING
// ============================================

model EmailTemplate {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  subject     String
  htmlContent String   @db.Text
  textContent String?  @db.Text
  variables   String[] // ["firstName", "planName", etc.]
  
  campaigns   EmailCampaign[]
  automationSteps AutomationStep[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([slug])
}

model EmailCampaign {
  id          String   @id @default(cuid())
  name        String
  subject     String
  templateId  String?
  template    EmailTemplate? @relation(fields: [templateId], references: [id])
  
  status      String   @default("draft") // draft, scheduled, sending, sent
  
  // Ciblage
  segmentId   String?
  segment     CustomerSegment? @relation(fields: [segmentId], references: [id])
  
  // Stats
  sentCount   Int      @default(0)
  openCount   Int      @default(0)
  clickCount  Int      @default(0)
  
  scheduledAt DateTime?
  sentAt      DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([segmentId])
}

model EmailAutomation {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  trigger     String   // user.created, trial.started, etc.
  triggerConfig Json?  // Config additionnelle du trigger
  
  status      String   @default("draft") // draft, active, paused
  
  steps       AutomationStep[]
  runs        AutomationRun[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([trigger])
}

model AutomationStep {
  id            String   @id @default(cuid())
  automationId  String
  automation    EmailAutomation @relation(fields: [automationId], references: [id], onDelete: Cascade)
  
  order         Int
  type          String   // email, wait, condition
  
  // Pour type "email"
  templateId    String?
  template      EmailTemplate? @relation(fields: [templateId], references: [id])
  subject       String?
  
  // Pour type "wait"
  waitDuration  Int?     // en minutes
  
  // Pour type "condition"
  condition     Json?
  
  createdAt     DateTime @default(now())
  
  @@index([automationId, order])
}

model AutomationRun {
  id            String   @id @default(cuid())
  automationId  String
  automation    EmailAutomation @relation(fields: [automationId], references: [id], onDelete: Cascade)
  
  customerId    String
  
  status        String   @default("active") // active, completed, cancelled
  currentStep   Int      @default(0)
  
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  nextStepAt    DateTime?
  
  @@index([automationId])
  @@index([customerId])
  @@index([status, nextStepAt])
}

model EmailLog {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  messageId   String   @unique // ID du provider (Resend, etc.)
  
  type        String   // campaign, automation, transactional
  campaignId  String?
  automationId String?
  
  subject     String
  template    String?
  
  status      String   @default("sent") // sent, delivered, opened, clicked, bounced
  
  openedAt    DateTime?
  clickedAt   DateTime?
  bouncedAt   DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([customerId, createdAt])
  @@index([type, createdAt])
  @@index([status])
}

// ============================================
// INTÉGRATIONS ADS
// ============================================

model AdPlatformConnection {
  id            String   @id @default(cuid())
  
  platform      String   // meta, google, tiktok
  accountId     String   // ID du compte pub
  accountName   String?
  
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime?
  
  status        String   @default("active") // active, expired, error
  lastSyncAt    DateTime?
  
  metadata      Json?    // Infos additionnelles du compte
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([platform, accountId])
  @@index([platform, status])
}

model AdCampaignSync {
  id            String   @id @default(cuid())
  
  platform      String
  externalId    String   // ID de la campagne sur la plateforme
  
  name          String
  status        String
  
  // Métriques synchronisées
  spend         Float    @default(0)
  impressions   Int      @default(0)
  clicks        Int      @default(0)
  conversions   Int      @default(0)
  revenue       Float    @default(0)
  
  // Période des données
  dateFrom      DateTime
  dateTo        DateTime
  
  syncedAt      DateTime @default(now())
  
  @@unique([platform, externalId, dateFrom, dateTo])
  @@index([platform, dateFrom])
}

// ============================================
// WEBHOOKS & EVENTS
// ============================================

model Webhook {
  id              String   @id @default(cuid())
  
  name            String
  url             String
  secret          String   // Pour signature HMAC
  
  events          String[] // Liste des event types
  
  active          Boolean  @default(true)
  failureCount    Int      @default(0)
  
  lastTriggeredAt DateTime?
  
  logs            WebhookLog[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([active])
  @@index([failureCount])
}

model WebhookLog {
  id          String   @id @default(cuid())
  webhookId   String
  webhook     Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id])
  
  status      String   // success, failed, pending
  statusCode  Int?
  
  requestBody  Json
  responseBody String?  @db.Text
  
  duration    Int?     // en ms
  error       String?  @db.Text
  
  attempts    Int      @default(1)
  nextRetryAt DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([webhookId, createdAt])
  @@index([status, nextRetryAt])
}

model Event {
  id          String   @id @default(cuid())
  
  type        String   // user.created, subscription.cancelled, etc.
  
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id])
  
  data        Json     // Payload de l'événement
  
  processed   Boolean  @default(false)
  processedAt DateTime?
  
  webhookLogs WebhookLog[]
  
  createdAt   DateTime @default(now())
  
  @@index([type, createdAt])
  @@index([customerId, createdAt])
  @@index([processed, createdAt])
}

// ============================================
// ANALYTICS & METRICS SNAPSHOTS
// ============================================

model DailyMetrics {
  id          String   @id @default(cuid())
  
  date        DateTime @db.Date
  
  // Revenue
  mrr         Float    @default(0)
  arr         Float    @default(0)
  revenue     Float    @default(0)
  
  // Customers
  totalCustomers    Int @default(0)
  activeCustomers   Int @default(0)
  newCustomers      Int @default(0)
  churnedCustomers  Int @default(0)
  
  // Trials
  activeTrials      Int @default(0)
  trialsStarted     Int @default(0)
  trialsConverted   Int @default(0)
  
  // Churn
  churnRate         Float @default(0)
  
  // Ads
  adSpend           Float @default(0)
  adConversions     Int   @default(0)
  adRevenue         Float @default(0)
  
  createdAt   DateTime @default(now())
  
  @@unique([date])
  @@index([date])
}

model MonthlyMetrics {
  id          String   @id @default(cuid())
  
  year        Int
  month       Int
  
  // Revenue
  mrr         Float    @default(0)
  arr         Float    @default(0)
  totalRevenue Float   @default(0)
  
  // Growth
  mrrGrowth   Float    @default(0)
  
  // Customers
  startingCustomers Int @default(0)
  endingCustomers   Int @default(0)
  newCustomers      Int @default(0)
  churnedCustomers  Int @default(0)
  
  // Rates
  churnRate         Float @default(0)
  conversionRate    Float @default(0)
  
  // LTV & CAC
  avgLtv            Float @default(0)
  avgCac            Float @default(0)
  ltvCacRatio       Float @default(0)
  
  createdAt   DateTime @default(now())
  
  @@unique([year, month])
  @@index([year, month])
}

model CohortData {
  id          String   @id @default(cuid())
  
  cohortMonth DateTime @db.Date // Mois de la cohorte (inscription)
  
  // Données par mois après inscription
  monthNumber Int      // 0 = mois d'inscription, 1 = mois suivant, etc.
  
  startingCount   Int  // Nombre de clients au départ de la cohorte
  remainingCount  Int  // Nombre de clients restants ce mois
  retentionRate   Float // % de rétention
  
  revenue     Float    @default(0)
  
  createdAt   DateTime @default(now())
  
  @@unique([cohortMonth, monthNumber])
  @@index([cohortMonth])
}

// ============================================
// NOTIFICATIONS ADMIN
// ============================================

model AdminNotification {
  id          String   @id @default(cuid())
  
  type        String   // alert, info, success, warning
  title       String
  message     String
  
  // Lien vers une action
  actionUrl   String?
  actionLabel String?
  
  read        Boolean  @default(false)
  readAt      DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([read, createdAt])
}

// ============================================
// AUDIT LOG (Actions Admin)
// ============================================

model AdminAuditLog {
  id          String   @id @default(cuid())
  
  adminId     String   // ID de l'admin qui a fait l'action
  
  action      String   // create, update, delete, export, etc.
  resource    String   // customer, campaign, webhook, etc.
  resourceId  String?
  
  changes     Json?    // Détail des changements (before/after)
  
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([adminId, createdAt])
  @@index([resource, resourceId])
}
```

### Relations à Ajouter au Modèle User

```prisma
model User {
  // ... champs existants ...
  
  // Relations Super Admin
  customer          Customer?
  adminNotifications AdminNotification[]
  adminAuditLogs   AdminAuditLog[] @relation("AdminAuditLogs")
}
```

---

## 🔐 SÉCURITÉ & PERMISSIONS

### Middleware Protection

**Fichier**: `apps/frontend/middleware.ts` (à créer/modifier)

```typescript
// Protection routes /admin/*
// Vérification rôle PLATFORM_ADMIN
// Redirection si non autorisé
```

### Guard Backend

**Fichier**: `apps/backend/src/modules/admin/guards/super-admin.guard.ts`

```typescript
// Guard NestJS pour vérifier rôle PLATFORM_ADMIN
// Utilisation avec @UseGuards(SuperAdminGuard)
```

### Permissions Utils

**Fichier**: `apps/frontend/src/lib/admin/permissions.ts`

```typescript
// Fonction checkAdminAccess() pour vérifier côté serveur
// Utilisation dans API routes et Server Components
```

---

## 📊 CALCULS MÉTRIQUES BUSINESS

### Service Métriques

**Fichier**: `apps/frontend/src/lib/admin/metrics-calculator.ts`

Fonctions principales :
- `calculateMRR()` - MRR actuel
- `calculateRevenueMetrics()` - Métriques complètes
- `calculateChurnMetrics()` - Churn rate, NRR
- `calculateLTVMetrics()` - LTV moyen, médian, projeté
- `calculateAcquisitionMetrics()` - CAC, payback, LTV/CAC
- `calculateCohortRetention()` - Analyse cohorte
- `calculateEngagementScore()` - Score engagement client
- `createDailySnapshot()` - Snapshot quotidien (cron)

---

## 🔄 WORKFLOW DE DÉVELOPPEMENT

### Phase 1 : Infrastructure & Base
1. ✅ Créer groupe route `(super-admin)`
2. ✅ Créer layout avec protection
3. ✅ Créer middleware protection
4. ✅ Créer guard backend
5. ✅ Étendre schema Prisma
6. ✅ Créer migrations

### Phase 2 : Layout & Navigation
1. ✅ Créer composants layout (sidebar, header, breadcrumbs)
2. ✅ Créer config navigation
3. ✅ Intégrer dans layout principal

### Phase 3 : Dashboard Overview
1. ✅ Créer page dashboard
2. ✅ Créer composants widgets (KPI cards, charts)
3. ✅ Créer API route overview
4. ✅ Créer hook useAdminOverview

### Phase 4 : Gestion Clients
1. ✅ Créer page liste clients
2. ✅ Créer composant customers-table
3. ✅ Créer page détail client
4. ✅ Créer API routes customers
5. ✅ Créer hooks useCustomers, useCustomerDetail

### Phase 5 : Analytics Business
1. ✅ Créer pages analytics
2. ✅ Créer composants charts
3. ✅ Créer API routes analytics
4. ✅ Implémenter calculs métriques

### Phase 6 : Email Marketing
1. ✅ Créer pages marketing
2. ✅ Créer automation builder
3. ✅ Créer template editor
4. ✅ Créer API routes marketing
5. ✅ Implémenter engine automation

### Phase 7 : Ads Manager
1. ✅ Créer pages ads
2. ✅ Créer composants platform cards
3. ✅ Créer intégrations OAuth
4. ✅ Créer API routes ads
5. ✅ Implémenter clients API (Meta, Google, TikTok)

### Phase 8 : Webhooks & Events
1. ✅ Créer pages webhooks
2. ✅ Créer composants webhooks
3. ✅ Créer API routes webhooks
4. ✅ Implémenter handler webhooks
5. ✅ Implémenter système events

### Phase 9 : Intégrations & Settings
1. Créer pages integrations
2. Créer pages settings
3. Créer API routes correspondantes

### Phase 10 : Tests & Optimisations
1. Tests unitaires composants
2. Tests E2E flows critiques
3. Optimisations performance
4. Documentation complète

---

## 🎯 POINTS D'ATTENTION

### Sécurité
- ✅ Vérification admin sur TOUTES les routes
- ✅ Rate limiting sur API admin
- ✅ Logging de toutes les actions admin (AdminAuditLog)
- ✅ Protection CSRF sur formulaires
- ✅ Validation stricte des inputs

### Performance
- ✅ Pagination sur toutes les listes
- ✅ Cache des métriques calculées (Redis)
- ✅ Lazy loading des composants lourds
- ✅ Optimisation des queries Prisma
- ✅ Indexes DB appropriés

### UX/UI
- ✅ Loading states partout
- ✅ Error boundaries
- ✅ Messages d'erreur clairs
- ✅ Confirmations pour actions critiques
- ✅ Feedback visuel immédiat

### Code Quality
- ✅ TypeScript strict
- ✅ Validation DTOs backend
- ✅ Gestion erreurs complète
- ✅ Logging approprié
- ✅ Pas de console.log (utiliser logger)

---

## 📦 DÉPENDANCES À AJOUTER

### Frontend
```json
{
  "recharts": "^2.10.0",           // Charts
  "date-fns": "^2.30.0",           // Date formatting
  "framer-motion": "^10.16.0",     // Animations
  "react-day-picker": "^8.9.0",    // Date picker
  "nanoid": "^5.0.0",              // ID generation
  "papaparse": "^5.4.0",           // CSV export
  "xlsx": "^0.18.0"                // Excel export
}
```

### Backend
```json
{
  "@nestjs/passport": "^10.0.0",   // Auth (déjà présent)
  "passport-jwt": "^4.0.0",        // JWT (déjà présent)
  "class-validator": "^0.14.0",    // Validation (déjà présent)
  "resend": "^2.0.0",              // Email service
  "facebook-nodejs-business-sdk": "^19.0.0", // Meta Ads
  "google-ads-api": "^14.0.0"      // Google Ads
}
```

---

## ✅ CHECKLIST ARCHITECTURE

- [x] Structure fichiers définie
- [x] Schema Prisma planifié
- [x] Routes API définies
- [x] Composants listés
- [x] Hooks identifiés
- [x] Services backend planifiés
- [x] Sécurité prise en compte
- [x] Performance optimisée
- [x] Conventions respectées

---

*Architecture créée le: Décembre 2024*  
*Prêt pour développement*
