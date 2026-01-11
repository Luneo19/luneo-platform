# Dockerfile optimisé pour Railway - Monorepo Luneo Platform
# Build multi-stage pour réduire la taille de l'image (objectif: < 4.0 GB)

# ============================================
# STAGE 1: Builder - Compile l'application
# ============================================
FROM node:20-alpine AS builder

# Installer les dépendances système nécessaires pour compiler canvas et autres packages natifs
# py3-setuptools est nécessaire pour distutils (requis par node-gyp)
RUN apk add --no-cache \
    python3 \
    py3-setuptools \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer @nestjs/cli globalement
RUN npm install -g @nestjs/cli@latest

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages/

# Installer les dépendances (inclure devDependencies pour le build)
RUN pnpm install --frozen-lockfile --include-workspace-root

# Copier le code source backend
COPY apps/backend ./apps/backend/

# Générer Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Builder l'application
RUN nest build || pnpm build

# ============================================
# STAGE 2: Production - Image finale légère
# ============================================
FROM node:20-alpine AS production

# Installer les dépendances système nécessaires pour Alpine
# Inclure les dépendances pour canvas (nécessaires même en production)
# Et les outils de build pour compiler canvas
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    python3 \
    py3-setuptools \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer uniquement les dépendances de production
WORKDIR /app

# Copier package.json et pnpm-lock.yaml (nécessaires pour pnpm)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Copier les packages nécessaires AVANT de copier node_modules
COPY packages ./packages/

# Installer les dépendances de production dans le stage production
# Cela garantit que la structure pnpm est correcte et que les modules sont accessibles
# Canvas sera compilé avec les outils de build installés ci-dessus
RUN pnpm install --frozen-lockfile --include-workspace-root --prod

# Copier le schéma Prisma AVANT de générer le client
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Générer Prisma Client dans le stage production
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Revenir à la racine
WORKDIR /app

# Supprimer les outils de build après installation (garder uniquement les bibliothèques runtime)
RUN apk del python3 py3-setuptools make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Créer le script de démarrage
# Le script doit être exécuté depuis la racine pour que pnpm trouve les node_modules
RUN printf '#!/bin/sh\nset -e\ncd /app\necho "Execution des migrations Prisma..."\nif [ -f "/app/node_modules/.bin/prisma" ]; then\n  cd apps/backend\n  /app/node_modules/.bin/prisma migrate deploy || echo "WARNING: Migrations echouees ou deja appliquees"\nelse\n  echo "WARNING: Prisma CLI not found, skipping migrations"\nfi\necho "Verification Prisma Client..."\nif [ ! -d "/app/node_modules/.prisma/client" ]; then\n  echo "WARNING: Prisma Client not found, regenerating..."\n  cd /app/apps/backend\n  pnpm prisma generate || echo "WARNING: Failed to generate Prisma Client"\nfi\necho "Demarrage de l application..."\ncd /app/apps/backend\nexec node dist/src/main.js\n' > /app/start.sh && chmod +x /app/start.sh

# Nettoyer les fichiers inutiles pour réduire la taille

# Nettoyer les fichiers inutiles
RUN rm -rf /app/node_modules/.cache \
    && rm -rf /tmp/* \
    && rm -rf /var/cache/apk/* \
    && find /app/node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "*.test.js" -o -name "*.spec.js" \) -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -type f \( -name "*.md" -o -name "*.map" -o -name "*.ts" ! -path "*/node_modules/.prisma/*" \) -delete 2>/dev/null || true \
    && find /app/node_modules -type d -empty -delete 2>/dev/null || true

# Exposer le port
EXPOSE ${PORT:-3000}

# Commande de démarrage
# Le WORKDIR reste à la racine pour que pnpm fonctionne correctement
WORKDIR /app
CMD ["sh", "/app/start.sh"]
