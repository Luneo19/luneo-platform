# 📊 **UPTIME MONITORING - CONFIGURATION BETTERUPTIME**

---

## 🎯 **CONFIGURATION (5 min)**

### **1. Créer un compte BetterUptime**

Va sur : https://betteruptime.com  
Clique sur **Sign up free**

---

### **2. Ajouter les monitors**

Une fois connecté, ajoute ces **monitors** :

#### **Monitor 1 : Frontend**
- Name: `Luneo - Frontend`
- URL: `https://app.luneo.app`
- Check interval: 1 minute
- Regions: Multi (US, EU, Asia)

#### **Monitor 2 : API Health**
- Name: `Luneo - API`
- URL: `https://app.luneo.app/api/health`
- Check interval: 1 minute
- Expected status: 200

#### **Monitor 3 : Dashboard**
- Name: `Luneo - Dashboard`
- URL: `https://app.luneo.app/dashboard`
- Check interval: 5 minutes
- Expected status: 200 or 302 (redirect to login)

---

### **3. Configurer les alertes**

**Email** : service.luneo@gmail.com  
**Slack** : (optionnel)  
**SMS** : (optionnel, payant)

**Seuil d'alerte** :
- 1 échec = Warning (email)
- 3 échecs consécutifs = Critical (email + SMS)

---

### **4. Status Page (optionnel)**

BetterUptime offre une **status page publique** :
- URL : `status.luneo.app` (à configurer)
- Affiche l'uptime en temps réel
- Historique incidents
- Professional et transparent

---

## ✅ **C'EST FAIT !**

Une fois configuré, tu recevras :
- ✅ Alertes 24/7
- ✅ Rapports hebdomadaires
- ✅ Uptime tracking (99.9%+)
- ✅ Status page publique

**Temps : 5 minutes**  
**Coût : Gratuit (50 checks/month)**

---

**🌟 MONITORING ACTIVÉ ! 🌟**

