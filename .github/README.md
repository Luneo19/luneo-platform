# Configuration GitHub pour Luneo Platform

Ce dossier contient toute la configuration GitHub pour le projet Luneo Platform.

## 📁 Fichiers

### Templates & Configuration
- **`pull_request_template.md`** - Template pour les Pull Requests avec checklist complète
- **`CODEOWNERS`** - Définit les propriétaires automatiques pour les reviews (@security, @devops, @frontend, @backend)
- **`dependabot.yml`** - Configuration Dependabot pour les mises à jour de dépendances

### Documentation
- **`SECRETS_CHECKLIST.md`** - Checklist complète des variables d'environnement requises
- **`BRANCH_PROTECTION_SETUP.md`** - Guide pour configurer les branches protégées (méthode automatique)
- **`BRANCH_PROTECTION_MANUAL.md`** - Guide pour configurer les branches protégées (méthode manuelle)
- **`SECURITY_SETUP_COMPLETE.md`** - Résumé de la configuration de sécurité
- **`SETUP_COMPLETE.md`** - Résumé complet de la configuration GitHub

### Workflows GitHub Actions
- **`workflows/check-secrets.yml`** - Vérifie les secrets dans chaque PR
- **`workflows/ci.yml`** - Pipeline CI/CD complet
- **`workflows/codeql.yml`** - Analyse de sécurité avec CodeQL
- **`workflows/deploy.yml`** - Déploiement automatique
- **`workflows/qa-e2e.yml`** - Tests E2E
- **`workflows/security-owasp.yml`** - Scan de sécurité OWASP

## 🚀 Utilisation

### Vérifier les secrets avant un commit
```bash
./scripts/check-secrets.sh
```

### Configurer les branches protégées (si repository public)
```bash
./scripts/setup-branch-protection.sh Luneo19/luneo-platform
```

### Rendre le repository public (si nécessaire)
```bash
./scripts/make-repo-public.sh
```

## 🔒 Sécurité

- ✅ Tous les fichiers `.env` sont exclus de Git
- ✅ Workflow automatique pour détecter les secrets
- ✅ CODEOWNERS pour reviews automatiques
- ✅ Template PR avec checklist de sécurité

## 📚 Documentation

Pour plus de détails, consultez :
- [SECRETS_CHECKLIST.md](./SECRETS_CHECKLIST.md) - Liste des secrets requis
- [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) - Configuration des branches
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - État actuel de la configuration

