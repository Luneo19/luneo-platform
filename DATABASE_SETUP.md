# 🗄️ Mise en place de la base de données Luneo

Ce guide décrit comment lancer PostgreSQL/Redis en local, appliquer les migrations Prisma et injecter les données de démonstration.

## 1. Pré-requis

- **Node.js 20+** (utilisez `nvm use` pour aligner votre environnement sur la version LTS requise par la plateforme).
- **Docker** (recommandé) ou un serveur PostgreSQL local accessible sur `postgresql://postgres:postgres@localhost:5432/luneo_dev`.
- **npm/pnpm** installés.

## 2. Variables d’environnement

Assurez-vous d’avoir créé vos fichiers d’environnement à partir des templates :

```bash
cp apps/backend/env.example apps/backend/.env.local    # optionnel pour éditer
cp apps/frontend/env.example apps/frontend/.env.local  # variables publiques frontend
```

> Les scripts Prisma utiliseront `DATABASE_URL`. Si la variable n’est pas définie, le script `bootstrap-local.sh` utilise `postgresql://postgres:postgres@localhost:5432/luneo_dev`.

## 3. Démarrage automatique (recommandé)

```bash
# Depuis la racine du monorepo
chmod +x scripts/db/bootstrap-local.sh
./scripts/db/bootstrap-local.sh
```

Ce script réalise les étapes suivantes :

1. Lance PostgreSQL et Redis via `docker compose` si Docker est présent.
2. Installe les dépendances backend si nécessaire.
3. Exécute `prisma generate`, `prisma migrate deploy` puis `prisma db seed`.

À l’issue, un administrateur (`admin@luneo.com / admin123`), une marque d’exemple et un produit de démonstration sont disponibles.

## 4. Étapes manuelles (si Docker indisponible)

1. **Lancer PostgreSQL** :
   ```bash
   pg_ctl start # ou service postgresql start, selon votre distribution
   createdb luneo_dev
   psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
   ```

2. **Exécuter les migrations** :
   ```bash
   cd apps/backend
   npm install --workspaces=false
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/luneo_dev \
     npx prisma migrate deploy
   ```

3. **Lancer le seed** :
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/luneo_dev \
     npx prisma db seed
   ```

## 5. Vérification

- `npm run prisma:studio` ou `pnpm prisma:studio` depuis la racine ouvrira Prisma Studio.
- Tableau de bord NestJS : démarrer `npm run dev --filter=@luneo/backend` et vérifier `GET /health`.

## 6. Nettoyage

```bash
docker compose down
```

ou, pour conserver les données :

```bash
docker compose stop
```

---

Pour plus de détails sur les variables disponibles, consultez `ENVIRONMENT_VARIABLES.md`.
