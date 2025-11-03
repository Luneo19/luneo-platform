# 📂 FICHIERS CRITIQUES - RÉFÉRENCE COMPLÈTE

**Date:** 29 Octobre 2025  
**Usage:** Liste exhaustive de tous les fichiers critiques avec leur rôle et emplacement

---

## 📋 TABLE DES MATIÈRES

1. [Configuration Root](#config-root)
2. [Frontend - Configuration](#frontend-config)
3. [Frontend - Pages critiques](#frontend-pages)
4. [Frontend - API Routes](#frontend-api)
5. [Frontend - Composants](#frontend-components)
6. [Frontend - Hooks](#frontend-hooks)
7. [Frontend - Lib & Utils](#frontend-lib)
8. [Backend - Configuration](#backend-config)
9. [Backend - Modules](#backend-modules)
10. [Backend - Services](#backend-services)
11. [Base de données - Migrations](#database-migrations)
12. [Scripts](#scripts)
13. [Documentation](#documentation)

---

<a name="config-root"></a>
## ⚙️ CONFIGURATION ROOT

### Fichiers de configuration

| Fichier | Rôle | Criticité |
|---------|------|-----------|
| `/package.json` | Package root monorepo | 🔴 CRITIQUE |
| `/turbo.json` | Configuration Turborepo | 🔴 CRITIQUE |
| `/pnpm-lock.yaml` | Lock file pnpm | 🟡 Important |
| `/.gitignore` | Git ignore | 🟡 Important |
| `/README.md` | Documentation principale | 🟢 Info |
| `/luneo-platform.code-workspace` | Workspace VSCode | 🟢 Info |

### .gitignore

**Fichier:** `/.gitignore`

**Contenu:**
```
node_modules/
.env*
logs/
*.log
coverage/
.next/
dist/
build/
.cache/
.turbo/
.vercel/
*.tsbuildinfo
.DS_Store
uploads/
tmp/
temp/
```

---

<a name="frontend-config"></a>
## 🎨 FRONTEND - CONFIGURATION

### Fichiers de configuration

| Fichier | Rôle | Criticité |
|---------|------|-----------|
| `/apps/frontend/package.json` | Dependencies frontend | 🔴 CRITIQUE |
| `/apps/frontend/next.config.mjs` | Next.js config | 🔴 CRITIQUE |
| `/apps/frontend/vercel.json` | Vercel deployment | 🔴 CRITIQUE |
| `/apps/frontend/tsconfig.json` | TypeScript config | 🔴 CRITIQUE |
| `/apps/frontend/tailwind.config.cjs` | Tailwind CSS config | 🟡 Important |
| `/apps/frontend/postcss.config.cjs` | PostCSS config | 🟡 Important |
| `/apps/frontend/.gitignore` | Git ignore frontend | 🟡 Important |
| `/apps/frontend/middleware.ts` | Edge middleware | 🔴 CRITIQUE |
| `/apps/frontend/env.example` | Exemple variables env | 🟡 Important |

### next.config.mjs

**Emplacement:** `/apps/frontend/next.config.mjs`

**Points critiques:**
- `reactStrictMode: true`
- `optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']`
- `images.domains: ['res.cloudinary.com', 'images.unsplash.com']`
- Webpack config (ignore test files)
- Security headers

**NE PAS MODIFIER:**
- Image optimization config
- Webpack fallbacks
- Test files exclusion

### vercel.json

**Emplacement:** `/apps/frontend/vercel.json`

**Configuration critique:**

**CSP (Content Security Policy):**
```
connect-src: 'self' https://*.supabase.co https://*.cloudinary.com 
             https://api.stripe.com https://*.vercel.app 
             wss://*.supabase.co
frame-src: 'self' https://js.stripe.com
```

**⚠️ Si problème Stripe:** Vérifier que `https://js.stripe.com` est dans `frame-src`

**Redirects:**
```json
{ "source": "/signin", "destination": "/login", "permanent": true }
{ "source": "/signup", "destination": "/register", "permanent": true }
{ "source": "/dashboard", "destination": "/dashboard/dashboard", "permanent": false }
```

**Rewrites:**
```json
{ "source": "/api/v1/:path*", "destination": "/api/:path*" }
```

### middleware.ts

**Emplacement:** `/apps/frontend/middleware.ts`

**Fonctions critiques:**

1. **Rate limiting** (ligne 10-18)
   - Require: UPSTASH_REDIS_REST_URL
   - Fallback gracieux si non configuré

2. **Authentication** (ligne 24-72)
   - Public paths définis
   - Redirect vers /login si non auth
   - Refresh session automatique

**Routes publiques:**
```typescript
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/help',
  '/contact',
  '/blog',
  '/legal/terms',
  '/legal/privacy',
  '/auth/callback',
  '/api/stripe/webhook'
];
```

### tsconfig.json

**Emplacement:** `/apps/frontend/tsconfig.json`

**Path aliases:**
```json
{
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/store/*": ["./src/store/*"],
  "@/types/*": ["./src/types/*"],
  "@/utils/*": ["./src/utils/*"]
}
```

**⚠️ Important:** Ces aliases sont utilisés partout dans le code!

---

<a name="frontend-pages"></a>
## 📄 FRONTEND - PAGES CRITIQUES

### Layout & Providers

| Fichier | Rôle | Criticité |
|---------|------|-----------|
| `/apps/frontend/src/app/layout.tsx` | Root layout | 🔴 CRITIQUE |
| `/apps/frontend/src/app/page.tsx` | Homepage | 🔴 CRITIQUE |
| `/apps/frontend/src/app/providers.tsx` | Context providers | 🔴 CRITIQUE |
| `/apps/frontend/src/app/globals.css` | Global styles | 🟡 Important |

### Layout.tsx (Root)

**Emplacement:** `/apps/frontend/src/app/layout.tsx`

**Providers:**
- Supabase SSR ✅
- TanStack Query ✅
- Theme Provider ✅

**Composants globaux:**
- CookieBanner (GDPR)
- Vercel Analytics
- Speed Insights
- WebVitalsReporter

**Metadata:**
- SEO complet
- Open Graph
- Twitter Card
- Robots config

### Homepage

**Emplacement:** `/apps/frontend/src/app/page.tsx`

**Sections:**
- Hero avec animation
- Features showcase
- Templates preview
- Testimonials
- CTA sections
- Footer

### Auth Pages

| Fichier | Route | Rôle |
|---------|-------|------|
| `/apps/frontend/src/app/(auth)/login/page.tsx` | `/login` | Connexion |
| `/apps/frontend/src/app/(auth)/register/page.tsx` | `/register` | Inscription |
| `/apps/frontend/src/app/(auth)/reset-password/page.tsx` | `/reset-password` | Reset MDP |
| `/apps/frontend/src/app/(auth)/layout.tsx` | - | Layout auth |

### Dashboard Pages

| Fichier | Route | Rôle |
|---------|-------|------|
| `/apps/frontend/src/app/(dashboard)/layout.tsx` | - | Layout dashboard | 🔴 CRITIQUE
| `/apps/frontend/src/app/(dashboard)/dashboard/page.tsx` | `/dashboard/dashboard` | Dashboard principal | 🔴 CRITIQUE
| `/apps/frontend/src/app/(dashboard)/ai-studio/page.tsx` | `/dashboard/ai-studio` | Studio IA |
| `/apps/frontend/src/app/(dashboard)/ar-studio/page.tsx` | `/dashboard/ar-studio` | Studio AR |
| `/apps/frontend/src/app/(dashboard)/products/page.tsx` | `/dashboard/products` | Gestion produits |
| `/apps/frontend/src/app/(dashboard)/orders/page.tsx` | `/dashboard/orders` | Gestion commandes |
| `/apps/frontend/src/app/(dashboard)/billing/page.tsx` | `/dashboard/billing` | Facturation |
| `/apps/frontend/src/app/(dashboard)/analytics/page.tsx` | `/dashboard/analytics` | Analytics |
| `/apps/frontend/src/app/(dashboard)/settings/page.tsx` | `/dashboard/settings` | Paramètres |
| `/apps/frontend/src/app/(dashboard)/team/page.tsx` | `/dashboard/team` | Équipe |
| `/apps/frontend/src/app/(dashboard)/library/page.tsx` | `/dashboard/library` | Bibliothèque |
| `/apps/frontend/src/app/(dashboard)/integrations/page.tsx` | `/dashboard/integrations` | Intégrations |

### Public Pages

| Fichier | Route | Rôle |
|---------|-------|------|
| `/apps/frontend/src/app/(public)/layout.tsx` | - | Layout public | 🔴 CRITIQUE
| `/apps/frontend/src/app/(public)/pricing/page.tsx` | `/pricing` | Tarifs | 🔴 CRITIQUE
| `/apps/frontend/src/app/(public)/contact/page.tsx` | `/contact` | Contact |
| `/apps/frontend/src/app/(public)/about/page.tsx` | `/about` | À propos |
| `/apps/frontend/src/app/(public)/features/page.tsx` | `/features` | Fonctionnalités |
| `/apps/frontend/src/app/(public)/gallery/page.tsx` | `/gallery` | Galerie |
| `/apps/frontend/src/app/(public)/templates/page.tsx` | `/templates` | Templates |
| `/apps/frontend/src/app/(public)/blog/page.tsx` | `/blog` | Blog |
| `/apps/frontend/src/app/(public)/help/page.tsx` | `/help` | Aide |

### Pricing Page (CRITIQUE)

**Emplacement:** `/apps/frontend/src/app/(public)/pricing/page.tsx`

**Lignes:** 260

**Structure:**
```typescript
// Ligne 9-112: Configuration des plans
const plans = [
  {
    name: 'Professional',
    price: 29,              // Mensuel
    yearlyPrice: 278.4,     // Annuel
    planId: 'professional',
    // ...
  }
];

// Ligne 114-134: Fonction paiement
const handleStripeCheckout = async (planId, billingCycle) => {
  // Fetch /api/billing/create-checkout-session
  // Redirect vers Stripe
};

// Ligne 157-260: Rendering
export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  // UI rendering
}
```

**Points critiques:**
- Plans configuration (prix, features)
- Toggle monthly/yearly
- Appel API Stripe
- Affichage prix (ligne 206-216)
- Boutons CTA (ligne 224-247)

---

<a name="frontend-api"></a>
## 🌐 FRONTEND - API ROUTES

### Routes Stripe (CRITIQUES)

| Fichier | Route | Méthode | Rôle |
|---------|-------|---------|------|
| `/apps/frontend/src/app/api/billing/create-checkout-session/route.ts` | `/api/billing/create-checkout-session` | POST | Créer session Stripe | 🔴 CRITIQUE
| `/apps/frontend/src/app/api/stripe/webhook/route.ts` | `/api/stripe/webhook` | POST | Webhooks Stripe |
| `/apps/frontend/src/app/api/billing/subscription/route.ts` | `/api/billing/subscription` | GET | Info subscription |
| `/apps/frontend/src/app/api/billing/invoices/route.ts` | `/api/billing/invoices` | GET | Liste factures |

### create-checkout-session/route.ts

**Emplacement:** `/apps/frontend/src/app/api/billing/create-checkout-session/route.ts`

**Lignes:** 159

**Structure:**

```typescript
// Ligne 1-5: Imports
import { NextRequest, NextResponse } from 'next/server';
const Stripe = require('stripe');

// Ligne 5: Runtime
export const runtime = 'nodejs';

// Ligne 7-159: Handler POST
export async function POST(request: NextRequest) {
  // Ligne 9: Récupérer params
  const { planId, email, billing = 'monthly' } = await request.json();
  
  // Ligne 20-22: Init Stripe
  const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  
  // Ligne 24-39: Config Price IDs
  const planPrices: Record<string, { monthly, yearly }> = {
    professional: { 
      monthly: 'price_1RvB1uKG9MsM6fdSnrGm2qIo',
      yearly: 'price_1RvB1uKG9MsM6fdSnrGm2qIo'
    },
    // ... autres plans
  };
  
  // Ligne 41-43: Sélection Price ID
  const priceId = billing === 'yearly' 
    ? priceConfig.yearly 
    : priceConfig.monthly;
  
  // Ligne 102-135: Création prix annuel si yearly
  if (billing === 'yearly') {
    const priceDetails = await stripe.prices.retrieve(priceId);
    const productId = priceDetails.product;
    
    const yearlyAmount = yearlyAmounts[planId];
    
    const yearlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: yearlyAmount,
      currency: 'eur',
      recurring: { interval: 'year' }
    });
    
    sessionConfig.line_items[0].price = yearlyPrice.id;
  }
  
  // Ligne 137-140: Créer session
  const session = await stripe.checkout.sessions.create(sessionConfig);
  
  // Ligne 142-145: Retourner URL
  return NextResponse.json({
    success: true,
    url: session.url
  });
}
```

**Variables env utilisées:**
- `STRIPE_SECRET_KEY` (ligne 20)

**URLs hardcodées:**
- `success_url: 'https://app.luneo.app/dashboard/billing?session_id={CHECKOUT_SESSION_ID}'`
- `cancel_url: 'https://app.luneo.app/pricing'`

**⚠️ NE PAS MODIFIER:**
- apiVersion: '2023-10-16'
- runtime: 'nodejs'
- URLs hardcodées (pas de variables env)

### Routes CRUD

| Fichier | Route | Méthodes | Rôle |
|---------|-------|----------|------|
| `/apps/frontend/src/app/api/products/route.ts` | `/api/products` | GET, POST | CRUD produits |
| `/apps/frontend/src/app/api/products/[id]/route.ts` | `/api/products/:id` | GET, PUT, DELETE | Produit spécifique |
| `/apps/frontend/src/app/api/designs/route.ts` | `/api/designs` | GET, POST | CRUD designs |
| `/apps/frontend/src/app/api/orders/route.ts` | `/api/orders` | GET, POST | CRUD commandes |
| `/apps/frontend/src/app/api/orders/[id]/route.ts` | `/api/orders/:id` | GET, PUT | Commande spécifique |
| `/apps/frontend/src/app/api/templates/route.ts` | `/api/templates` | GET | Liste templates |
| `/apps/frontend/src/app/api/cliparts/route.ts` | `/api/cliparts` | GET | Liste cliparts |
| `/apps/frontend/src/app/api/collections/route.ts` | `/api/collections` | GET, POST | Collections |

### Routes Auth & Profile

| Fichier | Route | Méthode | Rôle |
|---------|-------|---------|------|
| `/apps/frontend/src/app/auth/callback/route.ts` | `/auth/callback` | GET | OAuth callback |
| `/apps/frontend/src/app/api/profile/route.ts` | `/api/profile` | GET, PUT | Profil utilisateur |
| `/apps/frontend/src/app/api/profile/avatar/route.ts` | `/api/profile/avatar` | PUT | Upload avatar |
| `/apps/frontend/src/app/api/profile/password/route.ts` | `/api/profile/password` | PUT | Changer MDP |

### Routes Utilitaires

| Fichier | Route | Méthode | Rôle |
|---------|-------|---------|------|
| `/apps/frontend/src/app/api/health/route.ts` | `/api/health` | GET | Health check |
| `/apps/frontend/src/app/api/dashboard/stats/route.ts` | `/api/dashboard/stats` | GET | Stats dashboard |
| `/apps/frontend/src/app/api/csrf/token/route.ts` | `/api/csrf/token` | GET | Token CSRF |

### Health Route

**Emplacement:** `/apps/frontend/src/app/api/health/route.ts`

**Checks:**
- Supabase connection
- Redis connection (si configuré)
- Response time

**Réponse:**
```json
{
  "status": "healthy" | "unhealthy",
  "timestamp": "2025-10-29T...",
  "uptime": 123.45,
  "services": {
    "database": { "status": "healthy", "latency_ms": 100 },
    "redis": { "status": "not_configured" }
  }
}
```

---

<a name="frontend-components"></a>
## 🧩 FRONTEND - COMPOSANTS

### Composants UI (shadcn/ui)

**Emplacement:** `/apps/frontend/src/components/ui/`

**Liste complète:**
```
avatar.tsx           # Avatar utilisateur
badge.tsx            # Badges
button.tsx           # Bouton (CRITIQUE)
card.tsx             # Cards (CRITIQUE)
input.tsx            # Input (CRITIQUE)
label.tsx            # Label
select.tsx           # Select dropdown
slider.tsx           # Slider
switch.tsx           # Toggle switch
tabs.tsx             # Tabs
toast.tsx            # Toast notifications
toaster.tsx          # Toast container
use-toast.ts         # Hook toast
progress.tsx         # Progress bar
skeleton.tsx         # Skeleton loader
scroll-area.tsx      # Scroll area
popover.tsx          # Popover
textarea.tsx         # Textarea
loading-spinner.tsx  # Spinner
```

**Base:** Radix UI + Tailwind CSS + class-variance-authority

### Layout Components

| Fichier | Rôle | Utilisé dans |
|---------|------|--------------|
| `/apps/frontend/src/components/layout/UnifiedNav.tsx` | Navigation publique | Pages publiques | 🔴 CRITIQUE
| `/apps/frontend/src/components/layout/Footer.tsx` | Footer | Pages publiques |
| `/apps/frontend/src/components/dashboard/Sidebar.tsx` | Sidebar dashboard | Dashboard | 🔴 CRITIQUE
| `/apps/frontend/src/components/dashboard/Header.tsx` | Header dashboard | Dashboard |

### Sidebar.tsx (Dashboard)

**Emplacement:** `/apps/frontend/src/components/dashboard/Sidebar.tsx`

**Navigation items:**
```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard/dashboard', icon: Home },
  { name: 'AI Studio', href: '/dashboard/ai-studio', icon: Sparkles },
  { name: 'AR Studio', href: '/dashboard/ar-studio', icon: Camera },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Bibliothèque', href: '/dashboard/library', icon: Library },
  { name: 'Templates', href: '/dashboard/templates', icon: Layout },
  { name: 'Intégrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Facturation', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Équipe', href: '/dashboard/team', icon: Users },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings }
];
```

### Customizer 2D

**Emplacement:** `/apps/frontend/src/components/Customizer/ProductCustomizer.tsx`

**Dépendances:**
- konva
- react-konva

**Features:**
- Canvas Konva
- Toolbar (text, images, shapes)
- Layers panel
- Color picker
- Undo/Redo
- Export (PNG, SVG, PDF, print-ready)

**Props:**
```typescript
interface Props {
  productId: string;
  initialDesign?: KonvaJSON;
  onSave?: (design: KonvaJSON) => void;
  onClose?: () => void;
}
```

### Configurator 3D

**Emplacement:** `/apps/frontend/src/components/3d-configurator/ProductConfigurator3D.tsx`

**Dépendances:**
- three
- @react-three/fiber
- @react-three/drei

**Features:**
- 3D viewer (Three.js)
- Color picker 3D
- Material selector
- Part selector
- Lighting controls
- Camera controls
- Export GLTF/GLB

**Composants associés:**
```
3d-configurator/
├── ProductConfigurator3D.tsx      # Main component
├── ColorPalette3D.tsx             # Color picker
├── MaterialSelector.tsx           # Material selector
└── PartSelector.tsx               # Part selector
```

### Virtual Try-On

**Emplacement:** `/apps/frontend/src/components/virtual-tryon/`

**Composants:**
```
EyewearTryOn.tsx              # Lunettes (MediaPipe Face Mesh)
JewelryTryOn.tsx              # Bijoux (MediaPipe Hands)
WatchTryOn.tsx                # Montres (MediaPipe Hands)
```

**Dépendances:**
- @mediapipe/face_mesh
- @mediapipe/hands
- @tensorflow/tfjs

**Features:**
- Détection faciale/mains temps réel
- Overlay 3D/2D sur webcam
- Screenshot
- Export image

---

<a name="frontend-hooks"></a>
## 🪝 FRONTEND - HOOKS

### Hooks critiques

| Fichier | Hook | Rôle | Usage |
|---------|------|------|-------|
| `/apps/frontend/src/lib/hooks/useAuth.ts` | `useAuth()` | Authentification | Partout | 🔴 CRITIQUE
| `/apps/frontend/src/lib/hooks/useDashboardData.ts` | `useDashboardData()` | Stats dashboard | Dashboard page | 🔴 CRITIQUE
| `/apps/frontend/src/lib/hooks/useBilling.ts` | `useBilling()` | Billing Stripe | Billing page | 🔴 CRITIQUE

### useAuth

**Emplacement:** `/apps/frontend/src/lib/hooks/useAuth.ts`

**Retourne:**
```typescript
{
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  register: (email, password) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
}
```

### useDashboardData

**Emplacement:** `/apps/frontend/src/lib/hooks/useDashboardData.ts`

**Fetch:** `/api/dashboard/stats?period=${period}`

**Retourne:**
```typescript
{
  stats: {
    designs_count: number;
    views_count: number;
    downloads_count: number;
    revenue: number;
  };
  recentActivity: Activity[];
  topDesigns: Design[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

### useBilling

**Emplacement:** `/apps/frontend/src/lib/hooks/useBilling.ts`

**Fetch:** `/api/billing/subscription`

**Retourne:**
```typescript
{
  subscription: {
    plan: 'starter' | 'professional' | 'business' | 'enterprise';
    status: string;
    period: 'monthly' | 'yearly';
    trial_ends_at: string | null;
  };
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  openCustomerPortal: () => Promise<void>;
}
```

### Hooks CRUD

| Hook | Fichier | Fetch | Mutations |
|------|---------|-------|-----------|
| `useProducts()` | `/lib/hooks/useProducts.ts` | `/api/products` | create, update, delete |
| `useDesigns()` | `/lib/hooks/useDesigns.ts` | `/api/designs` | create, update, delete |
| `useOrders()` | `/lib/hooks/useOrders.ts` | `/api/orders` | create, update |
| `useTemplates()` | `/lib/hooks/useTemplates.ts` | `/api/templates` | - |
| `useCliparts()` | `/lib/hooks/useCliparts.ts` | `/api/cliparts` | - |
| `useCollections()` | `/lib/hooks/useCollections.ts` | `/api/collections` | create, delete |

### Hooks Infinite Scroll

| Hook | Fichier | Usage |
|------|---------|-------|
| `useDesignsInfinite()` | `/lib/hooks/useDesignsInfinite.ts` | Infinite scroll designs |
| `useOrdersInfinite()` | `/lib/hooks/useOrdersInfinite.ts` | Infinite scroll orders |
| `useInfiniteScroll()` | `/lib/hooks/useInfiniteScroll.ts` | Generic infinite scroll |

---

<a name="frontend-lib"></a>
## 📚 FRONTEND - LIB & UTILS

### Supabase Clients

| Fichier | Rôle | Usage |
|---------|------|-------|
| `/apps/frontend/src/lib/supabase/client.ts` | Browser client | Composants client | 🔴 CRITIQUE
| `/apps/frontend/src/lib/supabase/server.ts` | Server client | Server Components, API | 🔴 CRITIQUE
| `/apps/frontend/src/lib/supabase/middleware.ts` | Middleware client | Edge middleware | 🔴 CRITIQUE

### client.ts

**Emplacement:** `/apps/frontend/src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### server.ts

**Emplacement:** `/apps/frontend/src/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

### Canvas Editor (2D)

| Fichier | Rôle |
|---------|------|
| `/apps/frontend/src/lib/canvas-editor/CanvasEditor.ts` | Logique éditeur |
| `/apps/frontend/src/lib/canvas-editor/tools/TextTool.ts` | Outil texte |
| `/apps/frontend/src/lib/canvas-editor/tools/ImageTool.ts` | Outil image |
| `/apps/frontend/src/lib/canvas-editor/tools/ShapeTool.ts` | Outil forme |
| `/apps/frontend/src/lib/canvas-editor/export/ExportManager.ts` | Export |
| `/apps/frontend/src/lib/canvas-editor/state/EditorState.ts` | State management |

### 3D Configurator (3D)

| Fichier | Rôle |
|---------|------|
| `/apps/frontend/src/lib/3d-configurator/core/Scene3D.ts` | Scène 3D |
| `/apps/frontend/src/lib/3d-configurator/tools/ColorChanger.ts` | Changement couleur |
| `/apps/frontend/src/lib/3d-configurator/tools/MaterialChanger.ts` | Changement matériau |
| `/apps/frontend/src/lib/3d-configurator/tools/PartSelector.ts` | Sélection partie |
| `/apps/frontend/src/lib/3d-configurator/tools/LightingManager.ts` | Éclairage |
| `/apps/frontend/src/lib/3d-configurator/tools/CameraControls.ts` | Caméra |
| `/apps/frontend/src/lib/3d-configurator/tools/ExportManager.ts` | Export 3D |

### Utilities

| Fichier | Rôle |
|---------|------|
| `/apps/frontend/src/lib/utils.ts` | Utilitaires génériques |
| `/apps/frontend/src/lib/api/client.ts` | API client (axios) |
| `/apps/frontend/src/lib/logger.ts` | Logger |
| `/apps/frontend/src/lib/encryption.ts` | Encryption utils |
| `/apps/frontend/src/lib/rate-limit.ts` | Rate limiting |
| `/apps/frontend/src/lib/redis-cache.ts` | Redis cache |
| `/apps/frontend/src/lib/csrf.ts` | CSRF protection |
| `/apps/frontend/src/lib/web-vitals.ts` | Web Vitals |

---

<a name="backend-config"></a>
## ⚙️ BACKEND - CONFIGURATION

### Fichiers de configuration

| Fichier | Rôle | Criticité |
|---------|------|-----------|
| `/apps/backend/package.json` | Dependencies backend | 🔴 CRITIQUE |
| `/apps/backend/vercel.json` | Vercel config backend | 🟡 Important |
| `/apps/backend/tsconfig.json` | TypeScript config | 🔴 CRITIQUE |
| `/apps/backend/nest-cli.json` | NestJS CLI config | 🟡 Important |
| `/apps/backend/prisma/schema.prisma` | Database schema | 🔴 CRITIQUE |
| `/apps/backend/.gitignore` | Git ignore | 🟡 Important |
| `/apps/backend/env.example` | Exemple env vars | 🟡 Important |

### schema.prisma

**Emplacement:** `/apps/backend/prisma/schema.prisma`

**Lignes:** 694

**Structure:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums (6)
enum UserRole { ... }
enum OrderStatus { ... }
enum DesignStatus { ... }
enum PaymentStatus { ... }
enum BrandStatus { ... }
enum WebhookEventType { ... }

// Models (12)
model User { ... }
model OAuthAccount { ... }
model RefreshToken { ... }
model Brand { ... }
model Product { ... }
model Design { ... }
model Order { ... }
model ApiKey { ... }
model Webhook { ... }
model AICost { ... }
model UserQuota { ... }
model SystemConfig { ... }
```

**Relations:**
- User → Brand (1:1)
- User → Designs (1:N)
- User → Orders (1:N)
- User → OAuthAccounts (1:N)
- User → RefreshTokens (1:N)
- Order → Product (N:1)
- Order → Design (N:1)

---

<a name="backend-modules"></a>
## 🧬 BACKEND - MODULES

### Modules critiques

| Module | Fichier | Controller | Service | Endpoints |
|--------|---------|------------|---------|-----------|
| **Auth** | `/apps/backend/src/modules/auth/` | auth.controller.ts | auth.service.ts | 7 | 🔴 CRITIQUE
| **Users** | `/apps/backend/src/modules/users/` | users.controller.ts | users.service.ts | 5 |
| **Billing** | `/apps/backend/src/modules/billing/` | billing.controller.ts | billing.service.ts | 4 | 🔴 CRITIQUE
| **Products** | `/apps/backend/src/modules/products/` | products.controller.ts | products.service.ts | 5 |
| **Designs** | `/apps/backend/src/modules/designs/` | designs.controller.ts | designs.service.ts | 6 |
| **Orders** | `/apps/backend/src/modules/orders/` | orders.controller.ts | orders.service.ts | 6 |

### Auth Module

**Emplacement:** `/apps/backend/src/modules/auth/`

**Fichiers:**
```
auth/
├── auth.module.ts               # Module definition
├── auth.controller.ts           # 7 endpoints
├── auth.service.ts              # Business logic
├── dto/
│   ├── login.dto.ts            # Login DTO
│   ├── signup.dto.ts           # Signup DTO
│   └── refresh-token.dto.ts    # Refresh DTO
├── guards/
│   └── jwt-auth.guard.ts       # JWT guard
└── strategies/
    └── jwt.strategy.ts         # JWT strategy (Passport)
```

**Endpoints:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/profile
POST   /api/v1/auth/google
POST   /api/v1/auth/github
```

### Billing Module

**Emplacement:** `/apps/backend/src/modules/billing/`

**Fichiers:**
```
billing/
├── billing.module.ts
├── billing.controller.ts        # 4 endpoints
└── billing.service.ts           # Stripe integration
```

**Méthodes service:**
```typescript
createCheckoutSession(planId, userId, userEmail)
createCustomerPortalSession(userId)
handleWebhook(event)
getSubscription(userId)
```

**Plans supportés:**
```typescript
const planPrices = {
  starter: null,
  professional: this.configService.get('STRIPE_PRICE_PRO'),
  business: this.configService.get('STRIPE_PRICE_BUSINESS'),
  enterprise: this.configService.get('STRIPE_PRICE_ENTERPRISE')
};
```

---

<a name="backend-services"></a>
## 🔧 BACKEND - SERVICES

### Services Libs

| Service | Fichier | Rôle |
|---------|---------|------|
| **PrismaService** | `/apps/backend/src/libs/prisma/prisma.service.ts` | Database ORM | 🔴 CRITIQUE
| **PrismaOptimizedService** | `/apps/backend/src/libs/prisma/prisma-optimized.service.ts` | Queries optimisées |
| **RedisOptimizedService** | `/apps/backend/src/libs/redis/redis-optimized.service.ts` | Cache Redis |
| **SmartCacheService** | `/apps/backend/src/libs/cache/smart-cache.service.ts` | Cache intelligent |
| **S3Service** | `/apps/backend/src/libs/s3/s3.service.ts` | Storage S3 |
| **CloudinaryService** | `/apps/backend/src/libs/storage/cloudinary.service.ts` | Storage Cloudinary |

### Services Email

| Service | Fichier | Provider |
|---------|---------|----------|
| **SendGridService** | `/apps/backend/src/modules/email/sendgrid.service.ts` | SendGrid |
| **MailgunService** | `/apps/backend/src/modules/email/mailgun.service.ts` | Mailgun |
| **SMTPService** | `/apps/backend/src/modules/email/smtp.service.ts` | SMTP |
| **EmailService** | `/apps/backend/src/modules/email/email.service.ts` | Orchestrateur |

### Services Intégrations

| Service | Fichier | Integration |
|---------|---------|-------------|
| **SlackService** | `/apps/backend/src/modules/integrations/slack/slack.service.ts` | Slack |
| **ZapierService** | `/apps/backend/src/modules/integrations/zapier/zapier.service.ts` | Zapier |
| **WebhookIntegrationService** | `/apps/backend/src/modules/integrations/webhook-integration/webhook-integration.service.ts` | Custom webhooks |

### Services AI & Rendering

| Service | Fichier | Rôle |
|---------|---------|------|
| **AiService** | `/apps/backend/src/modules/ai/ai.service.ts` | OpenAI integration |
| **RenderService** | `/apps/backend/src/modules/render/services/render.service.ts` | 3D rendering |
| **ProductEngineService** | `/apps/backend/src/modules/product-engine/services/product-engine.service.ts` | Product logic |

---

<a name="database-migrations"></a>
## 🗄️ BASE DE DONNÉES - MIGRATIONS

### Migrations Supabase

**Ordre d'exécution:**

1. **Migration initiale**
   - Fichier: `supabase-migration-init.sql`
   - Tables: profiles

2. **Tables core**
   - Fichier: `create-all-missing-tables.sql`
   - Tables: team_members, api_keys, designs, products

3. **Templates & Cliparts**
   - Fichier: `supabase-templates-cliparts-system.sql`
   - Tables: templates, cliparts

4. **Orders**
   - Fichier: `supabase-orders-system.sql`
   - Tables: orders, order_items, order_status_history

5. **AR Models**
   - Fichier: `supabase-ar-models.sql`
   - Tables: ar_models, ar_interactions, ar_sessions

6. **Integrations**
   - Fichier: `supabase-integrations-system.sql`
   - Tables: integrations, sync_logs

7. **Notifications**
   - Fichier: `supabase-notifications-system.sql`
   - Tables: notifications, notification_preferences

8. **Webhooks**
   - Fichier: `supabase-webhooks-system.sql`
   - Tables: webhook_endpoints, webhook_deliveries

9. **Design Features**
   - Fichier: `supabase-design-versioning.sql`
   - Tables: design_versions
   - Fichier: `supabase-design-collections.sql`
   - Tables: design_collections, design_collection_items
   - Fichier: `supabase-design-sharing.sql`
   - Tables: design_shares, share_analytics

10. **Security**
    - Fichier: `supabase-2fa-system.sql`
    - Tables: totp_secrets, totp_attempts
    - Fichier: `supabase-enterprise-audit-logs.sql`
    - Tables: audit_logs
    - Fichier: `supabase-rbac-granular.sql`
    - Tables: role_permissions

11. **Optimisations**
    - Fichier: `supabase-optimize-FINAL-PRODUCTION.sql`
    - Indexes et optimisations

### Seeds

| Fichier | Rôle |
|---------|------|
| `seed-templates.sql` | Seed templates (100+) |
| `seed-cliparts.sql` | Seed cliparts (200+) |
| `seed-cliparts-safe.sql` | Seed cliparts (version safe) |

---

<a name="scripts"></a>
## 🔧 SCRIPTS

### Scripts de déploiement

| Fichier | Rôle |
|---------|------|
| `/deploy-luneo.sh` | Déploiement complet |
| `/deploy-now.sh` | Déploiement rapide |
| `/deploy-phase1.sh` | Déploiement phase 1 |

### Scripts de vérification

| Fichier | Rôle |
|---------|------|
| `/check-and-configure-env-variables.sh` | Vérifier env vars |
| `/test-profile-api.sh` | Tester API profil |

### Scripts Backend

| Fichier | Rôle |
|---------|------|
| `/apps/backend/scripts/setup-production.js` | Setup production |
| `/apps/backend/scripts/generate-env.js` | Générer .env |
| `/apps/backend/scripts/setup-hetzner-env.sh` | Setup Hetzner |
| `/apps/backend/deploy-production.sh` | Deploy production |

---

<a name="documentation"></a>
## 📚 DOCUMENTATION

### Documentation Stripe (11 fichiers)

```
GUIDE_REFERENCE_STRIPE_COMPLET.md          # Guide complet
DOCUMENTATION_COMMENT_CELA_FONCTIONNE.md   # Fonctionnement
DOCUMENTATION_COMPLETE_STRIPE_PRODUCTION.md # Production
FINALISATION_STRIPE_COMPLETE.md            # Finalisation
SUCCES_PLANS_ANNUELS_100_POURCENT.md       # Plans annuels
SOLUTION_FINALE_COMPLETE.md                # Solution finale
SOLUTION_PLANS_ANNUELS.md                  # Plans annuels solution
AUDIT_PRICES_STRIPE.md                     # Audit prices
SOLUTION_PRICES_STRIPE.md                  # Solution prices
VARIABLES_STRIPE_VERCEL.md                 # Variables Vercel
CREER_PRIX_ANNUELS_STRIPE.md               # Créer prix annuels
```

### Documentation Architecture (3 fichiers)

```
AUDIT_COMPLET_ARCHITECTURE_FINALE.md       # Audit complet (créé aujourd'hui)
ARCHITECTURE_TECHNIQUE_COMPLETE.md         # Architecture technique (créé aujourd'hui)
FICHIERS_CRITIQUES_REFERENCE.md            # Fichiers critiques (ce fichier)
```

### Documentation Déploiement

```
GUIDE_VERCEL_DETAILLE.md                   # Vercel détaillé
START_HERE_PRODUCTION.md                   # Démarrage
DEPLOIEMENT_PRODUCTION_FINAL.md            # Déploiement
VERCEL_ENV_CHECKLIST.md                    # Checklist env
```

### Documentation Setup

```
CONFIGURATION_OAUTH_SUPABASE.md            # OAuth Supabase
GUIDE_SETUP_REDIS_UPSTASH.md               # Redis setup
GUIDE_SSO_ENTERPRISE.md                    # SSO enterprise
GUIDE_CUSTOM_DOMAINS.md                    # Custom domains
```

---

## 🎯 INDEX DES FICHIERS PAR FONCTION

### Paiements Stripe

**Configuration:**
1. `/apps/frontend/src/app/(public)/pricing/page.tsx` (ligne 9-112: plans)
2. `/apps/frontend/src/app/api/billing/create-checkout-session/route.ts` (ligne 24-39: Price IDs)

**Montants mensuels:** pricing/page.tsx ligne 36, 60, 84
**Montants annuels:** create-checkout-session/route.ts ligne 112-116
**Prix annuels dynamiques:** create-checkout-session/route.ts ligne 102-135

**Documentation:** GUIDE_REFERENCE_STRIPE_COMPLET.md

### Authentification

**Frontend:**
1. `/apps/frontend/src/app/(auth)/login/page.tsx`
2. `/apps/frontend/src/lib/hooks/useAuth.ts`
3. `/apps/frontend/src/lib/supabase/client.ts`

**Backend:**
1. `/apps/backend/src/modules/auth/auth.service.ts`
2. `/apps/backend/src/modules/auth/strategies/jwt.strategy.ts`
3. `/apps/backend/src/modules/auth/guards/jwt-auth.guard.ts`

**Middleware:** `/apps/frontend/middleware.ts` (ligne 24-72)

### Dashboard

**Layout:** `/apps/frontend/src/app/(dashboard)/layout.tsx`
**Sidebar:** `/apps/frontend/src/components/dashboard/Sidebar.tsx`
**Header:** `/apps/frontend/src/components/dashboard/Header.tsx`
**Stats:** `/apps/frontend/src/app/api/dashboard/stats/route.ts`
**Hook:** `/apps/frontend/src/lib/hooks/useDashboardData.ts`

### Customization (2D/3D/AR)

**2D:**
- Component: `/apps/frontend/src/components/Customizer/ProductCustomizer.tsx`
- Lib: `/apps/frontend/src/lib/canvas-editor/`
- Page: `/apps/frontend/src/app/(dashboard)/customize/[productId]/page.tsx`

**3D:**
- Component: `/apps/frontend/src/components/3d-configurator/ProductConfigurator3D.tsx`
- Lib: `/apps/frontend/src/lib/3d-configurator/`
- Page: `/apps/frontend/src/app/(dashboard)/configure-3d/[productId]/page.tsx`

**AR:**
- Components: `/apps/frontend/src/components/virtual-tryon/`
- Lib: `/apps/frontend/src/lib/virtual-tryon/`
- Page: `/apps/frontend/src/app/(dashboard)/try-on/[productId]/page.tsx`

---

## 🔍 RECHERCHE RAPIDE

### Pour modifier les prix

**Fichiers à modifier:**
1. `/apps/frontend/src/app/(public)/pricing/page.tsx` (ligne 36, 60, 84)
2. `/apps/frontend/src/app/api/billing/create-checkout-session/route.ts` (ligne 32, 112)

### Pour ajouter une page

**Dashboard:** `/apps/frontend/src/app/(dashboard)/nouvelle-page/page.tsx`
**Public:** `/apps/frontend/src/app/(public)/nouvelle-page/page.tsx`
**API:** `/apps/frontend/src/app/api/nouvelle-route/route.ts`

### Pour modifier la navigation

**Public:** `/apps/frontend/src/components/layout/UnifiedNav.tsx`
**Dashboard:** `/apps/frontend/src/components/dashboard/Sidebar.tsx`

### Pour modifier les variables env

**Frontend:** Vercel Dashboard → Settings → Environment Variables
**Backend:** Hetzner server → .env file

---

## ✅ CHECKLIST FICHIERS CRITIQUES

### Ne JAMAIS supprimer

- [ ] `/apps/frontend/src/app/layout.tsx`
- [ ] `/apps/frontend/src/app/page.tsx`
- [ ] `/apps/frontend/middleware.ts`
- [ ] `/apps/frontend/next.config.mjs`
- [ ] `/apps/frontend/vercel.json`
- [ ] `/apps/frontend/src/lib/supabase/client.ts`
- [ ] `/apps/frontend/src/lib/supabase/server.ts`
- [ ] `/apps/frontend/src/app/api/billing/create-checkout-session/route.ts`
- [ ] `/apps/backend/src/main.ts`
- [ ] `/apps/backend/src/app.module.ts`
- [ ] `/apps/backend/prisma/schema.prisma`

### Modifier avec précaution

- [ ] `/apps/frontend/src/app/(dashboard)/layout.tsx` (layout dashboard)
- [ ] `/apps/frontend/src/components/dashboard/Sidebar.tsx` (navigation)
- [ ] `/apps/frontend/src/app/api/stripe/webhook/route.ts` (webhooks Stripe)
- [ ] `/apps/backend/src/modules/billing/billing.service.ts` (billing backend)

---

*Fichiers critiques référencés le 29 Oct 2025*

