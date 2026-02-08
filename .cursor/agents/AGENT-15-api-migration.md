# AGENT-15: Migration API Routes Frontend vers Backend

**Objectif**: Migrer les 20+ routes API Next.js qui font des queries Prisma directes vers des forwards au backend NestJS

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 10-15 jours  
**Dépendances**: AGENT-05 (Auth Flow)

---

## 📋 SCOPE

### Contexte

Le frontend Next.js contient encore 20+ routes `/api/*` qui importent Prisma (`@/lib/db`) et font des queries directes a la base de donnees. Cela cree un couplage fort, empeche la separation frontend/backend, et pose des problemes de securite (pas de guards NestJS, pas de rate limiting backend).

**Regle** : Toutes les queries DB doivent passer par le backend NestJS via `api.get/post('/api/v1/...')` depuis `@/lib/api/client`.

### Routes Concernees

#### Public Pages (5 routes)
- `/api/public/solutions/route.ts` - Requete Prisma directe pour les solutions
- `/api/public/industries/route.ts` - Requete Prisma directe pour les industries
- `/api/public/integrations/route.ts` - Requete Prisma directe pour les integrations
- `/api/public/marketing/route.ts` - Requete Prisma directe pour les donnees marketing
- `/api/public/case-studies/route.ts` - Requete Prisma directe pour les etudes de cas

#### Designs (4 routes)
- `/api/designs/[id]/masks/route.ts` - Queries Prisma pour les masques de design
- `/api/designs/save-custom/route.ts` - Sauvegarde directe en DB
- `/api/designs/[id]/versions/route.ts` - Historique versions via Prisma
- `/api/designs/[id]/ar/route.ts` - Configuration AR via Prisma

#### GDPR / Reports (2 routes)
- `/api/gdpr/export/route.ts` - Export donnees utilisateur via Prisma
- `/api/reports/upload/route.ts` - Upload et sauvegarde rapports

#### Bracelet / Chat (2 routes)
- `/api/bracelet/customizations/route.ts` - Customisations bracelet via Prisma
- `/api/chat/other-files-context/route.ts` - Contexte fichiers via Cloudinary direct

#### Auth / Webhooks (3 routes)
- `/api/auth/onboarding/route.ts` - Onboarding utilisateur via Prisma
- `/api/webhooks/route.ts` - Traitement webhooks avec Prisma
- `/api/liveblocks/auth/route.ts` - Auth Liveblocks avec Prisma

#### Stripe (1 route)
- `/api/stripe/webhook/route.ts` - Forward vers backend (deja partiellement fait)

### API Endpoints Backend Requis

Pour chaque route frontend, verifier si le backend NestJS a deja l'endpoint correspondant. Si non, creer le controller/service cote backend.

---

## ✅ TÂCHES

### Phase 1: Audit et Preparation (1 jour)

- [ ] Scanner toutes les routes `/api/*` qui importent `@/lib/db` ou `prisma`
- [ ] Lister les endpoints backend NestJS existants correspondants
- [ ] Identifier les endpoints backend manquants a creer

### Phase 2: Migration Routes Publiques (2-3 jours)

- [ ] Migrer `/api/public/solutions` vers `api.get('/api/v1/public/solutions')`
- [ ] Migrer `/api/public/industries` vers `api.get('/api/v1/public/industries')`
- [ ] Migrer `/api/public/integrations` vers `api.get('/api/v1/public/integrations')`
- [ ] Migrer `/api/public/marketing` vers `api.get('/api/v1/public/marketing')`
- [ ] Creer les controllers NestJS manquants dans `modules/public/`

### Phase 3: Migration Routes Designs (2-3 jours)

- [ ] Migrer `/api/designs/[id]/masks` vers `api.get('/api/v1/designs/:id/masks')`
- [ ] Migrer `/api/designs/save-custom` vers `api.post('/api/v1/designs/save-custom')`
- [ ] Migrer `/api/designs/[id]/versions` vers `api.get('/api/v1/designs/:id/versions')`
- [ ] Verifier que les endpoints backend existent dans `modules/designs/`

### Phase 4: Migration Routes GDPR/Reports/Auth (2-3 jours)

- [ ] Migrer `/api/gdpr/export` vers `api.get('/api/v1/gdpr/export')`
- [ ] Migrer `/api/reports/upload` vers `api.post('/api/v1/reports/upload')`
- [ ] Migrer `/api/bracelet/customizations` vers `api.get('/api/v1/bracelet/customizations')`
- [ ] Migrer `/api/chat/other-files-context` vers `api.post('/api/v1/chat/context')`
- [ ] Migrer `/api/auth/onboarding` vers `api.post('/api/v1/auth/onboarding')`
- [ ] Migrer `/api/webhooks` vers forward backend
- [ ] Migrer `/api/liveblocks/auth` vers `api.post('/api/v1/liveblocks/auth')`

### Phase 5: Verification (1 jour)

- [ ] `grep -r "@/lib/db" apps/frontend/src/app/api/` → 0 resultats
- [ ] `grep -r "from '@prisma" apps/frontend/src/app/api/` → 0 resultats
- [ ] Build OK : `cd apps/frontend && npm run build`
- [ ] Tester chaque route migree

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Pattern de Migration

```typescript
// ❌ AVANT (Prisma direct dans Next.js API route)
import { db } from '@/lib/db';
export async function GET() {
  const data = await db.solution.findMany();
  return NextResponse.json(data);
}

// ✅ APRÈS (Forward vers NestJS backend)
import { api } from '@/lib/api/client';
export async function GET() {
  const { data } = await api.get('/api/v1/public/solutions');
  return NextResponse.json(data);
}
```

### Structure Backend pour Routes Manquantes

```
apps/backend/src/modules/public/
├── public.module.ts
├── public.controller.ts
└── public.service.ts
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 import `@/lib/db`** dans `apps/frontend/src/app/api/`
- [ ] **0 import Prisma** dans les routes API frontend
- [ ] Toutes les 20+ routes forwardent vers le backend NestJS
- [ ] Build frontend reussit sans erreur
- [ ] Toutes les pages publiques affichent les donnees correctement

---

## 🔗 RESSOURCES

- API Client : `apps/frontend/src/lib/api/client.ts`
- Backend Modules : `apps/backend/src/modules/`
- Routes API Frontend : `apps/frontend/src/app/api/`

---

## 📝 NOTES

- Certaines routes peuvent etre supprimees si le frontend appelle deja le backend directement
- Verifier que le backend a les guards `@Public()` sur les endpoints publics
- Les routes webhooks doivent conserver le raw body pour la verification de signature
