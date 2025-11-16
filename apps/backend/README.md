# 🚀 Luneo Backend API

**Last Updated:** November 16, 2025

Backend professionnel pour le SaaS de personnalisation produit Luneo, développé avec NestJS, Prisma, et PostgreSQL.

## 🏗️ Architecture

- **Framework**: NestJS avec TypeScript
- **Base de données**: PostgreSQL avec Prisma ORM
- **Cache/Queue**: Redis avec BullMQ
- **Authentification**: JWT + OAuth (Google, GitHub)
- **Paiements**: Stripe
- **Stockage**: Cloudinary
- **IA**: OpenAI, Replicate
- **Monitoring**: Sentry
- **Documentation**: Swagger/OpenAPI

## 📋 Prérequis

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optionnel)

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone <repository-url>
cd backend
```

### 2. Installer les dépendances
```bash
pnpm install
```

### 3. Configuration de l'environnement
```bash
cp env.example .env
```

Éditer le fichier `.env` avec vos configurations :
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/luneo"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-32-chars-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars-long"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# AI Providers
OPENAI_API_KEY="sk-..."
REPLICATE_API_TOKEN="r8_..."
```

### 4. Base de données
```bash
# Générer le client Prisma
pnpm prisma generate

# Créer les migrations
pnpm prisma migrate dev --name init

# Seed la base de données
pnpm seed
```

### 5. Lancer l'application
```bash
# Développement
pnpm dev

# Production
pnpm build
pnpm start:prod
```

## 🐳 Docker

### Développement local
```bash
# Lancer tous les services
docker-compose up --build

# Services disponibles :
# - API: http://localhost:3000
# - Swagger: http://localhost:3000/api/docs
# - Adminer: http://localhost:8080
# - Redis: localhost:6379
```

### Production
```bash
# Build l'image
docker build -t luneo-backend .

# Lancer le conteneur
docker run -p 3000:3000 luneo-backend
```

## 📚 API Documentation

Une fois l'application lancée, la documentation Swagger est disponible à :
- **Développement**: http://localhost:3000/api/docs
- **Production**: https://api.luneo.com/api/docs

## 🔐 Authentification

### Inscription
```bash
POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Connexion
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Utilisation du token
```bash
Authorization: Bearer <access_token>
```

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e

# Couverture de code
pnpm test:cov

# Tests en mode watch
pnpm test:watch
```

## 📊 Monitoring

### Health Check
```bash
GET /health
```

### Métriques Prometheus
```bash
GET /metrics
```

## 🔧 Scripts disponibles

```bash
# Développement
pnpm dev              # Lancer en mode développement
pnpm build            # Build de production
pnpm start            # Lancer en production
pnpm start:debug      # Lancer en mode debug

# Base de données
pnpm migrate          # Appliquer les migrations
pnpm migrate:dev      # Créer une nouvelle migration
pnpm generate         # Générer le client Prisma
pnpm seed             # Seed la base de données
pnpm studio           # Ouvrir Prisma Studio

# Tests
pnpm test             # Tests unitaires
pnpm test:e2e         # Tests E2E
pnpm test:cov         # Couverture de code

# Qualité de code
pnpm lint             # Linting
pnpm format           # Formatage du code

# Docker
pnpm docker:build     # Build l'image Docker
pnpm docker:run       # Lancer avec Docker Compose
```

## 🏢 Structure du projet

```
backend/
├── src/
│   ├── config/           # Configuration
│   ├── modules/          # Modules NestJS
│   │   ├── auth/         # Authentification
│   │   ├── users/        # Gestion utilisateurs
│   │   ├── brands/       # Gestion marques
│   │   ├── products/     # Catalogue produits
│   │   ├── designs/      # Génération IA
│   │   ├── orders/       # Commandes
│   │   ├── ai/           # Services IA
│   │   ├── webhooks/     # Webhooks
│   │   └── admin/        # Administration
│   ├── common/           # Utilitaires communs
│   ├── jobs/             # Jobs BullMQ
│   └── libs/             # Services externes
├── prisma/               # Schéma et migrations
├── tests/                # Tests
├── docker-compose.yml    # Services Docker
├── Dockerfile           # Image Docker
└── package.json         # Dépendances
```

## 🔒 Sécurité

- **Rate Limiting**: Limitation de débit par IP
- **CORS**: Configuration sécurisée
- **Helmet**: Headers de sécurité
- **Validation**: Validation des entrées avec class-validator
- **Sanitisation**: Protection XSS et injection SQL
- **JWT**: Tokens sécurisés avec refresh
- **RBAC**: Contrôle d'accès basé sur les rôles

## 📈 Multi-tenant

Le système supporte le multi-tenant avec :
- Isolation des données par marque
- Contrôle d'accès granulaire
- Quotas par utilisateur
- Webhooks par marque

## 🤖 IA Integration

- **OpenAI**: DALL-E, GPT-4
- **Replicate**: Stable Diffusion
- **Coût tracking**: Suivi des coûts par marque
- **Cache**: Réutilisation des prompts similaires
- **Queue**: Traitement asynchrone

## 💳 Paiements

- **Stripe**: Checkout, webhooks
- **Calcul automatique**: TVA, frais de port
- **Statuts**: Suivi des commandes
- **Remboursements**: Gestion des annulations

## 🚀 Déploiement

### Variables d'environnement requises

```env
# Production
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
CLOUDINARY_CLOUD_NAME=...
OPENAI_API_KEY=...
SENTRY_DSN=...
```

### Déploiement sur Vercel

1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Déploiement sur AWS

1. Build l'image Docker
2. Push vers ECR
3. Déployer sur ECS/Fargate

## 🐛 Troubleshooting

### Problèmes courants

**Erreur de connexion à la base de données**
```bash
# Vérifier que PostgreSQL est lancé
sudo systemctl status postgresql

# Vérifier la connexion
psql -h localhost -U postgres -d luneo
```

**Erreur Redis**
```bash
# Vérifier que Redis est lancé
redis-cli ping

# Redémarrer Redis
sudo systemctl restart redis
```

**Erreur de migration**
```bash
# Reset la base de données
pnpm prisma migrate reset

# Recréer les migrations
pnpm prisma migrate dev --name init
```

## 📞 Support

- **Documentation**: `/docs`
- **Issues**: GitHub Issues
- **Email**: support@luneo.com

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.
