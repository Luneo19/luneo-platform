# Cursor Agents - Prompts Directory

Ce dossier contient les 15 prompts pour les agents Cursor qui seront exécutés dans un ordre strict.

## 📋 Ordre d'exécution (STRICT)

1. **AGENT_INFRA** - Terraform & infra blueprint (S3, CloudFront, RDS, Redis, ECR)
2. **AGENT_SHOPIFY** - Shopify onboarding, OAuth, webhooks, Prisma migration
3. **AGENT_WIDGET** - Embed SDK + iframe handshake + token endpoint
4. **AGENT_SECURITY** - Global security guardrails
5. **AGENT_3D** - Selection tool (raycast) & UV mask generation
6. **AGENT_AI** - Worker IA pipeline (inpainting & renders)
7. **AGENT_CI** - GitHub Actions & quality gates
8. **AGENT_MONITORING** - Prometheus, Grafana, Sentry integration
9. **AGENT_AR** - GLTF->USDZ conversion & WebXR
10. **AGENT_BILLING** - Stripe & usage billing
11. **AGENT_COMPLIANCE** - GDPR & data controls
12. **AGENT_REFACTOR** - Cleanup & tech debt
13. **AGENT_DOCS** - Architecture docs & READMEs
14. **AGENT_UX** - Product & onboarding polish
15. **AGENT_SCALING** - Load tests & autoscaling

## 🚀 Utilisation

Pour chaque agent :

```bash
# 1. Initialiser l'agent
cursor agent init --name "AGENT_NAME" --prompt-file ./cursor_prompts/AGENT_NAME.txt

# 2. Lancer l'agent en mode interactif
cursor agent run AGENT_NAME --non-interactive=false
```

## ⚠️ Important

- **NE PAS** exécuter les agents avant que la production soit finalisée
- Suivre **strictement** l'ordre d'exécution
- Réviser **toujours** les diffs proposées avant approbation
- Valider chaque étape avant de passer à la suivante

## 📝 Checklist avant approbation PR

- [ ] Build local successful
- [ ] Lint & Typecheck OK
- [ ] Unit tests OK
- [ ] E2E smoke tests OK
- [ ] Security checklist OK (HMAC, JWT expiry, no secrets)
- [ ] Migration DB reviewed & tested on staging
- [ ] Performance impact acceptable
- [ ] README ajouté et variables d'env documentées
- [ ] PR includes author, reviewer, changelog entry

## 🔄 Processus par agent

1. Review diff line-by-line
2. Run tests locally
3. If migrations: run in staging DB first
4. Approve PR only if checklist satisfied
5. Merge to staging branch (NOT main)
6. Deploy to staging
7. Smoke tests on staging
8. If OK → merge to main
9. Deploy to prod with canary rollout
10. Post-deploy monitoring (30-60 min)

---

**Créé le**: 16 novembre 2025  
**Status**: ⏳ En attente de finalisation production

