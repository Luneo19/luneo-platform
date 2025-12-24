# 🔧 CORRECTION DÉMARRAGE BACKEND

**Date** : 22 décembre 2024

---

## 🔴 PROBLÈME IDENTIFIÉ

**Symptôme** : Healthcheck échoue, aucun log de démarrage visible

**Cause** : L'application ne démarre pas sur Railway, même si le build réussit

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Simplification du startCommand
**Avant** :
```toml
startCommand = "sh -c 'pnpm prisma migrate deploy || true; node dist/src/main.js'"
```

**Après** :
```toml
startCommand = "node dist/src/main.js"
```

**Raison** : Simplifier pour éviter les problèmes de shell

### 2. Migrations dans main.ts
**Avant** : Migrations dans startCommand (peuvent bloquer)

**Après** : Migrations dans `bootstrap()` avec try-catch

**Raison** : Plus de contrôle et de logs

---

## 📋 FICHIERS MODIFIÉS

1. ✅ `apps/backend/railway.toml` - startCommand simplifié
2. ✅ `apps/backend/src/main.ts` - Migrations dans bootstrap()

---

## 🚀 DÉPLOIEMENT

- ✅ Relancé avec corrections
- ⏳ En attente de confirmation

---

## 🔍 VÉRIFICATIONS

```bash
railway logs --tail 100 | grep -E "(Bootstrap|🚀|Starting|Application is running|migration)"
```

**Logs attendus** :
- ✅ `🚀 Bootstrap function called`
- ✅ `Running database migrations...`
- ✅ `Starting server on port XXXX...`
- ✅ `🚀 Application is running on: http://0.0.0.0:XXXX`

---

**Corrections appliquées. Vérifiez les logs dans quelques minutes !**
