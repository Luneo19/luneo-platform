# 🔧 Désactiver le Healthcheck dans Railway Dashboard

**Date** : 4 janvier 2026, 20:44

## ⚠️ Problème

Railway **continue d'utiliser le healthcheck** malgré la désactivation dans `railway.toml`.

La configuration dans le **Dashboard Railway a priorité** sur `railway.toml` pour les healthchecks.

## ✅ Solution : Désactiver dans le Dashboard

### Méthode 1 : Via le Dashboard Web (Recommandé)

1. **Ouvrir Railway Dashboard**
   - Aller sur : https://railway.com/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971
   - Ou utiliser : `railway open`

2. **Sélectionner le service "backend"**

3. **Aller dans Settings**
   - Cliquer sur l'onglet **"Settings"** en haut

4. **Trouver "Health Check"**
   - Chercher la section **"Health Check"** ou **"Healthcheck"**
   - Trouver le champ **"Healthcheck Path"**

5. **Désactiver ou vider le champ**
   - **Effacer** la valeur `/health` (laisser vide)
   - OU **décocher** "Enable Health Check" s'il y a une case à cocher

6. **Sauvegarder**
   - Cliquer sur **"Save"** ou **"Update"**

7. **Redéployer**
   - Railway devrait automatiquement redéployer
   - OU utiliser : `railway up` depuis la racine

### Méthode 2 : Via Railway CLI (Alternative)

⚠️ **Note** : Cette méthode peut ne pas fonctionner car Railway CLI ne permet pas toujours de modifier la configuration du healthcheck.

```bash
# Désactiver via variable d'environnement (si supporté)
railway variables set RAILWAY_HEALTHCHECK_PATH=""
```

## 📋 Vérification

Après avoir désactivé le healthcheck :

1. **Vérifier que le nouveau build démarre sans healthcheck**
   ```bash
   railway logs --tail 100 | grep -E "(Starting Healthcheck|Healthcheck failed)"
   ```
   - **Ne devrait plus voir** : "Starting Healthcheck" ou "Healthcheck failed"

2. **Vérifier que l'application démarre correctement**
   ```bash
   railway logs --tail 200 | grep -E "(Bootstrap function called|Application is running|Nest application successfully started)"
   ```
   - **Devrait voir** : "Bootstrap function called", "Application is running"

3. **Tester manuellement `/health`** (une fois l'app démarrée)
   ```bash
   curl https://api.luneo.app/health
   ```
   - **Devrait retourner** : `200 OK` avec un JSON

## 🔄 Prochaines Étapes

Une fois le healthcheck désactivé :

1. ✅ Le déploiement devrait réussir (pas de timeout de healthcheck)
2. ⏳ L'application devrait démarrer correctement
3. ⏳ Le nouveau code avec `/health` enregistré AVANT NestJS sera déployé
4. ⏳ Tester `/health` manuellement pour confirmer qu'il fonctionne
5. ⏳ Réactiver le healthcheck dans le Dashboard une fois `/health` fonctionnel

## 📝 Notes

- Railway peut avoir **deux sources de configuration** :
  - **Dashboard** : Configuration via l'interface web (priorité)
  - **railway.toml** : Configuration via fichier (priorité moindre pour healthcheck)

- Pour les healthchecks, Railway privilégie souvent la **configuration du Dashboard**

- Une fois `/health` fonctionnel, on pourra **réactiver le healthcheck** dans le Dashboard avec le path `/health`

