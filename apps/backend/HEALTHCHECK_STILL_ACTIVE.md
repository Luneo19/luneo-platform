# ⚠️ Problème : Healthcheck Toujours Actif

**Date** : 4 janvier 2026, 20:37

## ❌ Problème

Même après avoir désactivé le healthcheck dans `railway.toml`, Railway **continue de l'utiliser** :

```
Starting Healthcheck
Path: /health
Retry window: 1m40s

Attempt #1 failed with service unavailable
...
Attempt #7 failed with service unavailable

1/1 replicas never became healthy!
Healthcheck failed!
```

## 🔍 Causes Possibles

1. **Railway utilise la configuration du Dashboard** plutôt que `railway.toml`
   - La configuration dans le Dashboard a priorité
   - Il faut désactiver le healthcheck dans le Dashboard

2. **Le changement n'a pas été déployé**
   - Le fichier `railway.toml` n'a pas été commité/pushé
   - Railway utilise encore l'ancienne version

3. **Railway ignore `railway.toml` pour certaines configurations**
   - Le healthcheck doit être configuré dans le Dashboard

## ✅ Solution : Désactiver dans le Dashboard

Si Railway utilise la configuration du Dashboard :

1. Aller dans Railway Dashboard
2. Service "backend" → Settings
3. Trouver "Healthcheck Path" ou "Health Check"
4. **Désactiver** ou **laisser vide**
5. Sauvegarder
6. Redéployer

OU utiliser le Railway CLI pour désactiver :
```bash
railway variables set RAILWAY_HEALTHCHECK_PATH=""
```

## 📋 Prochaines Étapes

1. ✅ Commit et push le changement dans `railway.toml` (fait)
2. ⏳ Vérifier si Railway utilise le Dashboard ou le fichier
3. ⏳ Désactiver le healthcheck dans le Dashboard si nécessaire
4. ⏳ Redéployer et vérifier les logs

