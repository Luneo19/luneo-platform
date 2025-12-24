# 🔧 Configuration DATABASE_URL avec Neon

**Date**: 17 novembre 2025  
**Statut**: Neon initialisé, projet à créer

---

## ✅ Neon Initialisé

Neon a été initialisé avec succès dans votre projet. L'organisation **Lunéo (org-late-bush-99355559)** est configurée.

---

## 📋 Obtenir DATABASE_URL depuis Neon

### Option 1: Via Dashboard Neon (Recommandé)

1. **Allez sur https://console.neon.tech**
2. **Connectez-vous** avec votre compte
3. **Créez un projet** (ou utilisez un existant):
   - Cliquez sur **"Create Project"**
   - Nom: `luneo-platform`
   - Région: Choisissez la plus proche
   - Cliquez sur **"Create Project"**
4. **Obtenez la Connection String**:
   - Dans votre projet, allez dans **"Connection Details"**
   - Sélectionnez **"URI"** dans le format
   - Copiez la connection string complète
   - Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### Option 2: Via CLI Neon

```bash
# Lister les projets
npx neonctl@latest projects list

# Obtenir la connection string
npx neonctl@latest connection-string --project-id [PROJECT_ID]
```

---

## 🔧 Configuration dans Vercel

Une fois que vous avez votre DATABASE_URL:

```bash
cd apps/backend

# Supprimer l'ancienne DATABASE_URL
vercel env rm DATABASE_URL production --yes

# Ajouter la nouvelle
vercel env add DATABASE_URL production
# Collez votre URL Neon ici

# Redéployer
vercel --prod
```

---

## ✅ Vérification

Après configuration et redéploiement:

```bash
# Attendre 60-90 secondes
curl https://backend-luneos-projects.vercel.app/health
```

Vous devriez voir `{"status":"ok"}` au lieu de `FUNCTION_INVOCATION_FAILED`.

---

## 🎯 Résultat Attendu

- ✅ Backend démarre sans erreur
- ✅ `/health` retourne `{"status":"ok"}`
- ✅ Routes API fonctionnent
- ✅ Connexion à la base de données réussie

---

**Dernière mise à jour**: 17 novembre 2025

