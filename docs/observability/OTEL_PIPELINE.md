# Pipeline OpenTelemetry – Luneo Platform

## Objectifs

- Centraliser les traces backend/worker/render dans un collector unique.
- Acheminer vers Tempo (ou Jaeger) + Grafana Cloud via OTLP HTTP.
- Disposer d’une configuration reproductible (dev, staging, prod).

## Architecture

```
NestJS (backend / workers) --OTLP HTTP--> Collector --> Tempo
                                               \--> Grafana Cloud
```

1. **SDK Node** (déployé dans `apps/backend`) publie vers `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`.
2. **Collector** (cf. `infrastructure/observability/otel-collector/otel-collector-config.yaml`) :
   - Receveur OTLP (HTTP + gRPC)
   - Processors (memory limiter, batch, nettoyage des attributs)
   - Exporters Tempo + Grafana Cloud (headers dynamiques)
3. **Tempo / Jaeger** – stockage des traces.
4. **Grafana** – exploitation + corrélation avec Prometheus & Loki.

## Variables d’environnement collector

| Variable                      | Description                                   | Exemple                                     |
|------------------------------|-----------------------------------------------|---------------------------------------------|
| `TEMPO_OTLP_HTTP_ENDPOINT`   | Endpoint Tempo (HTTP)                         | `https://tempo.example.com/api/traces`      |
| `TEMPO_TENANT_ID`            | Tenant Tempo (multitenant Grafana)            | `luneo`                                     |
| `GRAFANA_OTLP_ENDPOINT`      | Endpoint Grafana Cloud                        | `https://otlp-gateway.grafana.net/otlp`     |
| `GRAFANA_OTLP_AUTH`          | Header Authorization Grafana                  | `Basic base64(api:key)`                     |

## Déploiement

### Docker Compose local

```yaml
otel-collector:
  image: otel/opentelemetry-collector:0.105.0
  command: ["--config=/etc/otel-collector-config.yaml"]
  volumes:
    - ./infrastructure/observability/otel-collector/otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
  environment:
    TEMPO_OTLP_HTTP_ENDPOINT: http://tempo:4318
    TEMPO_TENANT_ID: luneo-local
```

### Helm / Kubernetes (Argo CD)
1. Ajouter un chart `opentelemetry-collector` (bitnami ou officiel).
2. Monter le fichier `otel-collector-config.yaml` en configmap.
3. Injecter les secrets Tempo / Grafana via External Secrets.
4. Exposer le service OTLP interne (`ClusterIP:4318/4317`).

### Configuration applications

Dans `apps/backend/.env` (exemple staging) :
```
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel-collector.luneo-observability:4318
OTEL_SERVICE_NAME=luneo-backend
OTEL_SERVICE_NAMESPACE=luneo-platform
OTEL_TRACES_SAMPLER_RATIO=0.25
```

Idem pour `apps/worker-ia` et `apps/render` (instrumentation à appliquer).

## Vérifications

1. **Health** : `curl http://collector:13133/healthz`
2. **Logs collector** : vérifier export vers Tempo.
3. **Grafana** : requête `service.name="luneo-backend"` → visualiser spans.
4. **Corrélation** : dans Grafana, associer traces, métriques (`Prometheus`) et logs (`Loki`).

## Étapes suivantes

- Instrumenter worker IA & render (mêmes variables env).
- Ajouter propagation W3C sur frontend (Playwright) pour corrélation bout‑en‑bout.
- Automatiser déploiement via Argo CD overlays (`infrastructure/kubernetes/overlays/observability-*`).

