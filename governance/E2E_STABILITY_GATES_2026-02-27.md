# E2E Stability Gates (Enterprise)

## Objectif
Garantir un niveau de confiance release sur les parcours critiques business, tout en séparant le signal des domaines secondaires pour éviter les faux positifs de blocage.

## Découpage des gates
- **Gate critique business**: pricing, checkout, confirmation, registration-to-design.
- **Gate couverture domaine**: admin, analytics, products, orders, oauth, email verification, cross-browser, rate-limiting.

## Workflow CI
- Fichier: `.github/workflows/e2e-quality-gates.yml`
- Déclencheurs: `pull_request` sur `main` + `workflow_dispatch`.
- Cible d'exécution: `BASE_URL` pilotée via `secrets.E2E_BASE_URL` (fallback `https://luneo.app`).
- Génère un pack PR automatique (`artifacts/e2e-pr-pack.md`) publié aussi dans le `GITHUB_STEP_SUMMARY`.
- Orchestration release complète: `.github/workflows/release-orchestration.yml`.

## Reporting de stabilité
- Scripts:
  - `apps/frontend/tests/e2e/report-e2e-stability.mjs`
  - `apps/frontend/tests/e2e/enforce-e2e-thresholds.mjs`
  - `apps/frontend/tests/e2e/build-e2e-pr-pack.mjs`
  - `apps/frontend/tests/e2e/build-e2e-weekly-kpi.mjs`
  - `apps/frontend/tests/e2e/build-e2e-trend.mjs`
- Sorties:
  - `artifacts/e2e/critical-stability-summary.json`
  - `artifacts/e2e/critical-stability-summary.md`
  - `artifacts/e2e/domain-stability-summary.json`
  - `artifacts/e2e/domain-stability-summary.md`
  - `artifacts/e2e/weekly-kpi-YYYY-Www.json`
  - `artifacts/e2e/weekly-kpi-YYYY-Www.md`

## Politique go/no-go
- Gate critique: **bloquante release**.
- Gate domaine: **bloquante merge vers `main`**.
- Taux flaky cible: **0%** sur gate critique, **<1%** sur gate domaine.
- Seuils techniques appliqués en CI:
  - Critique: `max-failed=0`, `max-flaky-rate=0`, `min-pass-rate=100`.
  - Domaine: `max-failed=0`, `max-flaky-rate=1`, `min-pass-rate=99`.

## KPI hebdomadaire
- Fichier workflow: `.github/workflows/e2e-weekly-kpi.yml`
- Déclenchement: chaque lundi matin UTC + exécution manuelle.
- Artefacts horodatés pour suivi tendance semaine par semaine.
- Trend `N vs N-1` généré automatiquement quand un snapshot précédent est disponible.
