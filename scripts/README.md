# 📚 GUIDE COMPLET DES SCRIPTS LUNEO

> Documentation centralisée de tous les scripts d'automatisation, déploiement, tests et maintenance

**Dernière mise à jour**: Novembre 2025  
**Nombre de scripts**: 65+

---

## 📋 TABLE DES MATIÈRES

1. [Scripts de Déploiement](#scripts-de-déploiement)
2. [Scripts de Test](#scripts-de-test)
3. [Scripts de Setup](#scripts-de-setup)
4. [Scripts de Maintenance](#scripts-de-maintenance)
5. [Scripts d'Audit](#scripts-daudit)
6. [Scripts de Correction](#scripts-de-correction)
7. [Scripts Backend](#scripts-backend)
8. [Scripts de Sécurité](#scripts-de-sécurité)
9. [Utilisation](#utilisation)
10. [Création de Nouveaux Scripts](#création-de-nouveaux-scripts)

---

## 🚀 SCRIPTS DE DÉPLOIEMENT

### Scripts Principaux

#### `deploy-complete.sh`
**Description**: Déploiement complet de l'application (frontend + backend)  
**Usage**: `./scripts/deploy-complete.sh`  
**Prérequis**: Variables d'environnement configurées  
**Actions**:
- Build frontend et backend
- Déploiement Vercel (frontend)
- Déploiement backend (Hetzner/Vercel)
- Vérification santé des services

#### `deploy-production.sh`
**Description**: Déploiement en production avec vérifications  
**Usage**: `./scripts/deploy-production.sh`  
**Prérequis**: Accès production, credentials configurés  
**Actions**:
- Vérification environnement production
- Build optimisé
- Déploiement avec rollback automatique
- Tests smoke post-déploiement

#### `deploy-backend.sh`
**Description**: Déploiement backend uniquement  
**Usage**: `./scripts/deploy-backend.sh`  
**Actions**:
- Build backend NestJS
- Déploiement sur infrastructure cible
- Migration base de données
- Redémarrage services

#### `deploy-public.sh`
**Description**: Déploiement frontend public uniquement  
**Usage**: `./scripts/deploy-public.sh`  
**Actions**:
- Build frontend Next.js
- Déploiement Vercel
- Invalidation CDN

#### `quick-deploy.sh`
**Description**: Déploiement rapide sans vérifications approfondies  
**Usage**: `./scripts/quick-deploy.sh`  
**⚠️ Attention**: Utiliser uniquement en développement

### Scripts Hetzner

Tous les scripts de déploiement Hetzner sont dans `apps/backend/scripts/`:

- `deploy-hetzner.sh` - Déploiement de base
- `deploy-hetzner-complete.sh` - Déploiement complet avec setup
- `auto-deploy-hetzner.sh` - Déploiement automatique
- `copy-source-to-server.sh` - Copie code vers serveur
- `setup-hetzner-env.sh` - Configuration environnement
- `setup-hetzner-cloudflare.sh` - Configuration DNS Cloudflare

### Scripts DNS

- `configure-dns-cloudflare.sh` - Configuration DNS Cloudflare
- `configure-cloudflare-dns-correct.sh` - Configuration DNS corrigée
- `configure-domain-automatic.sh` - Configuration domaine automatique
- `test-dns-propagation.sh` - Test propagation DNS
- `test-dns-rapide.sh` - Test DNS rapide

---

## 🧪 SCRIPTS DE TEST

### Tests Complets

#### `run-tests.sh`
**Description**: Exécute tous les types de tests avec reporting  
**Usage**: `./scripts/run-tests.sh`  
**Actions**:
- Tests unitaires (Jest)
- Tests d'intégration (Supertest)
- Tests E2E (Playwright)
- Génération rapport coverage

#### `test-all.sh`
**Description**: Exécute tous les tests disponibles  
**Usage**: `./scripts/test-all.sh`  
**Actions**:
- Tests frontend (Vitest)
- Tests backend (Jest)
- Tests E2E (Playwright)

#### `test-features.sh`
**Description**: Tests de fonctionnalités spécifiques  
**Usage**: `./scripts/test-features.sh`  
**Actions**:
- Tests API endpoints
- Tests workflows critiques
- Tests intégrations

### Tests Spécifiques

- `test-production.sh` - Tests en environnement production
- `test-production-automatic.sh` - Tests production automatiques
- `test-validation.sh` - Validation complète
- `test-all-links.js` - Test tous les liens (404, etc.)
- `test-complet-luneo.sh` - Test complet Luneo

---

## ⚙️ SCRIPTS DE SETUP

### Setup Initial

#### `setup.sh`
**Description**: Setup complet du projet  
**Usage**: `./scripts/setup.sh`  
**Actions**:
- Installation dépendances
- Configuration environnement
- Setup base de données
- Configuration Docker
- Setup Git hooks

#### `setup-dev.sh`
**Description**: Setup environnement développement  
**Usage**: `./scripts/setup-dev.sh`  
**Actions**:
- Installation dépendances dev
- Configuration variables locales
- Setup base de données locale

#### `start-all.sh`
**Description**: Démarre tous les services en développement  
**Usage**: `./scripts/start-all.sh`  
**Actions**:
- Démarre Redis
- Démarre backend
- Démarre frontend

### Setup Base de Données

- `db/bootstrap-local.sh` - Bootstrap base de données locale

---

## 🔧 SCRIPTS DE MAINTENANCE

### Vérification Santé

#### `check-health.sh`
**Description**: Vérifie la santé de tous les services  
**Usage**: `./scripts/check-health.sh`  
**Actions**:
- Vérification API backend
- Vérification base de données
- Vérification Redis
- Vérification services externes

#### `validate-everything.sh`
**Description**: Validation complète du projet  
**Usage**: `./scripts/validate-everything.sh`  
**Actions**:
- Validation code (lint, type-check)
- Validation configuration
- Validation base de données
- Validation déploiement

### Sauvegarde

- `backup/run-backup.sh` - Exécution sauvegarde base de données

---

## 🔍 SCRIPTS D'AUDIT

### Audit Codebase

#### `audit-404-links.js`
**Description**: Audit tous les liens 404  
**Usage**: `node scripts/audit-404-links.js`  
**Actions**:
- Scan toutes les pages
- Détection liens cassés
- Génération rapport

#### `audit-dashboard-expert.js`
**Description**: Audit expert du dashboard  
**Usage**: `node scripts/audit-dashboard-expert.js`  
**Actions**:
- Analyse complète dashboard
- Détection problèmes UX
- Recommandations

#### `audit-mobile-expert.js`
**Description**: Audit expert mobile  
**Usage**: `node scripts/audit-mobile-expert.js`  
**Actions**:
- Analyse responsive
- Détection problèmes mobile
- Recommandations

#### `audit-complet-pre-post-login.js`
**Description**: Audit complet avant/après login  
**Usage**: `node scripts/audit-complet-pre-post-login.js`  
**Actions**:
- Analyse pages publiques
- Analyse pages authentifiées
- Comparaison

---

## 🛠️ SCRIPTS DE CORRECTION

### Correction Mobile

- `fix-mobile-perfect.js` - Correction mobile complète
- `fix-all-mobile-issues.js` - Correction tous problèmes mobile
- `fix-homepage-mobile-responsive.js` - Correction homepage mobile
- `mobile-100-perfect.js` - Mobile 100% parfait
- `mobile-10-10-ultimate.js` - Mobile ultimate
- `mega-mobile-tablet-100.js` - Mobile + tablette
- `make-responsive.js` - Rendre responsive
- `fix-auth-responsive.sh` - Correction auth responsive

### Correction Générale

- `cleanup-homepage-classes.js` - Nettoyage classes homepage
- `remove-console-logs.js` - Suppression console.log
- `apply-dashboard-dark-theme.js` - Application thème sombre

---

## 🔐 SCRIPTS DE SÉCURITÉ

- `security/run-zap-baseline.sh` - Scan sécurité OWASP ZAP

---

## 📦 SCRIPTS BACKEND

Tous les scripts backend sont dans `apps/backend/scripts/`:

### Déploiement
- `deploy-hetzner.sh` - Déploiement Hetzner
- `deploy-final.sh` - Déploiement final
- `quick-deploy.sh` - Déploiement rapide
- `copy-code-to-server.sh` - Copie code
- `remote-deploy.sh` - Déploiement distant

### Configuration
- `setup-production.js` - Setup production
- `generate-env.js` - Génération .env
- `setup-hetzner-env.sh` - Setup Hetzner
- `setup-hetzner-cloudflare.sh` - Setup Cloudflare
- `setup-domain-complete.sh` - Setup domaine complet

### Tests
- `test-production-sendgrid.js` - Test SendGrid production
- `check-sendgrid-status.js` - Vérification SendGrid
- `verify-sendgrid-setup.js` - Vérification setup SendGrid
- `setup-sendgrid-domain.js` - Setup domaine SendGrid

---

## 💻 UTILISATION

### Exécution Basique

```bash
# Rendre exécutable (première fois)
chmod +x scripts/*.sh

# Exécuter un script
./scripts/nom-du-script.sh

# Scripts Node.js
node scripts/nom-du-script.js
```

### Variables d'Environnement

La plupart des scripts nécessitent des variables d'environnement. Vérifiez `.env` ou `.env.example` avant d'exécuter.

### Logs

Les scripts génèrent des logs dans:
- `logs/` - Logs applicatifs
- Console - Output direct

---

## 🆕 CRÉATION DE NOUVEAUX SCRIPTS

### Template Script Shell

```bash
#!/bin/bash

##############################################################################
# LUNEO - Description du Script
# Usage: ./scripts/nom-du-script.sh [options]
##############################################################################

set -e  # Arrêter en cas d'erreur

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${BLUE}  $1${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Main
main() {
  print_header "TITRE DU SCRIPT"
  
  # Votre code ici
  
  print_success "Script terminé avec succès"
}

# Run
main "$@"
```

### Template Script Node.js

```javascript
#!/usr/bin/env node

/**
 * LUNEO - Description du Script
 * Usage: node scripts/nom-du-script.js [options]
 */

const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('🚀 Démarrage du script...', 'blue');
  
  // Votre code ici
  
  log('✅ Script terminé avec succès', 'green');
}

main();
```

### Bonnes Pratiques

1. **Gestion d'erreurs**: Toujours utiliser `set -e` pour scripts shell
2. **Logging**: Utiliser les fonctions de logging pour cohérence
3. **Documentation**: Ajouter en-tête avec description et usage
4. **Variables**: Utiliser variables d'environnement pour configuration
5. **Validation**: Valider inputs avant traitement
6. **Rollback**: Prévoir mécanisme de rollback pour scripts critiques

---

## 📊 STATISTIQUES

| Catégorie | Nombre | Statut |
|-----------|--------|--------|
| Déploiement | 15+ | ✅ Excellent |
| Tests | 10+ | ✅ Excellent |
| Setup | 5+ | ✅ Bon |
| Maintenance | 10+ | ✅ Bon |
| Audit | 5+ | ✅ Excellent |
| Correction | 10+ | ✅ Bon |
| Backend | 15+ | ✅ Excellent |
| Sécurité | 1 | ⚠️ À améliorer |

---

## 🆘 DÉPANNAGE

### Script ne s'exécute pas

```bash
# Vérifier permissions
ls -l scripts/nom-du-script.sh

# Rendre exécutable
chmod +x scripts/nom-du-script.sh
```

### Erreur "command not found"

```bash
# Vérifier que le script est dans le bon répertoire
cd /Users/emmanuelabougadous/luneo-platform

# Vérifier dépendances
which node
which npm
```

### Erreur variables d'environnement

```bash
# Vérifier .env existe
ls -la .env

# Charger variables
source .env
```

---

## 📝 NOTES

- Tous les scripts doivent être exécutés depuis la racine du projet
- Les scripts de déploiement nécessitent des credentials configurés
- Les scripts de test nécessitent une base de données de test
- Les scripts d'audit peuvent prendre plusieurs minutes

---

**Pour toute question ou amélioration**, créer une issue ou contacter l'équipe de développement.

