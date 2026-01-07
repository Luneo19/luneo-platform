# 🚀 Quick Start - Déploiement Production

**Date:** Décembre 2024  
**Status:** Guide rapide de déploiement

---

## ⚡ Déploiement Rapide

### Option 1: Automatique (Recommandé)

#### Via GitHub Actions
1. **Push sur `main` branch**
   ```bash
   git push origin main
   ```

2. **CI/CD s'exécute automatiquement**
   - Tests
   - Build
   - Déploiement staging (si `develop` ou `staging`)
   - Déploiement production (si `main`)

3. **Vérifier déploiement**
   - Vérifier GitHub Actions
   - Vérifier Vercel Dashboard
   - Vérifier health checks

---

### Option 2: Manuel

#### Via Vercel CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déploiement production
cd apps/frontend
vercel --prod
```

#### Via Vercel Dashboard
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner projet
3. "Deployments" > "Promote to Production"

---

## ✅ Vérifications Rapides

### Avant Déploiement
```bash
# Exécuter script de vérification
./scripts/verify-production-ready.sh
```

### Après Déploiement
```bash
# Health check
curl https://luneo.app/api/health

# Vérifier application
open https://luneo.app
```

---

## 📋 Checklist Rapide

### Pré-Déploiement
- [ ] Variables d'environnement configurées (Vercel)
- [ ] Secrets GitHub configurés
- [ ] Build réussi localement
- [ ] Tests passent

### Post-Déploiement
- [ ] Application accessible
- [ ] Health check OK
- [ ] Sentry vérifié
- [ ] Fonctionnalités critiques testées

---

## 📚 Guides Complets

Pour plus de détails, consulter:
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Guide complet
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Checklist détaillée
- **[docs/POST_DEPLOYMENT.md](docs/POST_DEPLOYMENT.md)** - Post-déploiement
- **[docs/ROLLBACK_GUIDE.md](docs/ROLLBACK_GUIDE.md)** - Rollback

---

## 🚨 En Cas de Problème

### Application Non Accessible
1. Vérifier Vercel Dashboard
2. Vérifier logs
3. Vérifier health checks
4. Consulter [docs/ROLLBACK_GUIDE.md](docs/ROLLBACK_GUIDE.md)

### Erreurs Runtime
1. Vérifier Sentry
2. Vérifier variables d'environnement
3. Vérifier logs Vercel

---

**Dernière mise à jour:** Décembre 2024












