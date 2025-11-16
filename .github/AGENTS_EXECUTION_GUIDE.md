# 🚀 Guide d'Exécution des Agents Cursor

## 📋 Syntaxe Cursor Agent

La syntaxe correcte pour Cursor Agent est :

```bash
# Lancer un agent avec un prompt depuis un fichier
cursor agent --print < prompt_file.txt

# Ou en mode interactif (recommandé)
cursor agent < prompt_file.txt

# Ou directement avec le contenu du prompt
cursor agent "Votre prompt ici..."
```

## 🎯 Méthode Recommandée

Pour chaque agent, utilisez cette méthode :

### Option 1 : Mode interactif (recommandé)

```bash
cd /Users/emmanuelabougadous/luneo-platform

# Lire le prompt et le passer à Cursor Agent
cat cursor_prompts/AGENT_INFRA.txt | cursor agent
```

### Option 2 : Mode print (pour scripts)

```bash
cat cursor_prompts/AGENT_INFRA.txt | cursor agent --print
```

---

## 📝 To-Dos Étape par Étape

### ✅ Phase 1 : AGENT_INFRA (EN COURS)

**Commandes**:
```bash
cd /Users/emmanuelabougadous/luneo-platform
cat cursor_prompts/AGENT_INFRA.txt | cursor agent
```

**To-Dos**:
- [ ] Scanner `infrastructure/terraform/` et proposer modules manquants
- [ ] Générer modules Terraform (S3, CloudFront, RDS, Redis, ECR, KMS)
- [ ] Créer fichier variables template
- [ ] Créer `docs/infrastructure/README.md`
- [ ] Fournir IAM policies minimales
- [ ] Ajouter CI plan pour staging (approbation manuelle pour prod)

**Validation après PR**:
- [ ] Build local successful
- [ ] Terraform validate OK
- [ ] IAM policies reviewed
- [ ] Documentation complète
- [ ] Merge to staging → Deploy → Smoke tests → Merge to main

---

### ⏳ Phase 2 : AGENT_SHOPIFY (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_SHOPIFY.txt | cursor agent
```

**To-Dos**:
- [ ] Créer migration Prisma pour `ShopifyInstall` table
- [ ] Implémenter module NestJS `apps/backend/src/modules/ecommerce/shopify`
- [ ] Créer controllers (install, callback, webhooks)
- [ ] Ajouter service `ShopifyService` avec HMAC verification
- [ ] Créer snippet Liquid `apps/shopify/snippets/widget-inject.liquid`
- [ ] Ajouter tests unitaires et intégration
- [ ] Créer `docs/apps/shopify/README.md`

---

### ⏳ Phase 3 : AGENT_WIDGET (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_WIDGET.txt | cursor agent
```

**To-Dos**:
- [ ] Créer package `apps/widget/` avec build UMD + ESM
- [ ] Implémenter SDK API `LuneoWidget.init()`
- [ ] Créer endpoint `/api/embed/token`
- [ ] Implémenter iframe handshake avec postMessage
- [ ] Ajouter CSP headers
- [ ] Créer test Playwright e2e

---

### ⏳ Phase 4 : AGENT_SECURITY (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_SECURITY.txt | cursor agent
```

**To-Dos**:
- [ ] Ajouter rate-limiter middleware (Redis-backed)
- [ ] Implémenter JWT rotation plan
- [ ] Créer utility HMAC verify avec replay protection
- [ ] Ajouter exemple KMS encryption
- [ ] Intégrer OWASP ZAP baseline dans CI
- [ ] Ajouter pre-commit hook pour scan secrets

---

### ⏳ Phase 5 : AGENT_3D (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_3D.txt | cursor agent
```

**To-Dos**:
- [ ] Créer composant `SelectionTool.tsx` avec react-three-fiber
- [ ] Implémenter raycast picking + paint brush
- [ ] Créer endpoint `POST /api/designs/:id/masks`
- [ ] Ajouter utility reprojection UV server-side
- [ ] Créer test Playwright e2e

---

### ⏳ Phase 6 : AGENT_AI (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_AI.txt | cursor agent
```

**To-Dos**:
- [ ] Implémenter job `design-render` dans `apps/worker-ia/src/jobs/render-job.ts`
- [ ] Ajouter sanitization prompt avec `@luneo/ai-safety`
- [ ] Intégrer OpenAI Image Edit
- [ ] Créer preview (512) et high-res (2048)
- [ ] Ajouter token & cost accounting
- [ ] Implémenter retries, circuit breaker, concurrency limit

---

### ⏳ Phase 7 : AGENT_CI (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_CI.txt | cursor agent
```

**To-Dos**:
- [ ] Vérifier/ajouter `.github/workflows/ci.yml` avec tous les steps
- [ ] Ajouter recommandations branch protection
- [ ] Ajouter test scripts par package
- [ ] Créer pre-commit hook template (husky)

---

### ⏳ Phase 8 : AGENT_MONITORING (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_MONITORING.txt | cursor agent
```

**To-Dos**:
- [ ] Ajouter instrumentation Prometheus (worker queue, OpenAI, renders, etc.)
- [ ] Créer dashboard Grafana JSON sous `monitoring/grafana/`
- [ ] Vérifier intégration Sentry (backend + worker + frontend)
- [ ] Ajouter alertes (queue_time>60s, error_rate>1%, cost_spike)

---

### ⏳ Phase 9 : AGENT_AR (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_AR.txt | cursor agent
```

**To-Dos**:
- [ ] Créer service converter `tools/usdz-converter`
- [ ] Implémenter conversion GLB → USDZ
- [ ] Créer endpoint `GET /api/designs/:id/ar`
- [ ] Ajouter AR viewer frontend (QuickLook + WebXR)
- [ ] Implémenter caching USDZ par texture hash

---

### ⏳ Phase 10 : AGENT_BILLING (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_BILLING.txt | cursor agent
```

**To-Dos**:
- [ ] Implémenter usage billing dans `@luneo/billing-plans`
- [ ] Vérifier Stripe webhook handler idempotent
- [ ] Créer endpoint query usage per tenant
- [ ] Ajouter soft-limit enforcement
- [ ] Créer admin UI stubs pour cost view

---

### ⏳ Phase 11 : AGENT_COMPLIANCE (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_COMPLIANCE.txt | cursor agent
```

**To-Dos**:
- [ ] Créer endpoint `POST /api/data/export?userId=`
- [ ] Créer endpoint `DELETE /api/data/erase?userId=`
- [ ] Implémenter log scrubbing utility (PII)
- [ ] Documenter retention policies dans `docs/compliance.md`
- [ ] Créer test e2e export/delete

---

### ⏳ Phase 12 : AGENT_REFACTOR (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_REFACTOR.txt | cursor agent
```

**To-Dos**:
- [ ] Scanner repo (unused imports, `any` types, large bundles, duplicates)
- [ ] Proposer refactors sécurisés
- [ ] Créer PRs limitées (< 200 LOC)
- [ ] Ajouter métriques tech debt dans PR

---

### ⏳ Phase 13 : AGENT_DOCS (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_DOCS.txt | cursor agent
```

**To-Dos**:
- [ ] Générer/mettre à jour README.md pour chaque module
- [ ] Créer `ARCHITECTURE.md` avec diagrammes (mermaid)
- [ ] Générer runbooks (deploy worker, convert AR, rollback DB)
- [ ] Ajouter quickstart dev (`make setup`, `make dev`, `make build`)

---

### ⏳ Phase 14 : AGENT_UX (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_UX.txt | cursor agent
```

**To-Dos**:
- [ ] Réviser widget UX flow (load, selection, prompt, preview, AR)
- [ ] Proposer améliorations microcopy
- [ ] Créer onboarding overlay pour store owners
- [ ] Créer plan A/B test (preview→AR→checkout)

---

### ⏳ Phase 15 : AGENT_SCALING (EN ATTENTE)

**Commandes**:
```bash
cat cursor_prompts/AGENT_SCALING.txt | cursor agent
```

**To-Dos**:
- [ ] Créer scripts load test (k6/Artillery) pour embed + worker
- [ ] Définir autoscaling policy (worker concurrency, HPA EKS)
- [ ] Simuler 10k users concurrents (read-only)
- [ ] Simuler 500 renders concurrents
- [ ] Fournir cost estimate sheet

---

## ✅ Checklist Générale par Agent

Avant d'approuver chaque PR :

- [ ] Build local successful
- [ ] Lint & Typecheck OK
- [ ] Unit tests OK
- [ ] E2E smoke tests OK
- [ ] Security checklist OK (HMAC, JWT expiry, no secrets)
- [ ] Migration DB reviewed & tested on staging
- [ ] Performance impact acceptable
- [ ] README ajouté et variables d'env documentées
- [ ] PR includes author, reviewer, changelog entry

---

**Dernière mise à jour**: 16 novembre 2025

