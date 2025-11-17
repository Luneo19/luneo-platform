# ⚠️ Configuration DATABASE_URL - IMPORTANT

**Date**: 17 novembre 2025  
**Statut**: ⚠️ **ACTION REQUISE**

---

## 🚨 Problème

Le backend retourne `FUNCTION_INVOCATION_FAILED` car `DATABASE_URL` est manquante ou invalide.

Une valeur temporaire a été configurée pour permettre au backend de démarrer, mais **vous devez la remplacer par votre vraie URL PostgreSQL**.

---

## 📋 Comment Obtenir DATABASE_URL

### Option 1: Supabase (Recommandé)

1. Allez dans votre projet Supabase Dashboard
2. **Settings** > **Database**
3. Dans la section **Connection string**, sélectionnez **URI**
4. Copiez la chaîne de connexion complète
5. Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

**Note**: Remplacez `[PASSWORD]` par votre mot de passe de base de données Supabase.

### Option 2: Autre Base PostgreSQL

Format: `postgresql://user:password@host:port/database`

Exemples:
- Local: `postgresql://postgres:password@localhost:5432/luneo`
- Cloud: `postgresql://user:password@db.example.com:5432/luneo`

---

## 🔧 Configuration dans Vercel

### Méthode 1: Via CLI (Recommandé)

```bash
cd apps/backend
vercel env rm DATABASE_URL production --yes
vercel env add DATABASE_URL production
# Collez votre URL PostgreSQL complète
```

### Méthode 2: Via Dashboard Vercel

1. Allez dans Vercel Dashboard
2. Sélectionnez le projet `backend`
3. **Settings** > **Environment Variables**
4. Trouvez `DATABASE_URL` (ou créez-la)
5. Collez votre URL PostgreSQL
6. Sélectionnez **Production** environment
7. **Save**

---

## ✅ Vérification

Après configuration:

1. **Redéployer le backend**:
   ```bash
   cd apps/backend
   vercel --prod
   ```

2. **Attendre 60-90 secondes** pour le déploiement

3. **Tester**:
   ```bash
   curl https://backend-luneos-projects.vercel.app/health
   ```

4. **Vérifier les logs** si problème:
   ```bash
   cd apps/backend
   vercel logs <deployment-url>
   ```

---

## 🎯 Résultat Attendu

Une fois `DATABASE_URL` correctement configurée:

- ✅ Backend démarre sans erreur
- ✅ `/health` retourne `{"status":"ok"}`
- ✅ Routes API fonctionnent
- ✅ Connexion à la base de données réussie

---

## ⚠️ Valeur Temporaire Actuelle

Une valeur temporaire a été configurée:
```
postgresql://postgres:temp_password@localhost:5432/luneo_temp
```

**Cette valeur ne fonctionnera pas en production.** Vous devez la remplacer par votre vraie URL PostgreSQL.

---

**Dernière mise à jour**: 17 novembre 2025

