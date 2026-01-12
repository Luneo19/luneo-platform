# 📋 PLAN DE MISE EN PLACE - SCORE 90/100
## Guide Complet d'Installation et Configuration

**Date** : Janvier 2025  
**Objectif** : Mise en place complète pour atteindre 90/100

---

## 🚀 ÉTAPE 1 : INSTALLATION AUTOMATIQUE

### 1.1 Exécuter le Script d'Installation

```bash
# Rendre les scripts exécutables
chmod +x scripts/install-all-dependencies.sh
chmod +x scripts/setup-env.sh

# Installer toutes les dépendances
./scripts/install-all-dependencies.sh
```

**Ce script installe** :
- ✅ `passport-google-oauth20` (OAuth Google)
- ✅ `passport-github2` (OAuth GitHub)
- ✅ `exceljs` (Export Excel)
- ✅ `pdfkit` (Export PDF)
- ✅ `axios` (CAPTCHA service)

---

## 🔧 ÉTAPE 2 : CONFIGURATION ENVIRONNEMENT

### 2.1 Créer les Fichiers .env

```bash
# Créer automatiquement les fichiers .env
./scripts/setup-env.sh
```

### 2.2 Configurer les Variables d'Environnement

#### Backend (`apps/backend/.env`)

**OAuth Google** :
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet ou utiliser un existant
3. Activer Google+ API
4. Créer OAuth 2.0 credentials
5. Ajouter callback URL : `http://localhost:3001/api/v1/auth/google/callback`
6. Copier Client ID et Client Secret

**OAuth GitHub** :
1. Aller sur [GitHub Developer Settings](https://github.com/settings/developers)
2. Créer une nouvelle OAuth App
3. Callback URL : `http://localhost:3001/api/v1/auth/github/callback`
4. Copier Client ID et Client Secret

**reCAPTCHA** :
1. Aller sur [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Créer un site (v3)
3. Copier Site Key et Secret Key

#### Frontend (`apps/frontend/.env.local`)

**Analytics** :
- Google Analytics : Créer une propriété GA4 et copier Measurement ID
- Mixpanel : Créer un projet et copier le Token

---

## 🗄️ ÉTAPE 3 : BASE DE DONNÉES

### 3.1 Exécuter les Migrations Prisma

```bash
cd apps/backend
npx prisma migrate dev --name add_oauth_and_captcha
npx prisma generate
```

**Migrations incluses** :
- ✅ Champs 2FA (déjà fait)
- ✅ Indexes performance (déjà fait)
- ✅ OAuthAccount model (déjà présent)

---

## ✅ ÉTAPE 4 : VÉRIFICATION

### 4.1 Vérifier l'Installation

```bash
# Backend
cd apps/backend
npm run build

# Frontend
cd apps/frontend
npm run build
```

### 4.2 Démarrer les Services

```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

---

## 🧪 ÉTAPE 5 : TESTS

### 5.1 Tester OAuth

1. Aller sur `http://localhost:3000/login`
2. Cliquer sur "Continuer avec Google" ou "Continuer avec GitHub"
3. Vérifier la redirection et la connexion

### 5.2 Tester CAPTCHA

1. Aller sur `http://localhost:3000/register`
2. Remplir le formulaire
3. Vérifier que le CAPTCHA est vérifié (en dev, peut être désactivé)

### 5.3 Tester Analytics

1. Ouvrir la console navigateur
2. Vérifier que Google Analytics et Mixpanel sont initialisés
3. Naviguer sur le site et vérifier les événements trackés

### 5.4 Tester Export Analytics

1. Aller sur `http://localhost:3000/dashboard/analytics`
2. Cliquer sur "Exporter"
3. Tester PDF, Excel, CSV

---

## 📊 ÉTAPE 6 : MONITORING

### 6.1 Vérifier les Logs

```bash
# Backend logs
cd apps/backend
npm run start:dev | grep -i "oauth\|captcha\|analytics"
```

### 6.2 Vérifier les Erreurs

- Vérifier la console navigateur (F12)
- Vérifier les logs backend
- Vérifier Sentry (si configuré)

---

## 🎯 PROCHAINES ÉTAPES DE DÉVELOPPEMENT

Après l'installation, continuer avec :

1. **CDN Configuration** (3 jours) - +3 points
2. **Rate Limiting Tous Endpoints** (5 jours) - +2 points
3. **Monitoring Performance** (5 jours) - +2 points
4. **Tests E2E Critiques** (30 jours) - +5 points
5. **SSO Enterprise** (8 jours) - +2 points

**Score Final Attendu** : **92/100** 🌟

---

## ⚠️ DÉPANNAGE

### Erreur : "Cannot find module 'passport-google-oauth20'"

```bash
cd apps/backend
pnpm install passport-google-oauth20 passport-github2
```

### Erreur : "CAPTCHA verification failed"

En développement, le CAPTCHA peut être désactivé si non configuré.
En production, configurez les clés reCAPTCHA.

### Erreur : "OAuth callback failed"

Vérifier que les URLs de callback dans Google/GitHub correspondent à celles dans `.env`.

---

*Dernière mise à jour : Janvier 2025*
