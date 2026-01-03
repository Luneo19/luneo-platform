# Dockerfile pour Railway - Backend Luneo Platform
# Ce Dockerfile est dans apps/backend
# Railway Root Directory doit être configuré sur apps/backend

FROM node:20

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et pnpm-lock.yaml
# Si Root Directory = apps/backend, on copie depuis le contexte local
COPY package.json pnpm-lock.yaml* ./

# Si pnpm-workspace.yaml existe, le copier aussi
COPY pnpm-workspace.yaml* ../

# Installer les dépendances locales d'abord
RUN pnpm install --frozen-lockfile || npm install

# Copier le code source
COPY . .

# Builder l'application
RUN pnpm build || npm run build

# Exposer le port
EXPOSE ${PORT:-3000}

# Démarrer l'application
CMD ["node", "dist/src/main.js"]

