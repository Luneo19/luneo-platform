# 🚀 LUNEO AI - Plateforme B2B Premium

## 📋 Vue d'ensemble

Luneo AI est une plateforme SaaS B2B premium pour la personnalisation de produits avec IA. Cette refonte transforme l'architecture existante en une solution moderne, scalable et professionnelle.

### 🎯 Objectifs de la refonte

- ✅ **UI/UX Premium** : Design inspiré d'Apple, Linear, Stripe
- ✅ **Architecture Scalable** : Multi-tenant, microservices
- ✅ **Widgets Embed** : Composants réutilisables
- ✅ **Analytics Avancés** : Dashboard B2B professionnel
- ✅ **Intégrations Omnicanales** : Shopify, WooCommerce, API REST

## 🏗️ Architecture

```
luneo-refonte/
├── luneo-dashboard/          # Frontend B2B Premium (Next.js)
├── luneo-widgets/            # Widgets Embed (React + Vite)
└── saas-backend/             # Backend API (Express.js)
```

### 📊 Stack Technique

| Composant | Technologie | Description |
|-----------|-------------|-------------|
| **Frontend** | Next.js 15 + Tailwind + shadcn/ui | Dashboard B2B premium |
| **Widgets** | React + Vite + Framer Motion | Composants embed |
| **Backend** | Express.js + Supabase | API REST + Base de données |
| **IA** | OpenAI API | Génération d'images et 3D |
| **Billing** | Stripe | Facturation et abonnements |
| **Storage** | Cloudinary | Stockage de fichiers |
| **Auth** | Passport.js + OAuth | Authentification multi-providers |

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 20+
- npm ou yarn
- Compte Supabase
- Clés API (OpenAI, Cloudinary, Stripe)

### 1. Backend (saas-backend)

```bash
cd saas-backend

# Installation des dépendances
npm install

# Configuration des variables d'environnement
cp env.example .env
# Éditer .env avec vos clés API

# Démarrage en développement
npm run dev

# Démarrage en production
npm start
```

### 2. Frontend Dashboard (luneo-dashboard)

```bash
cd luneo-dashboard

# Installation des dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec l'URL de votre API

# Démarrage en développement
npm run dev

# Build pour production
npm run build
npm start
```

### 3. Widgets Embed (luneo-widgets)

```bash
cd luneo-widgets

# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Build pour production
npm run build
```

## 🔧 Configuration

### Variables d'environnement Backend (.env)

```env
# Base de données
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# IA
OPENAI_API_KEY=your_openai_api_key

# Stockage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentification
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_char_encryption_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Billing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_PRO=your_stripe_price_id
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
```

### Variables d'environnement Frontend (.env.local)

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase (si utilisé côté client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📊 Base de données

### Configuration Supabase

1. Créez un projet Supabase
2. Exécutez les scripts SQL dans l'ordre :

```sql
-- 1. Schéma de base
\i database-setup.sql

-- 2. Ajout des colonnes OAuth
\i setup-database-simple.sql

-- 3. Correction des contraintes
\i fix-all-constraints.sql
```

### Tables principales

- `users` : Utilisateurs et authentification
- `clients` : Organisations multi-tenant
- `products` : Produits générés
- `orders` : Commandes et transactions
- `analytics` : Métriques et événements

## 🎨 Design System

### Palette de couleurs

```css
:root {
  --primary: #0071e3;        /* Apple Blue */
  --primary-dark: #0056b3;
  --secondary: #6e6e73;      /* Gris neutre */
  --success: #34c759;        /* Vert succès */
  --warning: #ff9500;        /* Orange avertissement */
  --error: #ff3b30;          /* Rouge erreur */
  --gold: #d4af37;           /* Or accent */
}
```

### Typographie

- **Sans-serif** : Inter (UI, textes)
- **Display** : Playfair Display (titres)
- **Mono** : SF Mono (code, données)

### Composants

- **Cards** : Bordures subtiles, ombres douces
- **Buttons** : Styles cohérents avec hover effects
- **Inputs** : Focus states élégants
- **Tables** : Design épuré avec tri/filtres
- **Modals** : Overlay subtil, animations fluides

## 🚀 Déploiement

### Backend (Railway/Heroku)

```bash
# Railway
railway login
railway init
railway up

# Heroku
heroku create luneo-api
git push heroku main
```

### Frontend (Vercel)

```bash
# Vercel
vercel login
vercel --prod
```

### Variables d'environnement Production

Configurez toutes les variables d'environnement dans votre plateforme de déploiement :

- **Railway/Heroku** : Variables d'environnement du backend
- **Vercel** : Variables d'environnement du frontend

## 📈 Analytics et Monitoring

### Métriques clés

- **Chiffre d'affaires** : CA total et par période
- **Commandes** : Nombre et valeur des commandes
- **Clients actifs** : Utilisateurs actifs par mois
- **Taux de conversion** : Conversion visiteurs → clients
- **Performance IA** : Temps de génération, succès

### Monitoring

- **Sentry** : Gestion d'erreurs
- **PostHog** : Analytics utilisateurs
- **Uptime Robot** : Monitoring disponibilité

## 🔌 Intégrations

### Shopify

```javascript
// Configuration automatique
POST /api/shopify/configure
{
  "shop_domain": "ma-boutique.myshopify.com",
  "shopify_token": "shpat_...",
  "shopify_product_id": "1234567890"
}
```

### Widgets Embed

```html
<!-- Widget 3D/AR -->
<script src="https://widgets.luneo.ai/dist/product3d.js"></script>
<luneo-product3d product-id="123" theme="light"></luneo-product3d>

<!-- Widget Analytics -->
<script src="https://widgets.luneo.ai/dist/analytics.js"></script>
<luneo-analytics api-key="your_api_key"></luneo-analytics>
```

## 🧪 Tests

### Backend

```bash
cd saas-backend
npm test
```

### Frontend

```bash
cd luneo-dashboard
npm run test
```

### E2E

```bash
npm run test:e2e
```

## 📚 Documentation

- [Guide API](docs/api.md)
- [Guide Widgets](docs/widgets.md)
- [Guide Déploiement](docs/deployment.md)
- [Guide Intégrations](docs/integrations.md)

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation** : [docs.luneo.ai](https://docs.luneo.ai)
- **Email** : support@luneo.ai
- **Discord** : [discord.gg/luneo](https://discord.gg/luneo)
- **GitHub Issues** : [github.com/luneo-ai/issues](https://github.com/luneo-ai/issues)

## 🎯 Roadmap

### Phase 1 : MVP (Semaine 1-2)
- [x] Architecture backend consolidée
- [x] Design system premium
- [x] Dashboard analytics
- [x] Authentification OAuth

### Phase 2 : Features B2B (Semaine 3-4)
- [ ] Gestion multi-tenant avancée
- [ ] Analytics et reporting
- [ ] Intégrations omnicanales
- [ ] Billing et facturation

### Phase 3 : Widgets et SDK (Semaine 5-6)
- [ ] Widgets embed réutilisables
- [ ] SDK pour développeurs
- [ ] Documentation API
- [ ] Exemples d'intégration

### Phase 4 : Optimisation (Semaine 7-8)
- [ ] Performance et scalabilité
- [ ] Tests et monitoring
- [ ] Documentation utilisateur
- [ ] Formation et support

---

**Luneo AI** - Transformez votre e-commerce avec l'IA 🚀
