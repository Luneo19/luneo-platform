# 🚀 Déploiement Railway - En Cours

## ✅ Statut Actuel

**Projet créé :** `luneo-platform-backend`  
**URL du projet :** https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b  
**Déploiement :** En cours...

---

## 📋 Actions Effectuées

✅ Projet Railway créé  
✅ Service backend déployé (en cours)  
⚠️ PostgreSQL à ajouter (nécessite interaction)  
⚠️ Variables d'environnement à configurer (nécessite interaction)

---

## 🔧 Finalisation via Dashboard Railway

### 1. Ajouter PostgreSQL

1. Aller sur https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b
2. Cliquer sur **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Railway créera automatiquement une base de données
4. La variable `DATABASE_URL` sera automatiquement configurée

### 2. Configurer les Variables d'Environnement

Dans le dashboard Railway, aller dans **"Variables"** et ajouter :

#### Variables Essentielles

```bash
NODE_ENV=production
JWT_SECRET=<générer-un-secret-aleatoire-min-32-chars>
```

**Générer JWT_SECRET :**
```bash
openssl rand -hex 32
```

#### Variables Recommandées

```bash
APP_URL=https://votre-service.railway.app
FRONTEND_URL=https://votre-frontend.vercel.app
STRIPE_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@votre-domaine.com
```

### 3. Configurer le Service Backend

1. Dans le dashboard, sélectionner le service backend
2. Vérifier les **Settings** :
   - **Root Directory :** `apps/backend`
   - **Build Command :** `pnpm install && pnpm prisma generate && pnpm build`
   - **Start Command :** `pnpm start`

### 4. Vérifier le Déploiement

1. Aller dans **"Deployments"**
2. Vérifier que le build est réussi
3. Vérifier les logs pour s'assurer qu'il n'y a pas d'erreurs

---

## 🔍 Vérifications Post-Déploiement

### Via Dashboard

1. **Logs :** Vérifier qu'il n'y a pas d'erreurs
2. **Health Check :** Tester `https://votre-service.railway.app/health`
3. **Migrations :** Vérifier que Prisma a migré correctement

### Via CLI (si service lié)

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

---

## 🐛 Dépannage

### Erreur : "Cannot find module"

**Solution :** Vérifier que `pnpm install` s'exécute dans le build

### Erreur : "Prisma Client not generated"

**Solution :** Vérifier que `pnpm prisma generate` est dans le build command

### Erreur : "Database connection failed"

**Solution :** 
1. Vérifier que PostgreSQL est ajouté
2. Vérifier que `DATABASE_URL` est configuré
3. Vérifier les migrations : les migrations s'exécutent automatiquement au démarrage

### Erreur : "Port already in use"

**Solution :** Railway fournit automatiquement `PORT`, le code utilise déjà `process.env.PORT`

---

## 📊 Configuration Finale

Une fois tout configuré, votre backend sera accessible sur :
```
https://votre-service.railway.app
```

**Health Check :**
```
https://votre-service.railway.app/health
```

**API :**
```
https://votre-service.railway.app/api/*
```

---

## ✅ Checklist Finale

- [ ] PostgreSQL ajouté
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Service démarré
- [ ] Health check fonctionne
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Migrations Prisma appliquées
- [ ] API testée

---

## 🎯 Prochaines Étapes

1. **Finaliser la configuration** via le dashboard Railway
2. **Tester l'API** avec Postman ou curl
3. **Configurer le frontend** pour pointer vers l'URL Railway
4. **Configurer les webhooks** (Stripe, etc.)
5. **Monitorer les performances**

---

**✅ Déploiement initié avec succès !**

Finalisez la configuration via le dashboard Railway : https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b

