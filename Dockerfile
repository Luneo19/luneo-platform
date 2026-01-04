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

# Démarrer l'application
WORKDIR /app/apps/backend
CMD ["node", "dist/src/main.js"]
