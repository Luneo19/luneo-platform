# 🏗️ PLAN DE REFACTORISATION PRODUCTION COMPLÈTE
## LUNEO PLATFORM - SaaS de Luxe Production-Ready

> **Inspiré des meilleurs SaaS mondiaux** : Notion, Figma, Linear, Vercel, Stripe, Framer, Canva
> **Objectif** : Mettre le SaaS en vente avec toutes les fonctionnalités production-ready

---

## 📊 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Production](#architecture-production)
3. [Pages Publiques (Marketing)](#pages-publiques-marketing)
4. [Pages Dashboard (Application)](#pages-dashboard-application)
5. [Intégrations Backend](#intégrations-backend)
6. [Feature Gating & Plans](#feature-gating--plans)
7. [Design System Premium](#design-system-premium)
8. [Performance & SEO](#performance--seo)
9. [Sécurité Production](#sécurité-production)
10. [Analytics & Monitoring](#analytics--monitoring)
11. [Support & Documentation](#support--documentation)
12. [Timeline & Priorités](#timeline--priorités)

---

## 🎯 VUE D'ENSEMBLE

### Objectif Final
Transformer Luneo en un **SaaS de luxe production-ready** avec :
- ✅ **50+ pages fonctionnelles** connectées au backend
- ✅ **Feature gating complet** par plan de paiement
- ✅ **Design premium** niveau marque de luxe
- ✅ **Performance optimale** (Core Web Vitals 95+)
- ✅ **Sécurité renforcée** (SOC 2 ready)
- ✅ **Support client intégré** (chat, tickets, documentation)
- ✅ **Onboarding fluide** avec tours guidés
- ✅ **Analytics avancés** pour usage et revenus

### État Actuel vs État Cible

| Aspect | Actuel | Cible Production |
|--------|--------|------------------|
| Pages fonctionnelles | 5% | 100% |
| Connexion Backend | 10% | 100% |
| Feature Gating | 0% | 100% |
| Design System | Basique | Premium Luxe |
| Performance | 60/100 | 95+/100 |
| Tests | 0% | 80%+ coverage |
| Documentation | Minimal | Complète |

---

## 🏛️ ARCHITECTURE PRODUCTION

### Stack Technique (Production-Ready)

```
Frontend (Next.js 15)
├── React 18 + TypeScript
├── Tailwind CSS + shadcn/ui
├── Framer Motion (animations premium)
├── React Query (data fetching)
├── Zustand (state management)
├── Zod (validation)
└── React Hook Form

Backend (NestJS)
├── PostgreSQL (données)
├── Redis (cache/sessions)
├── BullMQ (queues)
├── Prisma ORM
└── 60+ modules backend existants ✅

Infrastructure
├── Vercel (frontend)
├── Railway (backend)
├── Cloudinary (assets)
├── Stripe (paiements)
├── SendGrid (emails)
└── Sentry (monitoring)
```

### Structure Frontend Production

```
apps/frontend/src/
├── app/
│   ├── (public)/              # Pages publiques marketing
│   │   ├── (marketing)/
│   │   │   ├── home/
│   │   │   ├── pricing/
│   │   │   ├── features/
│   │   │   ├── customers/
│   │   │   ├── blog/
│   │   │   ├── about/
│   │   │   └── careers/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   └── (landing)/
│   │       ├── demo/
│   │       └── contact/
│   ├── (dashboard)/           # Application dashboard
│   │   ├── layout.tsx         # Dashboard layout avec sidebar
│   │   ├── overview/          # Dashboard principal
│   │   ├── ai-studio/         # Génération IA designs
│   │   ├── customizer/        # Éditeur designs
│   │   ├── library/           # Bibliothèque designs
│   │   ├── products/          # Gestion produits
│   │   ├── orders/            # Commandes
│   │   ├── billing/           # Facturation & abonnements
│   │   ├── analytics/         # Analytics avancés
│   │   ├── team/              # Gestion équipe
│   │   ├── settings/          # Paramètres
│   │   ├── integrations/      # Intégrations tierces
│   │   ├── templates/         # Templates designs
│   │   ├── collections/       # Collections designs
│   │   ├── webhooks/          # Gestion webhooks
│   │   ├── api-keys/          # API keys management
│   │   ├── support/           # Support client
│   │   └── help/              # Documentation
│   └── api/                   # API routes Next.js (proxy backend)
│       ├── dashboard/
│       ├── designs/
│       ├── products/
│       ├── billing/
│       ├── analytics/
│       └── ...
├── lib/
│   ├── api/
│   │   ├── unified-client.ts  # Client API unifié
│   │   ├── endpoints/         # Endpoints typés
│   │   └── hooks/             # React Query hooks
│   ├── features/
│   │   ├── feature-gates.ts   # Feature gating
│   │   └── plan-limits.ts     # Limites par plan
│   ├── design-system/         # Design system luxe
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── components/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   ├── useDesigns.ts
│   │   └── ...
│   └── utils/
│       ├── format.ts
│       ├── validation.ts
│       └── ...
└── components/
    ├── dashboard/             # Composants dashboard
    ├── premium/               # Composants luxe
    ├── ui/                    # Composants de base (shadcn)
    └── layout/                # Layout components
```

---

## 🌐 PAGES PUBLIQUES (MARKETING)

### 1. Home (`/`) - Landing Page Premium

**Inspiration** : Vercel, Stripe, Linear

**Fonctionnalités** :
- ✅ Hero section avec animation premium
- ✅ Features showcase avec screenshots
- ✅ Social proof (logos clients, témoignages)
- ✅ Pricing preview (CTA vers /pricing)
- ✅ Demo vidéo intégrée
- ✅ Stats chiffrées (usage, clients)
- ✅ Newsletter signup
- ✅ Footer complet avec liens

**Backend** : `/api/v1/public/stats` (stats publiques)

**Design** : Glassmorphism, gradients or/noir, animations fluides

---

### 2. Pricing (`/pricing`) - ✅ DÉJÀ FONCTIONNELLE

**Améliorations nécessaires** :
- Comparaison table interactive
- FAQ intégrée
- Témoignages clients par plan
- Calculator de ROI
- Live chat pour questions

---

### 3. Features (`/features`)

**Sections** :
- AI Studio (génération designs IA)
- Customizer (éditeur avancé)
- 3D Viewer (visualisation produits)
- Library (bibliothèque designs)
- Integrations (Shopify, WooCommerce, etc.)
- Analytics (statistiques avancées)
- Team Collaboration
- API Access

**Backend** : `/api/v1/public/features`

---

### 4. Customers (`/customers`)

**Fonctionnalités** :
- Études de cas clients
- Témoignages vidéo
- Logo wall clients
- ROI metrics clients
- Success stories détaillées

**Backend** : `/api/v1/public/customers`

---

### 5. Blog (`/blog`)

**Fonctionnalités** :
- Liste articles (pagination)
- Article détaillé avec MDX
- Tags et catégories
- Recherche articles
- Newsletter signup dans sidebar
- Social sharing

**Backend** : `/api/v1/public/blog`

---

### 6. About (`/about`)

**Sections** :
- Notre mission
- L'équipe (photos + bios)
- Histoire de la marque
- Valeurs
- Presse et médias

---

### 7. Contact (`/contact`)

**Fonctionnalités** :
- Formulaire de contact
- Chat en direct (Intercom/Crisp)
- Email support
- Calendly booking
- FAQ

**Backend** : `/api/v1/public/contact`

---

### 8. Careers (`/careers`)

**Fonctionnalités** :
- Liste postes ouverts
- Filtres (département, localisation)
- Application en ligne
- Culture company
- Benefits

---

### 9. Legal Pages

- `/legal/privacy` - Politique de confidentialité
- `/legal/terms` - Conditions d'utilisation
- `/legal/cookies` - Politique cookies
- `/legal/gdpr` - Conformité GDPR

---

### 10. Auth Pages (✅ DÉJÀ EXISTANTES)

- `/login` - Connexion
- `/register` - Inscription
- `/forgot-password` - Mot de passe oublié
- `/reset-password` - Réinitialisation
- `/verify-email` - Vérification email

**Améliorations** :
- SSO (Google, GitHub) intégration complète
- Magic link (passwordless)
- 2FA activation à l'inscription

---

## 📊 PAGES DASHBOARD (APPLICATION)

### 1. Overview Dashboard (`/overview`)

**Inspiration** : Notion Dashboard, Linear Dashboard

**Fonctionnalités** :
- ✅ Stats cards (designs créés, vues, téléchargements, revenus)
- ✅ Graphiques activité (7j, 30j, 90j)
- ✅ Activité récente (timeline)
- ✅ Top designs populaires
- ✅ Quick actions (créer design, upload, etc.)
- ✅ Notifications en temps réel
- ✅ Widgets personnalisables (drag & drop)

**Backend** : `/api/v1/dashboard/stats`, `/api/v1/dashboard/activity`

**Feature Gating** : Accessible tous plans

---

### 2. AI Studio (`/dashboard/ai-studio`)

**Inspiration** : Midjourney, DALL-E, Framer AI

**Fonctionnalités** :
- ✅ Prompt input avancé (suggestions, history)
- ✅ Paramètres génération (style, qualité, format)
- ✅ Preview en temps réel (streaming SSE)
- ✅ Gallery designs générés (grid avec filtres)
- ✅ Export designs (PNG, SVG, PDF)
- ✅ Templates IA prédéfinis
- ✅ Histoire générations (versioning)
- ✅ Favoris et collections
- ✅ Partage designs
- ✅ Analytics par design (vues, téléchargements)

**Backend** : `/api/v1/ai/generate`, `/api/v1/ai/templates`, `/api/v1/designs`

**Feature Gating** : Professional+ (Starter = limité)

**Design** : Interface créative premium, dark mode, preview HD

---

### 3. Customizer (`/dashboard/customizer`)

**Inspiration** : Canva, Figma Editor

**Fonctionnalités** :
- ✅ Éditeur canvas (fabric.js ou Konva)
- ✅ Outils design (text, shapes, images, filters)
- ✅ Layers panel (gestion calques)
- ✅ Properties panel (couleurs, typo, effets)
- ✅ Sauvegarde automatique (versioning)
- ✅ Undo/Redo illimité
- ✅ Export multi-formats (PNG, SVG, PDF, JPG)
- ✅ Templates library intégrée
- ✅ Collaboration temps réel (WebSocket)
- ✅ Commentaires sur designs

**Backend** : `/api/v1/editor/save`, `/api/v1/editor/versions`

**Feature Gating** : Professional+

**Design** : Interface pro, toolbar fixe, panneau latéral

---

### 4. Library (`/dashboard/library`)

**Inspiration** : Figma Files, Notion Gallery

**Fonctionnalités** :
- ✅ Grid designs (masonry layout)
- ✅ Filtres avancés (date, type, tags, collection)
- ✅ Recherche full-text
- ✅ Vue liste/grille toggle
- ✅ Organisation par dossiers
- ✅ Collections personnalisées
- ✅ Bulk actions (supprimer, déplacer, taguer)
- ✅ Preview modal (lightbox)
- ✅ Partage designs (lien public, embed)
- ✅ Statistiques par design
- ✅ Dupliquer designs

**Backend** : `/api/v1/designs`, `/api/v1/collections`

**Feature Gating** : Tous plans (limite storage par plan)

**Design** : Gallery luxueuse, hover effects, transitions fluides

---

### 5. Products (`/dashboard/products`)

**Inspiration** : Shopify Products, WooCommerce

**Fonctionnalités** :
- ✅ Liste produits (table avec filtres)
- ✅ CRUD produits complet
- ✅ Images produits (multi-upload)
- ✅ Variantes produits (tailles, couleurs)
- ✅ Prix et stock management
- ✅ Catégories et tags
- ✅ 3D models upload (GLB/GLTF)
- ✅ SEO metadata (title, description, URL)
- ✅ Preview produit (3D viewer intégré)
- ✅ Dupliquer produits
- ✅ Bulk edit
- ✅ Export CSV
- ✅ Import CSV

**Backend** : `/api/v1/products`, `/api/v1/products/:id`

**Feature Gating** : Professional+ (Starter = limité à 10 produits)

---

### 6. Orders (`/dashboard/orders`)

**Inspiration** : Stripe Dashboard, Shopify Orders

**Fonctionnalités** :
- ✅ Liste commandes (table avec filtres)
- ✅ Détails commande (timeline complète)
- ✅ Statuts commandes (pending, processing, shipped, delivered)
- ✅ Filtres avancés (date, statut, client, montant)
- ✅ Recherche commandes
- ✅ Actions batch (mark as shipped, etc.)
- ✅ Export invoices PDF
- ✅ Tracking shipments
- ✅ Notifications client (email)
- ✅ Analytics commandes (revenus, top produits)

**Backend** : `/api/v1/orders`, `/api/v1/orders/:id`

**Feature Gating** : Professional+ (Starter = view only)

---

### 7. Billing (`/dashboard/billing`)

**Inspiration** : Stripe Billing Portal, Vercel Billing

**Fonctionnalités** :
- ✅ Plan actuel affiché
- ✅ Usage current month (designs, storage, API calls)
- ✅ Limits progress bars
- ✅ Upgrade/Downgrade plan (modal avec comparaison)
- ✅ Invoice history (liste + download PDF)
- ✅ Payment methods (ajouter, supprimer, défaut)
- ✅ Billing address
- ✅ Receipts emails
- ✅ Cancel subscription (retention flow)
- ✅ Coupon codes
- ✅ Referral program (si applicable)

**Backend** : `/api/v1/billing/subscription`, `/api/v1/billing/invoices`

**Feature Gating** : Tous plans

**Design** : Tableau de bord finances premium, cards élégantes

---

### 8. Analytics (`/dashboard/analytics`)

**Inspiration** : Google Analytics, Mixpanel, Amplitude

**Fonctionnalités** :
- ✅ Dashboard overview (KPIs principaux)
- ✅ Graphiques interactifs (Recharts/Chart.js)
  - Revenus par période
  - Designs créés par jour
  - Top designs (vues, téléchargements)
  - Conversion funnel
  - Client acquisition
- ✅ Filtres temporels (24h, 7j, 30j, 90j, custom)
- ✅ Comparaison périodes
- ✅ Export rapports (PDF, CSV)
- ✅ Rapports programmés (email)
- ✅ Segments utilisateurs
- ✅ Events tracking custom
- ✅ A/B testing results

**Backend** : `/api/v1/analytics/dashboard`, `/api/v1/analytics/reports`

**Feature Gating** : Professional+ (Starter = basic stats only)

**Design** : Dashboard data premium, graphiques élégants

---

### 9. Team (`/dashboard/team`)

**Inspiration** : Linear Team, Notion Team

**Fonctionnalités** :
- ✅ Liste membres équipe
- ✅ Inviter membres (email)
- ✅ Rôles et permissions (Admin, Editor, Viewer)
- ✅ Activity log par membre
- ✅ Remove members
- ✅ Team settings (nom, logo, plan)
- ✅ Usage par membre (designs créés, etc.)
- ✅ Billing par équipe (si applicable)

**Backend** : `/api/v1/team/members`, `/api/v1/team/invitations`

**Feature Gating** : Professional+ (Starter = 1 membre, Business = 10, Enterprise = illimité)

---

### 10. Settings (`/dashboard/settings`)

**Inspiration** : Stripe Settings, Vercel Settings

**Sections** :

#### 10.1 Profile (`/dashboard/settings/profile`)
- Avatar upload
- Nom, email, bio
- Timezone, langue
- Social links

#### 10.2 Account (`/dashboard/settings/account`)
- Change email
- Change password
- Delete account (confirmation flow)

#### 10.3 Security (`/dashboard/settings/security`)
- 2FA setup (TOTP, SMS)
- Active sessions (revoke)
- API keys management
- Login history

#### 10.4 Preferences (`/dashboard/settings/preferences`)
- Theme (light/dark/system)
- Notifications (email, push, in-app)
- Defaults (language, currency)

#### 10.5 Brand (`/dashboard/settings/brand`)
- Logo upload
- Brand colors
- Brand name
- Domain custom (Enterprise)

**Backend** : `/api/v1/users/me`, `/api/v1/settings/*`

**Feature Gating** : Tous plans (certaines features = Enterprise)

---

### 11. Integrations (`/dashboard/integrations`)

**Inspiration** : Zapier, Make (Integromat)

**Fonctionnalités** :
- ✅ Liste intégrations disponibles (cards)
- ✅ Connecter intégrations (OAuth flow)
- ✅ Statut connexions (connected, disconnected, error)
- ✅ Configuration par intégration
- ✅ Webhooks management
- ✅ Sync logs (historique synchronisations)
- ✅ Test connexions
- ✅ Disconnect intégrations

**Intégrations à supporter** :
- Shopify
- WooCommerce
- PrestaShop
- Magento
- Zapier
- Make
- Webhooks custom

**Backend** : `/api/v1/integrations/*`, `/api/v1/webhooks/*`

**Feature Gating** : Business+ (Professional = limité)

---

### 12. Templates (`/dashboard/templates`)

**Fonctionnalités** :
- ✅ Gallery templates (grid)
- ✅ Catégories templates (bijoux, accessoires, etc.)
- ✅ Preview templates
- ✅ Utiliser template (copie dans library)
- ✅ Templates favoris
- ✅ Créer template (depuis design)

**Backend** : `/api/v1/templates`

**Feature Gating** : Tous plans

---

### 13. Collections (`/dashboard/collections`)

**Fonctionnalités** :
- ✅ Liste collections
- ✅ Créer/modifier/supprimer collection
- ✅ Ajouter designs à collection
- ✅ Ordre designs (drag & drop)
- ✅ Partage collection (lien public)
- ✅ Export collection (ZIP)

**Backend** : `/api/v1/collections`

**Feature Gating** : Tous plans

---

### 14. Webhooks (`/dashboard/webhooks`)

**Fonctionnalités** :
- ✅ Liste webhooks
- ✅ Créer webhook (URL, events, secret)
- ✅ Test webhook
- ✅ Logs webhooks (success/error)
- ✅ Retry failed webhooks
- ✅ Delete webhooks

**Backend** : `/api/v1/webhooks/*`

**Feature Gating** : Business+

---

### 15. API Keys (`/dashboard/api-keys`)

**Fonctionnalités** :
- ✅ Liste API keys
- ✅ Créer API key (nom, permissions, expiry)
- ✅ Revoke API key
- ✅ Usage stats par key
- ✅ Rate limits par key

**Backend** : `/api/v1/api-keys/*`

**Feature Gating** : Business+

---

### 16. Support (`/dashboard/support`)

**Fonctionnalités** :
- ✅ Ticket system (créer, suivre, fermer)
- ✅ Chat en direct (Intercom/Crisp)
- ✅ FAQ intégrée
- ✅ Documentation search
- ✅ Video tutorials
- ✅ Contact support (email)

**Backend** : `/api/v1/support/tickets`

**Feature Gating** : Tous plans (priority = Business+)

---

### 17. Help (`/dashboard/help`)

**Fonctionnalités** :
- ✅ Documentation complète
- ✅ Guides step-by-step
- ✅ Video tutorials
- ✅ API documentation
- ✅ Changelog
- ✅ Community forum (si applicable)

---

### 18. Notifications (`/dashboard/notifications`)

**Fonctionnalités** :
- ✅ Liste notifications (inbox style)
- ✅ Marquer comme lu/non lu
- ✅ Filtres (all, unread, mentions)
- ✅ Preferences notifications

**Backend** : `/api/v1/notifications`

**Feature Gating** : Tous plans

---

## 🔗 INTÉGRATIONS BACKEND

### Architecture API Unifiée

```
Frontend API Client (apps/frontend/src/lib/api/unified-client.ts)
    ↓
Next.js API Routes (apps/frontend/src/app/api/*)
    ↓
Backend NestJS (apps/backend/src/modules/*)
    ↓
Database (PostgreSQL via Prisma)
```

### Mapping Frontend ↔ Backend

| Frontend Route | Backend Endpoint | Module Backend |
|----------------|------------------|----------------|
| `/api/dashboard/stats` | `/api/v1/dashboard/stats` | `analytics` |
| `/api/designs` | `/api/v1/designs` | `designs` |
| `/api/ai/generate` | `/api/v1/ai/generate` | `ai` |
| `/api/products` | `/api/v1/products` | `products` |
| `/api/orders` | `/api/v1/orders` | `orders` |
| `/api/billing/subscription` | `/api/v1/billing/subscription` | `billing` |
| `/api/analytics/dashboard` | `/api/v1/analytics/dashboard` | `analytics` |
| `/api/team/members` | `/api/v1/team/members` | `team` |
| `/api/integrations` | `/api/v1/integrations` | `integrations` |
| `/api/webhooks` | `/api/v1/webhooks` | `webhooks` |

### React Query Hooks

Créer hooks pour chaque ressource :

```typescript
// apps/frontend/src/lib/hooks/useDashboard.ts
export function useDashboard(period: string) {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => apiClient.get(`/dashboard/stats?period=${period}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// apps/frontend/src/lib/hooks/useDesigns.ts
export function useDesigns(filters: DesignFilters) {
  return useQuery({
    queryKey: ['designs', filters],
    queryFn: () => apiClient.get('/designs', { params: filters }),
  });
}

// ... etc pour chaque ressource
```

---

## 💎 FEATURE GATING & PLANS

### Matrice Fonctionnalités par Plan

| Fonctionnalité | Starter | Professional | Business | Enterprise |
|---------------|---------|--------------|----------|------------|
| **Designs/mois** | 10 | Illimité | Illimité | Illimité |
| **Storage** | 1GB | 10GB | 100GB | Illimité |
| **Rendu 2D** | ✅ | ✅ | ✅ | ✅ |
| **Rendu 3D** | ❌ | ✅ | ✅ | ✅ |
| **AI Studio** | ❌ (limité) | ✅ | ✅ | ✅ |
| **Customizer** | ❌ | ✅ | ✅ | ✅ |
| **Templates** | ✅ (basique) | ✅ (premium) | ✅ (premium) | ✅ (premium) |
| **Team Members** | 1 | 3 | 10 | Illimité |
| **Products** | 10 | Illimité | Illimité | Illimité |
| **Orders** | View only | Full access | Full access | Full access |
| **Analytics** | Basic | Advanced | Advanced | Advanced + Custom |
| **Integrations** | ❌ | Limited | Full | Full + Custom |
| **API Access** | ❌ | ❌ | ✅ (10k calls/mois) | ✅ (Illimité) |
| **Webhooks** | ❌ | ❌ | ✅ | ✅ |
| **White-label** | ❌ | ❌ | ✅ | ✅ |
| **Custom Domain** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **SLA** | ❌ | ❌ | 99.9% | 99.99% |
| **Dedicated Support** | ❌ | ❌ | ❌ | ✅ (Account Manager) |

### Implémentation Feature Gating

```typescript
// apps/frontend/src/lib/features/feature-gates.ts

export const FEATURES_BY_PLAN = {
  starter: ['basic-designs', '2d-renders', 'templates-basic'],
  professional: ['ai-studio', '3d-renders', 'customizer', 'templates-premium'],
  business: ['team-collaboration', 'api-access', 'integrations', 'webhooks', 'white-label'],
  enterprise: ['everything', 'custom-domain', 'dedicated-support'],
};

export function useFeatureGate(feature: string) {
  const { user } = useAuth();
  const plan = user?.subscription?.plan || 'starter';
  
  const hasFeature = FEATURES_BY_PLAN[plan]?.includes(feature) || 
                     plan === 'enterprise';
  
  return {
    hasFeature,
    plan,
    upgradeRequired: !hasFeature && plan !== 'enterprise',
  };
}

// Usage dans composant
function AIStudioPage() {
  const { hasFeature, upgradeRequired } = useFeatureGate('ai-studio');
  
  if (!hasFeature) {
    return <UpgradeRequiredModal feature="AI Studio" plan="professional" />;
  }
  
  return <AIStudioInterface />;
}
```

---

## 🎨 DESIGN SYSTEM PREMIUM

### Couleurs Luxe

```typescript
// apps/frontend/src/lib/design-system/colors.ts

export const colors = {
  // Primary (Or luxe)
  gold: {
    50: '#fffef9',
    100: '#fef9e7',
    200: '#fef3c7',
    300: '#fde68a',
    400: '#fcd34d',
    500: '#fbbf24', // Gold principal
    600: '#f59e0b',
    700: '#d97706',
    800: '#b45309',
    900: '#92400e',
  },
  
  // Secondary (Noir élégant)
  black: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717', // Noir principal
  },
  
  // Accent (Blanc pur)
  white: '#ffffff',
  
  // Semantic
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};
```

### Typographie Premium

```typescript
// apps/frontend/src/lib/design-system/typography.ts

// Fonts : Cormorant Garamond (headings), Inter (body)
export const typography = {
  fontFamily: {
    heading: ['Cormorant Garamond', 'serif'],
    body: ['Inter', 'sans-serif'],
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
};
```

### Composants Premium

- **Button** : Variantes luxe (gradient gold, outline, ghost)
- **Card** : Glassmorphism, hover effects
- **Input** : Bordure élégante, focus state premium
- **Modal** : Overlay sombre, animation smooth
- **Toast** : Notifications élégantes (success, error, info)
- **Loading** : Spinner premium, skeleton screens

---

## ⚡ PERFORMANCE & SEO

### Optimisations Performance

1. **Code Splitting**
   - Route-based splitting (automatique Next.js)
   - Component lazy loading
   - Dynamic imports pour heavy libs

2. **Images**
   - Next.js Image component partout
   - WebP format automatique
   - Lazy loading images

3. **Fonts**
   - Next.js font optimization
   - Preload critical fonts
   - Font display swap

4. **Caching**
   - React Query cache (5-10 min selon data)
   - Static page generation (marketing pages)
   - ISR (Incremental Static Regeneration)

5. **Bundle Size**
   - Tree shaking
   - Analyze bundle (webpack-bundle-analyzer)
   - Remove unused dependencies

### SEO

1. **Metadata** : Title, description, OG tags pour chaque page
2. **Sitemap** : Génération automatique
3. **Robots.txt** : Configuration correcte
4. **Structured Data** : JSON-LD pour produits, articles
5. **Core Web Vitals** : Optimisation (LCP, FID, CLS)

**Target** : Lighthouse 95+/100, Core Web Vitals 95+

---

## 🔒 SÉCURITÉ PRODUCTION

### Authentification

- ✅ JWT avec httpOnly cookies
- ✅ Refresh token rotation
- ✅ 2FA (TOTP, SMS)
- ✅ SSO (SAML, OAuth)

### Sécurité API

- ✅ Rate limiting (100 req/min par IP)
- ✅ CORS strict (whitelist origins)
- ✅ CSRF protection
- ✅ Input validation (Zod)
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React escape automatique)

### Sécurité Data

- ✅ Encryption at rest (database)
- ✅ Encryption in transit (HTTPS)
- ✅ Secrets management (env variables)
- ✅ Audit logs (toutes actions sensibles)

---

## 📈 ANALYTICS & MONITORING

### Analytics Utilisateurs

- Page views tracking
- Events tracking (designs créés, exports, etc.)
- Funnel analysis
- User retention
- Feature usage

**Tools** : Mixpanel, Amplitude, ou custom avec PostHog

### Monitoring

- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (UptimeRobot)
- Logs aggregation (Railway logs)

---

## 📚 SUPPORT & DOCUMENTATION

### Support Client

1. **Chat en direct** : Intercom ou Crisp
2. **Ticket system** : Zendesk ou custom
3. **Email support** : support@luneo.app
4. **Video calls** : Calendly booking

### Documentation

1. **Documentation produit** : MDX-based (Nextra ou custom)
2. **API documentation** : Swagger/OpenAPI
3. **Video tutorials** : YouTube intégré
4. **FAQ** : Base de connaissances

---

## ⏱️ TIMELINE & PRIORITÉS

### Sprint 1 (Semaines 1-2) : FONDATIONS

**Priorité CRITIQUE** :
1. ✅ Corriger CORS (x-request-time) ✅ FAIT
2. 🔴 Corriger authentification 401 (cookies httpOnly)
3. 🔴 Créer API client unifié
4. 🔴 Créer routes API manquantes (404)
5. 🟠 Créer design system premium (base)
6. 🟠 Implémenter feature gating (base)

**Deliverables** :
- API client fonctionnel
- Design system base
- Feature gating système

---

### Sprint 2 (Semaines 3-4) : DASHBOARD PRINCIPAL

**Priorité HAUTE** :
1. 🟠 Refactoriser Overview Dashboard (vraies données)
2. 🟠 Refactoriser AI Studio (intégration backend complète)
3. 🟠 Refactoriser Library (fetch designs, filtres)
4. 🟡 Refactoriser Billing (Stripe integration complète)

**Deliverables** :
- 4 pages dashboard fonctionnelles
- Connexion backend 100%

---

### Sprint 3 (Semaines 5-6) : FONCTIONNALITÉS AVANCÉES

**Priorité HAUTE** :
1. 🟠 Refactoriser Customizer (éditeur fonctionnel)
2. 🟠 Refactoriser Products (CRUD complet)
3. 🟠 Refactoriser Orders (gestion commandes)
4. 🟠 Refactoriser Analytics (dashboard data)

**Deliverables** :
- 4 pages avancées fonctionnelles

---

### Sprint 4 (Semaines 7-8) : ÉQUIPE & INTÉGRATIONS

**Priorité MOYENNE** :
1. 🟡 Refactoriser Team (gestion équipe)
2. 🟡 Refactoriser Integrations (OAuth, webhooks)
3. 🟡 Refactoriser Settings (sections complètes)
4. 🟡 Créer Templates page

**Deliverables** :
- 4 pages fonctionnelles

---

### Sprint 5 (Semaines 9-10) : MARKETING & UX

**Priorité MOYENNE** :
1. 🟡 Refactoriser Home (landing page premium)
2. 🟡 Créer Features page
3. 🟡 Créer Customers page
4. 🟡 Créer Blog (base)
5. 🟡 Améliorer UX (animations, transitions)

**Deliverables** :
- 4 pages marketing fonctionnelles
- UX premium

---

### Sprint 6 (Semaines 11-12) : POLISH & OPTIMISATION

**Priorité BASSE** :
1. 🟡 Performance optimization (Lighthouse 95+)
2. 🟡 SEO optimization (metadata, sitemap)
3. 🟡 Tests E2E (Playwright)
4. 🟡 Documentation complète
5. 🟡 Support system (chat, tickets)

**Deliverables** :
- Application production-ready
- Documentation complète
- Tests E2E

---

## 📋 CHECKLIST PRODUCTION-READY

### Backend
- [x] Modules backend existants (60+ modules) ✅
- [ ] Routes API documentées (Swagger)
- [ ] Tests backend (unit + e2e)
- [ ] Rate limiting configuré
- [ ] Error handling robuste

### Frontend
- [ ] Toutes les pages fonctionnelles (50+ pages)
- [ ] Connexion backend 100%
- [ ] Feature gating implémenté
- [ ] Design system premium complet
- [ ] Performance optimisée (Lighthouse 95+)
- [ ] SEO optimisé
- [ ] Tests E2E (80%+ coverage)

### Infrastructure
- [x] Déploiement Vercel (frontend) ✅
- [x] Déploiement Railway (backend) ✅
- [ ] Monitoring configuré (Sentry, Vercel Analytics)
- [ ] Backup database automatique
- [ ] CDN configuré (Cloudinary)

### Business
- [x] Stripe integration (pricing) ✅
- [ ] Onboarding flow complet
- [ ] Email templates (welcome, billing, etc.)
- [ ] Support system (chat, tickets)
- [ ] Documentation complète
- [ ] Legal pages (Privacy, Terms, GDPR)

---

## 🎯 CONCLUSION

Ce plan de refactorisation production-ready transformera Luneo en un **SaaS de luxe fonctionnel et vendable** avec :

- ✅ **50+ pages fonctionnelles** connectées au backend
- ✅ **Feature gating complet** par plan de paiement
- ✅ **Design premium** niveau marque de luxe
- ✅ **Performance optimale** (Core Web Vitals 95+)
- ✅ **Sécurité renforcée** (production-ready)
- ✅ **Support client intégré**
- ✅ **Documentation complète**

**Timeline** : 12 semaines (~3 mois)

**Priorité** : Commencer par Sprint 1 (fondations) pour stabiliser l'application, puis continuer sprint par sprint.

---

**PRÊT POUR COMMENCER ?** 🚀

Je peux commencer immédiatement par :
1. **Sprint 1 - Fondations** (CORS ✅, Auth 401, API client, Feature gating)
2. **Une page spécifique** en exemple complet (ex: Overview Dashboard)
3. **Design System Premium** (composants base)

Quelle est votre priorité ?
