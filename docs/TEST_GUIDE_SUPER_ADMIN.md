# 🧪 GUIDE DE TEST - SUPER ADMIN DASHBOARD

**Date**: 15 janvier 2025

---

## 📋 PRÉREQUIS

### 1. Vérifier la Migration Prisma
```bash
cd apps/backend
npx prisma migrate status
# Vérifier que la migration 20250115000000_add_super_admin_models est appliquée
```

### 2. Vérifier le Rôle Admin
```bash
# Dans votre base de données, vérifier qu'un utilisateur a le rôle PLATFORM_ADMIN
# Via Prisma Studio ou SQL:
cd apps/backend
npx prisma studio
# Ou via SQL:
# UPDATE "User" SET role = 'PLATFORM_ADMIN' WHERE email = 'votre-email@example.com';
```

### 3. Démarrer les Services
```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

---

## ✅ CHECKLIST DE TEST

### 🔐 1. AUTHENTIFICATION & ACCÈS

#### Test 1.1 : Accès Admin
- [ ] Se connecter avec un compte ayant le rôle `PLATFORM_ADMIN`
- [ ] Accéder à `http://localhost:3000/admin`
- [ ] Vérifier que la page se charge sans erreur
- [ ] Vérifier que la sidebar s'affiche correctement

#### Test 1.2 : Protection des Routes
- [ ] Se déconnecter
- [ ] Essayer d'accéder à `http://localhost:3000/admin`
- [ ] Vérifier la redirection vers `/login` ou `/dashboard`
- [ ] Se connecter avec un compte NON admin
- [ ] Essayer d'accéder à `/admin`
- [ ] Vérifier la redirection vers `/dashboard`

---

### 📊 2. DASHBOARD OVERVIEW (`/admin`)

#### Test 2.1 : KPIs
- [ ] Vérifier que les 4 KPI Cards s'affichent :
  - MRR avec trend
  - Customers avec nombre de nouveaux
  - Churn Rate avec trend
  - Avg LTV avec projection
- [ ] Vérifier que les valeurs sont formatées correctement (€, %)
- [ ] Vérifier que les trends (up/down) s'affichent avec les bonnes couleurs

#### Test 2.2 : Revenue Chart
- [ ] Vérifier que le graphique Revenue s'affiche
- [ ] Tester le toggle MRR/Revenue
- [ ] Vérifier que les données changent selon le toggle
- [ ] Vérifier le tooltip au survol

#### Test 2.3 : Activity Feed
- [ ] Vérifier que l'Activity Feed s'affiche
- [ ] Tester le filtre par type d'activité
- [ ] Vérifier que les activités s'affichent avec les bonnes icônes
- [ ] Vérifier le formatage des dates (relative time)

#### Test 2.4 : Charts
- [ ] Vérifier le Pie Chart "Revenue by Plan"
- [ ] Vérifier le Bar Chart "Acquisition Channels"
- [ ] Vérifier que les tooltips fonctionnent

#### Test 2.5 : Quick Actions
- [ ] Vérifier que les 6 Quick Actions s'affichent
- [ ] Cliquer sur chaque action
- [ ] Vérifier la navigation vers la bonne page

#### Test 2.6 : Recent Customers
- [ ] Vérifier que la table Recent Customers s'affiche
- [ ] Vérifier les colonnes (Customer, Plan, MRR, LTV, Status)
- [ ] Cliquer sur un customer
- [ ] Vérifier la navigation vers `/admin/customers/[id]`

#### Test 2.7 : Période
- [ ] Changer la période (7, 30, 90, 365 jours)
- [ ] Vérifier que les données se rechargent
- [ ] Vérifier que les KPIs se mettent à jour

---

### 👥 3. GESTION CLIENTS (`/admin/customers`)

#### Test 3.1 : Liste Customers
- [ ] Vérifier que la table s'affiche
- [ ] Vérifier les colonnes :
  - Checkbox (multi-selection)
  - Customer (avatar, name, email)
  - Plan
  - MRR
  - LTV
  - Status
  - Risk
  - Actions

#### Test 3.2 : Recherche
- [ ] Taper dans le champ de recherche
- [ ] Vérifier que les résultats se filtrent en temps réel
- [ ] Tester avec un nom
- [ ] Tester avec un email

#### Test 3.3 : Filtres
- [ ] Tester le filtre Status (All, Active, Trial, Churned, At Risk)
- [ ] Tester le filtre Plan
- [ ] Vérifier que les résultats se mettent à jour

#### Test 3.4 : Tri
- [ ] Cliquer sur les en-têtes de colonnes (Customer, MRR, LTV)
- [ ] Vérifier que le tri fonctionne (asc/desc)
- [ ] Vérifier l'icône de tri (flèche)

#### Test 3.5 : Multi-Selection
- [ ] Cocher plusieurs customers
- [ ] Vérifier que la barre "Bulk Actions" apparaît
- [ ] Vérifier le compteur "X selected"
- [ ] Tester "Select All"
- [ ] Tester "Clear"

#### Test 3.6 : Bulk Actions
- [ ] Sélectionner plusieurs customers
- [ ] Cliquer sur "Send Email"
- [ ] Cliquer sur "Export Selected"
- [ ] Vérifier que les actions fonctionnent (ou affichent un message)

#### Test 3.7 : Pagination
- [ ] Vérifier que la pagination s'affiche en bas
- [ ] Cliquer sur "Next"
- [ ] Cliquer sur "Previous"
- [ ] Vérifier que les pages changent
- [ ] Vérifier le compteur "Showing X to Y of Z"

#### Test 3.8 : Navigation vers Détail
- [ ] Cliquer sur un customer dans la liste
- [ ] Vérifier la navigation vers `/admin/customers/[id]`

---

### 👤 4. DÉTAIL CUSTOMER (`/admin/customers/[id]`)

#### Test 4.1 : Header
- [ ] Vérifier l'avatar du customer
- [ ] Vérifier le nom et l'email
- [ ] Vérifier le badge de status
- [ ] Vérifier le bouton "Back to Customers"
- [ ] Vérifier les boutons d'action (Send Email, More)

#### Test 4.2 : KPI Cards
- [ ] Vérifier les 4 KPI Cards :
  - LTV (avec projection)
  - Total Revenue (avec avg/month)
  - Time Spent (avec sessions)
  - Months Active (avec date de début)

#### Test 4.3 : Tab Overview
- [ ] Vérifier que le tab Overview est actif par défaut
- [ ] Vérifier "Usage Metrics" :
  - Total Sessions
  - Total Time Spent
  - Avg Session Duration
  - Last Seen
- [ ] Vérifier "Customer Information" :
  - Company, Industry, Country, Timezone (si disponibles)
  - Segments
- [ ] Vérifier "Revenue Breakdown"

#### Test 4.4 : Tab Activity
- [ ] Cliquer sur le tab "Activity"
- [ ] Vérifier que la timeline s'affiche
- [ ] Vérifier les icônes par type d'activité
- [ ] Vérifier le formatage des dates
- [ ] Vérifier les métadonnées (si disponibles)

#### Test 4.5 : Tab Billing
- [ ] Cliquer sur le tab "Billing"
- [ ] Vérifier que la table s'affiche
- [ ] Vérifier les colonnes (Date, Amount, Status)
- [ ] Vérifier les badges de status
- [ ] Vérifier le formatage des montants (€)

#### Test 4.6 : Tab Emails
- [ ] Cliquer sur le tab "Emails"
- [ ] Vérifier que la table s'affiche
- [ ] Vérifier les colonnes (Subject, Status, Sent At)
- [ ] Vérifier les icônes de status
- [ ] Vérifier les badges de status

---

### 📈 5. ANALYTICS (`/admin/analytics`)

#### Test 5.1 : KPIs
- [ ] Vérifier les 4 KPI Cards en haut
- [ ] Vérifier que les valeurs sont correctes

#### Test 5.2 : Tabs
- [ ] Vérifier que les 6 tabs s'affichent :
  - Overview
  - Revenue
  - Acquisition
  - Retention
  - Funnel
  - LTV Analysis

#### Test 5.3 : Tab Overview
- [ ] Vérifier Revenue Chart
- [ ] Vérifier Pie Chart "Revenue by Plan"
- [ ] Vérifier Bar Chart "Acquisition Channels"

#### Test 5.4 : Tab Revenue
- [ ] Cliquer sur "Revenue"
- [ ] Vérifier que le Revenue Chart s'affiche en grand
- [ ] Tester le toggle MRR/Revenue

#### Test 5.5 : Tab Acquisition
- [ ] Cliquer sur "Acquisition"
- [ ] Vérifier le Bar Chart horizontal
- [ ] Vérifier les données par channel

#### Test 5.6 : Tab Retention
- [ ] Cliquer sur "Retention"
- [ ] Vérifier la Cohort Table avec heatmap
- [ ] Vérifier les couleurs (vert = bon, rouge = mauvais)
- [ ] Vérifier la légende
- [ ] Vérifier que les pourcentages s'affichent

#### Test 5.7 : Tab Funnel
- [ ] Cliquer sur "Funnel"
- [ ] Vérifier le Funnel Chart
- [ ] Vérifier les 5 étapes :
  - Visitors
  - Signups
  - Trials
  - Conversions
  - Paying Customers
- [ ] Vérifier les pourcentages de conversion
- [ ] Vérifier les indicateurs de dropoff
- [ ] Vérifier le résumé en bas (Overall Conversion, Total Dropoff, Final Customers)

#### Test 5.8 : Tab LTV Analysis
- [ ] Cliquer sur "LTV Analysis"
- [ ] Vérifier les KPI Cards (Average LTV, Median LTV)

#### Test 5.9 : Période
- [ ] Changer la période (7, 30, 90, 365 jours)
- [ ] Vérifier que les données se rechargent pour chaque tab

---

### 📧 6. MARKETING AUTOMATIONS (`/admin/marketing/automations`)

#### Test 6.1 : Liste Automations
- [ ] Vérifier que la liste s'affiche
- [ ] Vérifier les cards d'automation avec :
  - Nom
  - Status badge
  - Trigger
  - Nombre de steps
  - Stats (Sent, Open Rate, Click Rate, Conversions)

#### Test 6.2 : Filtres par Status
- [ ] Cliquer sur "All"
- [ ] Cliquer sur "Active"
- [ ] Cliquer sur "Paused"
- [ ] Cliquer sur "Draft"
- [ ] Vérifier que les résultats se filtrent

#### Test 6.3 : Stats
- [ ] Vérifier que les stats s'affichent correctement
- [ ] Vérifier le formatage des pourcentages
- [ ] Vérifier les couleurs (vert pour conversions)

#### Test 6.4 : Steps Preview
- [ ] Vérifier que les steps s'affichent (Email, Wait, etc.)
- [ ] Vérifier les flèches entre les steps
- [ ] Vérifier "+X more" si plus de 5 steps

#### Test 6.5 : Actions
- [ ] Vérifier les boutons "Pause/Activate"
- [ ] Vérifier le bouton "Edit"
- [ ] Vérifier le bouton "More" (menu)

#### Test 6.6 : Nouvelle Automation
- [ ] Cliquer sur "New Automation"
- [ ] Vérifier la navigation vers `/admin/marketing/automations/new`
- [ ] (Si la page existe) Vérifier le formulaire

#### Test 6.7 : État Vide
- [ ] Si aucune automation, vérifier le message
- [ ] Vérifier le bouton "Create First Automation"

---

## 🐛 PROBLÈMES CONNUS & SOLUTIONS

### Problème 1 : Données Mock
**Symptôme**: Les données affichées sont des valeurs par défaut ou mockées.

**Solution**: 
- Vérifier que la migration Prisma est appliquée
- Vérifier que les tables existent en base de données
- Les API routes retournent des données mock si les tables sont vides

### Problème 2 : Erreur 403 Unauthorized
**Symptôme**: Erreur "Unauthorized" sur les API routes.

**Solution**:
- Vérifier que l'utilisateur a le rôle `PLATFORM_ADMIN`
- Vérifier que la session est active
- Vérifier les cookies/auth

### Problème 3 : Charts ne se chargent pas
**Symptôme**: Les graphiques sont vides ou affichent "No data".

**Solution**:
- Vérifier la console pour les erreurs
- Vérifier que les données sont retournées par l'API
- Vérifier le format des données (date, nombre)

### Problème 4 : Pagination ne fonctionne pas
**Symptôme**: Impossible de changer de page.

**Solution**:
- Vérifier que l'API retourne `pagination` avec `totalPages`
- Vérifier que `goToPage` est appelé correctement

---

## 📝 RAPPORT DE TEST

Après chaque test, noter :
- ✅ Réussi
- ⚠️ Problème mineur
- ❌ Échec

**Template**:
```
Test: [Nom du test]
Résultat: ✅/⚠️/❌
Notes: [Description du problème si applicable]
```

---

## 🚀 PROCHAINES ÉTAPES APRÈS TESTS

Une fois les tests validés, on pourra :
1. Corriger les bugs identifiés
2. Ajouter les fonctionnalités manquantes (voir `CE_QUI_RESTE_A_FAIRE.md`)
3. Optimiser les performances
4. Ajouter des tests automatisés
