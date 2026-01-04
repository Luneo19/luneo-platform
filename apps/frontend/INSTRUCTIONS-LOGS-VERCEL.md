# 📋 INSTRUCTIONS POUR RÉCUPÉRER LES LOGS VERCEL

Le déploiement échoue. Pour identifier l'erreur exacte, suivez ces étapes :

## 🔍 Méthode 1 : Dashboard Vercel (Recommandé)

1. **Allez sur** : https://vercel.com/luneos-projects/frontend/deployments

2. **Cliquez sur** le dernier déploiement (celui avec le statut "Error")

3. **Allez dans l'onglet "Build Logs"** ou "Runtime Logs"

4. **Copiez-collez les 100 dernières lignes** des logs ici

## 🔍 Méthode 2 : Vercel CLI

```bash
cd apps/frontend

# Récupérer l'URL du dernier déploiement
vercel ls

# Récupérer les logs (remplacez [URL] par l'URL du déploiement)
vercel logs [URL]
```

## 🔍 Méthode 3 : Script automatique

```bash
cd apps/frontend
node get-vercel-logs.js
```

---

## 🎯 Ce qu'il faut chercher dans les logs

- ❌ Erreurs Prisma (`@prisma/client did not initialize`)
- ❌ Erreurs TypeScript
- ❌ Erreurs de dépendances manquantes
- ❌ Erreurs de build Next.js
- ❌ Erreurs dans `setup-local-packages.sh`

---

## 📝 Format attendu

Partagez les logs dans ce format :

```
[Timestamp] Error: ...
[Timestamp] ...
```

---

**Une fois les logs partagés, je pourrai identifier et corriger l'erreur immédiatement !**









