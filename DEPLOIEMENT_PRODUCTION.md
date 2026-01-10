# 🚀 DÉPLOIEMENT PRODUCTION - NOUVEAU DESIGN LUNEO

**Date**: Janvier 2025  
**Plateformes**: Vercel (Frontend) + Railway (Backend)

---

## ✅ PRÉPARATION

### Fichiers modifiés
- ✅ Composants marketing (9 nouveaux composants)
- ✅ Hooks personnalisés (4 hooks)
- ✅ Styles CSS et Tailwind config
- ✅ Page d'accueil mise à jour
- ✅ Documentation complète

### Vérifications préalables
- ✅ Code vérifié (linting OK)
- ✅ Types TypeScript corrects
- ✅ Prisma client généré
- ✅ Configuration Vercel vérifiée
- ✅ Configuration Railway vérifiée

---

## 🌐 DÉPLOIEMENT VERCEL (FRONTEND)

### Configuration actuelle
- **Framework**: Next.js
- **Build Command**: `(pnpm prisma generate || echo 'Prisma skipped') && pnpm run build`
- **Output Directory**: `.next`
- **Region**: `cdg1` (Paris)

### Étapes de déploiement

#### Option 1: Via Git (Recommandé)
```bash
# 1. Commiter les changements
git add .
git commit -m "feat: Nouveau design Luneo basé sur template Pandawa

- Ajout de 9 nouveaux composants marketing
- Création de 4 hooks personnalisés pour animations
- Adaptation de tous les textes pour Luneo
- Ajout d'animations CSS et effets modernes
- Documentation complète du nouveau design"

# 2. Push sur la branche main
git push origin main

# Vercel déploiera automatiquement
```

#### Option 2: Via CLI Vercel
```bash
# Installer Vercel CLI si nécessaire
npm i -g vercel

# Se connecter
vercel login

# Déployer en production
cd apps/frontend
vercel --prod
```

### Variables d'environnement Vercel
Vérifier que toutes les variables sont configurées dans le dashboard Vercel :
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- Autres variables nécessaires

---

## 🚂 DÉPLOIEMENT RAILWAY (BACKEND)

### Configuration actuelle
- **Builder**: Dockerfile
- **Start Command**: `cd apps/backend && node dist/src/main.js`
- **Nixpacks**: Configuré pour Node.js 20

### Étapes de déploiement

#### Option 1: Via Git (Recommandé)
```bash
# Railway détecte automatiquement les changements sur main
# Le déploiement se fait automatiquement après le push Git
```

#### Option 2: Via Railway CLI
```bash
# Installer Railway CLI si nécessaire
npm i -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Déployer
railway up
```

### Variables d'environnement Railway
Vérifier que toutes les variables sont configurées dans le dashboard Railway :
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- Autres variables nécessaires

---

## 📋 CHECKLIST DE DÉPLOIEMENT

### Avant déploiement
- [x] Code vérifié et testé localement
- [x] Build réussi en local
- [x] Variables d'environnement préparées
- [x] Documentation à jour

### Déploiement Vercel
- [ ] Commiter les changements
- [ ] Push sur main
- [ ] Vérifier le build Vercel
- [ ] Vérifier le déploiement réussi
- [ ] Tester la page d'accueil en production

### Déploiement Railway
- [ ] Vérifier que Railway détecte les changements
- [ ] Vérifier le build Railway
- [ ] Vérifier le déploiement réussi
- [ ] Tester les endpoints API

### Post-déploiement
- [ ] Vérifier la page d'accueil
- [ ] Tester les animations
- [ ] Vérifier le responsive
- [ ] Tester les liens et CTA
- [ ] Vérifier les performances (Lighthouse)
- [ ] Surveiller les erreurs (Sentry)

---

## 🔍 VÉRIFICATIONS POST-DÉPLOIEMENT

### Frontend (Vercel)
1. **Page d'accueil**
   - ✅ Charge correctement
   - ✅ Navigation fonctionnelle
   - ✅ Animations fluides
   - ✅ Responsive design

2. **Performance**
   - Lighthouse Score > 80
   - First Contentful Paint < 1.5s
   - Largest Contentful Paint < 2.5s

3. **Erreurs**
   - Aucune erreur console
   - Aucune erreur Sentry

### Backend (Railway)
1. **API**
   - ✅ Endpoints fonctionnels
   - ✅ Health check OK
   - ✅ Base de données connectée

2. **Logs**
   - Aucune erreur critique
   - Démarrage réussi

---

## 🚨 ROLLBACK PLAN

En cas de problème critique :

### Vercel
1. Aller dans le dashboard Vercel
2. Sélectionner le déploiement précédent
3. Cliquer sur "Promote to Production"

### Railway
1. Aller dans le dashboard Railway
2. Sélectionner le déploiement précédent
3. Cliquer sur "Redeploy"

### Git
```bash
# Revenir au commit précédent
git revert HEAD
git push origin main
```

---

## 📊 MONITORING

### Métriques à surveiller
- Temps de chargement
- Taux d'erreur
- Taux de conversion
- Performance Lighthouse

### Outils
- Vercel Analytics
- Sentry (erreurs)
- Railway Metrics
- Google Analytics (si configuré)

---

## ✅ STATUS

**Prêt pour déploiement**: ✅ OUI

**Commandes à exécuter**:
```bash
# 1. Commiter les changements
git add .
git commit -m "feat: Nouveau design Luneo - Production ready"

# 2. Push sur main (déploie automatiquement)
git push origin main
```

---

*Document créé le Janvier 2025*
