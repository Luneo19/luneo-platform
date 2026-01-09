# Dockerfile pour Railway - Monorepo Luneo Platform
# Ce Dockerfile est à la racine et gère le build de apps/backend
# Root Directory dans Railway doit être '.'

FROM node:20

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer @nestjs/cli globalement pour avoir accès à la commande 'nest'
RUN npm install -g @nestjs/cli@latest

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires pour le monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages/

# Installer les dépendances (depuis la racine pour le monorepo)
# Inclure les devDependencies car TypeScript et @nestjs/cli sont nécessaires pour le build
RUN pnpm install --frozen-lockfile --include-workspace-root

# Copier le code source
COPY apps/backend ./apps/backend

# Builder l'application backend
# Générer Prisma Client avant le build (depuis apps/backend car prisma.json est là)
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Builder depuis apps/backend maintenant que nest est installé globalement
WORKDIR /app/apps/backend
RUN nest build || pnpm build

# Exposer le port (Railway fournira PORT via variable d'environnement)
EXPOSE ${PORT:-3000}

# Créer un script de démarrage qui exécute les migrations puis démarre l'app
WORKDIR /app/apps/backend
RUN printf '#!/bin/sh\nset -e\ncd /app/apps/backend\necho "Execution des migrations Prisma..."\npnpm prisma migrate deploy || echo "WARNING: Migrations echouees ou deja appliquees"\necho "Demarrage de l application..."\nexec node dist/src/main.js\n' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
