#!/bin/bash
# Configuration centralisée pour les scripts de déploiement
# Source this file: source "$(dirname "$0")/lib/config.sh"

# Environment
export NODE_ENV="${NODE_ENV:-production}"
export PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

# URLs
export FRONTEND_URL="${FRONTEND_URL:-https://app.luneo.app}"
export BACKEND_URL="${BACKEND_URL:-https://api.luneo.app}"

# Server configuration
export HETZNER_IP="${HETZNER_IP:-116.203.31.129}"
export HETZNER_USER="${HETZNER_USER:-root}"
export HETZNER_PATH="${HETZNER_PATH:-/opt/luneo}"

# Vercel
export VERCEL_TOKEN="${VERCEL_TOKEN:-}"
export VERCEL_ORG="${VERCEL_ORG:-luneos-projects}"
export VERCEL_PROJECT_FRONTEND="${VERCEL_PROJECT_FRONTEND:-frontend}"
export VERCEL_PROJECT_BACKEND="${VERCEL_PROJECT_BACKEND:-backend}"

# Services
export SUPABASE_URL="${SUPABASE_URL:-}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
export DATABASE_URL="${DATABASE_URL:-}"
export REDIS_URL="${REDIS_URL:-}"


#!/bin/bash
# Configuration centralisée pour les scripts de déploiement
# Source this file: source "$(dirname "$0")/lib/config.sh"

# Environment
export NODE_ENV="${NODE_ENV:-production}"
export PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

# URLs
export FRONTEND_URL="${FRONTEND_URL:-https://app.luneo.app}"
export BACKEND_URL="${BACKEND_URL:-https://api.luneo.app}"

# Server configuration
export HETZNER_IP="${HETZNER_IP:-116.203.31.129}"
export HETZNER_USER="${HETZNER_USER:-root}"
export HETZNER_PATH="${HETZNER_PATH:-/opt/luneo}"

# Vercel
export VERCEL_TOKEN="${VERCEL_TOKEN:-}"
export VERCEL_ORG="${VERCEL_ORG:-luneos-projects}"
export VERCEL_PROJECT_FRONTEND="${VERCEL_PROJECT_FRONTEND:-frontend}"
export VERCEL_PROJECT_BACKEND="${VERCEL_PROJECT_BACKEND:-backend}"

# Services
export SUPABASE_URL="${SUPABASE_URL:-}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
export DATABASE_URL="${DATABASE_URL:-}"
export REDIS_URL="${REDIS_URL:-}"
















