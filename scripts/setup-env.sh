#!/bin/bash

# 🔧 Script de Configuration Automatique des Variables d'Environnement

set -e

echo "🔧 CONFIGURATION DES VARIABLES D'ENVIRONNEMENT"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_ENV="apps/backend/.env"
FRONTEND_ENV="apps/frontend/.env.local"

# Create backend .env if it doesn't exist
if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${BLUE}📝 Création du fichier .env backend...${NC}"
    cat > "$BACKEND_ENV" << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/luneo?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Google
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# OAuth GitHub
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback

# Enterprise SSO - SAML
SAML_ENTRY_POINT=https://your-idp.com/sso/saml
SAML_ISSUER=luneo-platform
SAML_CERT=your_saml_certificate_content
SAML_CALLBACK_URL=http://localhost:3001/api/v1/auth/saml/callback
SAML_DECRYPTION_PVK=your_saml_decryption_private_key

# Enterprise SSO - OIDC (Azure AD, Okta, etc.)
OIDC_ISSUER=https://login.microsoftonline.com/{tenant-id}/v2.0
OIDC_AUTHORIZATION_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
OIDC_TOKEN_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
OIDC_USERINFO_URL=https://login.microsoftonline.com/{tenant-id}/openid/userinfo
OIDC_CLIENT_ID=your_oidc_client_id
OIDC_CLIENT_SECRET=your_oidc_client_secret
OIDC_CALLBACK_URL=http://localhost:3001/api/v1/auth/oidc/callback
OIDC_SCOPE=openid profile email

# CAPTCHA
CAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# App URLs
APP_FRONTEND_URL=http://localhost:3000
APP_NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_FROM=noreply@luneo.app
SENDGRID_API_KEY=your_sendgrid_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
EOF
    echo -e "${GREEN}✅ Fichier .env backend créé${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .env backend existe déjà${NC}"
fi

# Create frontend .env.local if it doesn't exist
if [ ! -f "$FRONTEND_ENV" ]; then
    echo -e "${BLUE}📝 Création du fichier .env.local frontend...${NC}"
    cat > "$FRONTEND_ENV" << 'EOF'
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
EOF
    echo -e "${GREEN}✅ Fichier .env.local frontend créé${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .env.local frontend existe déjà${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Modifiez les fichiers .env avec vos vraies valeurs !${NC}"
echo ""
