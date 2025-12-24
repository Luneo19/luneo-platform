# 📋 INSTRUCTIONS - VARIABLES SENTRY RAILWAY

**Date** : 22 décembre 2024

---

## 🔧 CONFIGURATION MANUELLE REQUISE

La CLI Railway ne supporte pas `railway variables set`. Vous devez ajouter les variables via le Dashboard.

---

## 📝 ÉTAPES POUR AJOUTER LES VARIABLES SENTRY

### 1. Accéder au Dashboard Railway
1. Aller sur https://railway.app
2. Se connecter avec votre compte
3. Sélectionner le projet : **believable-learning**
4. Sélectionner le service : **backend**

### 2. Ajouter les Variables
1. Cliquer sur l'onglet **"Variables"** dans le menu latéral
2. Cliquer sur **"+ New Variable"**
3. Ajouter les variables suivantes :

#### Variable 1 : SENTRY_DSN
- **Name** : `SENTRY_DSN`
- **Value** : `https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736`
- **Environment** : Production (ou All)

#### Variable 2 : SENTRY_ENVIRONMENT
- **Name** : `SENTRY_ENVIRONMENT`
- **Value** : `production`
- **Environment** : Production (ou All)

### 3. Redéployer
Après avoir ajouté les variables, Railway redéploiera automatiquement le service.

---

## ✅ VÉRIFICATION

Après le redéploiement, vérifiez les logs :

```bash
railway logs --tail 100 | grep -i sentry
```

**Logs attendus** :
- ✅ Pas de warning `[Sentry] SENTRY_DSN not configured`
- ✅ Sentry initialisé correctement

---

**Une fois les variables ajoutées, Sentry fonctionnera correctement !**
