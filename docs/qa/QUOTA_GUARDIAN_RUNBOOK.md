# Runbook QA / CSM – Usage Quota Guardian

Une procédure unique pour reproduire les scénarios critiques (alertes, blocages, top-up) et valider les garde-fous via E2E & charge.

## 1. Pré-requis
- `pnpm dev` lancé sur `apps/backend` & `apps/frontend`
- Jeu de données avec au moins un brand de test (ex. `brand_dashboard`)
- Clé API publique (pour les appels publics) et token JWT admin

## 2. Reset & préparation d’un brand (CLI)
```bash
# Simule 92 % d’utilisation + top-up 25 unités (écriture réelle)
pnpm quota:reset --brand=brand_dashboard --metric=ai_generations --target=92 --topup=25

# Mode lecture seule
pnpm quota:reset --brand=brand_dashboard --metric=renders_2d --target=85 --dry-run
```

- Effets :
  - supprime les `UsageMetric` du mois en cours pour le brand
  - recrée un point d’usage aligné sur `--target` (en utilisant le plan actuel via `PLAN_DEFINITIONS`)
  - ajoute un `UsageTopUp` complété si la métrique accepte l’overage charge
- URLs utiles rappelées en sortie (`/analytics`, `/monitoring`)
- Variables requises : `STRIPE_SECRET_KEY` (pour charger les plans) et `FRONTEND_URL`

> _Astuce_: pour invalider les métriques Prometheus d’un brand, appeler `QuotaMetricsService.resetBrand` via Nest console ou redémarrer le worker metrics.

## 3. Vérifications manuelles
1. Ouvrir `http://localhost:3000/analytics`
2. Vérifier :
   - Carte “Plan actuel” (prix + estimation dépassements)
   - Timeline (ordre anti-chronologique, badges sévérité)
   - Projections (“Sous tension” si >90 % prévu)
   - Carte “Plan recommandé” + CTA “Comparer les plans” & “Parler à un expert”
3. Déclencher une alerte critique en dépassant un quota (POST `/usage-billing/record` pour franchir 90 %)
4. Vérifier la notification Slack / Email générée par `QuotaAlertListenerService`
5. Générer un lien partagé :
   ```bash
   curl -X POST "$API_BASE/usage-billing/share" \
     -H "Authorization: Bearer $ADMIN_JWT" \
     -H "Content-Type: application/json" \
     -d '{"brandId":"brand_dashboard"}'
   ```
   - Vérifier que l’URL renvoyée pointe vers `/share/quota/<token>`
   - Tester l’expiration (`QUOTA_SHARE_TTL_MS`) et confirmer qu’un token expiré renvoie une page “Lien invalide”

## 4. E2E Playwright ciblés
```bash
cd apps/frontend
pnpm test:e2e --grep "Usage quota overview"
```
Couverture :
- Rendu du cockpit (snapshot plan + alertes + CTA)
- Calculs de projections et badges “Sous tension / Action immédiate”
- Page publique `share/quota/[token]`
- CTA Stripe simulé (mock checkout) avec toasts de confirmation

## 5. Charge & quotas (k6)
```bash
BASE_URL=http://localhost:3333 \
BRAND_ID=brand_dashboard \
API_TOKEN=$ADMIN_JWT \
PUBLIC_API_KEY=$PUBLIC_KEY \
k6 run tests/k6/usage-quota-guardian.js

API_BASE=http://localhost:3333/api/v1 \
FRONTEND_URL=http://localhost:3000 \
AUTH_TOKEN=$ADMIN_JWT \
BRAND_ID=brand_dashboard \
k6 run tests/k6/quota-share-topup.js
```
Surveiller :
- `quota_summary_latency` (< 400 ms p90)
- `design_queue_latency`, `render_queue_latency`
- `http_req_failed` < 2 %

## 6. Scénarios support / CSM
| Cas | Action backend | Vérification frontend |
| --- | -------------- | --------------------- |
| Upgrade bloqué | `POST /usage-billing/check-quota` avec `team_members` | Carte quotas affiche badge rouge + CTA upgrade |
| Achat de crédits | `POST /usage-billing/topups/checkout` (URLs `successUrl` / `cancelUrl` vers `/analytics?topup=...`) | Toast confirmation, historique top-up mis à jour |
| Lien partagé | Générer token `Buffer.from(JSON.stringify(payload)).toString('base64')` | Page `/share/quota/<token>` affiche le snapshot read-only |
| Reset fin de mois | `pnpm prisma db execute ...` + restart metrics | Courbes repartent de 0, timeline indique “Consommation stable” |

## 7. Check-list de sortie
- ✅ Alertes Slack/Email reçues
- ✅ Playwright “Usage quota overview” green
- ✅ k6 sous les seuils
- ✅ Documentation du ticket support (brand, métrique, capture d’écran cockpit)

Ce runbook est référencé depuis `docs/USAGE_QUOTA_GUARDIAN.md` (section Qualité & tests). Mettez-le à jour à chaque ajout de métrique ou évolution UI.

