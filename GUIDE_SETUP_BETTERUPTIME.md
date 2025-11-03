# ⏱️ GUIDE : Configuration BetterUptime (Monitoring Uptime)

**Durée estimée** : 10 minutes  
**Difficulté** : Facile  
**Impact** : Alertes si la plateforme tombe

---

## 🎯 OBJECTIF

Surveiller la **disponibilité** de votre plateforme :
- ✅ Ping toutes les 30 secondes
- ✅ Alertes email/SMS si down
- ✅ Page de status publique
- ✅ Historique uptime 99.9%

---

## 📋 ÉTAPE 1 : Créer un compte BetterUptime (3 min)

### 1. Aller sur BetterUptime
👉 **URL** : https://betteruptime.com/

### 2. S'inscrire
- Cliquer sur **"Start Free"**
- Email : `service.luneo@gmail.com`
- Ou connectez-vous avec GitHub/Google

---

## 📋 ÉTAPE 2 : Créer un Monitor (5 min)

### 1. Créer votre premier monitor
- Dans le dashboard, cliquer **"+ Create Monitor"**

### 2. Configurer le monitor
- **Monitor Name** : `Luneo Production - Homepage`
- **Monitor Type** : **HTTP(S)**
- **URL to Monitor** : `https://app.luneo.app`
- **Check Frequency** : **30 seconds** (gratuit)
- **Request Timeout** : `30 seconds`
- **Expected Status Code** : `200`

Cliquer **"Create Monitor"**

### 3. Créer des monitors supplémentaires (optionnel)

#### Monitor 2 : API Templates
- **Name** : `Luneo Production - API Templates`
- **URL** : `https://app.luneo.app/api/templates`
- **Frequency** : 60 seconds
- **Status** : 200

#### Monitor 3 : API Health
- **Name** : `Luneo Production - API Health`
- **URL** : `https://app.luneo.app/api/health`
- **Frequency** : 60 seconds
- **Status** : 200

---

## 📋 ÉTAPE 3 : Configurer les Alertes (2 min)

### 1. Aller dans "Escalation Policies"
- Menu de gauche → **"On-call"** → **"Escalation Policies"**

### 2. Créer une politique d'alerte
- Cliquer **"+ New Escalation Policy"**
- **Name** : `Luneo Production Alerts`
- **Who to notify** : Ajouter votre email
- **When to notify** : Immediately
- Cliquer **"Save"**

### 3. Lier aux monitors
- Retourner dans **"Monitors"**
- Pour chaque monitor, cliquer sur l'icône ⚙️ (Settings)
- **Escalation Policy** : Sélectionner `Luneo Production Alerts`
- Cliquer **"Save"**

---

## 📋 ÉTAPE 4 : Page de Status Publique (optionnel, 3 min)

### 1. Créer une Status Page
- Menu de gauche → **"Status Pages"**
- Cliquer **"+ New Status Page"**

### 2. Configurer
- **Subdomain** : `status-luneo` (ou autre)
- **Name** : `Luneo Platform Status`
- **Add Monitors** : Sélectionner tous vos monitors
- Cliquer **"Create Status Page"**

### 3. URL Publique
Vous obtiendrez une URL comme :
👉 `https://status-luneo.betteruptime.com`

Vous pouvez la partager avec vos clients ! 🎉

---

## ✅ VÉRIFICATION

### Tester les alertes
1. Dans BetterUptime, cliquer sur un monitor
2. Cliquer **"Pause"** puis **"Unpause"** immédiatement
3. Vous devriez recevoir un **email de test** ✅

---

## 🎯 RÉSULTAT

✅ **Monitoring uptime actif**  
✅ **Alertes configurées**  
✅ **Status page publique**  
✅ **Tranquillité d'esprit** 😌

---

## 📊 TABLEAU DE BORD

BetterUptime vous donnera :
- 📈 **Graphique uptime** : 99.9%
- ⏱️ **Response time moyen** : <1s
- 📅 **Historique incidents** : Visible 90 jours
- 🔔 **Notifications** : Email/SMS/Slack

---

**Configuration ultra-simple ! Vous pouvez le faire en parallèle pendant que Redis se configure ! 🚀**


