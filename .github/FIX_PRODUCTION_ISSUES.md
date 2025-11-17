# 🔧 Correction des Problèmes de Production

**Date**: 17 novembre 2025  
**Problème**: "Failed to fetch" lors de l'inscription

---

## 🔍 Diagnostic

L'erreur "Failed to fetch" vient de **Supabase non configuré dans Vercel**.

Le frontend utilise Supabase pour l'authentification, mais les variables d'environnement Supabase ne sont pas configurées dans Vercel.

---

## ✅ Solution : Configurer Supabase dans Vercel

### Étape 1 : Obtenir les Variables Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet (ou créez-en un)
3. Allez dans **Settings** → **API**
4. Copiez les valeurs suivantes :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (pour l'admin client)

### Étape 2 : Configurer dans Vercel

#### Option A : Via le Dashboard Vercel (Recommandé)

1. Allez sur https://vercel.com/luneos-projects
2. Sélectionnez le projet **frontend**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

5. Sélectionnez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

#### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Configurer les variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Coller: https://votre-projet.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Coller: votre-anon-key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Coller: votre-service-role-key

# Répéter pour preview et development
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview

vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY development
```

### Étape 3 : Redéployer

Après avoir ajouté les variables :

1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** sur le dernier déploiement
3. Ou poussez un commit pour déclencher un nouveau déploiement

---

## 🔧 Autres Corrections Appliquées

### 1. Correction de `NEXT_PUBLIC_API_URL`

**Avant**:
```json
"NEXT_PUBLIC_API_URL": "https://backend-n1eleizz7-luneos-projects.vercel.app"
```

**Après**:
```json
"NEXT_PUBLIC_API_URL": "https://backend-luneos-projects.vercel.app/api"
```

✅ **Corrigé dans** `apps/frontend/vercel.json`

---

## 📋 Checklist de Configuration

- [ ] Variables Supabase configurées dans Vercel
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Variables configurées pour Production, Preview, et Development
- [ ] Redéploiement effectué
- [ ] Test d'inscription réussi

---

## 🧪 Test Après Configuration

1. Allez sur https://frontend-luneos-projects.vercel.app/register
2. Remplissez le formulaire d'inscription
3. Cliquez sur "Créer mon compte"
4. ✅ L'inscription devrait fonctionner sans erreur "Failed to fetch"

---

## 🔗 Liens Utiles

- **Vercel Dashboard**: https://vercel.com/luneos-projects
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Frontend Production**: https://frontend-luneos-projects.vercel.app
- **Backend Production**: https://backend-luneos-projects.vercel.app

---

## ❓ Problèmes Courants

### "Failed to fetch" persiste après configuration
- Vérifiez que les variables sont bien configurées dans Vercel
- Vérifiez que le redéploiement a bien eu lieu
- Vérifiez les logs Vercel pour voir les erreurs exactes

### Supabase retourne une erreur
- Vérifiez que les clés API sont correctes
- Vérifiez que le projet Supabase est actif
- Vérifiez que les tables nécessaires existent dans Supabase (`profiles`)

---

**Dernière mise à jour**: 17 novembre 2025

