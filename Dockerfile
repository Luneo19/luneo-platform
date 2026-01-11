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
RUN apk add --no-cache libc6-compat openssl

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer uniquement les dépendances de production
WORKDIR /app

# Copier package.json et pnpm-lock.yaml (nécessaires pour pnpm)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Copier les packages nécessaires AVANT de copier node_modules
COPY packages ./packages/

# Copier les node_modules compilés depuis le builder pour éviter la recompilation
# (surtout pour canvas et autres packages natifs)
# Dans un monorepo pnpm, les node_modules sont à la racine
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Le Prisma Client est déjà dans node_modules copié depuis le builder

# Créer le script de démarrage
# Le script doit être exécuté depuis la racine pour que pnpm trouve les node_modules
# NODE_PATH permet à Node.js de trouver les modules depuis la racine
RUN printf '#!/bin/sh\nset -e\nexport NODE_PATH=/app/node_modules\nexport PATH="/app/node_modules/.bin:$PATH"\ncd /app\necho "Execution des migrations Prisma..."\ncd apps/backend\nif [ -f "../../node_modules/.bin/prisma" ]; then\n  ../../node_modules/.bin/prisma migrate deploy || echo "WARNING: Migrations echouees ou deja appliquees"\nelse\n  echo "WARNING: Prisma CLI not found, skipping migrations"\nfi\necho "Demarrage de l application..."\nexec node dist/src/main.js\n' > /app/start.sh && chmod +x /app/start.sh

# Nettoyer les fichiers inutiles pour réduire la taille
# Supprimer les outils de build après copie (ils ne sont plus nécessaires)
RUN apk del python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev 2>/dev/null || true

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
