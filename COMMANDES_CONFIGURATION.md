# 🚀 COMMANDES DE CONFIGURATION - GUIDE RAPIDE

**Date:** Décembre 2024  
**Objectif:** Configurer tous les services via terminal

---

## ⚡ CONFIGURATION RAPIDE (1 commande)

```bash
# Configuration automatique (Cloudinary + SendGrid déjà configurés)
./scripts/configure-services-auto.sh
```

**Résultat:**
- ✅ Cloudinary configuré automatiquement
- ✅ SendGrid configuré automatiquement
- ⚠️  Upstash Redis (à configurer manuellement)
- ⚠️  Sentry (à configurer manuellement)

---

## 📋 CONFIGURATION COMPLÈTE

### **Étape 1: Configuration Automatique**

```bash
./scripts/configure-services-auto.sh
```

### **Étape 2: Configurer Upstash Redis**

```bash
# Option A: Via script interactif
./scripts/auto-configure-services.sh

# Option B: Manuellement
echo 'UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"' >> apps/frontend/.env.local
echo 'UPSTASH_REDIS_REST_TOKEN="xxx"' >> apps/frontend/.env.local
```

**Pour obtenir les credentials:**
1. Aller sur https://upstash.com
2. Créer un compte (gratuit)
3. Créer une database Redis
4. Copier URL REST et Token

### **Étape 3: Configurer Sentry**

```bash
# Option A: Via script interactif
./scripts/auto-configure-services.sh

# Option B: Manuellement
echo 'NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"' >> apps/frontend/.env.local
```

**Pour obtenir le DSN:**
1. Aller sur https://sentry.io
2. Créer un compte (gratuit)
3. Créer un projet Next.js
4. Copier le DSN

### **Étape 4: Vérifier la Configuration**

```bash
node scripts/check-services-config.js
```

### **Étape 5: Configurer sur Vercel (Optionnel)**

```bash
# Si vous avez un token Vercel
export VERCEL_TOKEN="votre_token"
node scripts/vercel-configure-services.js
```

**Ou manuellement:**
1. Aller sur: https://vercel.com/luneos-projects/frontend/settings/environment-variables
2. Copier les variables depuis `apps/frontend/.env.local`
3. Ajouter sur Vercel
4. Redéployer

---

## 🎯 COMMANDES DISPONIBLES

### **1. Configuration Automatique**
```bash
./scripts/configure-services-auto.sh
```
Configure automatiquement Cloudinary et SendGrid (déjà configurés)

### **2. Configuration Interactive**
```bash
./scripts/auto-configure-services.sh
```
Guide interactif pour configurer tous les services

### **3. Configuration Terminal**
```bash
./scripts/configure-services-terminal.sh
```
Configuration via terminal avec prompts

### **4. Vérification**
```bash
node scripts/check-services-config.js
```
Vérifie la configuration et teste les connexions

### **5. Configuration Vercel**
```bash
export VERCEL_TOKEN="votre_token"
node scripts/vercel-configure-services.js
```
Configure automatiquement sur Vercel via API

---

## ✅ CHECKLIST RAPIDE

```bash
# 1. Configuration automatique
./scripts/configure-services-auto.sh

# 2. Vérifier
node scripts/check-services-config.js

# 3. (Optionnel) Configurer Upstash Redis
echo 'UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"' >> apps/frontend/.env.local
echo 'UPSTASH_REDIS_REST_TOKEN="xxx"' >> apps/frontend/.env.local

# 4. (Optionnel) Configurer Sentry
echo 'NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"' >> apps/frontend/.env.local

# 5. Vérifier à nouveau
node scripts/check-services-config.js

# 6. (Optionnel) Configurer sur Vercel
export VERCEL_TOKEN="votre_token"
node scripts/vercel-configure-services.js
```

---

## 📊 RÉSULTAT ATTENDU

Après configuration complète:
```
✅ Cloudinary
✅ SendGrid
✅ Upstash Redis
✅ Sentry
```

**Score:** 100/100 🎉

---

## 🆘 DÉPANNAGE

### **Erreur: Permission denied**
```bash
chmod +x scripts/*.sh
```

### **Erreur: Node.js non trouvé**
```bash
# Installer Node.js ou utiliser nvm
nvm use node
```

### **Erreur: VERCEL_TOKEN non défini**
```bash
export VERCEL_TOKEN="votre_token"
```

---

**Temps estimé:** 5-10 minutes (automatique) + 15-20 minutes (Upstash + Sentry)

