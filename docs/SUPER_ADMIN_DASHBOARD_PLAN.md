# 👑 SUPER ADMIN DASHBOARD - Plan de Développement Complet

> **STATUS**: En attente de toutes les parties du prompt avant développement
> **Date**: Décembre 2024

---

## 📋 PARTIE 1 - Architecture Complète (Reçue ✅)

### 🎯 CONTEXTE
Dashboard Super Admin COMPLET séparé du dashboard utilisateur standard.
Permet de gérer le SaaS de A à Z.

### 🎯 FONCTIONNALITÉS REQUISES

#### 1️⃣ GESTION CLIENTS
- Vue de tous les clients/abonnés
- Détail par client (profil, usage, historique)
- Métriques par client (temps passé, actions, résultats)
- LTV (Lifetime Value) par client
- Segmentation clients (actifs, churning, VIP, etc.)
- Filtres et recherche avancée

#### 2️⃣ EMAIL MARKETING & AUTOMATION
- Workflows automatisés (onboarding, promo, churn prevention)
- Templates d'emails
- Historique d'envois
- Métriques emails (open rate, click rate, etc.)
- Intégration avec service email (Resend, SendGrid, etc.)

#### 3️⃣ INTÉGRATIONS ADS & ANALYTICS
- Meta (Facebook/Instagram) Ads
- Google Ads
- TikTok Ads
- Suivi des conversions
- ROI par canal
- Attribution

#### 4️⃣ ANALYTICS BUSINESS
- Revenue (MRR, ARR, churn rate)
- Acquisition metrics
- Funnel conversion
- Cohort analysis

#### 5️⃣ SYSTÈME DE NOTIFICATIONS & WEBHOOKS
- Webhooks entrants/sortants
- Logs des événements
- Alertes temps réel

---

## 📁 ARCHITECTURE COMPLÈTE DES FICHIERS

### Frontend Structure
```
apps/frontend/src/
├── app/
│   ├── (super-admin)/          # ⚡ GROUPE SUPER ADMIN
│   │   ├── layout.tsx          # Layout Super Admin
│   │   └── admin/
│   │       ├── page.tsx        # Dashboard principal
│   │       ├── customers/      # 👥 GESTION CLIENTS
│   │       ├── analytics/      # 📊 ANALYTICS BUSINESS
│   │       ├── marketing/     # 📧 EMAIL MARKETING
│   │       ├── ads/            # 📱 INTÉGRATIONS ADS
│   │       ├── webhooks/      # 🔗 WEBHOOKS & EVENTS
│   │       ├── events/        # 📋 EVENT LOGS
│   │       ├── integrations/  # 🔌 INTÉGRATIONS
│   │       └── settings/      # ⚙️ SETTINGS ADMIN
│   └── api/
│       └── admin/              # 🔒 API ROUTES ADMIN
│           ├── customers/
│           ├── analytics/
│           ├── marketing/
│           ├── ads/
│           ├── webhooks/
│           └── events/
├── components/
│   └── admin/                  # 🎨 COMPOSANTS ADMIN
│       ├── layout/
│       ├── customers/
│       ├── analytics/
│       ├── marketing/
│       ├── ads/
│       ├── webhooks/
│       └── widgets/
├── lib/
│   └── admin/                  # 🔧 UTILS ADMIN
│       ├── permissions.ts
│       ├── metrics-calculator.ts
│       ├── export-utils.ts
│       ├── integrations/
│       ├── email/
│       └── webhooks/
├── hooks/
│   └── admin/                  # 🎣 HOOKS ADMIN
├── types/
│   └── admin/                  # 📝 TYPES ADMIN
└── config/
    └── admin-navigation.ts
```

---

## 🎨 DESIGN & LAYOUT SUPER ADMIN

### Layout Principal
- Sidebar dark mode avec navigation groupée
- Header avec recherche globale, notifications, user menu
- Breadcrumbs dynamiques
- Support responsive (mobile: bottom nav ou slide-over)

### Navigation Admin
Groupes :
- **Main**: Overview, Customers, Analytics
- **Marketing**: Email Marketing, Ads Manager
- **System**: Webhooks, Events, Integrations, Settings

---

## 📊 PAGE DASHBOARD OVERVIEW ADMIN

### Layout de la Page
- KPI Cards: MRR, Growth, Customers, Churn
- Revenue Chart (MRR over time)
- Recent Activity Feed
- Revenue by Plan (Donut chart)
- Acquisition Channels (Bar chart)
- Campaign Performance Summary
- Quick Actions
- Recent Customers Table

### Composants à Créer
- `kpi-card.tsx`
- `revenue-chart.tsx`
- `activity-feed.tsx`
- `plan-distribution.tsx`
- `acquisition-channels.tsx`
- `campaign-summary.tsx`
- `quick-actions.tsx`
- `recent-customers.tsx`

### API Route
- `GET /api/admin/analytics/overview` - Retourne toutes les métriques

---

## 👥 GESTION CLIENTS

### Page Liste Clients
- Table avec colonnes: Customer, Email, Plan, MRR, LTV
- Filtres: Status, Plan, Segment, Date Range
- Tabs: All, Active, Trial, Churned, At Risk
- Bulk Actions: Send Email, Add to Segment, Export Selected
- Pagination

### Page Détail Client
- Tabs: Overview, Activity, Billing, Emails, Notes
- Métriques: LTV, Time Spent, Sessions, Actions
- Usage Over Time Chart
- Customer Info (Company, Size, Industry, Country, Timezone)
- Segments
- Recent Activity Feed

### Calcul LTV
- `calculateCustomerLTV()` dans `metrics-calculator.ts`
- Formule: LTV = ARPU / Churn Rate
- Engagement Score (0-100)
- Churn Risk: low/medium/high

---

## 📧 EMAIL MARKETING & AUTOMATION

### Workflows Automatiques Pré-configurés
1. **Welcome Series** - Trigger: `user.created`
2. **Trial Conversion** - Trigger: `trial.started`
3. **Churn Prevention** - Trigger: `engagement.low`
4. **Cancellation Flow** - Trigger: `subscription.cancelled`
5. **Upgrade Nudge** - Trigger: `usage.limit.reached`
6. **Payment Failed** - Trigger: `payment.failed`

### Page Automations
- Liste des workflows avec stats
- Status: Active, Draft, Paused
- Stats: Sent, Opened, Clicked, Converted

### Éditeur de Workflow Visuel
- Workflow Builder avec nodes drag & drop
- Types de nodes: Email, Wait, Condition, Tag User, Notify
- Visual flow representation

### Intégration Email Service
- Client Resend/SendGrid
- `sendEmail()` function
- `processAutomation()` engine
- Logging des envois

---

## 📱 INTÉGRATIONS ADS (Meta, Google, TikTok)

### Architecture OAuth
- Meta Ads: Facebook Graph API
- Google Ads: Google Ads API
- TikTok Ads: TikTok Business API

### Clients API
- `MetaAdsClient` - Campagnes, Insights, Conversions
- `GoogleAdsClient` - Campagnes, Performance Reports
- `TikTokAdsClient` - Campagnes, Insights

### Page Overview Ads
- Connected Platforms Cards
- KPIs: Spend, Impressions, Conversions, ROAS
- Spend & Conversions by Platform Chart
- Performance by Platform Table
- Top Campaigns List

### Attribution & ROI
- Modèles: first-touch, last-touch, linear, time-decay, position-based
- `calculateAttribution()` function
- `calculateChannelROI()` function

---

## 🔗 WEBHOOKS & EVENTS

### Types d'Événements
- User events: `user.created`, `user.verified`, `user.updated`, `user.deleted`
- Subscription events: `subscription.created`, `subscription.updated`, `subscription.cancelled`, `subscription.renewed`
- Payment events: `payment.succeeded`, `payment.failed`, `payment.refunded`
- Trial events: `trial.started`, `trial.ending`, `trial.ended`, `trial.converted`
- Engagement events: `engagement.low`, `engagement.milestone`
- Usage events: `usage.limit.approaching`, `usage.limit.reached`

### Gestion Webhooks
- CRUD Webhooks
- Signature HMAC SHA256
- Retry automatique
- Logs des envois
- Test de webhooks

### Page Webhooks
- Liste des webhooks avec status
- Events associés
- Last triggered timestamp
- Actions: Edit, Test, View Logs, Disable

### Page Event Logs
- Table avec filtres: Event Type, Customer, Date Range, Status
- Colonnes: Time, Event, Customer, Status, Webhooks
- View Event Detail modal

---

## 🗄️ SCHÉMA BASE DE DONNÉES ADMIN

### Models Prisma (Complet ✅)

#### Gestion Clients Étendue
- `Customer` - Métriques étendues (LTV, engagementScore, churnRisk, totalRevenue, totalSessions, totalTimeSpent)
- `CustomerActivity` - Tracking des activités (type, action, metadata)
- `CustomerSegment` - Segments dynamiques avec critères JSON

#### Email Marketing
- `EmailTemplate` - Templates réutilisables (slug, subject, htmlContent, variables)
- `EmailCampaign` - Campagnes email (status, segmentId, stats)
- `EmailAutomation` - Workflows automatisés (trigger, triggerConfig, status)
- `AutomationStep` - Steps des workflows (order, type, waitDuration, condition)
- `AutomationRun` - Exécutions des workflows (status, currentStep, nextStepAt)
- `EmailLog` - Logs des envois (messageId, type, status, openedAt, clickedAt)

#### Intégrations Ads
- `AdPlatformConnection` - Connexions OAuth (platform, accountId, tokens, status)
- `AdCampaignSync` - Synchronisation des campagnes (spend, impressions, clicks, conversions, revenue)

#### Webhooks & Events (Complet)
- `Webhook` - Configuration webhooks (name, url, secret, events[], active, failureCount)
- `WebhookLog` - Logs détaillés (status, statusCode, requestBody, responseBody, duration, retry logic)
- `Event` - Événements système (type, customerId, data, processed)

#### Analytics & Metrics Snapshots
- `DailyMetrics` - Snapshots quotidiens (MRR, ARR, customers, churn, ads metrics)
- `MonthlyMetrics` - Métriques mensuelles (MRR Growth, LTV, CAC, ratios)
- `CohortData` - Données de cohorte (cohortMonth, monthNumber, retentionRate, revenue)

#### Notifications & Audit
- `AdminNotification` - Notifications admin (type, title, message, actionUrl, read)
- `AdminAuditLog` - Log actions admin (adminId, action, resource, changes, IP, userAgent)

---

## 📋 PARTIE 2 - Schéma Prisma Complet, Métriques & API Routes (Reçue ✅)

### 🗄️ SCHÉMA PRISMA COMPLET

#### Webhooks & Events (Suite)
- `Webhook` - Configuration complète avec secret HMAC, events, failureCount
- `WebhookLog` - Logs détaillés avec status, statusCode, requestBody, responseBody, duration, retry logic
- `Event` - Événements système avec type, customerId, data, processed status

#### Analytics & Metrics Snapshots
- `DailyMetrics` - Snapshots quotidiens (MRR, ARR, customers, churn, ads)
- `MonthlyMetrics` - Métriques mensuelles (MRR Growth, LTV, CAC, ratios)
- `CohortData` - Données de cohorte pour analyse de rétention

#### Notifications Admin
- `AdminNotification` - Notifications pour les admins (alert, info, success, warning)

#### Audit Log
- `AdminAuditLog` - Log de toutes les actions admin (action, resource, changes, IP, userAgent)

---

### 📊 SERVICE DE CALCUL DES MÉTRIQUES BUSINESS

**Fichier**: `src/lib/admin/metrics-calculator.ts`

#### Interfaces Principales
- `RevenueMetrics` - MRR, ARR, growth, totalRevenue, ARPU
- `CustomerMetrics` - Total, active, trial, churned, at-risk, new
- `ChurnMetrics` - Rate, count, revenueChurn, NRR
- `LTVMetrics` - Average, median, byPlan, projected
- `AcquisitionMetrics` - CAC, paybackPeriod, LTV/CAC ratio, byChannel

#### Fonctions Principales

##### Calcul MRR & ARR
- `calculateMRR()` - MRR actuel basé sur subscriptions actives
- `calculateRevenueMetrics(period)` - Métriques complètes de revenue avec croissance

##### Calcul Churn
- `calculateChurnMetrics(period)` - Churn rate, revenue churn, Net Revenue Retention

##### Calcul LTV
- `calculateLTVMetrics()` - LTV moyen, médian, par plan, projeté
- Formule projeté: `LTV = ARPU / Churn Rate`

##### Calcul CAC & Acquisition
- `calculateAcquisitionMetrics(period)` - CAC, payback period, LTV/CAC ratio, par canal

##### Cohort Analysis
- `calculateCohortRetention(cohortMonth, monthsToAnalyze)` - Analyse de rétention par cohorte

##### Engagement Score
- `calculateEngagementScore(customerId)` - Score 0-100 basé sur activité récente

##### Snapshot Journalier (Cron Job)
- `createDailySnapshot()` - Crée un snapshot quotidien des métriques

---

### 🔌 API ROUTES ADMIN COMPLÈTES

#### `/api/admin/analytics/overview` - GET
**Fichier**: `src/app/api/admin/analytics/overview/route.ts`

**Fonctionnalités**:
- Retourne toutes les métriques pour le dashboard overview
- Paramètre `period` (jours, défaut: 30)
- Calculs en parallèle pour performance
- KPIs: MRR, Customers, Churn Rate, LTV
- Revenue chart data
- Plan distribution
- Acquisition channels
- Recent activity & customers

**Response Structure**:
```typescript
{
  kpis: {
    mrr: { value, change, changePercent, trend },
    customers: { value, new, trend },
    churnRate: { value, change, trend },
    ltv: { value, projected, trend }
  },
  revenue: RevenueMetrics,
  churn: ChurnMetrics,
  ltv: LTVMetrics,
  acquisition: AcquisitionMetrics,
  recentActivity: Event[],
  recentCustomers: Customer[],
  revenueChart: ChartData[],
  planDistribution: PlanDistribution[],
  acquisitionChannels: ChannelData[]
}
```

#### `/api/admin/customers` - GET
**Fichier**: `src/app/api/admin/customers/route.ts`

**Fonctionnalités**:
- Liste paginée des clients
- Filtres: status, plan, segment, search
- Tri: sortBy, sortOrder
- Pagination: page, limit
- Enrichissement avec métriques (LTV, engagement, churn risk)

**Query Parameters**:
- `page` - Numéro de page (défaut: 1)
- `limit` - Nombre par page (défaut: 50)
- `status` - active, trial, churned, at-risk
- `plan` - Nom du plan
- `segment` - ID du segment
- `search` - Recherche nom/email
- `sortBy` - Champ de tri (défaut: createdAt)
- `sortOrder` - asc | desc (défaut: desc)

**Response Structure**:
```typescript
{
  customers: EnrichedCustomer[],
  pagination: {
    page, limit, total, totalPages
  }
}
```

#### `/api/admin/customers/[customerId]` - GET, PATCH
**Fichier**: `src/app/api/admin/customers/[customerId]/route.ts`

**GET**:
- Détail complet d'un client
- Métriques détaillées
- Activités récentes
- Historique emails
- Timeline des événements
- Historique paiements
- Segments

**PATCH**:
- Mise à jour segments
- Mise à jour churnRisk
- Notes
- Log dans AdminAuditLog

---

### 🎣 HOOKS REACT ADMIN

#### `useAdminOverview(options)`
**Fichier**: `src/hooks/admin/use-admin-overview.ts`

**Fonctionnalités**:
- SWR hook pour données overview
- Auto-refresh toutes les minutes
- Revalidate on focus
- Paramètre `period` (jours)

**Usage**:
```typescript
const { data, isLoading, error, refresh } = useAdminOverview({ period: 30 });
```

#### `useCustomers(options)`
**Fichier**: `src/hooks/admin/use-customers.ts`

**Fonctionnalités**:
- SWR hook pour liste clients
- Gestion des filtres en state
- Pagination intégrée
- Fonctions: `updateFilters()`, `goToPage()`

**Usage**:
```typescript
const {
  customers,
  pagination,
  isLoading,
  filters,
  updateFilters,
  goToPage
} = useCustomers({
  page: 1,
  limit: 50,
  status: 'active'
});
```

#### `useCustomerDetail(customerId)`
**Fichier**: `src/hooks/admin/use-customer-detail.ts`

**Fonctionnalités**:
- SWR hook pour détail client
- Fonctions: `updateCustomer()`, `sendEmail()`
- Auto-refresh après mutations

**Usage**:
```typescript
const {
  customer,
  isLoading,
  updateCustomer,
  sendEmail
} = useCustomerDetail(customerId);
```

---

## 📋 PARTIE 3 - Composants React Super Admin (Reçue ✅ - Partiellement)

### 🎨 COMPOSANTS LAYOUT ADMIN

#### `admin-sidebar.tsx`
**Fichier**: `src/components/admin/layout/admin-sidebar.tsx`

**Fonctionnalités**:
- Sidebar collapsible avec animation Framer Motion
- Navigation groupée par sections (Overview, Business, Marketing, System)
- Support des sous-menus expandables
- Badges "live" pour indicateurs temps réel
- Tooltips en mode collapsed
- Footer avec avatar admin et logout
- Toggle collapse avec bouton flottant
- Dark mode avec thème zinc/violet

**Sections Navigation**:
- Overview: Dashboard
- Business: Customers (avec segments, export), Analytics (avec sous-pages)
- Marketing: Email (campaigns, automations, templates), Ads (overview, Meta, Google, TikTok, ROI)
- System: Webhooks, Events, Integrations, Settings

#### `admin-header.tsx`
**Fichier**: `src/components/admin/layout/admin-header.tsx`

**Fonctionnalités**:
- Breadcrumbs dynamiques
- Date Range Picker avec presets (Aujourd'hui, 7j, 30j, 90j, Cette année)
- Bouton Refresh
- Bouton Export
- Search avec Command Palette (raccourci K)
- Notifications dropdown avec badge unread count
- Keyboard shortcut hint (Cmd+K)
- Hook `useAdminNotifications()` pour notifications

**Command Palette**:
- Modal overlay avec recherche globale
- Actions rapides avec raccourcis clavier
- ESC pour fermer

#### `admin-breadcrumbs.tsx`
**Fichier**: `src/components/admin/layout/admin-breadcrumbs.tsx`

**Fonctionnalités**:
- Breadcrumbs dynamiques basés sur pathname
- Mapping des noms de routes (customers → Clients, etc.)
- Liens cliquables sauf dernière page
- Icône Home pour retour dashboard

---

### 📊 COMPOSANTS WIDGETS ADMIN

#### `kpi-card.tsx`
**Fichier**: `src/components/admin/widgets/kpi-card.tsx`

**Fonctionnalités**:
- Carte KPI avec titre, valeur, changement
- Support prefix/suffix (€, %, etc.)
- Trend indicators (up/down/neutral) avec icônes
- Mini sparkline graphique
- Loading state avec skeletons
- Color variants (default, green, red, blue, purple, yellow)
- Animation Framer Motion
- Hover effects

**Props**:
- `title`, `value`, `change`, `changeLabel`, `trend`
- `icon`, `prefix`, `suffix`
- `loading`, `sparkline`, `color`

#### `stat-card-admin.tsx`
**Fichier**: `src/components/admin/widgets/stat-card-admin.tsx`

**Fonctionnalités**:
- Carte statistique avec gradient background
- Icône avec background coloré
- Tooltip optionnel
- Changement avec badge coloré (green/red)
- Hover effects avec glow
- Click handler optionnel
- Animation Framer Motion

#### `activity-feed.tsx`
**Fichier**: `src/components/admin/widgets/activity-feed.tsx`

**Fonctionnalités**:
- Feed d'activité en temps réel avec badge "Live"
- Filtres par type (Tout, Inscriptions, Paiements, Churns)
- Types d'événements: user.created, subscription.created, payment.succeeded, etc.
- Icônes colorées par type d'événement
- Formatage dates avec `formatDistanceToNow`
- Avatars clients
- ScrollArea pour liste longue
- Animation AnimatePresence pour nouvelles activités
- Bouton "Voir toute l'activité"
- Refresh button avec loading state

**Types d'activités supportés**:
- `user.created` - Nouveau compte
- `subscription.created` - Abonnement créé
- `subscription.cancelled` - Abonnement annulé
- `payment.succeeded` - Paiement réussi
- `payment.failed` - Paiement échoué
- `login` - Connexion
- `email.sent` - Email envoyé

#### `quick-actions.tsx`
**Fichier**: `src/components/admin/widgets/quick-actions.tsx`

**Fonctionnalités**:
- Grille 2x2 d'actions rapides
- Gradient backgrounds par action
- Icônes avec couleurs personnalisées
- Hover effects avec scale
- Actions configurables via props
- Actions par défaut: Nouvelle campagne, Exporter clients, Analytics, Notification

#### `recent-customers.tsx`
**Fichier**: `src/components/admin/widgets/recent-customers.tsx`

**Fonctionnalités**:
- Table des nouveaux clients
- Colonnes: Client, Plan, MRR, LTV, Status
- Avatars avec fallback initials
- Badges de status (Actif, Trial, Churned, À risque)
- Icône Crown pour plan Team
- Lien vers détail client
- Loading state avec skeletons
- Bouton "Voir tout" vers liste complète

**Status config**:
- `active` - Vert
- `trial` - Bleu
- `churned` - Rouge
- `at-risk` - Jaune avec icône AlertTriangle

---

### 📈 COMPOSANTS CHARTS ADMIN

#### `revenue-chart.tsx`
**Fichier**: `src/components/admin/analytics/revenue-chart.tsx`

**Fonctionnalités**:
- Area Chart avec Recharts
- Toggle entre MRR, Revenue, ou les deux
- Gradient fills pour les aires
- Custom tooltip avec formatage dates
- Formatage Y-axis (€Xk)
- Formatage X-axis (dd MMM)
- Boutons Download et Maximize
- Loading state
- Responsive avec ResponsiveContainer

**Chart Types**:
- MRR uniquement
- Revenue uniquement
- Les deux superposés

#### `pie-chart.tsx` (PieChartWidget)
**Fichier**: `src/components/admin/analytics/pie-chart.tsx`

**Fonctionnalités**:
- Pie Chart ou Donut Chart (innerRadius configurable)
- Labels de pourcentage sur les slices
- Custom tooltip avec valeurs et pourcentages
- Legend personnalisée
- Center label pour donut (total)
- Colors personnalisables par data point
- Loading state

**Props**:
- `data` - Array avec name, value, color
- `title`, `subtitle`
- `innerRadius`, `outerRadius`
- `showLegend`

#### `bar-chart.tsx` (BarChartWidget)
**Fichier**: `src/components/admin/analytics/bar-chart.tsx`

**Fonctionnalités**:
- Bar Chart horizontal ou vertical
- Hover effects avec opacity
- Custom tooltip
- Colors personnalisables
- Loading state
- Responsive

**Props**:
- `data` - Array avec name, value, color
- `horizontal` - Orientation
- `showValues` - Afficher valeurs sur bars

#### `cohort-table.tsx` (Complet ✅)
**Fichier**: `src/components/admin/analytics/cohort-table.tsx`

**Fonctionnalités**:
- Table de cohorte pour analyse de rétention
- Colonnes par mois après inscription (M0, M1, M2, etc.)
- Heatmap avec couleurs par pourcentage de rétention
- Formatage dates avec date-fns (locale fr)
- Sticky header et première colonne
- Legend avec codes couleur
- Loading state avec skeletons

**Color Coding**:
- 80%+ : Vert foncé (`bg-green-500/80`)
- 60-80% : Vert moyen (`bg-green-500/60`)
- 40-60% : Jaune (`bg-yellow-500/60`)
- 20-40% : Orange (`bg-orange-500/60`)
- <20% : Rouge (`bg-red-500/60`)

#### `funnel-chart.tsx`
**Fichier**: `src/components/admin/analytics/funnel-chart.tsx`

**Fonctionnalités**:
- Funnel chart avec étapes de conversion
- Largeur proportionnelle à la valeur
- Gradients colorés par étape
- Taux de conversion entre chaque étape
- Conversion totale affichée
- Animation Framer Motion
- Loading state

**Props**:
- `data` - Array avec name, value, color
- `title`, `subtitle`
- Calcul automatique des taux de conversion
- Affichage des pertes entre étapes

---

### 👥 COMPOSANTS CUSTOMERS (Détails)

#### `customers-table.tsx`
**Fichier**: `src/components/admin/customers/customers-table.tsx`

**Fonctionnalités**:
- Table complète avec toutes les colonnes (Client, Plan, LTV, Engagement, Status, Dernière activité)
- Checkbox pour sélection multiple
- Bulk actions bar (Envoyer email, Exporter)
- Search bar avec recherche nom/email
- Filtres dropdown (Status: Actifs, Trial, Churned, À risque)
- Tri par colonnes (Client, Plan, LTV, Engagement)
- Pagination complète avec navigation
- Loading state avec skeletons
- Actions dropdown par ligne (Voir détails, Envoyer email, Suspendre)
- Badges de status colorés
- Barre de progression pour engagement score
- Icône Crown pour plan Team
- Lien vers détail client

**Props**:
- `customers` - Array de customers
- `pagination` - Objet pagination
- `loading` - Boolean
- `onPageChange`, `onSearch`, `onFilterChange`, `onSort`, `onBulkAction` - Callbacks

#### `customer-detail.tsx`
**Fichier**: `src/components/admin/customers/customer-detail.tsx`

**Fonctionnalités**:
- Header avec avatar, nom, email, badges
- Bouton retour vers liste
- Actions: Envoyer email, Voir comme user, Menu dropdown
- 4 Cards métriques: LTV, Engagement, Temps passé, Risque de churn
- Tabs: Overview, Activity, Billing, Emails
- **Overview Tab**:
  - Card Informations (Email, Inscrit le, Dernière connexion, Plan, Prochain paiement)
  - Card Segments avec gestion
  - Card Activité récente (10 dernières)
- **Activity Tab**:
  - Timeline complète avec ligne verticale
  - Badges par type d'événement
  - Affichage data JSON si disponible
- **Billing Tab**:
  - Table historique paiements
  - Colonnes: Date, Description, Montant, Statut
  - Badges status (Payé/Échoué)
- **Emails Tab**:
  - Liste emails envoyés
  - Status: Ouvert, Cliqué, Bounced, Envoyé
  - Icônes colorées par status
  - Bouton "Nouvel email"

**Props**:
- `customer` - Objet customer complet
- `onSendEmail` - Callback pour envoyer email
- `onUpdateSegments` - Callback pour mettre à jour segments

---

### 📧 COMPOSANTS MARKETING (Détails)

#### `automation-builder.tsx` (Complet ✅)
**Fichier**: `src/components/admin/marketing/automation-builder.tsx`

**Fonctionnalités**:
- Builder d'automation avec workflow visuel
- Sélection du déclencheur (trigger)
- Ajout de steps (Email, Wait, Condition, Tag, Notification)
- Édition de chaque step dans Sheet sidebar
- Drag & drop pour réorganiser (GripVertical)
- Sauvegarde et activation/pause
- Badge "Non sauvegardé" si modifications
- StepEditor complet avec configuration détaillée:
  - **Email**: Sélection template + sujet personnalisé
  - **Wait**: Durée (minutes/heures/jours) avec Input + Select
  - **Condition**: Champ (plan, engagementScore, emailOpened, daysInTrial), Opérateur (equals, not_equals, greater_than, less_than, contains), Valeur
  - **Tag**: Nom du tag avec Input
  - **Notification**: Message avec Input
- Icônes colorées par type de step
- Animation AnimatePresence pour steps
- Connector lines entre steps
- Résumé de chaque step affiché

**Triggers disponibles**:
- `user.created` - Nouvelle inscription
- `trial.started` - Début de trial
- `trial.ending` - Fin de trial (3 jours avant)
- `subscription.created` - Nouvel abonnement
- `subscription.cancelled` - Annulation
- `payment.failed` - Paiement échoué
- `engagement.low` - Engagement faible
- `custom` - Déclencheur personnalisé

#### `email-template-editor.tsx` (Complet ✅)
**Fichier**: `src/components/admin/marketing/email-template-editor.tsx`

**Fonctionnalités**:
- Éditeur de templates email complet
- 3 modes: Éditeur visuel, Code HTML, Aperçu
- Éditeur visuel avec contentEditable
- Toolbar de formatage (Bold, Italic, Underline, Align, Lists, Link, Image)
- Insertion de variables (firstName, lastName, email, planName, etc.)
- Preview responsive (Desktop, Tablet, Mobile)
- Sujet avec insertion de variables
- Template HTML par défaut avec styles
- Variables disponibles affichées en bas
- Bouton "Tester" avec popover pour envoyer email de test
- Sauvegarde avec badge "Non sauvegardé"
- Remplacement automatique des variables dans preview avec exemples

**Variables disponibles**:
- `firstName`, `lastName`, `email`
- `planName`, `companyName`
- `trialDaysLeft`, `loginUrl`, `unsubscribeUrl`

---

### 📱 COMPOSANTS ADS / INTEGRATIONS (Détails)

#### `platform-card.tsx` (Complet ✅)
**Fichier**: `src/components/admin/ads/platform-card.tsx`

**Fonctionnalités**:
- Carte pour chaque plateforme ads (Meta, Google, TikTok, etc.)
- Gradient header coloré par plateforme
- Status badge (Connecté, Non connecté, Erreur)
- Métriques affichées si connecté:
  - Dépenses (€)
  - Conversions
  - Impressions (formaté K/M)
  - Clics (formaté K/M)
- Dernière sync affichée
- Actions: Sync, Détails, Settings (disconnect)
- Bouton "Connecter" avec gradient coloré par plateforme
- Message d'erreur si connexion expirée
- Animation Framer Motion

**Plateformes supportées**:
- Meta (📘, bleu)
- Google (🔍, rouge-jaune)
- TikTok (🎵, rose-cyan)
- LinkedIn (💼, bleu foncé)
- Twitter (🐦, ciel)

#### `ads-overview.tsx` (Complet ✅)
**Fichier**: `src/components/admin/ads/ads-overview.tsx`

**Fonctionnalités**:
- Vue d'ensemble complète des ads
- 4 KPI Cards: Dépenses totales, Conversions, ROAS, CPA Moyen
- Trends avec flèches (up/down) et pourcentages
- Chart principal: Bar chart avec toggle Dépenses/Conversions
- Pie chart: Répartition par plateforme (donut)
- Table de comparaison des plateformes:
  - Colonnes: Plateforme, Dépenses, Impressions, Clics, CTR, Conversions, CPA, ROAS
  - Badges ROAS colorés (vert ≥3x, jaune ≥2x, rouge <2x)
- Custom tooltip avec formatage dates
- Formatage nombres (K/M)
- Formatage currency (€)
- Loading states

---

### 🔗 COMPOSANTS WEBHOOKS (Détails)

#### `webhooks-table.tsx` (Complet ✅)
**Fichier**: `src/components/admin/webhooks/webhooks-table.tsx`

**Fonctionnalités**:
- Table/liste des webhooks
- Card pour chaque webhook avec:
  - Nom et status badge (Actif/Inactif)
  - Badge d'erreur si failureCount > 0
  - URL avec bouton copier
  - Liste des événements (badges)
  - Dernier déclenchement
- Switch pour activer/désactiver
- Bouton "Test" avec loading state
- Menu dropdown: Modifier, Voir logs, Copier secret, Supprimer
- Dialog de confirmation pour suppression
- Bouton "Nouveau Webhook"
- Empty state avec CTA
- Animation AnimatePresence
- Copy to clipboard avec feedback visuel

#### `webhook-logs.tsx` (Complet ✅)
**Fichier**: `src/components/admin/webhooks/webhook-logs.tsx`

**Fonctionnalités**:
- Liste des logs de webhooks
- Filtre par status (Tous, Succès, Échoués)
- Cards expandables pour chaque log:
  - Header avec status badge, event type, webhook name
  - Status code, duration, timestamp
  - Expanded: Request body (JSON), Response body, Error
  - Bouton "Réessayer" pour logs échoués
- ScrollArea pour liste longue
- Formatage dates avec date-fns
- Loading states
- Animation Framer Motion pour expand/collapse

---

### 📄 PAGES ADMIN (Détails)

#### `admin/page.tsx` (Partiellement reçu ⚠️)
**Fichier**: `src/app/(super-admin)/admin/page.tsx`

**Fonctionnalités** (partiellement documentées):
- Page dashboard principale Super Admin
- Header avec titre et description
- Grid de KPI Cards (4 colonnes)
- Layout avec composants widgets:
  - KPICard pour MRR, Clients, Croissance, Churn Rate
  - RevenueChart
  - ActivityFeed
  - QuickActions
  - RecentCustomers
  - PieChartWidget pour plan distribution
- Suspense pour loading states
- Fonction `getAdminOverviewData()` pour fetch données

**Note**: Le composant est incomplet dans le prompt fourni (coupé après KPICard Churn Rate).

---

### 📝 COMPOSANTS MANQUANTS / À CRÉER

D'après l'architecture initiale, les composants suivants sont encore à créer :

#### Customers Components
- `customers-table.tsx` - Table complète avec filtres, tri, pagination
- `customer-card.tsx` - Carte client pour vues grid
- `customer-detail.tsx` - Vue détail complète
- `customer-activity-feed.tsx` - Feed d'activité spécifique client
- `customer-metrics.tsx` - Métriques détaillées client
- `customer-ltv-card.tsx` - Carte LTV détaillée
- `customer-timeline.tsx` - Timeline des événements
- `customer-filters.tsx` - Composant filtres avancés
- `customer-segments.tsx` - Gestion segments
- `customer-export-modal.tsx` - Modal export CSV/Excel

#### Analytics Components
- `mrr-chart.tsx` - Chart MRR dédié
- `arr-display.tsx` - Affichage ARR
- `churn-chart.tsx` - Chart churn rate
- `funnel-chart.tsx` - Chart funnel conversion
- `ltv-chart.tsx` - Chart LTV analysis
- `acquisition-chart.tsx` - Chart acquisition
- `retention-curve.tsx` - Courbe de rétention
- `metrics-comparison.tsx` - Comparaison métriques

#### Marketing Components
- `campaigns-table.tsx` - Table campagnes
- `campaign-builder.tsx` - Builder campagne
- `campaign-stats.tsx` - Stats campagne
- ~~`automation-builder.tsx`~~ ✅ Reçu
- `automation-flow.tsx` - Flow visuel automation
- `automation-node.tsx` - Node automation
- ~~`email-template-editor.tsx`~~ ✅ Reçu
- `email-preview.tsx` - Preview email
- `email-stats.tsx` - Stats emails
- `recipient-selector.tsx` - Sélecteur destinataires
- `send-test-modal.tsx` - Modal test email

#### Ads Components
- ~~`ads-overview.tsx`~~ ✅ Reçu
- ~~`platform-card.tsx`~~ ✅ Reçu
- `connect-platform.tsx` - Connexion OAuth
- `campaigns-list.tsx` - Liste campagnes ads
- `campaign-metrics.tsx` - Métriques campagne
- `conversion-tracking.tsx` - Tracking conversions
- `roi-calculator.tsx` - Calculateur ROI
- `attribution-model.tsx` - Modèle attribution
- `spend-chart.tsx` - Chart dépenses
- `cpa-chart.tsx` - Chart CPA
- `roas-display.tsx` - Affichage ROAS
- `platform-comparison.tsx` - Comparaison plateformes

#### Webhooks Components
- ~~`webhooks-table.tsx`~~ ✅ Reçu
- `webhook-form.tsx` - Formulaire webhook
- ~~`webhook-logs.tsx`~~ ✅ Reçu
- `webhook-test.tsx` - Test webhook
- `event-log-viewer.tsx` - Viewer logs événements

#### Autres Widgets
- `trend-indicator.tsx` - Indicateur trend
- `mini-chart.tsx` - Mini chart
- `alerts-panel.tsx` - Panel alertes
- `revenue-ticker.tsx` - Ticker revenue

---

### 🎨 DESIGN SYSTEM & STYLING

#### Thème Couleurs
- **Background**: `zinc-950` (dark)
- **Cards**: `zinc-900` avec border `zinc-800`
- **Primary**: Violet (`violet-500`, `purple-600`)
- **Success**: Green (`green-400`, `green-500`)
- **Error**: Red (`red-400`, `red-500`)
- **Warning**: Yellow (`yellow-400`, `yellow-500`)
- **Info**: Blue (`blue-400`, `blue-500`)

#### Animations
- Framer Motion pour transitions
- Hover effects avec scale
- AnimatePresence pour listes
- Loading states avec skeletons

#### Composants UI Utilisés
- `Button` - Variants: ghost, outline, default
- `Badge` - Variants: secondary, outline
- `Avatar` - Avec fallback initials
- `Input` - Pour search
- `DropdownMenu` - Pour notifications
- `Popover` - Pour date picker
- `Tooltip` - Pour hints
- `ScrollArea` - Pour listes scrollables
- `Skeleton` - Pour loading states
- `Calendar` - Pour date picker

---

## ⏳ EN ATTENTE DES PARTIES SUIVANTES

- [x] Partie 1 - Architecture Complète ✅
- [x] Partie 2 - Schéma Prisma, Métriques & API Routes ✅
- [x] Partie 3 - Composants React (Partiellement reçu - CohortTable incomplet) ✅
- [ ] Partie 4 - ???
- [ ] ...

---

## 📝 NOTES DE DÉVELOPPEMENT

### Ordre d'Implémentation Suggéré
1. ✅ Architecture & Structure de fichiers
2. ⏳ Layout & Navigation Admin
3. ⏳ Page Overview Dashboard
4. ⏳ Gestion Clients (CRUD + Métriques)
5. ⏳ Email Marketing & Automation
6. ⏳ Intégrations Ads
7. ⏳ Webhooks & Events
8. ⏳ Analytics Business
9. ⏳ Tests & Documentation

### Points d'Attention
- Vérification permissions admin sur toutes les routes
- Rate limiting sur les API admin
- Logging des actions admin
- Sécurité des tokens OAuth
- Performance des calculs de métriques (LTV, MRR, etc.)

---

## 🚀 RÉSUMÉ ARCHITECTURE SUPER ADMIN

```
📦 SUPER ADMIN DASHBOARD - LUNEO
│
├── 📊 OVERVIEW DASHBOARD
│   ├── KPIs temps réel (MRR, Customers, Churn, LTV)
│   ├── Revenue charts (MRR over time)
│   ├── Activity feed (événements récents)
│   ├── Plan distribution (donut chart)
│   ├── Acquisition channels (bar chart)
│   ├── Campaign performance summary
│   ├── Quick actions
│   └── Recent customers table
│
├── 👥 CUSTOMERS MANAGEMENT
│   ├── Liste avec filtres avancés (status, plan, segment, search)
│   ├── Détail client complet
│   │   ├── Métriques (LTV, engagement, churn risk)
│   │   ├── Usage over time chart
│   │   ├── Recent activities
│   │   ├── Billing history
│   │   ├── Email history
│   │   └── Timeline events
│   ├── Segments dynamiques
│   └── Export CSV/Excel
│
├── 📈 ANALYTICS BUSINESS
│   ├── Revenue Analytics
│   │   ├── MRR, ARR, Growth
│   │   ├── Revenue charts
│   │   └── Plan distribution
│   ├── Churn Analysis
│   │   ├── Churn rate
│   │   ├── Revenue churn
│   │   └── Net Revenue Retention
│   ├── Cohort Retention
│   │   └── Cohort analysis par mois
│   ├── Funnel Conversion
│   └── LTV Analysis
│       ├── Average, Median
│       ├── By plan
│       └── Projected LTV
│
├── 📧 EMAIL MARKETING & AUTOMATION
│   ├── Campaigns Manuelles
│   │   ├── Création campagne
│   │   ├── Ciblage par segment
│   │   └── Stats (sent, opened, clicked)
│   ├── Automations
│   │   ├── Welcome Series
│   │   ├── Trial Conversion
│   │   ├── Churn Prevention
│   │   ├── Cancellation Flow
│   │   ├── Upgrade Nudge
│   │   └── Payment Failed
│   ├── Workflow Builder (visuel)
│   ├── Templates éditables
│   └── Email Stats & Analytics
│
├── 📱 ADS MANAGER
│   ├── Meta Ads Integration
│   │   ├── OAuth connection
│   │   ├── Campaigns sync
│   │   ├── Insights & metrics
│   │   └── Conversions tracking
│   ├── Google Ads Integration
│   │   ├── OAuth connection
│   │   ├── Campaigns sync
│   │   └── Performance reports
│   ├── TikTok Ads Integration
│   │   ├── OAuth connection
│   │   ├── Campaigns sync
│   │   └── Insights
│   ├── Attribution Multi-Touch
│   │   ├── First-touch
│   │   ├── Last-touch
│   │   ├── Linear
│   │   ├── Time-decay
│   │   └── Position-based
│   └── ROI par Canal
│       ├── CAC par canal
│       ├── ROAS
│       └── Payback period
│
├── 🔗 WEBHOOKS & EVENTS
│   ├── Webhooks Management
│   │   ├── CRUD webhooks
│   │   ├── Signature HMAC SHA256
│   │   ├── Event selection
│   │   ├── Retry logic
│   │   └── Test webhooks
│   ├── Event Logs
│   │   ├── Tous les événements
│   │   ├── Filtres (type, customer, date)
│   │   └── Détail payload
│   └── Event Types
│       ├── User events
│       ├── Subscription events
│       ├── Payment events
│       ├── Trial events
│       ├── Engagement events
│       └── Usage events
│
├── ⚙️ SETTINGS & INTEGRATIONS
│   ├── Integrations API
│   │   ├── Stripe
│   │   ├── Email Provider (Resend/SendGrid)
│   │   └── API Keys management
│   ├── Security Settings
│   └── Admin Notifications
│
└── 🔧 BACKEND SERVICES
    ├── Metrics Calculator
    │   ├── calculateMRR()
    │   ├── calculateRevenueMetrics()
    │   ├── calculateChurnMetrics()
    │   ├── calculateLTVMetrics()
    │   ├── calculateAcquisitionMetrics()
    │   ├── calculateCohortRetention()
    │   ├── calculateEngagementScore()
    │   └── createDailySnapshot() (Cron)
    ├── Email Client
    │   ├── sendEmail()
    │   ├── renderTemplate()
    │   └── processAutomation()
    ├── Ads Clients
    │   ├── MetaAdsClient
    │   ├── GoogleAdsClient
    │   └── TikTokAdsClient
    └── Webhook Handler
        ├── triggerWebhooks()
        ├── sendWebhook()
        └── generateSignature()
```

---

## 📊 BASE DE DONNÉES - MODELS PRISMA

### Tables Principales
- **Customer** (étendu) - Métriques LTV, engagement, churn risk
- **CustomerActivity** - Tracking activités
- **CustomerSegment** - Segments dynamiques
- **EmailTemplate** - Templates emails
- **EmailCampaign** - Campagnes
- **EmailAutomation** - Workflows
- **AutomationStep** - Steps workflows
- **AutomationRun** - Exécutions
- **EmailLog** - Logs envois
- **AdPlatformConnection** - Connexions OAuth
- **AdCampaignSync** - Sync campagnes
- **Webhook** - Configuration webhooks
- **WebhookLog** - Logs webhooks
- **Event** - Événements système
- **DailyMetrics** - Snapshots quotidiens
- **MonthlyMetrics** - Métriques mensuelles
- **CohortData** - Données cohorte
- **AdminNotification** - Notifications admin
- **AdminAuditLog** - Audit actions admin

---

## 🎯 PROCHAINES ÉTAPES ATTENDUES

- [x] Partie 3 - Composants React ✅ (22 composants reçus: Layout, Widgets, Charts, Customers, Marketing, Ads, Webhooks)
- [ ] Compléter `admin/page.tsx` (Page dashboard principale incomplète)
- [ ] Partie 4 - Autres composants manquants (Campaigns, Analytics détaillés, Settings, etc.)
- [ ] ...

---

---

## 📦 RÉSUMÉ COMPOSANTS REÇUS (Partie 3)

### ✅ Composants Layout (Complets)
- `admin-sidebar.tsx` - Sidebar collapsible avec navigation
- `admin-header.tsx` - Header avec search, notifications, date picker
- `admin-breadcrumbs.tsx` - Breadcrumbs dynamiques

### ✅ Composants Widgets (Complets)
- `kpi-card.tsx` - Carte KPI avec trends et sparkline
- `stat-card-admin.tsx` - Carte statistique avec gradients
- `activity-feed.tsx` - Feed d'activité temps réel
- `quick-actions.tsx` - Actions rapides
- `recent-customers.tsx` - Table nouveaux clients

### ✅ Composants Charts (Complets - 5)
- `revenue-chart.tsx` - Area chart MRR/Revenue
- `pie-chart.tsx` - Pie/Donut chart
- `bar-chart.tsx` - Bar chart horizontal/vertical
- `funnel-chart.tsx` - Funnel chart avec conversion rates ✅ (Nouveau)
- `cohort-table.tsx` - Table cohorte avec heatmap ✅ (Complété)

### ✅ Composants Customers (Complets)
- `customers-table.tsx` - Table complète avec filtres, tri, pagination, bulk actions
- `customer-detail.tsx` - Vue détail complète avec tabs (Overview, Activity, Billing, Emails)

### ✅ Composants Marketing (Complets - 2)
- `automation-builder.tsx` - Builder d'automation avec workflow visuel ✅ (Complété)
- `email-template-editor.tsx` - Éditeur de templates email ✅ (Nouveau)

### ✅ Composants Ads/Integrations (Complets - 2)
- `platform-card.tsx` - Carte plateforme ads ✅ (Nouveau)
- `ads-overview.tsx` - Vue d'ensemble ads ✅ (Nouveau)

### ✅ Composants Webhooks (Complets - 2)
- `webhooks-table.tsx` - Table des webhooks ✅ (Nouveau)
- `webhook-logs.tsx` - Logs des webhooks ✅ (Nouveau)

### ⚠️ Pages Admin (Partiellement - 1)
- `admin/page.tsx` - Page dashboard principale ⚠️ (Incomplet)

### 📊 Total Composants Reçus (Partie 3)
- **Layout**: 3 ✅
- **Widgets**: 5 ✅
- **Charts**: 5 ✅ (dont 2 nouveaux/complétés: funnel-chart, cohort-table)
- **Customers**: 2 ✅
- **Marketing**: 2 ✅ (dont 1 complété, 1 nouveau)
- **Ads/Integrations**: 2 ✅ (nouveaux)
- **Webhooks**: 2 ✅ (nouveaux)
- **Pages**: 1 ⚠️ (incomplet)
- **Total**: 22 composants (21 complets, 1 incomplet)

### 📋 Composants Manquants
- ~40+ composants listés dans la section "Composants Manquants"

---

*Document créé le: Décembre 2024*
*Dernière mise à jour: Partie 3 complétée (22 composants: Layout, Widgets, Charts, Customers, Marketing, Ads, Webhooks, Pages partiel)*
