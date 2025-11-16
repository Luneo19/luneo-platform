# 🛡️ Gestion des quotas & crédits — Architecture 2025

## Objectifs

- Centraliser la définition des plans d'abonnement et de leurs métriques
- Garantir l'application automatique des quotas côté API et workers
- Proposer une observabilité temps réel (Prometheus / Grafana)
- Offrir une visibilité métier dans le dashboard (Next.js)

---

## 1. Catalogue de plans partagé

| Fichier | Description |
| --- | --- |
| `packages/billing-plans/src/plans.ts` | Catalogue complet des plans (`starter`, `professional`, `business`, `enterprise`) |
| `packages/billing-plans/src/types.ts` | Types stricts : `UsageMetricType`, `PlanDefinition`, `PlanQuotaDefinition`, `PlanTier` |
| `packages/billing-plans/src/index.ts` | Exports publics |

Chaque quota définit :
- `metric` : identifiant (`designs_created`, `renders_2d`, …)
- `limit` & `period`
- `overage` (`charge` ou `block`) + `overageRate`
- `notificationThresholds` (par défaut 50/75/90%)
- `unit`, `label`, `description`

---

## 2. Backend NestJS — UsageBillingModule

### Services clés

| Service | Rôle |
| --- | --- |
| `QuotasService` | Vérifie & applique (`enforceQuota`) les limites, calcule résumés et alertes (prend en compte les top-ups) |
| `QuotaMetricsService` | Expose des gauges Prometheus : usage %, restant, overage |
| `QuotaAlertListenerService` | Diffuse les alertes vers Slack / Zapier / Email (admins + destinataires configurés) |
| `UsageTopUpService` | Crée des sessions Stripe, agrège les crédits achetés et alimente les limites dynamiques |
| `UsageTopUpListener` | Réagit aux événements Stripe via EventEmitter (`billing.topup.*`) |

### Endpoints

- `GET /usage-billing/summary/:brandId`
- `GET /usage-billing/summary` (brand courant via JWT)
- `GET /usage-billing/plans`
- `POST /usage-billing/check-quota`
- `POST /usage-billing/topups/checkout` (session Stripe pour crédits)
- `GET /usage-billing/topups/history`

Réponse standard :

```json
{
  "plan": { "...": "PlanDefinition" },
  "summary": {
    "metrics": [
      { "type": "renders_3d", "current": 42, "limit": 200, "percentage": 21, "overage": 0 }
    ],
    "estimatedCost": {
      "base": 29900,
      "usage": 0,
      "overage": 1200,
      "total": 31100
    },
    "alerts": [
      {
        "severity": "warning",
        "message": "Rendus 3D à 78% du quota",
        "metric": "renders_3d",
        "threshold": 75
      }
    ]
  }
}
```

### Observabilité & alerting

- Prometheus :
  - `luneo_quota_usage_percentage{brand,plan,metric}`
  - `luneo_quota_remaining_units{…}`
  - `luneo_quota_overage_units{…}`
  - `luneo_quota_summary_timestamp{brand,plan}`
  - `luneo_quota_checks_total{source,outcome}` + `luneo_quota_check_duration_seconds`
  - `luneo_quota_alerts_total{severity,overage_policy}`
  - `luneo_observability_ws_active_connections`
  - `luneo_observability_ws_last_snapshot_timestamp`
  - `luneo_observability_ws_broadcast_duration_seconds`
  - `luneo_observability_ws_broadcast_failures_total`
- Sentry :
  - Capture automatique des échecs de diffusion WS (tags `component=observability-gateway`)
  - Ticket warning lorsque ≥3 échecs consécutifs sont enregistrés (corrélé aux métriques Prometheus)
- Alertmanager :
  - Importer `docs/observability/alerting/ws-failover.yml` pour surveiller la boucle WebSocket (`failures_total` + `last_snapshot_timestamp`)
- Event Emitters :
  - `usage.quota.alert` → Slack / Email / Webhooks + métriques Prometheus
  - `billing.topup.completed` / `billing.topup.failed` → alimente `UsageTopUpService`
- Grafana :
  - Importer `docs/observability/grafana/quotas-dashboard.json` (datasource = Prometheus)
  - Variables : brand / metric / source / outcome
- Alertmanager :
  - Exemple prêt à l’emploi : `docs/observability/alerting/quota-alerts.yml`
  - Règles warning/critical + latence enforcement

---

## 3. Guard d’application (`QuotaGuard`)

| Fichier | Usage |
| --- | --- |
| `apps/backend/src/common/decorators/quota.decorator.ts` | `@RequireQuota({ metric: 'renders_3d', amountField: 'body.quantity' })` |
| `apps/backend/src/common/guards/quota.guard.ts` | Résout `brandId`, calcule `amount`, appelle `QuotasService.enforceQuota` |

### Intégrations actives

- `POST /designs` → `ai_generations`
- `POST /designs/:id/upgrade-highres` → `renders_2d`
- `POST /render/2d` → `renders_2d`
- `POST /render/3d` → `renders_3d`
- `Public API (api/v1/*)` → `api_calls` par défaut, `designs_created` pour `POST /api/v1/designs`, `webhook_deliveries` pour `/api/v1/webhooks/test`
- `Webhooks internes (POST /webhooks/test|:id/retry)` → `webhook_deliveries`, lecture `GET /webhooks/history` → `api_calls`

Le guard enregistre `request.quotaCheck` pour la traçabilité (logs, audit).

---

## 4. Self-service crédits & Stripe

- Checkout Stripe (mode `payment`) créé à la volée (`UsageTopUpService.createTopUpSession`)
- Les top-ups sont liés à la période courante (`periodKey = YYYY-MM`)
- Webhooks Stripe relayés par `BillingService` -> `UsageTopUpListener`
- Chaque top-up étend automatiquement la limite de la métrique ciblée dans `getUsageSummary` & `checkQuota`
- Historique exposé via `GET /usage-billing/topups/history`

---

## 5. Frontend Next.js — Dashboard Enterprise

| Fichier | Description |
| --- | --- |
| `apps/frontend/src/lib/hooks/useUsageSummary.ts` | Hook React consommant `/usage-billing/summary` (plan + alertes horodatées) |
| `apps/frontend/src/components/dashboard/UsageQuotaOverview.tsx` | Cockpit premium : plan, timeline, projections, CTA upgrade/contact |
| `apps/frontend/src/app/(dashboard)/analytics/page.tsx` | Section `Usage & quotas` intégrée au cockpit analytics |

Fonctionnalités UI :
- Timeline anti-chronologique avec badges `info/warning/critical`
- Fusion live : les snapshots WebSocket (`usage.quota.summary`) écrasent automatiquement les données API sur `/analytics` pour un cockpit réellement temps réel (badge Live + état standby)
- Failover automatique : badge “Flux instable” + rafraîchissement API dès que le WebSocket est silencieux (>15s)
- Projections basées sur la vélocité (badge “Stable / Sous tension / Action immédiate”)
- Comparateur express multi-plans : simule la marge restante et le coût delta pour chaque palier (`PLAN_DEFINITIONS`) afin de guider les upgrades
- Simulateur de top-ups : sélection d’une métrique + slider de crédits pour visualiser, en direct, la pression résiduelle / jours gagnés / coût estimé
- CTA “Acheter ce top-up” : déclenche directement `/usage-billing/topups/checkout` (Stripe Checkout) avec les valeurs simulées
- Export instantané : bouton “Exporter PDF” + partage mail pré-rempli (health report) directement depuis le cockpit
- Lien partageable : génération d’un lien encodé (copie presse-papiers) vers la page publique `https://app.luneo.com/share/quota/<token>`
- API `POST /usage-billing/share` pour obtenir un token signé (TTL configurable via `QUOTA_SHARE_TTL_MS`, secret `QUOTA_SHARE_SECRET`)
- API `GET /usage-billing/share/:token` pour produire le snapshot read-only (utilisé par la page Next.js)
- Progress bars animées + restants + coûts d’overage
- Carte “Plan recommandé” + CTA “Comparer les plans” / “Parler à un expert”
- CTA “Actualiser” + placeholders loading / error states

---

## 6. Tests & opérations

- **Playwright** : `apps/frontend/tests/e2e/usage-quota-dashboard.spec.ts` (`pnpm --filter luneo-frontend test:e2e --grep "Usage quota overview"`)
-   - Cas supplémentaires : page publique `/share/quota/[token]` + CTA Stripe simulé (mock checkout)
- **k6** : `tests/k6/usage-quota-guardian.js` (stress `/usage-billing/summary`, `/designs`, `/render/2d`)
-   - `tests/k6/quota-share-topup.js` : scénario end-to-end (summary + simulate + checkout + `/share/quota`)
- **CI** : job `stripe_pricing_verify` (workflow `ci.yml`) compare `PLAN_DEFINITIONS` ↔️ tarifs Stripe via `pnpm pricing:verify`
- **Runbook QA/CSM** : `docs/qa/QUOTA_GUARDIAN_RUNBOOK.md` (reset, top-up, alerting, commandes de test + cas lien partagé)
- **WebSocket live** : `ObservabilityGateway` diffuse `usage.quota.summary` → section “Quotas en tension” sur `/monitoring`
- **CLI reset** : `pnpm quota:reset --brand=... --metric=... --target=90` pour préparer un compte (purge usage + top-up simulé)
- Prometheus/Grafana : nouvelles métriques disponibles pour dashboards
- Logs : évènements `QuotaAlertListenerService`

---

## 7. Roadmap quick wins

- [x] Automatiser notifications Slack/Email via `QuotaAlertListenerService`
- [x] Ajouter achats de crédits (Stripe Checkout) déclenchés depuis alertes/dashboard
- [x] Tests e2e Playwright + scénarios k6 pour quotas
- [x] WebSocket temps réel (ObservabilityGateway) pour quotas live (dash `/monitoring`)
- [x] CI: snapshots Stripe catalog ↔️ `PLAN_DEFINITIONS`

---

## Récapitulatif

- ✅ Plans centralisés & typés (`@luneo/billing-plans`)
- ✅ Enforcement automatique via garde NestJS
- ✅ Observabilité Prometheus + EventEmitter
- ✅ Dashboard Next.js avec UX pro & alertes contextualisées
- ✅ Documentation prête pour devs & ops

Welcome to quota perfection 🚀

