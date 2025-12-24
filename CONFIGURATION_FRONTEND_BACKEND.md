# 🔗 Configuration Frontend (Vercel) ↔ Backend (Railway)

## ✅ Backend Railway Configuré

**URL Backend** : https://backend-production-9178.up.railway.app  
**URL API** : https://backend-production-9178.up.railway.app/api

---

## 🔧 Configuration Vercel (Frontend)

### Variable à Ajouter/Modifier dans Vercel

**Nom** : `NEXT_PUBLIC_API_URL`  
**Valeur** : `https://backend-production-9178.up.railway.app/api`  
**Environnements** : Production, Preview, Development

---

## 📋 Étapes pour Configurer Vercel

### 1. Accéder à Vercel Dashboard

1. Aller sur : https://vercel.com/dashboard
2. Sélectionner votre projet frontend
3. Aller dans **Settings** → **Environment Variables**

### 2. Ajouter/Modifier la Variable

**Si la variable existe déjà :**
1. Trouver `NEXT_PUBLIC_API_URL` dans la liste
2. Cliquer sur **⋯** (3 points) → **Edit**
3. Modifier la valeur : `https://backend-production-9178.up.railway.app/api`
4. Sélectionner **All Environments** (Production, Preview, Development)
5. Cliquer **Save**

**Si la variable n'existe pas :**
1. Cliquer **Add New**
2. **Name** : `NEXT_PUBLIC_API_URL`
3. **Value** : `https://backend-production-9178.up.railway.app/api`
4. **Environments** : Sélectionner **Production, Preview, Development**
5. Cliquer **Save**

### 3. Redéployer le Frontend

Après avoir ajouté/modifié la variable :
1. Aller dans l'onglet **Deployments**
2. Cliquer sur **⋯** du dernier déploiement
3. Cliquer **Redeploy**
4. Attendre 2-3 minutes

---

## ✅ Vérification

### 1. Vérifier que le Backend répond

```bash
# Health check
curl https://backend-production-9178.up.railway.app/health

# API
curl https://backend-production-9178.up.railway.app/api
```

### 2. Vérifier la Connexion Frontend/Backend

Une fois le frontend redéployé :
1. Ouvrir https://app.luneo.app
2. Ouvrir la console du navigateur (F12)
3. Vérifier qu'il n'y a pas d'erreurs CORS
4. Tester une requête API (ex: login)

---

## 🔒 CORS Configuré

Le backend Railway est configuré pour accepter les requêtes depuis :
- ✅ https://app.luneo.app
- ✅ https://luneo.app
- ✅ https://*.vercel.app (tous les déploiements Vercel)
- ✅ http://localhost:3000 (développement local)

---

## 📊 Checklist

- [x] Backend Railway déployé
- [x] CORS configuré dans Railway
- [x] URL backend obtenue
- [ ] Variable `NEXT_PUBLIC_API_URL` ajoutée dans Vercel
- [ ] Frontend redéployé sur Vercel
- [ ] Connexion testée

---

## 🎯 Résumé

**Backend Railway** :
- URL : https://backend-production-9178.up.railway.app
- API : https://backend-production-9178.up.railway.app/api
- CORS : Configuré pour Vercel

**Frontend Vercel** :
- Variable à ajouter : `NEXT_PUBLIC_API_URL=https://backend-production-9178.up.railway.app/api`
- Action : Ajouter dans Vercel Dashboard → Redéployer

Une fois cette variable configurée et le frontend redéployé, ils seront interconnectés ! 🚀





