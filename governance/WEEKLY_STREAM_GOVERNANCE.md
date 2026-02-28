# Weekly Stream Governance

Cadence hebdomadaire unique pour piloter les streams A/B/C, sécuriser les releases et arbitrer les contrats API.

## Rituels

- Lundi: revue des KPI de la semaine precedente (activation, create->publish, succes integrations, latence p95, observed vs estimated).
- Mercredi: revue risques + blocages techniques + plan de mitigation.
- Vendredi: decision review des contrats API et go/no-go release.

## Scoreboard attendu

- Stream A (Produit): `activation_j7`, `median_create_to_publish_minutes`, `publish_readiness_block_rate`.
- Stream B (Integrations): `integration_success_rate`, `integration_error_rate`, `integration_p95_latency_ms`, `provider_health_status`.
- Stream C (Runtime/ROI): `runtime_canonical_path_ratio`, `guardrail_block_rate`, `roi_observed_ratio`, `roi_estimated_ratio`.

## Decision Log API/Contrats

Pour chaque decision hebdo:

- `date`
- `stream`
- `contract` (endpoint + version)
- `decision` (accept / reject / deprecate)
- `impact` (frontend/backend/ops)
- `owner`
- `deadline`

## Release Gate hebdomadaire (obligatoire)

Avant chaque release:

1. `pnpm run quality:release`
2. Verifier les smoke publics/user/admin
3. Archiver le resultat dans `RELEASE_QUALITY_GATES.md`
4. Valider en comite hebdo (produit + engineering + ops)
