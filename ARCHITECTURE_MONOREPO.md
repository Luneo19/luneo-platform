# 🏗️ Architecture Monorepo - Luneo Platform

## 📊 Vue d'Ensemble

Le projet Luneo est un **monorepo complet** avec **7 applications** interconnectées :

```
luneo-platform/
├── apps/
│   ├── frontend/          ✅ Next.js 14 (SSR/SSG)
│   ├── backend/           ✅ NestJS + Prisma + PostgreSQL
│   ├── mobile/            ✅ React Native + Expo
│   ├── ar-viewer/         ✅ WebAR + Model Viewer
│   ├── worker-ia/         ✅ BullMQ + OpenAI + Sharp
│   ├── widget/            ✅ React SDK embeddable
│   └── shopify/           ✅ Shopify App (NestJS)
├── packages/ (prévu)
│   └── @luneo/types/      🚧 Types partagés
└── docs/                  ✅ Documentation complète
```

---

## 🎯 Applications du Monorepo

### 1. 🌐 **Frontend** - Next.js App
**Path:** `apps/frontend/`  
**Port:** 3000  
**Tech Stack:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5+
- Tailwind CSS
- Zustand (state)
- Framer Motion
- Axios + Interceptors

**Fonctionnalités:**
- ✅ Landing pages (public)
- ✅ Dashboard (auth protected)
- ✅ AI Studio (image génération)
- ✅ 3D Configurator
- ✅ Virtual Try-On
- ✅ Authentication (JWT)
- ✅ Pricing & Billing (Stripe)
- ✅ Legal & GDPR pages

**Démarrage:**
```bash
cd apps/frontend
npm install
npm run dev
# → http://localhost:3000
```

---

### 2. ⚙️ **Backend** - NestJS API
**Path:** `apps/backend/`  
**Port:** 3001  
**Tech Stack:**
- NestJS 10+
- Prisma ORM
- PostgreSQL
- JWT + bcrypt
- Stripe SDK
- BullMQ (queues)
- S3 (storage)
- Mailgun/SendGrid

**Fonctionnalités:**
- ✅ REST API complète
- ✅ Authentication (JWT + Refresh tokens)
- ✅ User management
- ✅ Design & Product CRUD
- ✅ Billing & Subscriptions (Stripe)
- ✅ Email service (templates)
- ✅ File upload (S3)
- ✅ Background jobs (BullMQ)

**Démarrage:**
```bash
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
# → http://localhost:3001
```

**API Documentation:** `http://localhost:3001/api`

---

### 3. 📱 **Mobile** - React Native + Expo
**Path:** `apps/mobile/`  
**Tech Stack:**
- React Native 0.74+
- Expo SDK 51
- TypeScript
- Zustand
- React Query
- React Navigation
- NativeBase

**Fonctionnalités:**
- ✅ Authentification JWT + Biométrie
- ✅ Dashboard mobile
- 🚧 AI Studio mobile
- 🚧 Gestion produits
- 🚧 Mode hors ligne
- 🚧 Push notifications

**Démarrage:**
```bash
cd apps/mobile
npm install
npm start          # Expo Dev
npm run ios        # iOS
npm run android    # Android
```

**Build Production:**
```bash
eas build --platform all
eas submit --platform all
```

---

### 4. 🥽 **AR Viewer** - WebAR Module
**Path:** `apps/ar-viewer/`  
**Tech Stack:**
- React 18
- @google/model-viewer
- Three.js
- @react-three/fiber
- @react-three/drei
- Framer Motion

**Fonctionnalités:**
- ✅ Visualisation 3D (GLB/GLTF)
- ✅ AR Mode (iOS Quick Look, Android Scene Viewer)
- ✅ Camera controls
- ✅ Auto-rotate
- ✅ Fullscreen
- ✅ Error handling

**Usage:**
```tsx
import { ModelViewer } from '@luneo/ar-viewer';

<ModelViewer
  modelUrl="/models/shoe.glb"
  posterUrl="/images/poster.jpg"
  arMode={true}
  autoRotate={true}
/>
```

**Build:**
```bash
cd apps/ar-viewer
npm run build
# → dist/ (UMD + ESM)
```

---

### 5. 🤖 **Worker IA** - Background Jobs
**Path:** `apps/worker-ia/`  
**Tech Stack:**
- Node.js + TypeScript
- BullMQ (queue)
- OpenAI SDK (DALL-E, GPT)
- Sharp (image processing)
- Redis
- Winston (logging)

**Workers:**
1. **ImageGenerationWorker** - Génération d'images IA (DALL-E)
2. **UpscaleWorker** - Upscaling d'images
3. **BlendTextureWorker** - Fusion textures 3D
4. **ExportGLTFWorker** - Export 3D (GLB/GLTF)
5. **ARPreviewWorker** - Génération AR previews

**Démarrage:**
```bash
cd apps/worker-ia
npm install
npm run dev
# Require: Redis running
```

**Production:**
```bash
npm run build
npm start
```

---

### 6. 🔌 **Widget** - Embeddable SDK
**Path:** `apps/widget/`  
**Tech Stack:**
- React 18
- Vite (build)
- TypeScript
- Minimal CSS

**Fonctionnalités:**
- ✅ Widget embeddable (<script>)
- ✅ API client
- ✅ Preview canvas
- ✅ Prompt input
- ✅ Customizable styles

**Installation:**
```html
<script src="https://cdn.luneo.app/widget.js"></script>
<script>
  LuneoWidget.init({
    apiKey: 'YOUR_API_KEY',
    container: '#luneo-widget',
    theme: 'light'
  });
</script>
```

**Build:**
```bash
cd apps/widget
npm run build
# → dist/widget.js (UMD)
```

---

### 7. 🛍️ **Shopify App** - Shopify Integration
**Path:** `apps/shopify/`  
**Tech Stack:**
- NestJS (backend)
- React (frontend)
- Shopify API
- Shopify App Bridge
- GraphQL

**Fonctionnalités:**
- ✅ OAuth Shopify
- ✅ Billing (Shopify subscriptions)
- ✅ Webhooks (orders, products, etc.)
- ✅ Product sync
- 🚧 Design integration
- 🚧 AI features

**Démarrage:**
```bash
cd apps/shopify
npm install
npm run dev
# → http://localhost:8080
```

---

## 🔗 Communication Inter-Apps

### Frontend → Backend
```
HTTP REST API (Axios)
- JWT Auth (Bearer token)
- Refresh token interceptor
- Auto-retry on 401
```

### Mobile → Backend
```
HTTP REST API (Axios)
- JWT Auth (SecureStore)
- Offline sync (WatermelonDB)
- Biometric auth
```

### Backend → Worker IA
```
BullMQ (Redis Queue)
- Job creation
- Progress tracking
- Result callback
```

### Frontend/Mobile → AR Viewer
```
Direct import (@luneo/ar-viewer)
- Props-based config
- Event callbacks
```

### External Sites → Widget
```
<script> embed
- API Key auth
- iframe isolation
- PostMessage communication
```

### Shopify App → Backend
```
Webhook callbacks
- HMAC verification
- Event processing
- Data sync
```

---

## 📦 Packages Partagés (Prévu)

### `@luneo/types` (🚧 À créer)
Types TypeScript partagés entre toutes les apps :
```typescript
// Shared types
export interface User { ... }
export interface Design { ... }
export interface Product { ... }
// etc.
```

### `@luneo/utils` (🚧 À créer)
Utilitaires partagés :
```typescript
// Validation, formatting, etc.
export function formatPrice(amount: number): string;
export function validateEmail(email: string): boolean;
```

### `@luneo/ui` (🚧 À créer)
Composants UI partagés (React) :
```tsx
export { Button } from './Button';
export { Input } from './Input';
```

---

## 🛠️ Build Pipeline

### Actuel (npm workspaces)
```bash
# Root level
npm install           # Install all deps
npm run dev           # Dev all apps
npm run build         # Build all apps
npm test              # Test all apps
```

### Recommandé: Turborepo (🚧 À migrer)
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

**Avantages Turborepo:**
- ✅ Cache intelligent (build + test)
- ✅ Parallel execution
- ✅ Dependency graph
- ✅ Remote caching (Vercel)
- ✅ Build optimisé (3-10x faster)

---

## 🚀 Démarrage Complet

### 1. Installation
```bash
git clone https://github.com/luneo/platform.git
cd luneo-platform
npm install
```

### 2. Configuration
```bash
# PostgreSQL
createdb luneo_dev

# Redis
brew install redis
redis-server

# Backend
cd apps/backend
cp .env.example .env
npx prisma migrate dev

# Frontend
cd apps/frontend
cp .env.example .env

# Mobile
cd apps/mobile
cp .env.example .env
```

### 3. Démarrage services
```bash
# Terminal 1: Backend
cd apps/backend && npm run start:dev

# Terminal 2: Frontend
cd apps/frontend && npm run dev

# Terminal 3: Worker IA
cd apps/worker-ia && npm run dev

# Terminal 4: Mobile (optionnel)
cd apps/mobile && npm start
```

### 4. Accès
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Mobile: Expo Go (scan QR)
- API Docs: http://localhost:3001/api

---

## 📊 Statistiques Projet

| Métrique | Valeur |
|----------|--------|
| **Apps** | 7 |
| **Fichiers** | 600+ |
| **Lignes de code** | 150,000+ |
| **Dépendances** | 200+ |
| **Tests E2E** | 14 |
| **Documentation** | 20 fichiers |
| **Langages** | TypeScript 95%+ |

---

## 🔐 Sécurité

### Backend
- ✅ JWT authentication
- ✅ bcrypt (rounds: 12)
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Helmet (security headers)
- ✅ Input validation (Zod)

### Frontend
- ✅ XSS prevention (escaping)
- ✅ CSRF protection
- ✅ Secure cookies (httpOnly)
- ✅ Environment variables
- ✅ Content Security Policy

### Mobile
- ✅ SecureStore (Keychain/Keystore)
- ✅ Biometric auth
- ✅ Certificate pinning
- ✅ Code obfuscation

---

## 🧪 Testing

### E2E (Playwright)
```bash
cd apps/frontend
npm run test:e2e
```

### Unit (Jest)
```bash
npm test
```

### API (Postman)
```bash
cd apps/backend
# Import postman_collection.json
```

---

## 📈 Performance

| App | Bundle Size | Initial Load | Score |
|-----|-------------|--------------|-------|
| Frontend | 300 KB | < 2s | 95/100 |
| Mobile | 12 MB | < 3s | 90/100 |
| Widget | 50 KB | < 1s | 98/100 |
| AR Viewer | 80 KB | < 1.5s | 92/100 |

**Optimisations:**
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization (Next/Image)
- ✅ Bundle analysis
- ✅ Tree shaking
- ✅ Compression (gzip/brotli)

---

## 🚢 Déploiement

### Frontend
```bash
# Vercel (recommandé)
vercel --prod

# Netlify
netlify deploy --prod

# Docker
docker build -t luneo-frontend .
docker run -p 3000:3000 luneo-frontend
```

### Backend
```bash
# Hetzner/VPS
make deploy-production

# Docker Compose
docker-compose -f docker-compose.production.yml up -d

# Railway/Render
git push railway main
```

### Mobile
```bash
# EAS Build (Expo)
eas build --platform all
eas submit --platform all
```

### Widget
```bash
# CDN (Cloudflare, AWS S3)
npm run build
aws s3 sync dist/ s3://cdn.luneo.app/
```

---

## 🐛 Debugging

### Frontend
```bash
npm run dev        # Dev mode avec HMR
npm run lint       # ESLint
npm run type-check # TypeScript
```

### Backend
```bash
npm run start:dev  # Watch mode
npm run test:e2e   # E2E tests
```

### Mobile
```bash
npx react-native log-android  # Android logs
npx react-native log-ios      # iOS logs
```

---

## 📚 Documentation

- [Quick Start](./README.md)
- [Guide Déploiement](./GUIDE_DEPLOIEMENT_PRODUCTION.md)
- [API Documentation](./API_ROUTES_TEST_PLAN.md)
- [Stripe Integration](./STRIPE_INTEGRATION_CHECKLIST.md)
- [Audit Complet](./🏆_RAPPORT_COMPLET_FINAL.md)
- [Index Documentation](./📚_INDEX_DOCUMENTATION.md)

---

## 🤝 Contribution

```bash
# 1. Fork & Clone
git clone https://github.com/your-username/luneo-platform.git

# 2. Create branch
git checkout -b feature/my-feature

# 3. Make changes
npm run lint
npm test

# 4. Commit
git commit -m "feat: add amazing feature"

# 5. Push
git push origin feature/my-feature

# 6. Create Pull Request
```

---

## 📞 Support

- 📧 Email: support@luneo.app
- 💬 Discord: https://discord.gg/luneo
- 📖 Docs: https://docs.luneo.app
- 🐛 Issues: https://github.com/luneo/platform/issues

---

## 📝 License

MIT License - Luneo Platform © 2025

---

**✨ Built with love by the Luneo Team 🚀**



