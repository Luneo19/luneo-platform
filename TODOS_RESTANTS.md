# 📋 TODOS RESTANTS - LUNEO PLATFORM

**Date** : 9 Janvier 2025  
**Statut** : En cours de développement

---

## 🔧 BACKEND - TODOS TECHNIQUES

### 1. AR Studio Service
**Fichier** : `apps/backend/src/modules/ar/ar-studio.service.ts`

- [ ] **Ligne 408** : Implémenter compression/optimisation AR models
  - Compression GLB/USDZ pour réduire taille fichiers
  - Optimisation textures et géométrie
  - Cache des modèles optimisés

- [ ] **Ligne 409** : Générer URL signée avec expiration si stockage privé
  - URLs signées Cloudinary/S3 avec expiration
  - Sécurité accrue pour modèles privés

- [ ] **Ligne 413** : Calculer fileSize depuis headers HTTP
  - Récupérer Content-Length depuis headers
  - Stocker dans base de données

- [ ] **Ligne 531** : Calculer usdzFileSize depuis headers
  - Même chose pour fichiers USDZ

### 2. AI Image Service
**Fichier** : `apps/backend/src/modules/ai/services/ai-image.service.ts`

- [ ] **Ligne 433** : Implémenter face/product detection
  - Détection visage pour smart crop
  - Détection produit pour centrage automatique
  - Utiliser bibliothèque ML (TensorFlow.js, OpenCV, etc.)

### 3. Logging
**Fichier** : `apps/backend/src/main.ts`

- [ ] Remplacer `console.log` par `Logger` de NestJS
  - Lignes 2, 3, 4, 10, 12, 223, 226
  - Utiliser `Logger` pour meilleure gestion logs

---

## 🎨 FRONTEND - TODOS TECHNIQUES

### 1. Error Boundaries
**Fichiers** : `apps/frontend/src/app/(dashboard)/**/error.tsx`

- [ ] Améliorer gestion erreurs dans Error Boundaries
  - Meilleur affichage erreurs utilisateur
  - Logging structuré
  - Retry automatique si possible

### 2. Logging
**Fichiers** : 
- `apps/frontend/src/lib/supabase/admin.ts` (lignes 11, 27)
- `apps/frontend/src/app/(dashboard)/templates/error.tsx` (ligne 15)
- `apps/frontend/src/app/(dashboard)/dashboard/components/RecentActivity.tsx` (ligne 41)

- [ ] Remplacer `console.log/error/warn` par `logger` de `@/lib/logger`
  - Utiliser logger structuré partout
  - Meilleure gestion logs en production

### 3. Loading States
- [ ] Améliorer Loading Skeletons
  - Skeletons plus réalistes
  - Animations fluides
  - États de chargement cohérents

### 4. Performance
- [ ] Code Splitting avancé
  - Lazy loading routes
  - Dynamic imports composants lourds
  - Optimisation bundle size

---

## 📊 ANALYTICS - AMÉLIORATIONS

### 1. Session Duration
- [x] ✅ Calculer depuis WebVital (COMPLÉTÉ)
- [ ] Améliorer précision avec UsageMetric si disponible
- [ ] Calculer médiane en plus de moyenne

### 2. Countries
- [x] ✅ Utiliser table Attribution (COMPLÉTÉ)
- [ ] Ajouter données géographiques enrichies
- [ ] Calculer croissance par pays

### 3. Top Pages
- [ ] Optimiser requêtes pour grandes quantités de données
- [ ] Ajouter cache Redis
- [ ] Calculer métriques avancées (bounce rate, time on page)

---

## 🔒 SÉCURITÉ - AMÉLIORATIONS

### 1. Cookies
- [x] ✅ Migration httpOnly cookies (COMPLÉTÉ)
- [x] ✅ Tokens supprimés de la réponse (COMPLÉTÉ)
- [ ] Validation cookies côté serveur renforcée
- [ ] Rotation automatique refresh tokens

### 2. Rate Limiting
- [ ] Implémenter rate limiting granulaire
- [ ] Rate limiting par endpoint
- [ ] Rate limiting par utilisateur/IP

### 3. Validation
- [ ] Validation Zod partout
- [ ] Sanitization inputs renforcée
- [ ] Validation fichiers uploads

---

## 🧪 TESTS

### 1. Backend
- [ ] Tests unitaires analytics service
- [ ] Tests E2E endpoints auth
- [ ] Tests intégration cookies

### 2. Frontend
- [ ] Tests composants dashboard
- [ ] Tests hooks analytics
- [ ] Tests E2E auth flow

### 3. Scripts
- [x] ✅ Script test endpoints créé
- [ ] Exécuter tests en production
- [ ] Automatiser tests CI/CD

---

## 📚 DOCUMENTATION

### 1. API
- [ ] Documenter tous les endpoints Swagger
- [ ] Ajouter exemples requêtes/réponses
- [ ] Documenter codes erreur

### 2. Code
- [ ] Ajouter JSDoc partout
- [ ] Documenter fonctions complexes
- [ ] Guide développement

---

## 🚀 DÉPLOIEMENT

### 1. Monitoring
- [ ] Configurer monitoring production
- [ ] Alertes erreurs critiques
- [ ] Dashboard métriques

### 2. Performance
- [ ] Optimiser temps réponse API
- [ ] Cache stratégique
- [ ] CDN pour assets statiques

---

## 📋 PRIORITÉS

### 🔴 Haute Priorité
1. Corriger erreur TypeScript `totalUsers` ✅ (EN COURS)
2. Remplacer console.log par Logger
3. Améliorer Error Boundaries frontend

### 🟡 Moyenne Priorité
4. Compression AR models
5. Face/product detection
6. Tests automatisés

### 🟢 Basse Priorité
7. Documentation API complète
8. Monitoring avancé
9. Optimisations performance

---

*Dernière mise à jour : 9 Janvier 2025*
