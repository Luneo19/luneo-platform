# Dockerfile optimisé pour Railway - Monorepo Luneo Platform
# Build multi-stage pour réduire la taille de l'image (objectif: < 4.0 GB)

# ============================================
# STAGE 1: Builder - Compile l'application
# ============================================
FROM node:20-alpine AS builder

# Installer les dépendances système nécessaires pour compiler canvas et autres packages natifs
RUN apk add --no-cache \
    python3 \
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
RUN apk add --no-cache libc6-compat openssl

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer uniquement les dépendances de production
WORKDIR /app

# Copier package.json et pnpm-lock.yaml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Installer uniquement les dépendances de production (sans devDependencies)
# Note: --filter=backend peut ne pas fonctionner, utiliser --prod à la place
RUN pnpm install --frozen-lockfile --include-workspace-root --prod

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Copier le Prisma Client généré depuis le builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma || true

# Copier les packages nécessaires (si utilisés par le backend)
# Note: Ne copier que les packages réellement utilisés pour réduire la taille
COPY packages ./packages/

# Créer le script de démarrage
WORKDIR /app/apps/backend
RUN printf '#!/bin/sh\nset -e\ncd /app/apps/backend\necho "Execution des migrations Prisma..."\npnpm prisma migrate deploy || echo "WARNING: Migrations echouees ou deja appliquees"\necho "Demarrage de l application..."\nexec node dist/src/main.js\n' > /app/start.sh && chmod +x /app/start.sh

# Nettoyer les fichiers inutiles pour réduire la taille
# Supprimer les outils de build après installation
RUN apk del python3 make g++ || true

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
CMD ["/app/start.sh"]
