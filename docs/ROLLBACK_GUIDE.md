# 🔄 Guide de Rollback - Luneo Platform

**Date:** Décembre 2024  
**Status:** Guide complet de rollback

---

## 🎯 Vue d'Ensemble

Ce guide détaille le processus de rollback (retour en arrière) en cas de problème après un déploiement.

---

## ⚠️ Quand Faire un Rollback

### Critères de Rollback

#### Erreurs Critiques
- Application inaccessible
- Erreurs 500 généralisées
- Base de données corrompue
- Sécurité compromise

#### Performance
- Performance dégradée > 50%
- Temps de réponse > 10s
- Core Web Vitals dégradés

#### Fonctionnalités
- Fonctionnalités critiques cassées
- Paiements non fonctionnels
- Authentification cassée

---

## 🔄 Processus de Rollback

### Option 1: Via Vercel Dashboard (Recommandé)

#### Étapes
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner le projet
3. Aller dans "Deployments"
4. Identifier la version précédente stable
5. Cliquer sur "..." (menu)
6. Sélectionner "Promote to Production"
7. Confirmer

#### Avantages
- Interface graphique
- Rapide
- Pas de commandes

### Option 2: Via Vercel CLI

#### Installation
```bash
npm i -g vercel
```

#### Login
```bash
vercel login
```

#### Rollback
```bash
cd apps/frontend
vercel rollback
```

#### Rollback Vers Version Spécifique
```bash
vercel rollback <deployment-url>
```

---

## 📊 Vérifications Après Rollback

### Immédiat (0-5 min)
- [ ] Application accessible
- [ ] Health check OK
- [ ] Aucune erreur console

### Court Terme (5-15 min)
- [ ] Fonctionnalités critiques OK
- [ ] Performance acceptable
- [ ] Monitoring vérifié

### Moyen Terme (15-30 min)
- [ ] Sentry vérifié (pas d'erreurs)
- [ ] Vercel Analytics vérifié
- [ ] Logs vérifiés

---

## 🗄️ Database Rollback (Si Nécessaire)

### Migrations Prisma

#### Vérifier Migrations
```bash
cd apps/frontend
npx prisma migrate status
```

#### Rollback Migration
```bash
# Si migration problématique
npx prisma migrate resolve --rolled-back <migration_name>
```

#### Restaurer Backup
```bash
# Si base de données corrompue
# Restaurer depuis backup Supabase
```

---

## 📝 Documentation

### Après Rollback
- [ ] Documenter raison du rollback
- [ ] Documenter version rollback
- [ ] Documenter problèmes rencontrés
- [ ] Créer issue pour corriger problème

### Exemple
```markdown
## Rollback - [Date]

**Version rollback:** [deployment-url]
**Raison:** [description]
**Problèmes:** [liste]
**Actions:** [corrections prévues]
```

---

## 🚨 Scénarios d'Urgence

### Application Complètement Inaccessible

#### Actions Immédiates
1. Rollback via Vercel Dashboard
2. Vérifier health check
3. Vérifier logs
4. Notifier équipe

### Base de Données Corrompue

#### Actions Immédiates
1. Rollback application
2. Restaurer backup base de données
3. Vérifier intégrité données
4. Notifier équipe

### Sécurité Compromise

#### Actions Immédiates
1. Rollback application
2. Révoquer secrets compromis
3. Générer nouveaux secrets
4. Notifier équipe et utilisateurs

---

## 📋 Checklist Rollback

### Avant Rollback
- [ ] Identifier version stable précédente
- [ ] Vérifier que version est fonctionnelle
- [ ] Notifier équipe

### Pendant Rollback
- [ ] Exécuter rollback
- [ ] Attendre déploiement
- [ ] Vérifier health check

### Après Rollback
- [ ] Application accessible
- [ ] Fonctionnalités critiques OK
- [ ] Monitoring vérifié
- [ ] Documenter rollback

---

## 🎯 Best Practices

### 1. Prévention
- Toujours tester staging avant production
- Vérifier health checks après déploiement
- Monitorer activement après déploiement

### 2. Préparation
- Identifier versions stables
- Documenter processus
- Tester processus de rollback

### 3. Communication
- Notifier équipe avant rollback
- Documenter raison
- Communiquer après rollback

---

**Dernière mise à jour:** Décembre 2024

