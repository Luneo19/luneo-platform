# 🏗️ PLAN DE REFACTORISATION COMPLÈTE - LUNEO PLATFORM

## 📋 CONTEXTE

Le système actuel présente des problèmes critiques :
- Pages marketing non fonctionnelles
- Absence de communication frontend ↔ backend
- Erreurs 401/404/500 massives
- CORS mal configuré
- UX/Design non adapté à une marque de luxe
- Pas de liaison avec les plans de paiement

## 🎯 OBJECTIF GLOBAL

Transformer Luneo en une plateforme SaaS fonctionnelle, élégante et luxueuse où :
1. **Toutes les pages sont fonctionnelles** et connectées au backend
2. **L'UX/UI reflète une marque de luxe** (design premium, animations fluides)
3. **Les fonctionnalités sont liées aux plans de paiement** (feature gating)
4. **L'architecture est robuste et maintenable**

---

## 📐 ARCHITECTURE PROPOSÉE

### Phase 1 : Correction CORS & Authentification (URGENT)
### Phase 2 : Refactorisation des Pages Dashboard
### Phase 3 : Intégration Backend ← → Frontend
### Phase 4 : Feature Gating (Plans de Paiement)
### Phase 5 : Redesign UX/UI Luxe

---

## 🚨 PHASE 1 : CORRECTIONS URGENTES (Semaine 1)

### 1.1 CORS - Headers Manquants ✅
**Problème** : `x-request-time` non autorisé
**Solution** : Ajouter `X-Request-Time, x-request-time` dans `Access-Control-Allow-Headers`

### 1.2 Authentification 401
**Problème** : Requêtes 401 massives
**Solution** :
- Vérifier la transmission des cookies httpOnly
- Corriger la vérification d'auth dans `useAuth` hook
- Implémenter refresh token automatique

### 1.3 Routes API Manquantes (404)
**Problème** : `/api/credits/balance`, `/api/billing/payment-methods`, etc. retournent 404
**Solution** :
- Créer les routes API manquantes dans le frontend
- Ou connecter directement au backend NestJS

---

## 🎨 PHASE 2 : REFACTORISATION PAGES DASHBOARD (Semaines 2-4)

### 2.1 Overview Dashboard (`/overview`)
**État actuel** : Stats non fonctionnelles, données mockées
**Refactorisation** :
- ✅ Connexion réelle à `/api/dashboard/stats`
- ✅ Gestion des erreurs gracieuse
- ✅ Loading states élégants
- ✅ Animations premium (Framer Motion)
- **Design** : Cards glassmorphism, gradients luxueux

### 2.2 AI Studio (`/dashboard/ai-studio`)
**État actuel** : Interface basique, génération non fonctionnelle
**Refactorisation** :
- Intégration backend `/api/v1/ai/generate`
- Streaming des résultats (SSE)
- Gallery de designs générés
- Export/download fonctionnel
- **Design** : Interface créative, preview en temps réel

### 2.3 Customizer (`/dashboard/customizer`)
**État actuel** : Éditeur non fonctionnel
**Refactorisation** :
- Intégration fabric.js ou Konva
- Sauvegarde automatique
- Versioning des designs
- Export PNG/SVG/PDF
- **Design** : Interface pro, outils avancés

### 2.4 Library (`/dashboard/library`)
**État actuel** : Liste vide, pas de données
**Refactorisation** :
- Fetch depuis `/api/v1/designs`
- Filtres et recherche
- Organisation par dossiers
- Partage et collaboration
- **Design** : Grid élégant, preview hover

### 2.5 Billing (`/dashboard/billing`)
**État actuel** : Pas de connexion Stripe
**Refactorisation** :
- Affichage du plan actuel
- Liste des factures Stripe
- Gestion des méthodes de paiement
- Upgrade/downgrade de plan
- **Design** : Tableau de bord finances premium

### 2.6 Analytics (`/dashboard/analytics`)
**État actuel** : Graphiques vides
**Refactorisation** :
- Intégration backend `/api/v1/analytics`
- Graphiques interactifs (Recharts/Chart.js)
- Filtres temporels
- Export rapports
- **Design** : Dashboard data luxueux

### 2.7 Settings (`/dashboard/settings`)
**État actuel** : Formulaire basique
**Refactorisation** :
- Profil utilisateur complet
- Préférences avancées
- 2FA fonctionnel
- Intégrations tierces
- **Design** : Formulaire premium, sections organisées

### 2.8 Team (`/dashboard/team`)
**État actuel** : Liste vide
**Refactorisation** :
- Gestion membres équipe
- Rôles et permissions
- Invitations email
- Facturation équipe
- **Design** : Interface collaboration élégante

### 2.9 Products (`/dashboard/products`)
**État actuel** : Liste produits non fonctionnelle
**Refactorisation** :
- CRUD produits complet
- Images/3D upload
- Variantes et options
- Stock et prix
- **Design** : Catalogue luxueux

### 2.10 Integrations (`/dashboard/integrations`)
**État actuel** : Liste intégrations non fonctionnelle
**Refactorisation** :
- Connecteurs Shopify, WooCommerce
- Configuration OAuth
- Webhooks gestion
- **Design** : Cards intégrations premium

---

## 🔗 PHASE 3 : INTÉGRATION BACKEND ← → FRONTEND (Semaines 3-5)

### 3.1 API Client Unifié
**Créer** : `apps/frontend/src/lib/api/unified-client.ts`
- Centraliser toutes les requêtes
- Gestion automatique auth (cookies)
- Retry logic et cache
- Error handling unifié

### 3.2 Hooks React Query
**Créer** : Hooks pour chaque ressource
- `useDashboard()`, `useDesigns()`, `useProducts()`, etc.
- Cache intelligent
- Optimistic updates
- Refetch automatique

### 3.3 Routes API Frontend
**Créer** : Routes Next.js pour proxy backend
- `/api/dashboard/*` → Backend `/api/v1/dashboard/*`
- `/api/designs/*` → Backend `/api/v1/designs/*`
- Gestion CORS transparente

### 3.4 Real-time Updates
**Intégrer** : WebSocket pour updates temps réel
- Notifications live
- Collaboration en temps réel
- Status updates

---

## 💎 PHASE 4 : FEATURE GATING (Plans de Paiement) (Semaines 4-6)

### 4.1 Système de Feature Flags
**Créer** : `apps/frontend/src/lib/features/feature-gates.ts`
```typescript
const FEATURES_BY_PLAN = {
  starter: ['basic-designs', '2d-renders'],
  professional: ['ai-studio', '3d-renders', 'customizer'],
  business: ['team-collaboration', 'api-access', 'white-label'],
  enterprise: ['everything']
}
```

### 4.2 Guards & Middleware
**Créer** : `useFeatureGate()` hook
- Vérifier plan utilisateur
- Rediriger vers upgrade si nécessaire
- Afficher message élégant

### 4.3 Limitations par Plan
**Implémenter** :
- Quotas designs/mois
- Limites storage
- Nombre membres équipe
- API rate limits

---

## ✨ PHASE 5 : REDESIGN UX/UI LUXE (Semaines 5-8)

### 5.1 Design System Premium
**Créer** : `apps/frontend/src/lib/design-system/`
- Couleurs luxe (or, noir, blanc)
- Typographie premium (Cormorant, Playfair)
- Composants glassmorphism
- Animations fluides (Framer Motion)

### 5.2 Composants UI Refactorisés
**Refactoriser** :
- `Button` : Variantes luxe (gradients, ombres)
- `Card` : Glassmorphism, hover effects
- `Input` : Bordure élégante, focus state premium
- `Modal` : Overlay sombre, animation smooth

### 5.3 Layout Dashboard
**Refactoriser** :
- Sidebar élégante (navigation premium)
- Header avec breadcrumbs
- Content area avec animations
- Footer minimaliste

### 5.4 Animations & Transitions
**Ajouter** :
- Page transitions (Framer Motion)
- Hover effects premium
- Loading states élégants
- Success/error toasts luxe

---

## 📊 MATRICE DES FONCTIONNALITÉS PAR PLAN

| Fonctionnalité | Starter | Professional | Business | Enterprise |
|---------------|---------|--------------|----------|------------|
| Designs/mois | 10 | Illimité | Illimité | Illimité |
| Rendu 2D | ✅ | ✅ | ✅ | ✅ |
| Rendu 3D | ❌ | ✅ | ✅ | ✅ |
| AI Studio | ❌ | ✅ | ✅ | ✅ |
| Customizer | ❌ | ✅ | ✅ | ✅ |
| Team Members | 1 | 3 | 10 | Illimité |
| API Access | ❌ | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ✅ | ✅ |
| Storage | 1GB | 10GB | 100GB | Illimité |

---

## 🗂️ STRUCTURE DE FICHIERS PROPOSÉE

```
apps/frontend/src/
├── app/
│   ├── (dashboard)/
│   │   ├── overview/          # Dashboard principal
│   │   ├── ai-studio/         # Génération IA
│   │   ├── customizer/        # Éditeur design
│   │   ├── library/           # Bibliothèque designs
│   │   ├── billing/           # Facturation & abonnements
│   │   ├── analytics/         # Analytics avancés
│   │   ├── products/          # Gestion produits
│   │   ├── team/              # Équipe & collaboration
│   │   ├── settings/          # Paramètres
│   │   └── integrations/      # Intégrations tierces
│   └── (public)/
│       ├── pricing/           # Page tarifs (✅ déjà fonctionnelle)
│       ├── home/              # Landing page
│       └── ...
├── lib/
│   ├── api/
│   │   ├── unified-client.ts  # Client API unifié
│   │   └── endpoints/         # Endpoints typés
│   ├── features/
│   │   ├── feature-gates.ts   # Feature gating
│   │   └── plan-limits.ts     # Limites par plan
│   ├── design-system/         # Design system luxe
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── components/
│   └── hooks/
│       ├── useDashboard.ts
│       ├── useDesigns.ts
│       └── ...
└── components/
    ├── dashboard/             # Composants dashboard
    ├── premium/               # Composants luxe
    └── ui/                    # Composants de base
```

---

## 🔄 WORKFLOW DE DÉVELOPPEMENT

### Pour chaque page :
1. **Audit** : Identifier fonctionnalités manquantes
2. **Backend** : Créer/valider routes API nécessaires
3. **Frontend** : Refactoriser composant avec :
   - Hooks React Query
   - Gestion erreurs
   - Loading states
   - Feature gating
4. **Design** : Appliquer design system luxe
5. **Tests** : Tests fonctionnels & E2E

---

## ⏱️ ESTIMATION TEMPS

| Phase | Durée | Priorité |
|-------|-------|----------|
| Phase 1 : Corrections urgentes | 1 semaine | 🔴 CRITIQUE |
| Phase 2 : Refactorisation pages | 3 semaines | 🟠 HAUTE |
| Phase 3 : Intégration backend | 2 semaines | 🟠 HAUTE |
| Phase 4 : Feature gating | 2 semaines | 🟡 MOYENNE |
| Phase 5 : Redesign UX/UI | 3 semaines | 🟡 MOYENNE |

**Total estimé** : 11 semaines (~3 mois)

---

## 🎯 PRIORITÉS IMMÉDIATES (Cette semaine)

1. ✅ Corriger CORS (x-request-time)
2. 🔴 Fixer authentification 401
3. 🔴 Créer routes API manquantes
4. 🟠 Refactoriser Overview Dashboard
5. 🟠 Intégrer AI Studio avec backend

---

## 📝 PROCHAINES ACTIONS

Voulez-vous que je commence par :
1. **Corriger les erreurs urgentes** (CORS, auth, 404) ?
2. **Refactoriser une page spécifique** en exemple ?
3. **Créer le design system** premium ?
4. **Implémenter le feature gating** ?

