# Configuration Railway Health Check via API

## Méthode 1: Via API GraphQL (Recommandé)

Pour configurer automatiquement le health check path via l'API GraphQL de Railway :

### 1. Obtenir un token Railway

1. Allez sur https://railway.app/account/tokens
2. Cliquez sur "New Token"
3. Donnez un nom au token (ex: "health-check-config")
4. Copiez le token généré

### 2. Exporter le token

```bash
export RAILWAY_TOKEN='votre-token-ici'
```

### 3. Exécuter le script

```bash
./scripts/configure-railway-health-check-graphql.sh
```

Le script va :
- Récupérer automatiquement l'ID du projet et du service
- Configurer le health check path à `/api/v1/health` via l'API GraphQL
- Vérifier que la configuration a été appliquée

## Méthode 2: Via railway.toml (Fallback)

Si vous n'avez pas de token API, le script utilisera automatiquement `railway.toml` :

```bash
./scripts/configure-railway-health-check-graphql.sh
```

Le script va :
- Mettre à jour `railway.toml` avec `healthcheckPath = "/api/v1/health"`
- Déclencher un redéploiement automatique

**Note:** Railway peut prendre quelques minutes pour prendre en compte les changements dans `railway.toml`.

## Méthode 3: Configuration manuelle (Si nécessaire)

Si les méthodes automatiques ne fonctionnent pas :

1. Ouvrez Railway Dashboard :
   ```bash
   railway open
   ```

2. Allez dans **Settings** → **Health Check**

3. Configurez :
   - **Health Check Path:** `/api/v1/health`
   - **Health Check Timeout:** `300`

4. Sauvegardez et attendez le redéploiement

## Vérification

Après configuration, vérifiez que le health check fonctionne :

```bash
# Obtenir l'URL du service
railway domain

# Tester le health check
curl https://$(railway domain)/api/v1/health
```

Vous devriez recevoir une réponse JSON avec `status: "ok"`.



