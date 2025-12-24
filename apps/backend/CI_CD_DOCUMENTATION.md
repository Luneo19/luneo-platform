# 🚀 Documentation CI/CD - Luneo Backend

## 📋 Vue d'ensemble

Ce document décrit le pipeline CI/CD configuré pour le déploiement automatique de l'API Luneo.

## 🔄 Workflows GitHub Actions

### 1. Déploiement Production (`deploy-production.yml`)

**Déclencheurs:**
- Push sur `main` ou `production`
- Déclenchement manuel (workflow_dispatch)

**Étapes:**
1. **Build and Test**: Installation, linting, tests, build
2. **Build Docker**: Construction et push de l'image Docker
3. **Deploy to Production**: Déploiement sur Hetzner VPS
4. **Post-deployment Tests**: Tests de l'API après déploiement

### 2. Déploiement Staging (`deploy-staging.yml`)

**Déclencheurs:**
- Pull Request vers `main`

**Étapes:**
- Tests et build
- Déploiement en environnement de staging

## 🔧 Scripts de Déploiement

### Script de Déploiement Local (`deploy-local.sh`)

```bash
./deploy-local.sh
```

**Fonctionnalités:**
- Vérifications pré-déploiement
- Pull du code
- Build Docker
- Migrations DB
- Redémarrage des services
- Tests post-déploiement

### Script de Rollback (`rollback.sh`)

```bash
./rollback.sh
```

**Fonctionnalités:**
- Confirmation de sécurité
- Arrêt des services
- Rollback Git
- Reconstruction
- Redémarrage
- Tests post-rollback

## 🔐 Secrets GitHub

Les secrets suivants doivent être configurés dans GitHub:

- `HETZNER_HOST`: IP du serveur (116.203.31.129)
- `HETZNER_USERNAME`: Utilisateur SSH (root)
- `HETZNER_SSH_KEY`: Clé SSH privée

## 📊 Monitoring du Déploiement

### Health Checks Automatiques

Après chaque déploiement:
- Vérification de la connectivité
- Tests des endpoints API
- Vérification SSL/TLS
- Tests de performance

### Notifications

- Logs détaillés dans GitHub Actions
- Notifications en cas d'échec
- Rapports de performance

## 🚨 Procédures d'Urgence

### Rollback Rapide

```bash
# Rollback automatique
./rollback.sh

# Ou rollback manuel
ssh root@116.203.31.129 "cd /home/deploy/app && git reset --hard HEAD~1 && docker-compose -f docker-compose.production.yml up -d"
```

### Diagnostic de Problème

```bash
# Vérification des logs
ssh root@116.203.31.129 "cd /home/deploy/app && docker-compose -f docker-compose.production.yml logs"

# Health checks
ssh root@116.203.31.129 "cd /home/deploy/app && ./advanced-health-checks.sh"
```

## 📈 Optimisations

### Cache Docker

- Utilisation de GitHub Container Registry
- Cache des layers Docker
- Optimisation des builds

### Tests Automatiques

- Tests unitaires
- Tests d'intégration
- Tests de performance
- Tests de sécurité

## 🔄 Maintenance

### Mise à Jour du Pipeline

1. Modifier les fichiers `.github/workflows/`
2. Tester en staging
3. Déployer en production

### Surveillance

- Monitoring des déploiements
- Alertes en cas d'échec
- Métriques de performance

---

**Dernière mise à jour**: $(date)
**Version**: 1.0.0
