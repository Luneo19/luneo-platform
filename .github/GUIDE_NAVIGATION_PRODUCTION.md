# 🧭 Guide de Navigation - Fonctionnalités en Production

**Date**: 17 novembre 2025  
**URL Production**: https://frontend-luneos-projects.vercel.app

---

## 🎯 Fonctionnalités Principales

### 📊 Dashboard (Nécessite Connexion)

**URL**: https://frontend-luneos-projects.vercel.app/dashboard/overview

**Pages disponibles**:
- **Overview** - Vue d'ensemble: `/dashboard/overview`
- **AI Studio** - Création avec IA: `/dashboard/ai-studio`
- **AR Studio** - Réalité augmentée: `/dashboard/ar-studio`
- **Products** - Gestion produits: `/dashboard/products`
- **Library** - Bibliothèque de designs: `/dashboard/library`
- **Orders** - Gestion commandes: `/dashboard/orders`
- **Analytics** - Statistiques: `/dashboard/analytics`
- **Billing** - Facturation: `/dashboard/billing`
- **Plans** - Plans tarifaires: `/dashboard/plans`
- **Settings** - Paramètres: `/dashboard/settings`
- **Team** - Gestion équipe: `/dashboard/team`
- **Monitoring** - Monitoring: `/dashboard/monitoring`
- **Integrations** - Intégrations: `/dashboard/integrations-dashboard`

### 👑 Admin Panel

**URL**: https://frontend-luneos-projects.vercel.app/dashboard/admin/tenants

**Fonctionnalités**:
- Gestion des tenants
- Vue d'ensemble des coûts
- Usage et quotas par tenant
- Recommandations

### 🎨 Outils de Design

**3D View**: `/dashboard/3d-view/[productId]`
- Visualisation 3D des produits

**Configure 3D**: `/dashboard/configure-3d/[productId]`
- Configuration 3D des produits

**Customize**: `/dashboard/customize/[productId]`
- Personnalisation de produits

**Try-On**: `/dashboard/try-on/[productId]`
- Essayage virtuel

**Virtual Try-On**: `/dashboard/virtual-try-on`
- Essayage virtuel général

### 🌐 AR (Réalité Augmentée)

**AR Viewer**: https://frontend-luneos-projects.vercel.app/ar/viewer
- Visualiseur AR pour modèles 3D

**AR Studio**: `/dashboard/ar-studio`
- Studio de création AR

---

## 🔌 API Backend

**URL Base**: https://backend-luneos-projects.vercel.app

### Endpoints Principaux

**Designs**:
- `GET /api/designs` - Liste des designs
- `POST /api/designs` - Créer un design
- `GET /api/designs/:id` - Détails d'un design
- `POST /api/designs/:id/masks` - Upload de masques

**Products**:
- `GET /api/products` - Liste des produits
- `POST /api/products` - Créer un produit

**AR**:
- `GET /api/designs/:id/ar` - Conversion AR (USDZ)

**Admin**:
- `GET /api/admin/tenants` - Liste des tenants (admin)

**Widget**:
- `GET /api/embed/token` - Token pour widget embed

**Shopify**:
- `GET /api/shopify/install` - Installation Shopify
- `GET /api/shopify/callback` - Callback OAuth
- `POST /api/shopify/webhooks/products` - Webhooks produits

**GDPR**:
- `POST /api/data/export` - Export données utilisateur
- `DELETE /api/data/erase` - Suppression données utilisateur

---

## 🎮 Démonstrations Publiques

**Demos**: https://frontend-luneos-projects.vercel.app/demo

**Pages disponibles**:
- `/demo` - Page principale démos
- `/demo/3d-configurator` - Configurateur 3D
- `/demo/ar-export` - Export AR
- `/demo/customizer` - Personnaliseur
- `/demo/asset-hub` - Hub d'assets
- `/demo/configurator-3d` - Configurateur 3D alternatif
- `/demo/bulk-generation` - Génération en masse
- `/demo/virtual-try-on` - Essayage virtuel
- `/demo/playground` - Playground

---

## 🔐 Authentification

**Connexion**: https://frontend-luneos-projects.vercel.app/login
**Inscription**: https://frontend-luneos-projects.vercel.app/register

---

## 📱 Comment Accéder aux Fonctionnalités

### Étape 1: Se Connecter
1. Aller sur: https://frontend-luneos-projects.vercel.app/login
2. Se connecter avec vos identifiants

### Étape 2: Accéder au Dashboard
Une fois connecté, vous serez redirigé vers `/dashboard/overview`

### Étape 3: Naviguer vers les Fonctionnalités
- **AI Studio**: Cliquer sur "AI Studio" dans le menu ou aller sur `/dashboard/ai-studio`
- **AR Studio**: Cliquer sur "AR Studio" dans le menu ou aller sur `/dashboard/ar-studio`
- **Admin**: Aller sur `/dashboard/admin/tenants` (nécessite droits admin)
- **Products**: Aller sur `/dashboard/products` pour gérer vos produits
- **Library**: Aller sur `/dashboard/library` pour voir vos designs

---

## 🆕 Fonctionnalités Ajoutées Récemment

### Par les Agents Cursor

1. **AGENT_SHOPIFY** - Intégration Shopify
   - Installation OAuth
   - Webhooks produits
   - Endpoint: `/api/shopify/*`

2. **AGENT_WIDGET** - Widget Embed
   - SDK widget
   - Token endpoint: `/api/embed/token`
   - Handshake iframe

3. **AGENT_3D** - Outils 3D
   - SelectionTool component
   - Upload masques: `/api/designs/:id/masks`
   - Reprojection UV

4. **AGENT_AR** - Réalité Augmentée
   - Conversion GLTF → USDZ
   - AR Viewer: `/ar/viewer`
   - Endpoint: `/api/designs/:id/ar`

5. **AGENT_AI** - Pipeline IA
   - Worker IA pour rendus
   - Génération d'images
   - Comptabilité tokens/costs

6. **AGENT_BILLING** - Facturation
   - Intégration Stripe
   - Usage billing
   - Admin tenants: `/dashboard/admin/tenants`

7. **AGENT_COMPLIANCE** - GDPR
   - Export données: `/api/data/export`
   - Suppression données: `/api/data/erase`

---

## 🔗 Liens Rapides

- **Frontend**: https://frontend-luneos-projects.vercel.app
- **Backend API**: https://backend-luneos-projects.vercel.app
- **Dashboard**: https://frontend-luneos-projects.vercel.app/dashboard/overview
- **AI Studio**: https://frontend-luneos-projects.vercel.app/dashboard/ai-studio
- **AR Studio**: https://frontend-luneos-projects.vercel.app/dashboard/ar-studio
- **Admin**: https://frontend-luneos-projects.vercel.app/dashboard/admin/tenants
- **AR Viewer**: https://frontend-luneos-projects.vercel.app/ar/viewer
- **Demos**: https://frontend-luneos-projects.vercel.app/demo

---

## 📝 Notes

- Certaines fonctionnalités nécessitent une authentification
- Les pages admin nécessitent des droits administrateur
- Les endpoints API nécessitent un token JWT valide
- Le widget nécessite un token embed obtenu via `/api/embed/token`

---

**Dernière mise à jour**: 17 novembre 2025

