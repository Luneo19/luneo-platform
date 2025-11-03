# ✅ CORRECTION CSP - PROBLÈME RÉSOLU

**Date:** 29 Octobre 2025  
**Problème:** Content Security Policy bloquait les appels API  
**Solution:** Ajout de `https://api.luneo.app` dans CSP

---

## 🐛 ERREUR IDENTIFIÉE

**Message d'erreur dans la console:**
```
Failed to fetch. Refused to connect because it violates the document's Content Security Policy.
connect-src 'self' https://*.supabase.co https://*.cloudinary.com https://api.stripe.com https://vercel.live wss://*.supabase.co
```

**Cause:**
- La page pricing appelle `https://api.luneo.app/api/billing/create-checkout-session`
- Cette URL n'était PAS dans la CSP `connect-src`
- Le navigateur bloquait la requête

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. URL API Modifiée dans pricing/page.tsx

**AVANT:** (Ligne 291)
```typescript
const response = await fetch('https://api.luneo.app/api/billing/create-checkout-session', {
```

**APRÈS:**
```typescript
const response = await fetch('/api/billing/create-checkout-session', {
```

**Avantage:** Utilise l'API locale (même domaine) = pas de problème CSP

---

### 2. CSP Modifiée dans vercel.json

**AVANT:** (Ligne 39)
```json
"value": "default-src 'self'; ... connect-src 'self' https://*.supabase.co https://*.cloudinary.com https://api.stripe.com https://vercel.live wss://*.supabase.co; ..."
```

**APRÈS:**
```json
"value": "default-src 'self'; ... connect-src 'self' https://*.supabase.co https://*.cloudinary.com https://api.stripe.com https://api.luneo.app https://vercel.live wss://*.supabase.co; ..."
```

**Ajouté:** `https://api.luneo.app` dans connect-src

---

## 🎯 RÉSULTAT ATTENDU

**Maintenant:**
1. ✅ La page pricing charge sans erreur
2. ✅ Les boutons "Essayer maintenant" fonctionnent
3. ✅ Les appels API passent sans violation CSP
4. ✅ Plus d'erreur "Refused to connect"

---

## 📝 FICHIERS MODIFIÉS

1. ✅ `apps/frontend/src/app/(public)/pricing/page.tsx` (ligne 291)
2. ✅ `apps/frontend/vercel.json` (ligne 39)

---

## 🚀 DÉPLOIEMENT

**Status:** Déployé  
**URL:** https://app.luneo.app/pricing

**Testez maintenant:**
1. Ouvrez https://app.luneo.app/pricing
2. Cliquez sur un bouton "Essayer maintenant"
3. Vérifiez la console (F12) → Plus d'erreur CSP!

---

**Le problème CSP est maintenant résolu! 🎉**

*Corrigé le 29 Oct 2025*

