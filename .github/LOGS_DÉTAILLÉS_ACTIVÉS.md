# ✅ Logs Détaillés Activés - Guide

**Date**: 17 novembre 2025  
**Objectif**: Identifier l'erreur exacte au démarrage

---

## 🔍 Logs Détaillés Ajoutés

### Dans `validateEnv()`
- ✅ Logs des détails de l'erreur de validation
- ✅ Liste des variables problématiques
- ✅ Message d'erreur complet

### Dans `bootstrap()`
- ✅ `'Validating environment variables...'`
- ✅ `'Environment variables validated'`
- ✅ `'Creating NestJS application...'`
- ✅ `'NestJS application created'`
- ✅ `'Security middleware configured'`
- ✅ `'Starting server on port...'`

---

## 📋 Comment Voir les Logs

### Méthode 1: Vercel Dashboard (Recommandé)

1. **Allez sur**: https://vercel.com/dashboard
2. **Sélectionnez**: Projet `backend` ou `luneos-projects/backend`
3. **Allez dans**: **"Deployments"**
4. **Cliquez sur**: Le dernier déploiement
5. **Allez dans**: **"Functions"** > **"api/index.js"**
6. **Cliquez sur**: **"Runtime Logs"**
7. **Faites une requête**: 
   ```bash
   curl https://backend-luneos-projects.vercel.app/health
   ```
8. **Observez les logs**: Vous devriez voir:
   - Les messages de log détaillés
   - Les erreurs de validation si présentes
   - Les détails des variables problématiques

### Méthode 2: Vercel CLI

```bash
cd apps/backend
vercel logs https://backend-2bn90yynw-luneos-projects.vercel.app
```

**Note**: Cette commande peut timeout après 5 minutes.

---

## 🔍 Ce que Chercher dans les Logs

### Si vous voyez:
- `'Validating environment variables...'` mais pas `'Environment variables validated'`
  → **Erreur de validation des variables**
  → Cherchez `'Environment validation error details:'`
  → Notez les variables listées dans `input`

### Si vous voyez:
- `'Environment variables validated'` mais pas `'Creating NestJS application...'`
  → **Erreur entre validation et création de l'app**

### Si vous voyez:
- `'Creating NestJS application...'` mais pas `'NestJS application created'`
  → **Erreur lors de la création de l'app NestJS**
  → Cherchez les erreurs Prisma, Redis, ou modules

### Si vous voyez:
- `'NestJS application created'` mais pas `'Security middleware configured'`
  → **Erreur lors de la configuration du middleware**

---

## 💡 Solutions Selon les Erreurs

### Erreur de Validation
- Vérifier les variables listées dans les logs
- Vérifier les formats (URLs, secrets, etc.)
- Rendre les variables optionnelles si nécessaire

### Erreur Prisma
- Vérifier DATABASE_URL
- Vérifier que Prisma Client est généré
- Vérifier les migrations

### Erreur Redis
- Redis est déjà non-bloquant
- Vérifier REDIS_URL si configurée

---

## 📊 Variables à Vérifier

Si erreur de validation, vérifier:
- `DATABASE_URL` - Doit être une URL valide
- `JWT_SECRET` - Doit avoir au moins 32 caractères
- `JWT_REFRESH_SECRET` - Doit avoir au moins 32 caractères
- `STRIPE_SECRET_KEY` - Optionnel maintenant, mais si présent doit commencer par `sk_`

---

**Dernière mise à jour**: 17 novembre 2025

