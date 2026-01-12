# 🚀 Multi-Environment CI/CD - Guide Complet

## 📋 Vue d'ensemble

Pipeline CI/CD multi-environnement avec déploiements automatiques pour develop, staging, et production.

## 🌍 Environnements

### Develop
- **Branch** : `develop`
- **URL** : https://develop-api.luneo.app
- **Déploiement** : Automatique sur push
- **Tests** : Unit tests uniquement

### Staging
- **Branch** : `staging`
- **URL** : https://staging-api.luneo.app
- **Déploiement** : Automatique sur push
- **Tests** : Unit + Integration tests

### Production
- **Branch** : `main`
- **URL** : https://api.luneo.app
- **Déploiement** : Automatique sur push (avec validation)
- **Tests** : Full test suite + Coverage check
- **Blue-Green** : Disponible via workflow_dispatch

## 🔄 Workflow

```
develop → staging → production
   ↓         ↓          ↓
  Auto     Auto      Auto + Validation
```

## 📝 Utilisation

### Déploiement Automatique

```bash
# Develop
git push origin develop

# Staging
git push origin staging

# Production
git push origin main
```

### Déploiement Manuel

```bash
# Via GitHub Actions UI
Actions → Multi-Environment CI/CD → Run workflow
→ Sélectionner l'environnement
```

### Blue-Green Deployment (Production)

```bash
# Via GitHub Actions UI
Actions → Multi-Environment CI/CD → Run workflow
→ Environment: production
→ Blue-Green: true
```

## 🔐 Secrets Requis

### Railway Tokens

- `RAILWAY_TOKEN_DEVELOP`
- `RAILWAY_TOKEN_STAGING`
- `RAILWAY_TOKEN_PRODUCTION`

### Configuration

GitHub → Settings → Secrets → Actions → Add secret

## ✅ Validation Production

Avant déploiement en production :

1. ✅ Tests unitaires passent
2. ✅ Tests d'intégration passent
3. ✅ Coverage > 85%
4. ✅ Build réussi
5. ✅ Security audit (moderate+)
6. ✅ Smoke tests passent

## 🔄 Rollback

En cas d'échec en production :

1. Blue-Green deployment : Rollback automatique
2. Manuel : Re-déployer la version précédente via Railway

## 📊 Monitoring

- **Health Checks** : Automatiques après déploiement
- **Smoke Tests** : Validation fonctionnelle
- **Notifications** : Slack/Discord (à configurer)

## 🚀 Améliorations Futures

- [ ] Canary deployments
- [ ] Feature flags
- [ ] Automated rollback
- [ ] Performance testing en staging
