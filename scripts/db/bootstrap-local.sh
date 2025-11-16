#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
DEFAULT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/luneo_dev"

GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

info() { echo -e "${GREEN}➤${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }
error() { echo -e "${RED}✖${RESET} $*"; }

info "Bootstrapping local database (PostgreSQL + Prisma)"

# 1. Start Docker services if docker is available
if command -v docker >/dev/null 2>&1; then
  info "Docker detected"
  if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
  else
    warn "docker compose is not available. Skipping container startup."
    DOCKER_CMD=""
  fi

  if [[ -n "$DOCKER_CMD" ]]; then
    info "Starting PostgreSQL & Redis containers..."
    $DOCKER_CMD -f "$COMPOSE_FILE" up -d postgres redis >/dev/null

    info "Waiting for PostgreSQL to be ready..."
    until $DOCKER_CMD exec luneo-postgres pg_isready -U postgres >/dev/null 2>&1; do
      sleep 2
    done
  fi
else
  warn "Docker not found. Ensure PostgreSQL is running locally at $DEFAULT_DATABASE_URL"
fi

# 2. Ensure backend dependencies are installed
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  warn "Backend dependencies not installed. Running npm install --workspaces=false"
  (cd "$BACKEND_DIR" && npm install --workspaces=false >/dev/null)
fi

# 3. Run Prisma migrations and seeds
export DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
info "Using DATABASE_URL=$DATABASE_URL"

cd "$BACKEND_DIR"

info "Generating Prisma client"
npx prisma generate >/dev/null

info "Applying database migrations"
npx prisma migrate deploy

info "Seeding database"
npx prisma db seed

info "✅ Local database is ready!"
