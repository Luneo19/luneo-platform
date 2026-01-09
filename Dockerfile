# Dockerfile pour Railway - Monorepo Luneo Platform
# Ce Dockerfile est à la racine et gère le build de apps/backend
# Root Directory dans Railway doit être '.'

FROM node:20

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires pour le monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages/

# Installer les dépendances (depuis la racine pour le monorepo)
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY apps/backend ./apps/backend

# Builder l'application backend
WORKDIR /app/apps/backend
# Générer Prisma Client avant le build
RUN pnpm prisma generate
RUN pnpm build

# Exposer le port (Railway fournira PORT via variable d'environnement)
EXPOSE ${PORT:-3000}

# Créer un script de démarrage qui exécute les migrations puis démarre l'app
WORKDIR /app/apps/backend
RUN echo '#!/bin/sh\n\
set -e\n\
echo "🚀 Exécution des migrations Prisma..."\n\
pnpm prisma migrate deploy || echo "⚠️  Migrations échouées ou déjà appliquées"\n\
echo "✅ Démarrage de l\'application..."\n\
exec node dist/src/main.js' > /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
