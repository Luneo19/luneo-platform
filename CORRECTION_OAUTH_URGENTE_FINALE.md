# 🚨 CORRECTION OAUTH GOOGLE URGENTE - LOCALHOST PERSISTE

**Date:** 31 Octobre 2025 00:30  
**Problème:** OAuth redirige vers localhost:3000 au lieu de app.luneo.app  
**Cause:** Configuration Supabase Dashboard  
**Criticité:** 🔴 BLOQUANT

---

## 🔍 PROBLÈME

### Ce qui se passe
```
1. User clique "S'inscrire avec Google"
2. Popup Google OAuth s'ouvre
3. User autorise
4. Google renvoie vers Supabase
5. Supabase callback redirige vers: localhost:3000 ❌
6. ERR_CONNECTION_REFUSED
```

### Pourquoi localhost?
Le code frontend envoie bien:
```typescript
redirectTo: 'https://app.luneo.app/auth/callback?next=/overview'
```

MAIS Supabase a une **liste de Redirect URLs autorisées** dans le Dashboard.
Si `localhost:3000` est dans cette liste, Supabase peut rediriger là automatiquement.

---

## ✅ SOLUTION

### 1. Configuration Supabase Dashboard (CRITIQUE)

**Aller sur Supabase Dashboard:**
```
https://supabase.com/dashboard/project/obrijgptqztacolemsbk
```

**Naviguer vers:**
```
Authentication → URL Configuration
```

**Vérifier ces paramètres:**

#### Site URL
```
https://app.luneo.app
```
⚠️ PAS localhost:3000

#### Redirect URLs (liste autorisée)
```
✅ AJOUTER:
https://app.luneo.app/auth/callback
https://app.luneo.app/*

❌ SUPPRIMER (ou commenter):
http://localhost:3000/*
http://localhost:3000/auth/callback
```

**Pourquoi:**
- Supabase vérifie que redirectTo est dans la liste autorisée
- Si localhost est en premier, il peut être prioritaire
- En production, SEUL app.luneo.app devrait être autorisé

---

### 2. Variables d'environnement Vercel

**Vérifier dans Vercel Dashboard:**
```
Project → Settings → Environment Variables
```

**Ces variables doivent pointer vers PRODUCTION:**
```
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

⚠️ PAS de références à localhost

---

### 3. Code OAuth (déjà corrigé ✅)

```typescript
// apps/frontend/src/app/(auth)/register/page.tsx
// apps/frontend/src/app/(auth)/login/page.tsx

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: provider,
  options: {
    redirectTo: 'https://app.luneo.app/auth/callback?next=/overview',
  },
});
```

✅ URL hardcodée (pas window.location.origin)
✅ Pointe vers production
✅ Param next=/overview

---

### 4. Callback route (déjà corrigé ✅)

```typescript
// apps/frontend/src/app/auth/callback/route.ts

const redirectTo = requestUrl.searchParams.get('next') 
  || requestUrl.searchParams.get('redirect') 
  || '/overview';

return NextResponse.redirect(`${origin}${redirectTo}`);
```

✅ Utilise param `next`
✅ Fallback `/overview`
✅ Origin dynamique (mais devrait être app.luneo.app en prod)

---

## 🎯 ACTIONS IMMÉDIATES

### À FAIRE MAINTENANT (Par vous)

1. **Ouvrir Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/obrijgptqztacolemsbk/auth/url-configuration
   ```

2. **Modifier "Site URL"**
   ```
   Avant: http://localhost:3000 (ou vide)
   Après: https://app.luneo.app
   ```

3. **Modifier "Redirect URLs"**
   ```
   Supprimer ou commenter:
   - http://localhost:3000/*
   - http://localhost:3000/auth/callback
   
   Garder seulement:
   - https://app.luneo.app/*
   - https://app.luneo.app/auth/callback
   ```

4. **Sauvegarder**
   - Cliquer "Save"
   - Attendre confirmation

5. **Retester OAuth**
   - Aller sur https://app.luneo.app/register
   - Cliquer "S'inscrire avec Google"
   - Autoriser
   - Devrait maintenant rediriger vers app.luneo.app/overview ✅

---

## 📸 GUIDE VISUEL

### Emplacement dans Supabase Dashboard

```
Supabase Dashboard
└── Project: obrijgptqztacolemsbk
    └── Authentication (menu gauche)
        └── URL Configuration
            ├── Site URL: https://app.luneo.app
            └── Redirect URLs:
                ├── https://app.luneo.app/*
                └── https://app.luneo.app/auth/callback
```

### Capture d'écran attendue

**Site URL:**
```
┌─────────────────────────────────────────┐
│ Site URL                                │
│ ┌─────────────────────────────────────┐ │
│ │ https://app.luneo.app               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Redirect URLs:**
```
┌─────────────────────────────────────────┐
│ Redirect URLs                           │
│ ┌─────────────────────────────────────┐ │
│ │ https://app.luneo.app/*             │ │
│ │ https://app.luneo.app/auth/callback │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## ⚠️ POURQUOI CECI EST CRITIQUE

### Sécurité OAuth
Supabase vérifie que les URLs de redirect sont autorisées.
C'est une **protection contre les attaques de redirection**.

### Développement vs Production
- **Développement:** localhost:3000 OK
- **Production:** SEULEMENT app.luneo.app

### Si non corrigé
- ❌ OAuth ne fonctionnera JAMAIS en production
- ❌ Users ne pourront pas s'inscrire avec Google
- ❌ Conversion chute drastiquement

---

## 🎯 APRÈS CORRECTION SUPABASE

### Test à faire
```bash
# 1. Aller sur
https://app.luneo.app/register

# 2. Cliquer
"S'inscrire avec Google"

# 3. Popup Google s'ouvre
Autoriser

# 4. Devrait rediriger vers
https://app.luneo.app/auth/callback?next=/overview&code=...

# 5. Puis automatiquement vers
https://app.luneo.app/overview

# 6. Dashboard affiché ✅
```

---

## 📋 CHECKLIST COMPLÈTE

### Configuration Supabase (À FAIRE)
- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans Authentication → URL Configuration
- [ ] Modifier Site URL → `https://app.luneo.app`
- [ ] Modifier Redirect URLs (supprimer localhost)
- [ ] Ajouter `https://app.luneo.app/*`
- [ ] Ajouter `https://app.luneo.app/auth/callback`
- [ ] Sauvegarder
- [ ] Attendre 1-2 min propagation

### Code Frontend (DÉJÀ FAIT ✅)
- [x] register.tsx → redirectTo hardcodé production
- [x] login.tsx → redirectTo hardcodé production
- [x] callback/route.ts → param `next` supporté
- [x] Dashboard renommé → /overview
- [x] Build success
- [x] Deploy lancé

### Tests (APRÈS config Supabase)
- [ ] Test OAuth Google register
- [ ] Test OAuth Google login
- [ ] Test OAuth GitHub register
- [ ] Test OAuth GitHub login
- [ ] Vérifier redirect vers /overview
- [ ] Vérifier dashboard accessible

---

## 🆘 SI TOUJOURS PROBLÈME

### Vérifier OAuth Provider (Google Cloud Console)

**Authorized redirect URIs dans Google Cloud:**
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

✅ Devrait déjà être configuré (car fourni par Supabase)

### Vérifier logs Supabase

**Dans Supabase Dashboard:**
```
Logs → Auth Logs
```

Chercher:
- Tentative OAuth
- URL de redirect utilisée
- Erreurs éventuelles

---

## 🎉 APRÈS RÉSOLUTION

Une fois la config Supabase corrigée:
- ✅ OAuth Google fonctionne
- ✅ OAuth GitHub fonctionne
- ✅ Registration fluide
- ✅ Dashboard accessible
- ✅ Users peuvent s'inscrire facilement

**Le code est prêt. Il ne manque que la config Supabase Dashboard!** 🎯

---

*Correction OAuth urgente - 31 Octobre 2025*  
*Action requise: Modifier Supabase Dashboard*

