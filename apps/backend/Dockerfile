FROM node:22-alpine AS builder

RUN apk add --no-cache python3 py3-setuptools make g++

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json ./
RUN pnpm install --no-frozen-lockfile --prod

COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
