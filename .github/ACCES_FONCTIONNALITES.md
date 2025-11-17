# 🎯 Guide d'Accès aux Fonctionnalités en Production

**Date**: 17 novembre 2025  
**URL Production**: https://frontend-luneos-projects.vercel.app

---

## ⚠️ IMPORTANT : Authentification Requise

**Les pages dashboard nécessitent une connexion pour être accessibles.**

Si vous voyez une erreur 404 sur `/dashboard/*`, c'est normal : vous devez d'abord vous connecter.

---

## 🔐 ÉTAPE 1 : Se Connecter

**URL de connexion**: https://frontend-luneos-projects.vercel.app/login

**Options de connexion**:
- Email + Mot de passe
- Google OAuth
- GitHub OAuth

**Pas encore de compte ?** → https://frontend-luneos-projects.vercel.app/register

---

## ✅ ÉTAPE 2 : Accéder aux Fonctionnalités (Après Connexion)

Une fois connecté, vous serez redirigé vers le dashboard et aurez accès à :

### 📊 Dashboard Principal
- **URL**: `/dashboard/overview`
- **Fonctionnalités**: Vue d'ensemble, statistiques, activité récente

### 🎨 AI Studio
- **URL**: `/dashboard/ai-studio`
- **Fonctionnalités**: Création de designs avec IA, génération d'images

### 🌐 AR Studio
- **URL**: `/dashboard/ar-studio`
- **Fonctionnalités**: Création d'expériences AR, conversion USDZ

### 📦 Products
- **URL**: `/dashboard/products`
- **Fonctionnalités**: Gestion des produits, configuration 3D

### 📚 Library
- **URL**: `/dashboard/library`
- **Fonctionnalités**: Bibliothèque de designs, templates

### 🛒 Orders
- **URL**: `/dashboard/orders`
- **Fonctionnalités**: Gestion des commandes

### 📈 Analytics
- **URL**: `/dashboard/analytics`
- **Fonctionnalités**: Statistiques et analyses

### 💳 Billing
- **URL**: `/dashboard/billing`
- **Fonctionnalités**: Facturation, abonnements

### 👑 Admin Panel
- **URL**: `/dashboard/admin/tenants`
- **Fonctionnalités**: Gestion des tenants, coûts, quotas (nécessite droits admin)

### ⚙️ Settings
- **URL**: `/dashboard/settings`
- **Fonctionnalités**: Paramètres du compte

### 👥 Team
- **URL**: `/dashboard/team`
- **Fonctionnalités**: Gestion de l'équipe

---

## 🌐 Pages Publiques (Sans Connexion)

Ces pages sont accessibles sans authentification :

### 🎮 Page de Démonstrations
**URL**: https://frontend-luneos-projects.vercel.app/demo

**Démos disponibles**:
- **Virtual Try-On**: `/demo/virtual-try-on` - Essayage AR en temps réel
- **3D Configurator**: `/demo/3d-configurator` - Configurateur 3D interactif
- **Bulk Generation**: `/demo/bulk-generation` - Génération IA massive
- **AR Export**: `/demo/ar-export` - Export AR pour iOS/Android/WebXR
- **Customizer**: `/demo/customizer` - Personnaliseur visuel
- **Asset Hub**: `/demo/asset-hub` - Hub d'assets 3D
- **Playground**: `/demo/playground` - Code playground pour tester le SDK

### 🥽 AR Viewer
**URL**: https://frontend-luneos-projects.vercel.app/ar/viewer

**Paramètres**:
- `?model=<URL_MODEL>` - URL du modèle 3D à afficher
- `?title=<TITRE>` - Titre du modèle (optionnel)

**Exemple**: `/ar/viewer?model=https://example.com/model.glb&title=Mon%20Produit`

---

## 🔌 API Backend

**URL Base**: https://backend-luneos-projects.vercel.app

### Endpoints Principaux

#### Designs
- `GET /api/designs` - Liste des designs
- `POST /api/designs` - Créer un design
- `GET /api/designs/:id` - Détails d'un design
- `POST /api/designs/:id/masks` - Upload de masques (3D selection)

#### Products
- `GET /api/products` - Liste des produits
- `POST /api/products` - Créer un produit

#### AR
- `GET /api/designs/:id/ar` - Conversion AR (GLTF → USDZ)

#### Widget Embed
- `GET /api/embed/token?shop=<shop>` - Token pour widget embed

#### Shopify
- `GET /api/shopify/install` - Installation Shopify OAuth
- `GET /api/shopify/callback` - Callback OAuth
- `POST /api/shopify/webhooks/products` - Webhooks produits

#### Admin
- `GET /api/admin/tenants` - Liste des tenants (admin uniquement)

#### GDPR
- `POST /api/data/export` - Export données utilisateur
- `DELETE /api/data/erase` - Suppression données utilisateur

**Note**: Tous les endpoints API nécessitent un token JWT valide (sauf endpoints publics).

---

## 🆕 Fonctionnalités Ajoutées par les Agents

### ✅ AGENT_SHOPIFY
- Intégration Shopify complète
- OAuth flow
- Webhooks produits
- Endpoints: `/api/shopify/*`

### ✅ AGENT_WIDGET
- SDK widget embed
- Token endpoint: `/api/embed/token`
- Handshake iframe sécurisé

### ✅ AGENT_3D
- Outil de sélection 3D (raycast)
- Upload masques: `/api/designs/:id/masks`
- Reprojection UV

### ✅ AGENT_AR
- Conversion GLTF → USDZ
- AR Viewer: `/ar/viewer`
- Endpoint conversion: `/api/designs/:id/ar`

### ✅ AGENT_AI
- Worker IA pour rendus
- Génération d'images avec IA
- Comptabilité tokens/costs

### ✅ AGENT_BILLING
- Intégration Stripe
- Usage billing
- Admin tenants: `/dashboard/admin/tenants`

### ✅ AGENT_COMPLIANCE
- Export données GDPR: `/api/data/export`
- Suppression données: `/api/data/erase`

---

## 📝 Checklist d'Accès

- [ ] Se connecter sur `/login`
- [ ] Créer un compte si nécessaire sur `/register`
- [ ] Accéder au dashboard `/dashboard/overview`
- [ ] Explorer les fonctionnalités depuis le menu sidebar
- [ ] Tester les démos publiques sur `/demo`
- [ ] Tester l'AR Viewer sur `/ar/viewer`

---

## 🔗 Liens Rapides

- **Frontend**: https://frontend-luneos-projects.vercel.app
- **Backend API**: https://backend-luneos-projects.vercel.app
- **Connexion**: https://frontend-luneos-projects.vercel.app/login
- **Inscription**: https://frontend-luneos-projects.vercel.app/register
- **Dashboard**: https://frontend-luneos-projects.vercel.app/dashboard/overview (après connexion)
- **Demos**: https://frontend-luneos-projects.vercel.app/demo
- **AR Viewer**: https://frontend-luneos-projects.vercel.app/ar/viewer

---

## ❓ Problèmes Courants

### Erreur 404 sur les pages dashboard
**Solution**: Connectez-vous d'abord sur `/login`

### Erreur d'authentification sur les API
**Solution**: Vérifiez que vous avez un token JWT valide dans les headers

### Page AR Viewer ne charge pas
**Solution**: Vérifiez que vous fournissez le paramètre `?model=<URL>` dans l'URL

---

**Dernière mise à jour**: 17 novembre 2025

