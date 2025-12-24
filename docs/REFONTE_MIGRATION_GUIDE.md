# 🔄 GUIDE DE MIGRATION - LUNEO AI

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la migration de votre architecture existante vers la nouvelle plateforme Luneo AI B2B Premium.

## 🎯 Objectifs de la migration

- ✅ **Préserver** : Logique métier existante, intégrations Shopify
- ✅ **Moderniser** : UI/UX premium, architecture scalable
- ✅ **Étendre** : Widgets embed, analytics avancés
- ✅ **Optimiser** : Performance, sécurité, maintenabilité

## 📊 État actuel vs Objectif

| Aspect | Avant | Après |
|--------|-------|-------|
| **UI/UX** | Back-office basique | Design premium Apple-like |
| **Architecture** | Monolithique | Multi-tenant scalable |
| **Frontend** | HTML/CSS simple | Next.js + Design System |
| **Widgets** | Aucun | Composants embed réutilisables |
| **Analytics** | Basiques | Dashboard B2B professionnel |
| **Intégrations** | Shopify uniquement | Omnicanales (Shopify, WooCommerce, API) |

## 🚀 Plan de migration

### Phase 1 : Préparation (Jour 1-2)

#### 1.1 Sauvegarde des données

```bash
# Sauvegarde de la base de données
pg_dump your_database > backup_$(date +%Y%m%d).sql

# Sauvegarde des fichiers
tar -czf backup_files_$(date +%Y%m%d).tar.gz /path/to/uploads/
```

#### 1.2 Audit de l'existant

```bash
# Analyse des routes utilisées
grep -r "app.get\|app.post" saas-backend/

# Analyse des intégrations
grep -r "shopify\|openai\|cloudinary" saas-backend/
```

#### 1.3 Configuration de l'environnement

```bash
# Création de l'environnement de développement
mkdir luneo-refonte
cd luneo-refonte

# Clonage des nouveaux projets
git clone https://github.com/luneo-ai/dashboard.git luneo-dashboard
git clone https://github.com/luneo-ai/widgets.git luneo-widgets
```

### Phase 2 : Migration Backend (Jour 3-5)

#### 2.1 Migration des routes

**Avant (saas-backend/index.js) :**
```javascript
// Routes existantes à migrer
app.use('/api/generate', generateRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/auth', authRoutes);
```

**Après (luneo-api/src/routes/) :**
```javascript
// Structure modulaire
src/
├── routes/
│   ├── generate.js      # Génération IA
│   ├── shopify.js       # Intégrations Shopify
│   ├── auth.js          # Authentification
│   ├── analytics.js     # Analytics B2B
│   └── billing.js       # Facturation
```

#### 2.2 Migration des services

**Avant :**
```javascript
// services/imageProvider.js
async function generateImage(prompt) {
  // Logique existante
}
```

**Après :**
```javascript
// services/ai/
├── imageGenerator.js    # Génération d'images
├── modelGenerator.js    # Génération 3D
└── analytics.js         # Insights IA
```

#### 2.3 Migration de la base de données

```sql
-- Migration des données existantes
INSERT INTO new_users (id, email, name, created_at)
SELECT id, email, name, created_at FROM old_users;

-- Migration des produits
INSERT INTO new_products (id, name, image_url, glb_url, client_id)
SELECT id, name, image_url, glb_url, client_id FROM old_products;
```

### Phase 3 : Migration Frontend (Jour 6-8)

#### 3.1 Migration des pages

**Avant (views/) :**
```html
<!-- views/dashboard.html -->
<div class="dashboard">
  <!-- Interface basique -->
</div>
```

**Après (luneo-dashboard/src/app/) :**
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <Header />
      <DashboardContent />
    </div>
  )
}
```

#### 3.2 Migration des composants

**Avant :**
```html
<!-- Composants HTML simples -->
<button class="btn btn-primary">Générer</button>
```

**Après :**
```typescript
// components/ui/button.tsx
export function Button({ variant, size, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }))} {...props}>
      {children}
    </button>
  )
}
```

#### 3.3 Migration des styles

**Avant :**
```css
/* public/css/theme.css */
.btn-primary {
  background-color: var(--primary-color);
}
```

**Après :**
```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        // Design system complet
      }
    }
  }
}
```

### Phase 4 : Intégration des Widgets (Jour 9-10)

#### 4.1 Création des widgets embed

```typescript
// luneo-widgets/src/components/Product3D.tsx
export function Product3D({ productId, theme = 'light' }) {
  return (
    <div className={`luneo-product3d theme-${theme}`}>
      {/* Widget 3D/AR */}
    </div>
  )
}
```

#### 4.2 Intégration dans les sites clients

```html
<!-- Intégration simple -->
<script src="https://widgets.luneo.ai/dist/product3d.js"></script>
<luneo-product3d product-id="123" theme="light"></luneo-product3d>
```

### Phase 5 : Tests et Validation (Jour 11-12)

#### 5.1 Tests unitaires

```bash
# Tests backend
cd luneo-api
npm test

# Tests frontend
cd luneo-dashboard
npm test

# Tests widgets
cd luneo-widgets
npm test
```

#### 5.2 Tests d'intégration

```bash
# Tests API
npm run test:integration

# Tests E2E
npm run test:e2e
```

#### 5.3 Validation des fonctionnalités

- [ ] Authentification OAuth
- [ ] Génération d'images IA
- [ ] Intégration Shopify
- [ ] Dashboard analytics
- [ ] Widgets embed

## 🔧 Configuration post-migration

### 5.1 Variables d'environnement

```env
# Production
NODE_ENV=production
API_URL=https://api.luneo.ai
FRONTEND_URL=https://app.luneo.ai
WIDGETS_URL=https://widgets.luneo.ai
```

### 5.2 Monitoring

```javascript
// Sentry pour la gestion d'erreurs
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

### 5.3 Analytics

```javascript
// PostHog pour les analytics
import posthog from 'posthog-js'

posthog.init('your-posthog-key', {
  api_host: 'https://app.posthog.com'
})
```

## 📊 Validation de la migration

### Métriques de succès

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| **Performance** | < 2s temps de chargement | Lighthouse Score |
| **Disponibilité** | 99.9% uptime | Uptime Robot |
| **Erreurs** | < 0.1% taux d'erreur | Sentry |
| **Adoption** | 100% des utilisateurs migrés | Analytics |

### Checklist de validation

- [ ] **Backend** : Toutes les routes fonctionnent
- [ ] **Frontend** : Interface premium opérationnelle
- [ ] **Base de données** : Données migrées sans perte
- [ ] **Intégrations** : Shopify connecté et fonctionnel
- [ ] **Widgets** : Composants embed testés
- [ ] **Analytics** : Dashboard B2B opérationnel
- [ ] **Performance** : Temps de réponse optimisés
- [ ] **Sécurité** : Authentification et autorisation

## 🚨 Gestion des risques

### Risques identifiés

1. **Perte de données** : Sauvegarde complète avant migration
2. **Temps d'arrêt** : Migration en maintenance window
3. **Incompatibilités** : Tests approfondis avant déploiement
4. **Performance** : Monitoring continu post-migration

### Plan de rollback

```bash
# Rollback rapide si nécessaire
git checkout previous-version
npm install
npm start

# Restauration de la base de données
psql -d database_name -f backup.sql
```

## 📚 Ressources

### Documentation

- [Guide API](docs/api.md)
- [Guide Widgets](docs/widgets.md)
- [Guide Déploiement](docs/deployment.md)

### Support

- **Email** : migration@luneo.ai
- **Slack** : #migration-support
- **Documentation** : docs.luneo.ai/migration

## 🎯 Prochaines étapes

### Immédiat (Semaine 1)

1. **Validation** : Tests complets de la migration
2. **Formation** : Équipe utilisateurs
3. **Monitoring** : Mise en place des alertes

### Court terme (Semaine 2-4)

1. **Optimisation** : Performance et UX
2. **Features** : Nouvelles fonctionnalités B2B
3. **Intégrations** : WooCommerce, autres plateformes

### Long terme (Mois 2-3)

1. **Scale** : Nouveaux marchés
2. **Innovation** : IA avancée, AR/VR
3. **Partnerships** : Intégrations tierces

---

**Luneo AI** - Migration réussie vers l'excellence B2B 🚀
