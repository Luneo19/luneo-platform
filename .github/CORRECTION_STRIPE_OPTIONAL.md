# ✅ Correction STRIPE_SECRET_KEY Optionnel

**Date**: 17 novembre 2025  
**Problème**: STRIPE_SECRET_KEY était requis mais pouvait ne pas être configuré

---

## 🔍 Problème Identifié

Le schéma de validation Zod requiert `STRIPE_SECRET_KEY` qui doit commencer par `sk_`. Si cette variable n'est pas configurée, `validateEnv()` lance une exception qui bloque le démarrage.

---

## ✅ Solution Appliquée

Modifié `apps/backend/src/config/configuration.ts`:

### Avant
```typescript
// Stripe
STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
STRIPE_WEBHOOK_SECRET: z.string().optional(),
```

### Après
```typescript
// Stripe
STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
STRIPE_WEBHOOK_SECRET: z.string().optional(),
```

---

## 🎯 Impact

- ✅ Backend peut démarrer même si STRIPE_SECRET_KEY n'est pas configuré
- ✅ Stripe fonctionnera en mode dégradé si la clé n'est pas fournie
- ✅ Pas d'erreur de validation au démarrage

---

## 📋 Note

Pour utiliser Stripe, vous devrez configurer `STRIPE_SECRET_KEY` dans Vercel:

```bash
cd apps/backend
vercel env add STRIPE_SECRET_KEY production
# Collez votre clé Stripe (commence par sk_)
vercel --prod
```

---

**Dernière mise à jour**: 17 novembre 2025

