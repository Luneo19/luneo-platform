# 🔧 Correction Redis Railway

## Problème identifié

Le backend Railway essaie de se connecter à Redis sur `127.0.0.1:6379` (localhost) mais Redis n'est pas configuré.

## Solution

### Option 1 : Ajouter Redis sur Railway (Recommandé)

1. **Ouvrir Railway Dashboard**
   ```bash
   railway open
   ```

2. **Ajouter Redis**
   - Cliquez sur "+ New"
   - Sélectionnez "Database" → "Redis"
   - Railway génère automatiquement `REDIS_URL`

3. **Configurer REDIS_URL dans le service backend**
   - Ouvrez le service `backend`
   - Allez dans "Variables"
   - Ajoutez : `REDIS_URL = ${{Redis.REDIS_URL}}`
   - Utilisez exactement cette syntaxe pour référencer Redis

### Option 2 : Utiliser Upstash Redis (Alternative)

1. **Créer un compte Upstash** : https://upstash.com
2. **Créer une base Redis**
3. **Copier l'URL Redis** (format: `rediss://...`)
4. **Ajouter dans Railway** :
   ```bash
   railway variables set REDIS_URL="rediss://..."
   ```

### Option 3 : Mode dégradé (Sans Redis)

Le code a été modifié pour fonctionner sans Redis en mode dégradé. L'application fonctionnera mais sans cache.

## Vérification

Après configuration, vérifiez les logs :
```bash
railway logs
```

Vous ne devriez plus voir les erreurs `ECONNREFUSED 127.0.0.1:6379`.

