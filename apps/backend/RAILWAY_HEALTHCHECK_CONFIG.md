# 📋 Configuration Railway Healthcheck

Selon la [documentation Railway sur les healthchecks](https://docs.railway.com/guides/healthchecks) :

## ✅ Points Importants

### 1. Hostname Railway
- Railway utilise le hostname **`healthcheck.railway.app`** pour les healthchecks
- Notre application n'a **pas de restriction de hostname** (pas de validation de Host header)
- Donc **aucune modification nécessaire** pour accepter les healthchecks Railway

### 2. Healthcheck Path
- Le healthcheck path doit retourner **HTTP 200** quand l'application est prête
- Notre endpoint `/health` retourne 200 avec JSON : ✅ Configuré correctement

### 3. Healthcheck Timeout
- Timeout par défaut : **300 secondes (5 minutes)**
- Si l'application ne retourne pas 200 dans ce délai, le déploiement est marqué comme échoué
- Configurable via `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` ou dans les settings du service

### 4. Configuration dans Railway

**Dans `railway.toml`** :
```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300  # secondes (optionnel, 300 par défaut)
```

**Ou dans Railway Dashboard** :
- Service → Settings → Healthcheck Path : `/health`
- Healthcheck Timeout : 300 (secondes)

### 5. Monitoring Continu
⚠️ **Important** : Railway n'utilise **PAS** le healthcheck pour le monitoring continu
- Le healthcheck est seulement appelé **au démarrage du déploiement**
- Pour le monitoring continu, utiliser un service externe (ex: Uptime Kuma)

## 🔧 Configuration Actuelle

### ✅ Endpoint `/health` Configuré
- Route enregistrée **AVANT** NestJS (ligne 77 de `main.ts`)
- Retourne 200 avec JSON
- Accessible à `/health` (pas de préfixe API)

### ⚠️ Healthcheck Désactivé dans `railway.toml`
Actuellement désactivé temporairement :
```toml
# healthcheckPath = "/health"  # DÉSACTIVÉ TEMPORAIREMENT
```

**Une fois que `/health` fonctionne (retourne 200), réactiver** :
```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
```

## 📝 Prochaines Étapes

1. ✅ Vérifier que `/health` fonctionne (retourne 200)
2. ✅ Réactiver le healthcheck dans `railway.toml`
3. ✅ Tester le déploiement avec healthcheck activé

## 🔗 Références

- [Documentation Railway Healthchecks](https://docs.railway.com/guides/healthchecks)
- Configuration actuelle : `apps/backend/railway.toml`
- Code healthcheck : `apps/backend/src/main.ts` (ligne 77-87)

