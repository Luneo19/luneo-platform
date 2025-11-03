# 📊 GUIDE : Configuration Better Stack (Logs Centralisés)

**Durée estimée** : 10 minutes  
**Difficulté** : Facile  
**Impact** : Logs centralisés pour debugging

---

## 🎯 OBJECTIF

Centraliser **tous les logs** de votre application :
- ✅ Logs frontend (erreurs, warnings)
- ✅ Logs backend (API requests, errors)
- ✅ Logs database (queries lentes)
- ✅ Recherche et filtrage avancés

---

## 📋 ÉTAPE 1 : Créer un compte Better Stack (3 min)

### 1. Aller sur Better Stack
👉 **URL** : https://logs.betterstack.com/

### 2. S'inscrire
- Cliquer sur **"Start Free Trial"**
- Email : `service.luneo@gmail.com`
- Ou connectez-vous avec GitHub/Google

### 3. Créer une source (Source)
- Dans le dashboard, cliquer **"Sources"**
- Cliquer **"+ Add Source"**
- **Name** : `Luneo Production`
- **Platform** : **Vercel**
- Cliquer **"Create Source"**

### 4. Récupérer le Source Token
Vous verrez :
- **Source Token** : `xxxxxxxxxxxxxxxxxxxxx`

📸 **Copiez ce token**

---

## 📋 ÉTAPE 2 : Configurer Vercel (3 min)

### 1. Aller sur Vercel Integrations
👉 **URL** : https://vercel.com/integrations/logtail

### 2. Installer l'intégration Logtail
- Cliquer **"Add Integration"**
- Sélectionner votre projet : `frontend`
- Autoriser l'accès

### 3. Configurer le Source Token
- **Source Token** : Coller votre token Better Stack
- Cliquer **"Save"**

---

## 📋 ÉTAPE 3 : Vérifier (4 min)

### 1. Générer quelques logs
Visitez quelques pages de votre application :
- https://app.luneo.app
- https://app.luneo.app/api/templates
- https://app.luneo.app/library

### 2. Retourner sur Better Stack
- Aller dans **"Live Tail"**
- Vous devriez voir les logs arriver en temps réel ! ✅

---

## ✅ RÉSULTAT

✅ **Logs centralisés activés**  
✅ **Recherche et filtrage avancés**  
✅ **Alertes configurables**  
✅ **Debugging facilité**

---

## 🎯 ALTERNATIVE SIMPLE

Si vous voulez **sauter cette étape** (c'est optionnel pour la production) :
- Les logs Vercel de base sont suffisants
- Vous pouvez toujours l'ajouter plus tard
- **Passez directement à l'Étape 3 : BetterUptime**

---

**Dites-moi si vous voulez configurer Better Stack ou passer directement à BetterUptime ! 💪**


