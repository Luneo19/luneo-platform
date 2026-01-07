# 🔍 Explication : Déploiement Railway

## ❌ Problème Identifié

J'ai utilisé `git push` en pensant que Railway était connecté à GitHub pour le déploiement automatique, mais **Railway n'est PAS connecté à GitHub** pour ce projet. Donc le code n'a pas été déployé.

## ✅ Solution : Déploiement Manuel avec `railway up`

Pour déployer sur Railway, il faut utiliser :

```bash
cd apps/backend
railway up
```

ou

```bash
railway up --detach  # Pour ne pas suivre les logs en temps réel
```

## 🔄 Deux Modes de Déploiement Railway

### Mode 1 : Déploiement Automatique (GitHub)

**Configuration requise** :
- Projet Railway connecté au repo GitHub dans le Dashboard
- Railway surveille la branche `main` (ou configurée)
- Chaque `git push` déclenche automatiquement un déploiement

**Avantage** : Automatique, pas besoin de commande supplémentaire

### Mode 2 : Déploiement Manuel (CLI)

**Configuration requise** :
- Aucune connexion GitHub nécessaire
- Utilise `railway up` pour déployer manuellement
- Déploie le code local actuel

**Avantage** : Contrôle total sur quand déployer

## 📝 Pourquoi `git push` ne suffit pas ici ?

**Parce que Railway n'est PAS connecté à GitHub** pour ce projet.

Dans le Dashboard Railway :
- Settings → Source
- Si "No source" ou "Manual Deploy", alors il faut utiliser `railway up`
- Si "GitHub" avec un repo, alors `git push` déclenche le déploiement

## ✅ Solution Appliquée

**Commande exécutée** :
```bash
cd apps/backend
railway up --detach
```

Cela va :
1. Compresser le code local
2. L'uploader sur Railway
3. Lancer le build et le déploiement
4. Ne pas suivre les logs (--detach)

## 🔍 Vérification du Déploiement

**Attendre 2-3 minutes, puis** :

1. **Vérifier les logs** :
   ```bash
   railway logs --tail 200 | grep -E "(Health check route registered|Application is running)"
   ```

2. **Tester /health** :
   ```bash
   curl https://api.luneo.app/health
   ```

   Devrait retourner 200 avec JSON :
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "uptime": 123.45,
     "service": "luneo-backend",
     "version": "1.0.0"
   }
   ```

## 🎯 Leçon Apprise

**Pour les prochains déploiements** :

1. **Vérifier d'abord** si Railway est connecté à GitHub :
   - Dashboard Railway → Settings → Source
   
2. **Si connecté à GitHub** : `git push` suffit (déploiement automatique)
   
3. **Si PAS connecté à GitHub** : Utiliser `railway up` (déploiement manuel)

## 📚 Documentation Railway

- **Railway CLI Docs** : https://docs.railway.app/develop/cli
- **Railway Deployment** : https://docs.railway.app/deploy/builds



