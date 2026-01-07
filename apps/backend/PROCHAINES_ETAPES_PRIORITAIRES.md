# 🎯 Prochaines Étapes Prioritaires

## ✅ État Actuel

1. **Correction `/health`** : Code corrigé (enregistré AVANT app.init()), mais pas encore déployé
2. **Migration User.name** : Migration Prisma créée, pas encore exécutée en production
3. **Migrations automatiques** : Configurées dans `main.ts` (s'exécutent au démarrage)

---

## 🚀 Actions Prioritaires

### 1. Déployer la Correction `/health` (URGENT)

Les changements dans `main.ts` corrigent le problème `/health` mais ne sont pas encore déployés.

**Actions** :
```bash
# Commit et push les changements
git add apps/backend/src/main.ts
git commit -m "fix: Register /health endpoint before NestJS app creation"
git push

# Attendre le déploiement (2-3 minutes)
# Puis tester :
curl https://api.luneo.app/health
```

**Résultat attendu** : Status 200 avec JSON `{"status":"ok",...}`

---

### 2. Vérifier l'Exécution Automatique des Migrations

Les migrations Prisma sont configurées pour s'exécuter automatiquement au démarrage dans `main.ts` (ligne 59).

**Vérification** :
```bash
# Vérifier les logs après déploiement
railway logs --tail 200 | grep -E "(migration|Migration|Running database)"

# Devrait montrer :
# "Running database migrations..."
# "Database migrations completed"
```

**Si les migrations s'exécutent automatiquement** : ✅ Aucune action requise
**Si les migrations échouent** : Passer à l'étape 3

---

### 3. Exécuter la Migration User.name (Si Nécessaire)

Si les migrations automatiques ne fonctionnent pas ou si la colonne `User.name` n'existe toujours pas.

**Option A : Via Script Local (Recommandé si Railway shell indisponible)**
```bash
cd apps/backend
./scripts/execute-migration-locale.sh
```

**Option B : Via Railway CLI**
```bash
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

**Option C : Via Dashboard Railway**
1. Railway Dashboard → Service → Deployments → ... → Open Shell
2. Exécuter :
   ```bash
   cd apps/backend
   pnpm prisma migrate deploy
   ```

---

### 4. Tester les Endpoints Critiques

Une fois `/health` fonctionnel et la migration exécutée :

**A. Health Check**
```bash
curl https://api.luneo.app/health
# Devrait retourner 200
```

**B. Signup (Test de la colonne User.name)**
```bash
curl -X POST https://api.luneo.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"User"
  }'
# Devrait retourner 201 ou 200 (pas 500)
```

**C. Products**
```bash
curl https://api.luneo.app/api/products
# Devrait retourner 200 avec liste de produits
```

**D. Auth Login**
```bash
curl -X POST https://api.luneo.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!"
  }'
# Devrait retourner 200 avec tokens
```

---

### 5. Réactiver le Health Check dans Railway (Une fois /health fonctionnel)

Une fois que `/health` fonctionne (retourne 200), réactiver le health check dans `railway.toml` :

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
startCommand = "node dist/src/main.js"
```

Puis commit et push :
```bash
git add apps/backend/railway.toml
git commit -m "feat: Re-enable health check in Railway"
git push
```

---

### 6. Monitoring et Logs (Après Stabilisation)

**A. Vérifier Sentry**
- Les erreurs devraient être envoyées à Sentry
- Vérifier dans le dashboard Sentry

**B. Logs Structurés**
- Vérifier que les logs sont bien formatés
- Configurer des alertes si nécessaire

**C. Métriques de Performance**
- Vérifier les temps de réponse
- Configurer des dashboards de monitoring

---

## 📋 Checklist

- [ ] Déployer correction `/health`
- [ ] Vérifier `/health` retourne 200
- [ ] Vérifier l'exécution automatique des migrations dans les logs
- [ ] Exécuter migration User.name si nécessaire
- [ ] Tester `/api/auth/signup` (vérifier que User.name fonctionne)
- [ ] Tester `/api/products`
- [ ] Tester `/api/auth/login`
- [ ] Réactiver health check dans Railway
- [ ] Vérifier Sentry
- [ ] Configurer logs structurés
- [ ] Configurer métriques de performance

---

## 🐛 En Cas de Problème

### `/health` retourne toujours 404
→ Vérifier que les changements sont bien déployés :
```bash
railway logs --tail 100 | grep -E "(Health check|health)"
```

### Migration échoue
→ Vérifier DATABASE_URL :
```bash
railway variables | grep DATABASE_URL
```

### Signup retourne 500
→ Vérifier que la colonne `User.name` existe :
```bash
# Via script local ou Railway shell
psql "$DATABASE_URL" -c "\d \"User\"" | grep name
```



