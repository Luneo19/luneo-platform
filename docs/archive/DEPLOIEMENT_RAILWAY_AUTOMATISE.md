# 🚀 Déploiement Railway Automatisé

## 📋 Méthodes de Déploiement

### Option 1 : Via Railway CLI (Recommandé)

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Se connecter (ouvre le navigateur)
railway login

# 3. Lier le projet
railway link

# 4. Ajouter PostgreSQL
railway add postgresql

# 5. Configurer les variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=votre-secret

# 6. Déployer
railway up
```

---

### Option 2 : Via Token Railway (Script Automatisé)

```bash
# 1. Obtenir votre token Railway
# Aller sur https://railway.app/account/tokens
# Créer un nouveau token

# 2. Exporter le token
export RAILWAY_TOKEN=votre-token

# 3. Exécuter le script
./scripts/deploy-railway-automated.sh

# Options :
./scripts/deploy-railway-automated.sh --build      # Build local avant déploiement
./scripts/deploy-railway-automated.sh --migrate    # Exécuter les migrations
./scripts/deploy-railway-automated.sh --build --migrate  # Les deux
```

---

### Option 3 : Via API Railway Directe

```bash
# 1. Obtenir votre token Railway
export RAILWAY_TOKEN=votre-token

# 2. Obtenir votre Project ID
export RAILWAY_PROJECT_ID=votre-project-id

# 3. (Optionnel) Obtenir votre Service ID
export RAILWAY_SERVICE_ID=votre-service-id

# 4. Exécuter le script API
./scripts/deploy-railway-api.sh
```

---

## 🔑 Obtenir les Tokens et IDs

### Token Railway

1. Aller sur [railway.app/account/tokens](https://railway.app/account/tokens)
2. Cliquer sur "New Token"
3. Donner un nom (ex: "Deployment Token")
4. Copier le token généré
5. Exporter : `export RAILWAY_TOKEN=votre-token`

### Project ID

**Via CLI :**
```bash
railway projects list
```

**Via Dashboard :**
1. Aller sur votre projet Railway
2. L'URL contient le Project ID : `https://railway.app/project/[PROJECT_ID]`

**Via API :**
```bash
curl -H "Authorization: Bearer $RAILWAY_TOKEN" \
  https://api.railway.app/v1/projects | jq '.projects[] | {id, name}'
```

### Service ID

**Via CLI :**
```bash
railway status
```

**Via API :**
```bash
curl -H "Authorization: Bearer $RAILWAY_TOKEN" \
  https://api.railway.app/v1/projects/$RAILWAY_PROJECT_ID/services | jq '.services[] | {id, name}'
```

---

## 🚀 Déploiement Complet Automatisé

### Script Complet (Tout-en-un)

```bash
#!/bin/bash

# Configuration
export RAILWAY_TOKEN=votre-token
export RAILWAY_PROJECT_ID=votre-project-id

# 1. Installer Railway CLI si nécessaire
if ! command -v railway &> /dev/null; then
    npm install -g @railway/cli
fi

# 2. Se connecter
railway login --token $RAILWAY_TOKEN

# 3. Lier le projet
railway link --project $RAILWAY_PROJECT_ID

# 4. Ajouter PostgreSQL (si pas déjà fait)
railway add postgresql

# 5. Configurer les variables essentielles
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# 6. Déployer
railway up

# 7. Vérifier le déploiement
railway logs --tail 50
railway status
```

---

## 📝 Variables d'Environnement Minimales

```bash
# Essentielles
NODE_ENV=production
JWT_SECRET=generer-un-secret-aleatoire-min-32-chars

# Database (fourni automatiquement par Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Port (fourni automatiquement)
PORT=${{PORT}}
```

**Générer un JWT_SECRET sécurisé :**
```bash
openssl rand -hex 32
```

---

## ✅ Vérification Post-Déploiement

### Via CLI

```bash
# Voir les logs
railway logs

# Vérifier le statut
railway status

# Obtenir l'URL
railway domain

# Tester le health check
curl $(railway domain)/health
```

### Via API

```bash
# Obtenir les déploiements
curl -H "Authorization: Bearer $RAILWAY_TOKEN" \
  https://api.railway.app/v1/services/$RAILWAY_SERVICE_ID/deployments

# Obtenir les logs (nécessite Railway CLI)
railway logs
```

---

## 🔧 Configuration Avancée

### Déploiement avec Build Local

```bash
# Build local d'abord
cd apps/backend
pnpm install
pnpm prisma generate
pnpm build
cd ../..

# Puis déployer
railway up
```

### Migration Prisma Automatique

```bash
# Exécuter les migrations après déploiement
railway run pnpm prisma migrate deploy
```

### Déploiement avec Variables Personnalisées

```bash
# Créer un fichier .env.railway
cat > .env.railway << EOF
NODE_ENV=production
JWT_SECRET=votre-secret
STRIPE_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=...
EOF

# Charger et déployer
railway variables set $(cat .env.railway | xargs)
railway up
```

---

## 🐛 Dépannage

### Erreur : "Not authenticated"

```bash
# Se reconnecter
railway login

# Ou utiliser un token
export RAILWAY_TOKEN=votre-token
railway login --token $RAILWAY_TOKEN
```

### Erreur : "Project not found"

```bash
# Vérifier le Project ID
railway projects list

# Lier le projet
railway link
```

### Erreur : "Build failed"

```bash
# Vérifier les logs
railway logs

# Build local pour tester
cd apps/backend
pnpm install
pnpm build
```

---

## 📊 Monitoring

### Logs en Temps Réel

```bash
railway logs --follow
```

### Métriques

```bash
railway metrics
```

### Statut du Service

```bash
railway status
```

---

## 🎯 Checklist Déploiement Automatisé

- [ ] Railway CLI installé
- [ ] Token Railway obtenu et exporté
- [ ] Project ID identifié
- [ ] Service ID identifié (optionnel)
- [ ] PostgreSQL ajouté au projet
- [ ] Variables d'environnement configurées
- [ ] Script de déploiement exécuté
- [ ] Logs vérifiés
- [ ] Health check testé
- [ ] API testée

---

## ✅ Prêt !

**Vous pouvez maintenant déployer automatiquement sur Railway !**

Utilisez `./scripts/deploy-railway-automated.sh` pour un déploiement automatisé complet.

