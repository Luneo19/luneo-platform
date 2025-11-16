# Infrastructure locale conteneurisée

Ce guide décrit comment exécuter l’environnement complet Luneo en local via Docker.

## Prérequis

- Docker Desktop ≥ 4.30 ou équivalent
- Node.js 20.x (géré via `.nvmrc`)
- 15 Go d’espace disque disponible

## Démarrage rapide

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services exposés :

- API NestJS : http://localhost:3001
- Frontend Next.js : http://localhost:3000
- Queue/Worker IA : démarré automatiquement
- PostgreSQL : localhost:5432 (luneo/luneo)
- Redis : localhost:6379
- Mailhog : http://localhost:8025
- Prometheus : http://localhost:9090
- Grafana : http://localhost:3002 (admin/admin)

## Workflow recommandé

1. Modifier le code sur l’hôte. Les services montent le dossier `/workspace` en volume.
2. Relancer un service :

   ```bash
   docker compose -f docker-compose.dev.yml restart backend
   ```

3. Nettoyer :

   ```bash
   docker compose -f docker-compose.dev.yml down -v
   ```

## Variables d’environnement

Le fichier `docker-compose.dev.yml` définit des variables par défaut. Surclasser en créant un fichier `.env.docker` à la racine, puis lancer :

```bash
docker compose --env-file .env.docker -f docker-compose.dev.yml up
```

## Observabilité

Prometheus et Grafana sont intégrés. Les dashboards par défaut se trouvent dans `monitoring/grafana/dashboards`. Ajouter des règles d’alerting via Alertmanager (à ajouter dans une itération future).

## Étapes suivantes

- Paramétrer un bucket S3 managé et remplacer les volumes locaux pour la persistance de fichiers.
- Ajouter un profil `staging` en s’appuyant sur Kubernetes (Helm + ArgoCD).
- Connecter Sentry pour centraliser les erreurs front/back (DSN à injecter via secrets).

