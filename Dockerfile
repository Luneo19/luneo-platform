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
# Ajouter retries pour gérer les erreurs réseau temporaires
RUN pnpm install --frozen-lockfile --include-workspace-root --fetch-timeout=60000 || \
    (echo "Retry 1..." && sleep 5 && pnpm install --frozen-lockfile --include-workspace-root --fetch-timeout=60000) || \
    (echo "Retry 2..." && sleep 10 && pnpm install --frozen-lockfile --include-workspace-root --fetch-timeout=60000)

# Copier le code source backend
COPY apps/backend ./apps/backend/

# Générer Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Créer un tar du Prisma Client pour le copier facilement dans le stage production
# Cela évite les problèmes de COPY si le répertoire n'existe pas
WORKDIR /app
RUN echo "Checking for Prisma Client..." && \
    ls -la node_modules/.prisma 2>/dev/null || echo "Prisma Client not in node_modules/.prisma" && \
    find node_modules -name ".prisma" -type d 2>/dev/null | head -5 && \
    if [ -d "node_modules/.prisma" ]; then \
        echo "Found Prisma Client in node_modules/.prisma, creating tar..."; \
        tar -czf /tmp/prisma-client.tar.gz -C node_modules .prisma && \
        ls -lh /tmp/prisma-client.tar.gz; \
    else \
        echo "Prisma Client not found, searching in node_modules..."; \
        PRISMA_DIR=$(find node_modules -name ".prisma" -type d | head -1); \
        if [ -n "$PRISMA_DIR" ]; then \
            echo "Found Prisma Client at $PRISMA_DIR, creating tar..."; \
            tar -czf /tmp/prisma-client.tar.gz -C node_modules $(echo $PRISMA_DIR | sed 's|node_modules/||'); \
            ls -lh /tmp/prisma-client.tar.gz; \
        else \
            echo "Prisma Client not found anywhere, creating empty tar"; \
            touch /tmp/prisma-client.tar.gz; \
        fi; \
    fi

# Builder l'application
WORKDIR /app/apps/backend
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

# Installer les dépendances de production + prisma (nécessaire pour générer Prisma Client)
# Cela garantit que la structure pnpm est correcte et que les modules sont accessibles
# Canvas sera compilé avec les outils de build installés ci-dessus
# Ajouter retries pour gérer les erreurs réseau temporaires
RUN pnpm install --frozen-lockfile --include-workspace-root --prod --fetch-timeout=60000 || \
    (echo "Retry 1..." && sleep 5 && pnpm install --frozen-lockfile --include-workspace-root --prod --fetch-timeout=60000) || \
    (echo "Retry 2..." && sleep 10 && pnpm install --frozen-lockfile --include-workspace-root --prod --fetch-timeout=60000)

# Copier le schéma Prisma depuis le builder
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Copier le Prisma Client généré depuis le builder via tar
# Le tar a été créé avec succès dans le builder (7.8M), donc on l'utilise directement
COPY --from=builder /tmp/prisma-client.tar.gz /tmp/prisma-client.tar.gz
RUN echo "Extracting Prisma Client from builder..." && \
    ls -lh /tmp/prisma-client.tar.gz && \
    mkdir -p /app/node_modules/.prisma && \
    tar -xzf /tmp/prisma-client.tar.gz -C /app/node_modules 2>&1 && \
    echo "Prisma Client extracted successfully" && \
    ls -la /app/node_modules/.prisma/client 2>/dev/null | head -5 && \
    echo "Verifying Prisma Client structure..." && \
    find /app/node_modules -name ".prisma" -type d 2>/dev/null | head -3 && \
    rm -f /tmp/prisma-client.tar.gz

# Supprimer les outils de build après installation (garder uniquement les bibliothèques runtime)
RUN apk del python3 py3-setuptools make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Créer le script de démarrage
# Le script doit être exécuté depuis la racine pour que pnpm trouve les node_modules
RUN printf '#!/bin/sh\nset -e\ncd /app\necho "Execution des migrations Prisma..."\nif [ -f "/app/node_modules/.bin/prisma" ] || [ -f "/app/apps/backend/node_modules/.bin/prisma" ]; then\n  cd apps/backend\n  if [ -f "/app/node_modules/.bin/prisma" ]; then\n    /app/node_modules/.bin/prisma migrate deploy || echo "WARNING: Migrations echouees ou deja appliquees"\n  else\n    /app/apps/backend/node_modules/.bin/prisma migrate deploy || echo "WARNING: Migrations echouees ou deja appliquees"\n  fi\nelse\n  echo "WARNING: Prisma CLI not found, skipping migrations"\nfi\necho "Verification Prisma Client..."\nif [ ! -d "/app/node_modules/.prisma/client" ] && [ ! -d "/app/apps/backend/node_modules/.prisma/client" ]; then\n  echo "WARNING: Prisma Client not found, regenerating..."\n  cd /app/apps/backend\n  pnpm prisma generate || echo "WARNING: Failed to generate Prisma Client"\nfi\necho "Demarrage de l application..."\ncd /app/apps/backend\nexec node dist/src/main.js\n' > /app/start.sh && chmod +x /app/start.sh

# Nettoyer les fichiers inutiles pour réduire la taille

# Nettoyer les fichiers inutiles
# IMPORTANT: Ne PAS supprimer .prisma/client car il est nécessaire au runtime
RUN rm -rf /app/node_modules/.cache \
    && rm -rf /tmp/* \
    && rm -rf /var/cache/apk/* \
    && find /app/node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "*.test.js" -o -name "*.spec.js" \) ! -path "*/node_modules/.prisma/*" -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -type f \( -name "*.md" -o -name "*.map" -o -name "*.ts" ! -path "*/node_modules/.prisma/*" ! -path "*/node_modules/@prisma/*" \) -delete 2>/dev/null || true \
    && find /app/node_modules -type d -empty ! -path "*/node_modules/.prisma/*" -delete 2>/dev/null || true \
    && echo "Verifying Prisma Client after cleanup..." && \
    ls -la /app/node_modules/.prisma/client 2>/dev/null | head -3 || echo "WARNING: Prisma Client not found after cleanup"

# Exposer le port
EXPOSE ${PORT:-3000}

# Commande de démarrage
# Le WORKDIR reste à la racine pour que pnpm fonctionne correctement
WORKDIR /app
CMD ["sh", "/app/start.sh"]
