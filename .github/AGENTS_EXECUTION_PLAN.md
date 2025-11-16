# 🚀 Plan d'Exécution des Agents Cursor

**Date de démarrage**: 16 novembre 2025  
**Status**: 🟢 PRÊT À DÉMARRER

---

## 📋 Ordre d'Exécution (STRICT)

### Phase 1 : Infrastructure (AGENT_INFRA)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Scanner `infrastructure/terraform/` et proposer modules manquants
- [ ] Générer modules Terraform (S3, CloudFront, RDS, Redis, ECR, KMS)
- [ ] Créer fichier variables template
- [ ] Créer `docs/infrastructure/README.md`
- [ ] Fournir IAM policies minimales
- [ ] Ajouter CI plan pour staging (approbation manuelle pour prod)

**Commandes**:
```bash
cursor agent init --name "AGENT_INFRA" --prompt-file ./cursor_prompts/AGENT_INFRA.txt
cursor agent run AGENT_INFRA --non-interactive=false
```

**Validation**:
- [ ] Build local successful
- [ ] Terraform validate OK
- [ ] IAM policies reviewed
- [ ] Documentation complète

---

### Phase 2 : Shopify Integration (AGENT_SHOPIFY)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Créer migration Prisma pour `ShopifyInstall` table
- [ ] Implémenter module NestJS `apps/backend/src/modules/ecommerce/shopify`
- [ ] Créer controllers (install, callback, webhooks)
- [ ] Ajouter service `ShopifyService` avec HMAC verification
- [ ] Créer snippet Liquid `apps/shopify/snippets/widget-inject.liquid`
- [ ] Ajouter tests unitaires et intégration
- [ ] Créer `docs/apps/shopify/README.md`

**Commandes**:
```bash
cursor agent init --name "AGENT_SHOPIFY" --prompt-file ./cursor_prompts/AGENT_SHOPIFY.txt
cursor agent run AGENT_SHOPIFY --non-interactive=false
```

**Validation**:
- [ ] Migration testée sur staging DB
- [ ] HMAC verification fonctionne
- [ ] Tests passent
- [ ] Webhook replay protection OK

---

### Phase 3 : Widget SDK (AGENT_WIDGET)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Créer package `apps/widget/` avec build UMD + ESM
- [ ] Implémenter SDK API `LuneoWidget.init()`
- [ ] Créer endpoint `/api/embed/token`
- [ ] Implémenter iframe handshake avec postMessage
- [ ] Ajouter CSP headers
- [ ] Créer test Playwright e2e

**Commandes**:
```bash
cursor agent init --name "AGENT_WIDGET" --prompt-file ./cursor_prompts/AGENT_WIDGET.txt
cursor agent run AGENT_WIDGET --non-interactive=false
```

**Validation**:
- [ ] SDK build OK
- [ ] Token endpoint fonctionne
- [ ] Handshake sécurisé (nonce unique)
- [ ] Test e2e passe

---

### Phase 4 : Security (AGENT_SECURITY)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Ajouter rate-limiter middleware (Redis-backed)
- [ ] Implémenter JWT rotation plan
- [ ] Créer utility HMAC verify avec replay protection
- [ ] Ajouter exemple KMS encryption
- [ ] Intégrer OWASP ZAP baseline dans CI
- [ ] Ajouter pre-commit hook pour scan secrets

**Commandes**:
```bash
cursor agent init --name "AGENT_SECURITY" --prompt-file ./cursor_prompts/AGENT_SECURITY.txt
cursor agent run AGENT_SECURITY --non-interactive=false
```

**Validation**:
- [ ] Rate limiting fonctionne
- [ ] JWT rotation OK
- [ ] ZAP baseline passe
- [ ] Pre-commit hook actif

---

### Phase 5 : 3D Selection (AGENT_3D)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Créer composant `SelectionTool.tsx` avec react-three-fiber
- [ ] Implémenter raycast picking + paint brush
- [ ] Créer endpoint `POST /api/designs/:id/masks`
- [ ] Ajouter utility reprojection UV server-side
- [ ] Créer test Playwright e2e

**Commandes**:
```bash
cursor agent init --name "AGENT_3D" --prompt-file ./cursor_prompts/AGENT_3D.txt
cursor agent run AGENT_3D --non-interactive=false
```

**Validation**:
- [ ] Selection tool fonctionne
- [ ] Mask upload OK
- [ ] Reprojection UV correcte
- [ ] Test e2e passe

---

### Phase 6 : AI Worker (AGENT_AI)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Implémenter job `design-render` dans `apps/worker-ia/src/jobs/render-job.ts`
- [ ] Ajouter sanitization prompt avec `@luneo/ai-safety`
- [ ] Intégrer OpenAI Image Edit
- [ ] Créer preview (512) et high-res (2048)
- [ ] Ajouter token & cost accounting
- [ ] Implémenter retries, circuit breaker, concurrency limit

**Commandes**:
```bash
cursor agent init --name "AGENT_AI" --prompt-file ./cursor_prompts/AGENT_AI.txt
cursor agent run AGENT_AI --non-interactive=false
```

**Validation**:
- [ ] Worker job fonctionne
- [ ] Cost accounting OK
- [ ] Circuit breaker actif
- [ ] Tests mock OpenAI passent

---

### Phase 7 : CI/CD (AGENT_CI)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Vérifier/ajouter `.github/workflows/ci.yml` avec tous les steps
- [ ] Ajouter recommandations branch protection
- [ ] Ajouter test scripts par package
- [ ] Créer pre-commit hook template (husky)

**Commandes**:
```bash
cursor agent init --name "AGENT_CI" --prompt-file ./cursor_prompts/AGENT_CI.txt
cursor agent run AGENT_CI --non-interactive=false
```

**Validation**:
- [ ] CI passe complètement
- [ ] Pre-commit hook fonctionne
- [ ] Tests rapides vs complets séparés

---

### Phase 8 : Monitoring (AGENT_MONITORING)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Ajouter instrumentation Prometheus (worker queue, OpenAI, renders, etc.)
- [ ] Créer dashboard Grafana JSON sous `monitoring/grafana/`
- [ ] Vérifier intégration Sentry (backend + worker + frontend)
- [ ] Ajouter alertes (queue_time>60s, error_rate>1%, cost_spike)

**Commandes**:
```bash
cursor agent init --name "AGENT_MONITORING" --prompt-file ./cursor_prompts/AGENT_MONITORING.txt
cursor agent run AGENT_MONITORING --non-interactive=false
```

**Validation**:
- [ ] Métriques Prometheus visibles
- [ ] Dashboard Grafana fonctionne
- [ ] Sentry capture erreurs
- [ ] Alertes configurées

---

### Phase 9 : AR Conversion (AGENT_AR)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Créer service converter `tools/usdz-converter`
- [ ] Implémenter conversion GLB → USDZ
- [ ] Créer endpoint `GET /api/designs/:id/ar`
- [ ] Ajouter AR viewer frontend (QuickLook + WebXR)
- [ ] Implémenter caching USDZ par texture hash

**Commandes**:
```bash
cursor agent init --name "AGENT_AR" --prompt-file ./cursor_prompts/AGENT_AR.txt
cursor agent run AGENT_AR --non-interactive=false
```

**Validation**:
- [ ] Conversion USDZ fonctionne
- [ ] AR viewer iOS OK
- [ ] WebXR Android OK
- [ ] Caching efficace

---

### Phase 10 : Billing (AGENT_BILLING)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Implémenter usage billing dans `@luneo/billing-plans`
- [ ] Vérifier Stripe webhook handler idempotent
- [ ] Créer endpoint query usage per tenant
- [ ] Ajouter soft-limit enforcement
- [ ] Créer admin UI stubs pour cost view

**Commandes**:
```bash
cursor agent init --name "AGENT_BILLING" --prompt-file ./cursor_prompts/AGENT_BILLING.txt
cursor agent run AGENT_BILLING --non-interactive=false
```

**Validation**:
- [ ] Usage billing fonctionne
- [ ] Stripe webhooks idempotents
- [ ] Soft limits appliqués
- [ ] Audit logs complets

---

### Phase 11 : Compliance (AGENT_COMPLIANCE)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Créer endpoint `POST /api/data/export?userId=`
- [ ] Créer endpoint `DELETE /api/data/erase?userId=`
- [ ] Implémenter log scrubbing utility (PII)
- [ ] Documenter retention policies dans `docs/compliance.md`
- [ ] Créer test e2e export/delete

**Commandes**:
```bash
cursor agent init --name "AGENT_COMPLIANCE" --prompt-file ./cursor_prompts/AGENT_COMPLIANCE.txt
cursor agent run AGENT_COMPLIANCE --non-interactive=false
```

**Validation**:
- [ ] Export fonctionne
- [ ] Delete fonctionne
- [ ] Logs sans PII
- [ ] Documentation complète

---

### Phase 12 : Refactoring (AGENT_REFACTOR)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Scanner repo (unused imports, `any` types, large bundles, duplicates)
- [ ] Proposer refactors sécurisés
- [ ] Créer PRs limitées (< 200 LOC)
- [ ] Ajouter métriques tech debt dans PR

**Commandes**:
```bash
cursor agent init --name "AGENT_REFACTOR" --prompt-file ./cursor_prompts/AGENT_REFACTOR.txt
cursor agent run AGENT_REFACTOR --non-interactive=false
```

**Validation**:
- [ ] Refactors couverts par tests
- [ ] Pas de breaking changes
- [ ] Métriques améliorées

---

### Phase 13 : Documentation (AGENT_DOCS)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Générer/mettre à jour README.md pour chaque module
- [ ] Créer `ARCHITECTURE.md` avec diagrammes (mermaid)
- [ ] Générer runbooks (deploy worker, convert AR, rollback DB)
- [ ] Ajouter quickstart dev (`make setup`, `make dev`, `make build`)

**Commandes**:
```bash
cursor agent init --name "AGENT_DOCS" --prompt-file ./cursor_prompts/AGENT_DOCS.txt
cursor agent run AGENT_DOCS --non-interactive=false
```

**Validation**:
- [ ] READMEs complets
- [ ] Architecture documentée
- [ ] Runbooks fonctionnels
- [ ] Quickstart testé

---

### Phase 14 : UX Polish (AGENT_UX)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Réviser widget UX flow (load, selection, prompt, preview, AR)
- [ ] Proposer améliorations microcopy
- [ ] Créer onboarding overlay pour store owners
- [ ] Créer plan A/B test (preview→AR→checkout)

**Commandes**:
```bash
cursor agent init --name "AGENT_UX" --prompt-file ./cursor_prompts/AGENT_UX.txt
cursor agent run AGENT_UX --non-interactive=false
```

**Validation**:
- [ ] UX flow amélioré
- [ ] Copy optimisée
- [ ] Onboarding clair
- [ ] Plan A/B test défini

---

### Phase 15 : Scaling (AGENT_SCALING)
**Status**: ⏳ EN ATTENTE

**To-Dos**:
- [ ] Créer scripts load test (k6/Artillery) pour embed + worker
- [ ] Définir autoscaling policy (worker concurrency, HPA EKS)
- [ ] Simuler 10k users concurrents (read-only)
- [ ] Simuler 500 renders concurrents
- [ ] Fournir cost estimate sheet

**Commandes**:
```bash
cursor agent init --name "AGENT_SCALING" --prompt-file ./cursor_prompts/AGENT_SCALING.txt
cursor agent run AGENT_SCALING --non-interactive=false
```

**Validation**:
- [ ] Load tests fonctionnent
- [ ] Autoscaling configuré
- [ ] Performance acceptable
- [ ] Cost estimate réaliste

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

## 🔄 Processus par Agent

1. **Review diff** line-by-line
2. **Run tests** locally
3. **If migrations**: run in staging DB first
4. **Approve PR** only if checklist satisfied
5. **Merge to staging** branch (NOT main)
6. **Deploy to staging**
7. **Smoke tests** on staging
8. **If OK** → merge to main
9. **Deploy to prod** with canary rollout
10. **Post-deploy monitoring** (30-60 min)

---

**Dernière mise à jour**: 16 novembre 2025  
**Prochaine étape**: Démarrer AGENT_INFRA

