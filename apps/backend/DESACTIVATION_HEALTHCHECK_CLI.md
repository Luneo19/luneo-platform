# 🔧 Désactivation du Healthcheck via CLI/Toml

**Date** : 4 janvier 2026, 20:50

## ✅ Solution Appliquée

J'ai modifié le fichier `railway.toml` pour **définir explicitement** `healthcheckPath = ""` (chaîne vide) au lieu de commenter la ligne.

### Changement dans `railway.toml`

**Avant** :
```toml
[deploy]
# healthcheckPath = "/health"  # Commenté
# healthcheckTimeout = 300
```

**Après** :
```toml
[deploy]
healthcheckPath = ""  # Chaîne vide = healthcheck désactivé
# healthcheckTimeout = 300
```

## 🔍 Pourquoi cette approche ?

Selon la documentation Railway :
- **Commenter** la ligne dans `railway.toml` = Railway peut toujours utiliser la configuration du Dashboard
- **Définir** `healthcheckPath = ""` = Healthcheck explicitement désactivé dans la configuration

## 📋 Prochaines Étapes

1. ✅ `railway.toml` modifié avec `healthcheckPath = ""`
2. ✅ Changement commité et pushé
3. ✅ Nouveau déploiement lancé avec `railway up`
4. ⏳ Attendre la fin du build et vérifier les logs
5. ⏳ Vérifier que le healthcheck n'est plus actif dans les logs de build

## 🔄 Si ça ne fonctionne toujours pas

Si Railway continue d'utiliser le healthcheck malgré cette modification, il faudra :

1. **Désactiver dans le Dashboard Railway** (priorité absolue)
   - Aller sur : https://railway.com/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971/service/a82f89f4-464d-42ef-b3ee-05f53decc0f4
   - Settings → Health Check → Effacer le path ou désactiver

2. **Utiliser l'API Railway** (si disponible)
   - Token disponible dans `~/.railway/config.json`
   - API endpoint : `PATCH /v1/services/{serviceId}` avec `healthcheckPath: null`

## 📝 Notes

- La configuration du **Dashboard Railway a souvent priorité** sur `railway.toml`
- Pour les healthchecks, Railway peut utiliser la configuration du Dashboard même si `railway.toml` dit autre chose
- Si cette modification ne fonctionne pas, il faudra désactiver dans le Dashboard




