# 🎯 Action Immédiate - Finaliser Railway

## ✅ Ce qui est FAIT

1. ✅ Railway CLI installé
2. ✅ Projet lié (`believable-learning`)
3. ✅ PostgreSQL ajouté et configuré
4. ✅ Variables d'environnement configurées (mais sur le service Postgres)

**Variables déjà configurées** :
- NODE_ENV, PORT, API_PREFIX
- JWT_SECRET, JWT_REFRESH_SECRET
- FRONTEND_URL, CORS_ORIGIN
- Configuration SendGrid (sauf API_KEY)
- Rate Limiting

---

## ⚠️ CE QU'IL RESTE À FAIRE (5 minutes)

### Étape 1 : Créer le Service Backend dans Railway

1. **Ouvrez Railway Dashboard**
   ```bash
   railway open
   ```
   Ou allez sur : https://railway.app

2. **Dans votre projet `believable-learning`**
   - Cliquez sur **"+ New"**
   - Sélectionnez **"GitHub Repo"**
   - Choisissez votre dépôt `luneo-platform`
   - **IMPORTANT** : Configurez le **Root Directory** : `apps/backend`
   - Nommez le service : `backend`

3. **Attendez que Railway détecte le projet**
   - Railway va automatiquement détecter que c'est un projet Node.js
   - Il utilisera les fichiers `railway.toml` et `nixpacks.toml` déjà configurés

---

### Étape 2 : Configurer les Variables dans le Service Backend

Une fois le service backend créé, allez dans **Variables** et ajoutez :

#### 🔴 OBLIGATOIRE - Ajoutez cette variable :
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

⚠️ **Important** : Utilisez exactement cette syntaxe `${{Postgres.DATABASE_URL}}` pour référencer la base de données PostgreSQL.

#### 📋 Copier les Variables depuis Postgres

Les variables suivantes doivent être dans le service backend (elles sont actuellement sur Postgres) :

**Variables à copier dans le service backend** :
- `NODE_ENV = production`
- `PORT = 3001`
- `API_PREFIX = /api`
- `JWT_SECRET = PAVKHl/2qpIjhDgXeDIGZb6v1uVxusk9rbUDOwZMNXc=`
- `JWT_REFRESH_SECRET = 3q3h97TmWorVGCdpRpWX6/msf/i+fY0Tigs7NkKZs18=`
- `JWT_EXPIRES_IN = 15m`
- `JWT_REFRESH_EXPIRES_IN = 7d`
- `FRONTEND_URL = https://app.luneo.app`
- `CORS_ORIGIN = https://app.luneo.app,https://luneo.app`
- `RATE_LIMIT_TTL = 60`
- `RATE_LIMIT_LIMIT = 100`
- `DOMAIN_VERIFIED = true`
- `SENDGRID_DOMAIN = luneo.app` (et autres configs SendGrid)

**Optionnel - Ajouter si vous avez Redis** :
```
REDIS_URL = ${{Redis.REDIS_URL}}
```

**À ajouter avec vos vraies valeurs** :
```
SENDGRID_API_KEY = SG.xxx... (votre clé SendGrid)
```

---

### Étape 3 : Exécuter les Migrations

Une fois le service backend créé et DATABASE_URL configuré :

```bash
cd apps/backend
railway service  # Sélectionner le service "backend"
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

---

### Étape 4 : Vérifier le Déploiement

1. **Voir les logs**
   ```bash
   railway logs
   ```

2. **Obtenir l'URL**
   ```bash
   railway domain
   ```

3. **Tester**
   ```bash
   curl $(railway domain)/health
   ```

---

## 🚀 Alternative Rapide : Utiliser Railway Dashboard

Si vous préférez tout faire via l'interface web :

1. **Créer le service backend** (comme décrit ci-dessus)
2. **Aller dans Variables** du service backend
3. **Copier toutes les variables** listées ci-dessus depuis le service Postgres
4. **Ajouter DATABASE_URL** avec `${{Postgres.DATABASE_URL}}`
5. **Attendre le déploiement automatique** ou déclencher manuellement

---

## 📊 Résumé Visuel

```
Railway Project: believable-learning
├── Service: Postgres ✅
│   └── Variables: DATABASE_URL, PGPASSWORD, etc.
│
└── Service: backend ⚠️ À CRÉER
    ├── Root Directory: apps/backend
    └── Variables: 
        ├── DATABASE_URL = ${{Postgres.DATABASE_URL}} ⚠️ À AJOUTER
        ├── NODE_ENV, PORT, etc. ⚠️ À COPIER
        └── JWT_SECRET, etc. ⚠️ À COPIER
```

---

## ✅ Checklist Finale

- [ ] Service backend créé
- [ ] Root Directory = `apps/backend`
- [ ] DATABASE_URL configuré avec `${{Postgres.DATABASE_URL}}`
- [ ] Variables copiées depuis Postgres vers backend
- [ ] SENDGRID_API_KEY ajoutée
- [ ] Migrations exécutées
- [ ] Build réussi
- [ ] Health check fonctionne

---

**Une fois tout configuré, votre API sera accessible et fonctionnelle ! 🎉**
