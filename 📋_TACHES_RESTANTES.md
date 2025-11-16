# 📋 Tâches Restantes - Luneo Platform

## 🔴 CRITIQUE - À faire IMMÉDIATEMENT

### 1. ⚙️ Configuration Environnement Backend
**Status:** 🔴 BLOQUANT  
**Temps estimé:** 30 min  
**Priorité:** P0

**Actions:**
```bash
cd apps/backend
cp .env.example .env

# Configurer dans .env :
DATABASE_URL="postgresql://user:password@localhost:5432/luneo_dev"
JWT_SECRET="[générer clé sécurisée]"
JWT_REFRESH_SECRET="[générer clé sécurisée]"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
OPENAI_API_KEY="sk-..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
SENDGRID_API_KEY="SG..."
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

**Vérification:**
```bash
npm run start:dev
# Doit démarrer sans erreurs
```

---

### 2. 🗄️ Base de Données - Setup Complet
**Status:** 🔴 BLOQUANT  
**Temps estimé:** 20 min  
**Priorité:** P0

**Actions:**
```bash
# 1. Créer la base de données
createdb luneo_dev

# 2. Générer Prisma Client
cd apps/backend
npx prisma generate

# 3. Exécuter les migrations
npx prisma migrate dev --name init

# 4. (Optionnel) Seed data
npx prisma db seed

# 5. Ouvrir Prisma Studio pour vérifier
npx prisma studio
# → http://localhost:5555
```

**Vérification:**
- Tables créées dans PostgreSQL
- Prisma Studio accessible
- Backend démarre sans erreur

---

### 3. ⚡ Installation Turborepo
**Status:** 🟡 IMPORTANT  
**Temps estimé:** 10 min  
**Priorité:** P1

**Actions:**
```bash
# À la racine du projet
npm install turbo@latest --save-dev
npm install @turbo/gen --save-dev

# Build le package types
cd packages/types
npm install
npm install tsup --save-dev
npm run build

# Tester Turborepo
cd ../..
npm run build
npm run dev
```

**Vérification:**
- `turbo --version` fonctionne
- `npm run build` utilise Turborepo
- Cache `.turbo/` créé

---

### 4. 🔐 Secrets & Clés API
**Status:** 🔴 CRITIQUE  
**Temps estimé:** 45 min  
**Priorité:** P0

**À générer/obtenir:**

#### Stripe (Paiements)
```bash
# 1. Créer compte Stripe
https://dashboard.stripe.com/register

# 2. Obtenir les clés (Mode Test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# 3. Configurer les webhooks
https://dashboard.stripe.com/webhooks
Endpoint: https://your-domain.com/api/webhooks/stripe
Events: checkout.session.completed, customer.subscription.*

# 4. Créer les Price IDs
- Professional Monthly: price_xxx
- Professional Yearly: price_yyy
- Business Monthly: price_zzz
- Etc.

# 5. Mettre à jour les Price IDs
→ apps/frontend/src/lib/pricing-constants.ts
```

#### OpenAI (IA)
```bash
# 1. Créer compte OpenAI
https://platform.openai.com/signup

# 2. Obtenir API Key
https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# 3. Ajouter des crédits ($20 minimum)
```

#### AWS S3 (Stockage)
```bash
# 1. Créer bucket S3
https://s3.console.aws.amazon.com/

# 2. Créer IAM User avec accès S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=luneo-uploads

# 3. Configurer CORS
```

#### SendGrid (Emails)
```bash
# 1. Créer compte SendGrid
https://signup.sendgrid.com/

# 2. Créer API Key
SENDGRID_API_KEY=SG...

# 3. Vérifier domaine (SPF, DKIM)
```

**Sécurité:**
- ✅ Ne JAMAIS commit les `.env`
- ✅ Utiliser `.env.example` comme template
- ✅ Générer des secrets forts (32+ caractères)

---

## 🟡 IMPORTANT - À faire RAPIDEMENT

### 5. 📝 Migrer Types vers @luneo/types
**Status:** 🟡 IMPORTANT  
**Temps estimé:** 2h  
**Priorité:** P1

**Fichiers à migrer:**

**Frontend:**
```
apps/frontend/src/types/
├── user.ts          → @luneo/types (User)
├── design.ts        → @luneo/types (Design)
├── product.ts       → @luneo/types (Product)
└── order.ts         → @luneo/types (Order)
```

**Mobile:**
```
apps/mobile/src/types/
└── index.ts         → @luneo/types (tout)
```

**Backend:**
```
apps/backend/src/types/
└── *.ts             → @luneo/types
```

**Actions:**
```bash
# 1. Dans chaque app, installer @luneo/types
cd apps/frontend
npm install @luneo/types@workspace:*

# 2. Remplacer les imports
# Avant:
import { User } from '@/types/user';

# Après:
import type { User } from '@luneo/types';

# 3. Supprimer les fichiers de types locaux
rm -rf src/types/
```

**Vérification:**
- Aucune erreur TypeScript
- `npm run type-check` passe
- Imports fonctionnent

---

### 6. 🤖 Remplacer console.log par Winston (Worker IA)
**Status:** 🟡 IMPORTANT  
**Temps estimé:** 1h  
**Priorité:** P2

**Problème:**
- 62 `console.log` dans Worker IA
- Pas de logging structuré

**Solution:**
```typescript
// apps/worker-ia/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Remplacer tous les console.log par:
logger.info('Message');
logger.error('Error', { error });
```

**Fichiers à modifier:**
- `apps/worker-ia/src/main.ts` (11 console.log)
- `apps/worker-ia/src/jobs/generateImage.ts` (8 console.log)
- `apps/worker-ia/ai-worker/worker.ts` (18 console.log)
- `apps/worker-ia/render-worker/worker.ts` (25 console.log)

---

### 7. 🔐 Renforcer Sécurité Widget
**Status:** 🟡 IMPORTANT  
**Temps estimé:** 1h30  
**Priorité:** P2

**Problèmes:**
- Pas de Content Security Policy
- iframe non sandboxé
- Pas de rate limiting

**Solution:**
```typescript
// apps/widget/src/lib/security.ts
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.luneo.app'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://api.luneo.app'],
  'frame-ancestors': ["'none'"],
};

// Ajouter rate limiting
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(apiKey: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(apiKey) || [];
    
    // Nettoyer les anciennes requêtes
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(apiKey, recentRequests);
    return true;
  }
}
```

**Actions:**
- Implémenter CSP dans le widget
- Ajouter sandboxing iframe
- Rate limiting API calls
- Validation API key côté serveur

---

### 8. 📱 Finaliser Mobile App
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 8h  
**Priorité:** P3

**Features manquantes:**

#### Navigation complète (2h)
```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
- ✅ Auth Stack (Login, Register)
- 🚧 Main Stack (Dashboard, AI Studio, Products, Orders)
- 🚧 Settings Stack (Profile, Subscription, Help)
```

#### Dashboard avec métriques (2h)
```typescript
// apps/mobile/src/screens/dashboard/DashboardScreen.tsx
- 🚧 Stats cards (Designs, Orders, Revenue)
- 🚧 Charts (react-native-chart-kit)
- 🚧 Recent activity
```

#### Mode hors ligne (3h)
```typescript
// apps/mobile/src/lib/offline.ts
import WatermelonDB from '@nozbe/watermelondb';

// Sync queue
- 🚧 Queue des actions offline
- 🚧 Sync automatique au retour online
- 🚧 Conflict resolution
```

#### Push notifications (1h)
```bash
# Expo Notifications
- 🚧 Config Expo Push
- 🚧 Handlers notifications
- 🚧 Backend integration
```

---

## 🟢 NICE-TO-HAVE - Améliorations Futures

### 9. 📊 Analytics & Monitoring
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 4h  
**Priorité:** P4

**À intégrer:**

#### Frontend Analytics
```bash
# Google Analytics 4
npm install @next/third-parties

# Posthog (alternative)
npm install posthog-js
```

#### Backend Monitoring
```bash
# Sentry (déjà configuré mais à tester)
# Voir: apps/backend/sentry.config.js

# Datadog APM (optionnel)
npm install dd-trace
```

#### Uptime Monitoring
```bash
# UptimeRobot (gratuit)
https://uptimerobot.com/

# Ou BetterUptime
https://betteruptime.com/
```

---

### 10. 🧪 Tests Unitaires Backend
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 6h  
**Priorité:** P4

**Couverture actuelle:** ~0%  
**Objectif:** 70%+

**À tester:**
```typescript
// apps/backend/src/auth/auth.service.spec.ts
describe('AuthService', () => {
  it('should register a new user', async () => {
    // Test registration
  });
  
  it('should login with valid credentials', async () => {
    // Test login
  });
  
  it('should reject invalid password', async () => {
    // Test validation
  });
});

// apps/backend/src/designs/designs.service.spec.ts
// apps/backend/src/products/products.service.spec.ts
// apps/backend/src/orders/orders.service.spec.ts
```

**Actions:**
```bash
cd apps/backend
npm test
npm run test:cov
```

---

### 11. 📚 Storybook (Components UI)
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 3h  
**Priorité:** P5

**Setup:**
```bash
cd apps/frontend
npx storybook@latest init

# Créer stories pour composants réutilisables
# src/components/ui/Button.stories.tsx
# src/components/ui/Input.stories.tsx
# src/components/ui/Card.stories.tsx
```

**Avantages:**
- Documentation visuelle des composants
- Tests visuels
- Développement isolé

---

### 12. 🌍 Internationalisation (i18n)
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 4h  
**Priorité:** P5

**Setup:**
```bash
cd apps/frontend
npm install next-intl

# Créer les fichiers de traduction
messages/
├── en.json
├── fr.json
├── es.json
└── de.json
```

**Actions:**
- Extraire tous les textes en variables
- Créer les fichiers de traduction
- Configurer next-intl
- Ajouter sélecteur de langue

---

### 13. 🎨 Design System Complet
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 8h  
**Priorité:** P5

**À créer:**
```bash
# Package @luneo/ui
packages/ui/
├── src/
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   ├── Modal/
│   ├── Toast/
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Avantages:**
- Composants réutilisables entre apps
- Cohérence visuelle
- Documentation avec Storybook

---

### 14. 🔄 CI/CD Avancé
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 3h  
**Priorité:** P4

**À améliorer dans `.github/workflows/ci.yml`:**

```yaml
# Ajouter:
- Lighthouse CI (performance)
- Bundle size check
- Dependency audit
- Security scan (Snyk)
- Visual regression (Percy/Chromatic)
- Auto-deploy preview (Vercel)
```

---

### 15. 📖 Documentation Utilisateur
**Status:** 🟢 NICE-TO-HAVE  
**Temps estimé:** 6h  
**Priorité:** P5

**À créer:**
```bash
# Documentation site (Docusaurus)
docs/
├── getting-started/
├── guides/
├── api-reference/
├── tutorials/
└── faq/
```

**Publier sur:**
- https://docs.luneo.app
- Ou utiliser GitBook / Notion

---

## 📊 RÉCAPITULATIF

### Par Priorité

| Priorité | Tâches | Temps Total | Status |
|----------|--------|-------------|--------|
| 🔴 P0 (Critique) | 4 tâches | ~1h45 | **À faire maintenant** |
| 🟡 P1-P2 (Important) | 4 tâches | ~6h30 | **Cette semaine** |
| 🟢 P3-P5 (Nice-to-have) | 7 tâches | ~42h | **Quand tu veux** |
| **TOTAL** | **15 tâches** | **~50h** | |

### Roadmap Suggérée

#### 🗓️ Semaine 1 (CRITIQUE)
```bash
Jour 1-2: Configuration (Backend .env, Database, Stripe)
Jour 3:   Installation Turborepo
Jour 4-5: Tests & Validation
```

#### 🗓️ Semaine 2-3 (IMPORTANT)
```bash
Semaine 2: Migration types + Winston logging
Semaine 3: Sécurité Widget + Mobile finalisation
```

#### 🗓️ Mois 1-2 (NICE-TO-HAVE)
```bash
Mois 1: Analytics, Tests, Storybook
Mois 2: i18n, Design System, Docs
```

---

## ✅ CHECKLIST - Démarrage Immédiat

Pour démarrer le projet MAINTENANT:

- [ ] 1. Configurer `.env` backend (30 min)
- [ ] 2. Setup PostgreSQL + migrations (20 min)
- [ ] 3. Obtenir clés Stripe Test (20 min)
- [ ] 4. Obtenir clé OpenAI (10 min)
- [ ] 5. Setup SendGrid basique (15 min)
- [ ] 6. Installer Turborepo (10 min)
- [ ] 7. Tester `npm run dev` (5 min)

**Total: ~2h** pour avoir un projet fonctionnel ! 🚀

---

## 🆘 BESOIN D'AIDE ?

### Priorités si temps limité:

**Si tu as 2h:**
→ Fais uniquement P0 (Configuration critique)

**Si tu as 1 jour:**
→ P0 + P1 (Config + Turborepo + Migration types)

**Si tu as 1 semaine:**
→ P0 + P1 + P2 (Tout le critique + important)

**Si tu as 1 mois:**
→ P0 → P5 (Tout ! 🎉)

---

## 📞 QUESTIONS ?

Si tu es bloqué sur une tâche, demande-moi ! Je peux:
- ✅ Générer les scripts de configuration
- ✅ Créer les fichiers manquants
- ✅ Débugger les erreurs
- ✅ Prioriser selon tes besoins

**Dis-moi par quoi tu veux commencer ! 🚀**



