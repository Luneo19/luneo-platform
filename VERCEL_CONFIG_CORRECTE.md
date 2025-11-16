# 🎯 CONFIGURATION VERCEL CORRECTE

**Date:** 29 Octobre 2025  
**Projet Supabase CORRECT:** obrijgptqztacolemsbk

---

## ✅ DÉCOUVERTE IMPORTANTE

Votre projet Supabase "Luneo Platform Production" est:
```
ID: obrijgptqztacolemsbk
URL: https://obrijgptqztacolemsbk.supabase.co
```

**Toutes les tables existent déjà ! ✅**

---

## 🔧 VARIABLES VERCEL À CONFIGURER

### Variables Frontend (CORRECTES)

```env
NEXT_PUBLIC_SUPABASE_URL
→ https://obrijgptqztacolemsbk.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
→ [À récupérer depuis Supabase Settings → API]

NEXT_PUBLIC_API_URL
→ https://app.luneo.app/api

NEXT_PUBLIC_APP_URL
→ https://app.luneo.app

NEXT_PUBLIC_GOOGLE_CLIENT_ID
→ 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com

NEXT_PUBLIC_GITHUB_CLIENT_ID
→ Ov23liJmVOHyn8tfxgLi

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
→ pk_live_your_publishable_key

OPENAI_API_KEY
→ [Votre clé OpenAI]
```

---

## 📋 ÉTAPES IMMÉDIATES

### 1. Récupérer la Clé Anon (2 min)

1. Aller sur https://supabase.com/dashboard/project/obrijgptqztacolemsbk
2. Menu gauche → **"Settings"** (⚙️ icône en bas)
3. Cliquer sur **"API"**
4. Copier la clé **"anon public"**

### 2. Mettre à Jour Vercel (5 min)

```bash
# Se connecter
https://vercel.com/dashboard

# Aller dans votre projet → Settings → Environment Variables

# SUPPRIMER les anciennes variables si elles existent
# (celles qui pointaient vers bkasxmzwilkbmszovedc)

# AJOUTER les nouvelles (All Environments):

NEXT_PUBLIC_SUPABASE_URL
→ https://obrijgptqztacolemsbk.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
→ [La clé que vous venez de copier]

# + Toutes les autres variables listées ci-dessus
```

### 3. Mettre à Jour .env Local (3 min)

```bash
cd /Users/emmanuelabougadous/luneo-platform

# Créer/éditer .env.local
cat > .env.local << 'EOF'
# Supabase (PROJET CORRECT)
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-anon]

# OpenAI
OPENAI_API_KEY=[votre-clé-openai]
EOF
```

### 4. Tester en Local (2 min)

```bash
cd apps/frontend
npm run dev

# Ouvrir http://localhost:3000/login
# Se connecter avec emmanuel.abougadous@gmail.com
# Vérifier que le dashboard fonctionne
```

### 5. Déployer (5 min)

```bash
cd apps/frontend
vercel --prod
```

---

## 🎯 POURQUOI ÇA NE MARCHAIT PAS AVANT

Le problème était simple:
- ❌ Les variables pointaient vers `bkasxmzwilkbmszovedc` (mauvais projet)
- ✅ Les tables sont sur `obrijgptqztacolemsbk` (bon projet)

**Solution:** Changer les variables pour pointer vers le bon projet !

---

## 🧪 TESTS APRÈS CORRECTION

### Test 1: Connexion
```
https://app.luneo.app/login
```
Connectez-vous → Devrait rediriger vers /dashboard ✅

### Test 2: Dashboard
```
https://app.luneo.app/dashboard
```
Les stats doivent s'afficher (peut être vide au début) ✅

### Test 3: API
```bash
curl https://app.luneo.app/api/health
```
Devrait retourner: `{"status":"healthy"}` ✅

---

## 📊 TABLEAU DES PROJETS CORRIGÉ

| Projet ID | Utilisation | Tables | Status |
|-----------|-------------|--------|--------|
| obrijgptqztacolemsbk | ✅ PRODUCTION | ✅ Toutes présentes | À utiliser |
| bkasxmzwilkbmszovedc | ❌ Ancien/inutilisé | ❓ Inconnu | À supprimer |
| brxxdjjqzwrbhyjalatg | ❌ Ancien/inutilisé | ❓ Inconnu | À supprimer |

---

## ✅ CHECKLIST FINALE

- [ ] Récupérer anon key depuis obrijgptqztacolemsbk
- [ ] Mettre à jour variables Vercel (URL + KEY)
- [ ] Mettre à jour .env.local
- [ ] Tester en local
- [ ] Déployer sur Vercel
- [ ] Tester en production
- [ ] Supprimer les anciens projets Supabase

---

**🎉 VOUS ÊTES PRESQUE EN PRODUCTION !**

Il suffit juste de corriger les variables d'environnement pour qu'elles pointent vers le bon projet Supabase (`obrijgptqztacolemsbk`).

---

*Configuration corrigée le 29 Octobre 2025*

