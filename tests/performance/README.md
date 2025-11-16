# Tests de performance

## k6 – Backend API

- Script : `tests/performance/k6/backend-smoke.js`
- Variables d’environnement
  - `K6_BASE_URL` : URL de l’API (`http://localhost:3000/api/v1`)
  - `K6_API_KEY` : clé publique (si nécessaire)
  - `K6_RATE` : requêtes/s (ex: `100`)
  - `K6_DURATION` : durée totale (`5m`, `15m`)
  - `K6_VUS`, `K6_MAX_VUS` : nombre de VUs
  - `K6_SLEEP` : délai entre itérations (défaut `1`)

## Exécution locale (Docker)

```bash
docker run --rm -i \
  -e K6_BASE_URL=http://host.docker.internal:3000/api/v1 \
  -e K6_RATE=40 \
  -e K6_DURATION=3m \
  -e K6_VUS=25 \
  -e K6_MAX_VUS=60 \
  -e K6_SLEEP=0.5 \
  -v "$(pwd)":/mnt \
  grafana/k6 run \
    --summary-export /mnt/tests/performance/results/backend-summary.json \
    /mnt/tests/performance/k6/backend-smoke.js
```

## Pipeline CI (exemple)

```yaml
- name: k6 load test
  run: |
    docker run --rm -i \
      -e K6_BASE_URL=$API_BASE_URL \
      -e K6_RATE=40 \
      -e K6_DURATION=3m \
      -e K6_VUS=25 \
      -e K6_MAX_VUS=60 \
      -e K6_SLEEP=0.5 \
      -v ${{ github.workspace }}:/mnt \
      grafana/k6 run \
        --summary-export /mnt/tests/performance/results/backend-summary.json \
        /mnt/tests/performance/k6/backend-smoke.js
```

## Interprétation

- `backend_http_latency` : Trend (avg, p95) en ms
- `backend_http_failures` : taux d’erreur (objectif < 2 %)
- Le rapport JSON est produit dans `tests/performance/results/backend-summary.json` (uploadable dans Grafana k6 Cloud ou conservé en artefact CI).

