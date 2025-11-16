# Luneo AI Worker

Service Node.js dédié au traitement asynchrone (génération d’images, exports 3D, prévisualisation AR) pour la plateforme Luneo. Le worker consomme les jobs BullMQ déposés par le backend et sauvegarde les rendus dans un stockage local ou S3.

## ⚙️ Prérequis

- Node.js 20+
- Redis 6+ accessible (via Docker ou service managé)
- Clé `OPENAI_API_KEY` (DALL·E 2/3) pour la génération d’images
- Espace disque pour le stockage temporaire des rendus

## 🚀 Installation rapide

```bash
# Depuis la racine du monorepo
pnpm install

# Compiler
pnpm --filter luneo-worker-ia run build

# Lancer en mode développement (TSX + watch)
pnpm --filter luneo-worker-ia run dev
```

## 🌍 Variables d’environnement

| Variable | Description | Valeur par défaut |
| -------- | ----------- | ----------------- |
| `OPENAI_API_KEY` | Clé API OpenAI utilisée par le job `generateImage` | *aucune – requis* |
| `REDIS_HOST` | Hôte Redis (BullMQ) | `localhost` |
| `REDIS_PORT` | Port Redis | `6379` |
| `REDIS_PASSWORD` | Mot de passe Redis si nécessaire | `undefined` |
| `WORKER_STORAGE_PATH` | Dossier racine où les fichiers générés sont enregistrés | `<repo>/apps/worker-ia/storage` |
| `WORKER_STORAGE_BASE_URL` | URL exposant les fichiers générés (via CDN, S3, etc.) | `http://localhost:4000/storage` |
| `LOG_LEVEL` | Niveau de log Winston (`info`, `debug`, …) | `info` |
| `PROMPT_CACHE_TTL_SECONDS` | Durée de vie du cache de prompts (0 pour désactiver) | `600` |

> **Tip :** Dans un environnement sécurisé, expose la configuration via un fichier `apps/worker-ia/.env` chargé par `pnpm --filter luneo-worker-ia run dev`.

## 🧱 Architecture

- `src/main.ts` : bootstrap et orchestration des workers.
- `src/jobs/*` : un fichier par type de job (génération, upscale, export GLTF, etc.).
- `src/utils/logger.ts` : configuration Winston + sérialisation d’erreurs.
- `src/utils/storage.ts` : helper de stockage (local, adaptable S3/R2).
- `src/types/*.d.ts` : définitions complémentaires (GLTF pipeline).

Chaque job instancie un `Worker` BullMQ :

```ts
new Worker<Payload, Result>('queue-name', processor, {
  connection,
  concurrency: 3,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
});
```

## 🧪 Qualité & scripts

```bash
# ESLint
pnpm --filter luneo-worker-ia run lint

# TypeScript
pnpm --filter luneo-worker-ia run type-check

# Build production
pnpm --filter luneo-worker-ia run build
```

## 🔌 Intégration avec le backend

- Le backend NestJS enfile les jobs (queues `image-generation`, `upscale`, etc.).
- Ce service doit partager la même configuration BullMQ : même `REDIS_HOST`, `REDIS_PORT`, credentials.
- Les URLs retournées par `saveToStorage` peuvent être consommées par le backend pour mettre à jour les designs.

## 📦 Déploiement

1. Provisionner un Redis (Upstash, ElastiCache, …).
2. Fournir les variables d’environnement (via secrets ou fichier `.env`).
3. Build & démarrer :

   ```bash
   pnpm --filter luneo-worker-ia run build
   node apps/worker-ia/dist/main.js
   ```

4. Prévoir un mécanisme de rotation / surveillance (PM2, systemd, containers, etc.).

---

Pour toute intégration avancée (S3, instrumentation, nouveaux jobs), ajouter les utilitaires dans `src/utils` et instancier un nouveau worker dans `src/main.ts`.

