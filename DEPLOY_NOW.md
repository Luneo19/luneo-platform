# 🚀 Déploiement Production - MAINTENANT

**Date:** Décembre 2024  
**Status:** 🚀 **PRÊT POUR DÉPLOIEMENT**

---

## ⚡ Déploiement Rapide

### Option 1: Automatique (Recommandé) ⭐

Le CI/CD déploiera automatiquement en production quand vous push sur `main`.

#### Commandes
```bash
# 1. Ajouter tous les changements
git add .

# 2. Commit (optionnel - seulement si vous voulez commiter les changements)
git commit -m "chore: prepare production deployment"

# 3. Push sur main (déclenche le déploiement)
git push origin main
```

#### Ce qui se passe
1. ✅ GitHub Actions s'exécute automatiquement
2. ✅ Tests et build
3. ✅ Déploiement sur Vercel
4. ✅ Health checks
5. ✅ Notification Slack

#### Vérifier le déploiement
- **GitHub Actions:** https://github.com/[org]/[repo]/actions
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Application:** https://app.luneo.app

---

### Option 2: Manuel via Script

#### Commandes
```bash
# Exécuter le script interactif
./scripts/deploy-production.sh
```

Le script vous guidera à travers:
- Vérifications pré-déploiement
- Choix automatique ou manuel
- Déploiement via Vercel CLI

---

### Option 3: Manuel via Vercel CLI

#### Commandes
```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# 2. Login
vercel login

# 3. Déploiement production
cd apps/frontend
vercel --prod
```

---

## ✅ Vérifications Post-Déploiement

### Immédiat (0-5 min)
```bash
# Health check
curl https://app.luneo.app/api/health

# Ouvrir application
open https://app.luneo.app
```

### Court Terme (5-15 min)
- [ ] Application accessible
- [ ] Sentry vérifié (pas d'erreurs critiques)
- [ ] Fonctionnalités critiques testées:
  - [ ] Authentification
  - [ ] Dashboard
  - [ ] AI Studio
  - [ ] Checkout Stripe

---

## 🚨 En Cas de Problème

### Rollback Rapide
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner projet
3. Deployments > Previous deployment
4. "Promote to Production"

### Documentation
- **Rollback:** [docs/ROLLBACK_GUIDE.md](docs/ROLLBACK_GUIDE.md)
- **Post-déploiement:** [docs/POST_DEPLOYMENT.md](docs/POST_DEPLOYMENT.md)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 📋 Checklist Rapide

### Avant
- [ ] Variables Vercel configurées
- [ ] Secrets GitHub configurés
- [ ] Sur branche `main`
- [ ] Build réussi

### Pendant
- [ ] Déploiement lancé
- [ ] CI/CD s'exécute
- [ ] Health checks OK

### Après
- [ ] Application accessible
- [ ] Fonctionnalités OK
- [ ] Monitoring actif

---

**🚀 Prêt à déployer! Choisissez une option ci-dessus.**

