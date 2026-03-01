# Runbook Opérationnel E2E

## Objectif
Fournir un protocole standard pour exécuter, diagnostiquer et valider les gates E2E avant merge/release.

## Commandes de référence
- Batch critique:
  - `BASE_URL=https://luneo.app pnpm exec playwright test --config=playwright.production.config.ts tests/e2e/pricing.spec.ts tests/e2e/checkout-flow.spec.ts tests/e2e/workflows/checkout-to-confirmation.spec.ts tests/e2e/workflows/registration-to-design.spec.ts --project=chromium`
- Batch domaine:
  - `BASE_URL=https://luneo.app pnpm exec playwright test --config=playwright.production.config.ts tests/e2e/products-flows.spec.ts tests/e2e/orders-flows.spec.ts tests/e2e/analytics-flows.spec.ts tests/e2e/oauth.spec.ts tests/e2e/oauth-flows.spec.ts tests/e2e/email-verification.spec.ts tests/e2e/admin-dashboard.spec.ts tests/e2e/cross-browser.spec.ts tests/e2e/rate-limiting.spec.ts --project=chromium`

## Procédure Go/No-Go
1. Vérifier le résultat `E2E Quality Gates` dans CI.
2. Vérifier les seuils:
   - Critical: 0 fail, 0% flaky, 100% pass.
   - Domain: 0 fail, <=1% flaky, >=99% pass.
3. Consulter `e2e-pr-pack` + artefacts de stabilité.
4. Si les seuils sont dépassés -> NO-GO et ouverture ticket remédiation.

## Diagnostic standard
- Échec isolé: rerun ciblé du test.
- Échec systémique: rerun du lot concerné.
- Échec environnement: vérifier `E2E_BASE_URL`, comptes E2E, auth provider, état de la plateforme.

## Critères de fermeture incident qualité
- Rerun vert sur la spec impactée.
- Gate complet vert sur le lot concerné.
- Mise à jour du ticket root cause + action préventive.
