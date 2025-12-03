# 🔧 GUIDE CONFIGURATION MONITORING - Sentry & Google Analytics

**Date:** 30 Novembre 2025  
**Objectif:** Activer le monitoring complet pour Luneo en production

---

## 📊 1. SENTRY (Error Tracking)

### Étape 1: Créer un compte Sentry

1. Aller sur https://sentry.io/signup/
2. Créer un compte (ou se connecter)
3. Choisir le plan **Developer** (gratuit jusqu'à 5K events/mois)

### Étape 2: Créer un projet

1. Dans le dashboard Sentry, cliquer sur **"Create Project"**
2. Sélectionner **"Next.js"**
3. Nom du projet: **"luneo-frontend"**
4. Team: Créer ou sélectionner votre team
5. Cliquer sur **"Create Project"**

### Étape 3: Récupérer le DSN

1. Après création, Sentry affiche le **DSN** (Data Source Name)
2. Il ressemble à: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. **Copier ce DSN**

### Étape 4: Ajouter dans Vercel

1. Aller sur https://vercel.com/luneos-projects/frontend/settings/environment-variables
2. Cliquer sur **"Add New"**
3. Remplir:
   - **Key:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** Coller le DSN copié depuis Sentry
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Cliquer sur **"Save"**

### Étape 5: Redéployer

```bash
# Option 1: Via Vercel Dashboard
# Aller sur Deployments → Redeploy

# Option 2: Via Git
git commit --allow-empty -m "chore: activate Sentry monitoring"
git push
```

### Vérification

1. Aller sur https://luneo.app
2. Ouvrir la console du navigateur (F12)
3. Vous devriez voir: `Sentry initialized`
4. Dans Sentry Dashboard → Issues, vous verrez les erreurs capturées

---

## 📈 2. GOOGLE ANALYTICS 4 (GA4)

### Étape 1: Créer un compte Google Analytics

1. Aller sur https://analytics.google.com/
2. Se connecter avec votre compte Google
3. Cliquer sur **"Start measuring"**

### Étape 2: Créer une propriété

1. **Nom du compte:** Luneo
2. **Nom de la propriété:** Luneo Platform
3. **Fuseau horaire:** Europe/Paris
4. **Devise:** EUR (€)
5. Cliquer sur **"Next"**

### Étape 3: Configurer les informations business

1. **Industrie:** Technology / Software
2. **Taille:** Small (1-10 employés)
3. **Objectifs:** 
   - ✅ Générer des leads
   - ✅ Augmenter les ventes en ligne
   - ✅ Augmenter l'engagement
4. Cliquer sur **"Create"**

### Étape 4: Accepter les conditions

1. Lire et accepter les conditions d'utilisation
2. Cliquer sur **"I Accept"**

### Étape 5: Récupérer le Measurement ID

1. Dans la page de configuration, vous verrez **"Data Streams"**
2. Cliquer sur **"Add stream"** → **"Web"**
3. Remplir:
   - **Website URL:** https://luneo.app
   - **Stream name:** Luneo Production
4. Cliquer sur **"Create stream"**
5. **Copier le Measurement ID** (format: `G-XXXXXXXXXX`)

### Étape 6: Ajouter dans Vercel

1. Aller sur https://vercel.com/luneos-projects/frontend/settings/environment-variables
2. Cliquer sur **"Add New"**
3. Remplir:
   - **Key:** `NEXT_PUBLIC_GA_ID`
   - **Value:** Coller le Measurement ID (ex: `G-XXXXXXXXXX`)
   - **Environments:** ✅ Production, ✅ Preview
4. Cliquer sur **"Save"**

### Étape 7: Redéployer

```bash
# Via Git
git commit --allow-empty -m "chore: activate Google Analytics"
git push
```

### Vérification

1. Aller sur https://luneo.app
2. Ouvrir les DevTools (F12) → Network
3. Filtrer par "google-analytics"
4. Vous devriez voir des requêtes vers `www.google-analytics.com`
5. Dans GA4 Dashboard → Realtime, vous verrez les visiteurs en temps réel

---

## ✅ CHECKLIST FINALE

### Sentry
- [ ] Compte Sentry créé
- [ ] Projet "luneo-frontend" créé
- [ ] DSN copié
- [ ] Variable `NEXT_PUBLIC_SENTRY_DSN` ajoutée dans Vercel
- [ ] Redéploiement effectué
- [ ] Erreurs visibles dans Sentry Dashboard

### Google Analytics
- [ ] Compte GA4 créé
- [ ] Propriété "Luneo Platform" créée
- [ ] Data Stream configuré
- [ ] Measurement ID copié
- [ ] Variable `NEXT_PUBLIC_GA_ID` ajoutée dans Vercel
- [ ] Redéploiement effectué
- [ ] Visiteurs visibles dans GA4 Realtime

---

## 🎯 ÉVÉNEMENTS TRACKÉS

### Google Analytics

Les événements suivants sont automatiquement trackés:

| Événement | Catégorie | Quand |
|-----------|-----------|-------|
| `page_view` | Navigation | Chaque changement de page |
| `purchase` | E-commerce | Checkout Stripe complété |
| `sign_up` | User | Inscription utilisateur |
| `login` | User | Connexion utilisateur |

### Sentry

Les erreurs suivantes sont automatiquement capturées:

- ✅ Erreurs JavaScript non catchées
- ✅ Erreurs réseau (avec contexte)
- ✅ Erreurs React (Error Boundaries)
- ✅ Performance issues (lenteurs)
- ✅ Session Replay (pour debug)

---

## 📊 DASHBOARDS

### Sentry Dashboard
**URL:** https://sentry.io/organizations/[votre-org]/projects/luneo-frontend/

**Métriques disponibles:**
- Erreurs par type
- Fréquence des erreurs
- Utilisateurs affectés
- Performance (temps de chargement)
- Session Replay

### Google Analytics Dashboard
**URL:** https://analytics.google.com/

**Rapports disponibles:**
- Realtime (visiteurs en direct)
- Acquisition (sources de trafic)
- Engagement (pages vues, durée)
- Conversions (checkouts, inscriptions)
- Démographie (pays, appareils)

---

## 🔒 SÉCURITÉ

### Variables sensibles

Les variables suivantes sont **publiques** (préfixe `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SENTRY_DSN` - OK, c'est public par design
- `NEXT_PUBLIC_GA_ID` - OK, c'est public par design

Ces variables sont **sécurisées** car:
- Sentry DSN: Ne permet que d'envoyer des erreurs, pas de lire les données
- GA ID: Ne permet que d'envoyer des événements, pas d'accéder aux données

---

## 🚀 PROCHAINES ÉTAPES

Une fois configuré:

1. **Sentry:**
   - Configurer des alertes email pour les erreurs critiques
   - Créer des releases pour suivre les déploiements
   - Configurer des règles de filtrage pour réduire le bruit

2. **Google Analytics:**
   - Configurer des objectifs de conversion (checkout, inscription)
   - Créer des audiences personnalisées
   - Configurer des rapports personnalisés

---

**✅ Configuration terminée !**

Votre plateforme Luneo est maintenant entièrement monitorée ! 🎉

