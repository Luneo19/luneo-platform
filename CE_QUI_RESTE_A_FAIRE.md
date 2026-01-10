# 📋 CE QUI RESTE À FAIRE - LUNEO PLATFORM

**Date** : 10 Janvier 2025  
**Statut** : ✅ Toutes les phases prioritaires complétées

---

## ✅ CE QUI EST DÉJÀ FAIT

### Phases Complétées
- ✅ **Phase Priorité Haute** : 3/3 étapes complétées
- ✅ **Phase Priorité Moyenne** : 3/3 étapes complétées (déjà implémentées)
- ✅ **Phase Priorité Basse** : 3/3 étapes complétées

### Infrastructure
- ✅ Migration httpOnly cookies complétée
- ✅ Tests endpoints backend en production
- ✅ Logger professionnel partout
- ✅ Error Boundaries complets
- ✅ Documentation Swagger améliorée
- ✅ Monitoring Sentry configuré
- ✅ Health checks avancés
- ✅ Cache Redis stratégique
- ✅ Lazy loading composants lourds

---

## 🔧 TODOs TECHNIQUES RESTANTS

### 🔴 **PRIORITÉ HAUTE** - Fonctionnalités Manquantes

#### 1. **Frontend - useAuth Hook** ⏱️ 2h
**Fichier** : `apps/frontend/src/hooks/useAuth.tsx`

**TODOs** :
- [ ] Ligne 42 : Utiliser endpoint backend au lieu de Supabase pour `getUser()`
- [ ] Ligne 55 : Mapper la réponse backend vers `AuthUser`
- [ ] Ligne 101 : Utiliser endpoint backend au lieu de Supabase pour `refreshUser()`
- [ ] Ligne 119 : Mapper la réponse backend vers `AuthUser`
- [ ] Ligne 169 : Appeler endpoint backend `/api/v1/auth/logout` au lieu de Supabase

**Impact** : Migration complète de Supabase vers backend NestJS pour l'authentification

---

#### 2. **Backend - AR Studio Service** ⏱️ 1h
**Fichier** : `apps/backend/src/modules/ar/ar-studio.service.ts`

**TODOs** :
- [ ] Ligne 438 : Générer URL signée avec expiration si stockage privé
  - URLs signées Cloudinary/S3 avec expiration
  - Sécurité accrue pour modèles privés

**Impact** : Sécurité améliorée pour les modèles AR privés

---

### 🟡 **PRIORITÉ MOYENNE** - Améliorations Fonctionnelles

#### 3. **Backend - Referral Service** ⏱️ 8h
**Fichier** : `apps/backend/src/modules/referral/referral.service.ts`

**TODOs** :
- [ ] Ligne 16 : Implémenter la logique de referral complète avec modèle Referral dans Prisma
- [ ] Ligne 45 : Créer table `referral_applications` si nécessaire
- [ ] Ligne 129 : Implémenter avec le modèle Commission dans Prisma
- [ ] Ligne 143 : Ajouter champ `iban` dans User ou dans un profil séparé
- [ ] Ligne 151 : Vérifier IBAN depuis profil ou settings
- [ ] Ligne 160 : Créer withdrawal dans Prisma

**Impact** : Système de referral complet avec commissions et retraits

---

#### 4. **Backend - Orders Service** ⏱️ 1h
**Fichier** : `apps/backend/src/modules/orders/orders.service.ts`

**TODOs** :
- [ ] Ligne 287 : Appliquer discount code si fourni
  - Validation du code promo
  - Calcul de la réduction
  - Application au total de la commande

**Impact** : Support des codes promo dans les commandes

---

#### 5. **Backend - Marketplace Service** ⏱️ 2h
**Fichier** : `apps/backend/src/modules/marketplace/services/stripe-connect.service.ts`

**TODOs** :
- [ ] Ligne 169 : Implémenter logique de schedule (daily, weekly, etc.)
  - Paiements récurrents programmés
  - Gestion des cycles de paiement

**Impact** : Paiements récurrents pour marketplace

---

#### 6. **Backend - Analytics Advanced** ⏱️ 12h
**Fichier** : `apps/backend/src/modules/analytics/services/analytics-advanced.service.ts`

**TODOs** :
- [ ] Ligne 288 : Implémenter avec ML models
  - Prédictions de revenus
  - Détection d'anomalies
  - Recommandations intelligentes
- [ ] Ligne 372 : Calculer `userCount` en fonction des critères

**Impact** : Analytics avancées avec machine learning

---

#### 7. **Frontend - Orders API** ⏱️ 2h
**Fichier** : `apps/frontend/src/app/api/orders/route.ts`

**TODOs** :
- [ ] Ligne 35 : Améliorer le backend pour gérer plusieurs items dans une seule commande
  - Support multi-items dans une commande
  - Calcul correct des totaux
  - Gestion des quantités

**Impact** : Commandes multi-items fonctionnelles

---

### 🟢 **PRIORITÉ BASSE** - Améliorations & Polish

#### 8. **Frontend - Loading States** ⏱️ 3h
**Améliorations** :
- [ ] Skeletons plus réalistes
- [ ] Animations fluides
- [ ] États de chargement cohérents partout

**Impact** : Meilleure UX pendant les chargements

---

#### 9. **Documentation Code** ⏱️ 6h
**Améliorations** :
- [ ] Ajouter JSDoc partout
- [ ] Documenter fonctions complexes
- [ ] Guide développement complet

**Impact** : Meilleure maintenabilité du code

---

#### 10. **Tests Supplémentaires** ⏱️ 8h
**Améliorations** :
- [ ] Tests unitaires composants dashboard frontend
- [ ] Tests hooks analytics
- [ ] Tests E2E auth flow complet
- [ ] Tests intégration API supplémentaires

**Impact** : Couverture de tests > 80%

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### 🔴 **Priorité Haute** (2 tâches, ~3h)
1. Frontend useAuth Hook - Migration Supabase → Backend
2. AR Studio - URLs signées avec expiration

### 🟡 **Priorité Moyenne** (5 tâches, ~25h)
3. Referral Service - Logique complète
4. Orders Service - Discount codes
5. Marketplace Service - Schedule logic
6. Analytics Advanced - ML models
7. Frontend Orders API - Multi-items

### 🟢 **Priorité Basse** (3 tâches, ~17h)
8. Loading States - Améliorations UX
9. Documentation Code - JSDoc complet
10. Tests Supplémentaires - Couverture > 80%

---

## 🎯 RECOMMANDATIONS

### **Prochaines Étapes Immédiates**

1. **Migration useAuth Hook** (2h) 🔴
   - Impact élevé : Migration complète de Supabase
   - Complexité faible : Mapping simple de données
   - Priorité : **HAUTE**

2. **AR Studio URLs signées** (1h) 🔴
   - Impact moyen : Sécurité améliorée
   - Complexité faible : Utiliser Cloudinary/S3
   - Priorité : **HAUTE**

3. **Orders Discount Codes** (1h) 🟡
   - Impact élevé : Fonctionnalité importante
   - Complexité faible : Validation + calcul
   - Priorité : **MOYENNE** (mais rapide à faire)

---

## 📈 MÉTRIQUES DE SUCCÈS

### Objectifs
- [ ] 100% endpoints backend utilisés par frontend
- [ ] 0 dépendance Supabase pour auth
- [ ] Support codes promo fonctionnel
- [ ] Couverture tests > 80%
- [ ] Documentation code complète

---

## 🚀 COMMANDES UTILES

### Vérifier TODOs
```bash
# Backend
cd apps/backend
grep -r "TODO" src/ --exclude-dir=node_modules

# Frontend
cd apps/frontend
grep -r "TODO" src/ --exclude-dir=node_modules
```

### Tests
```bash
# Backend
cd apps/backend
npm run test

# Frontend
cd apps/frontend
npm run test
```

---

*Dernière mise à jour : 10 Janvier 2025*
