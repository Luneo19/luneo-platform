# ✅ **CHECKLIST VARIABLES D'ENVIRONNEMENT VERCEL**

**URL** : https://vercel.com/luneos-projects/frontend/settings/environment-variables

---

## 🔴 **CRITIQUES (OBLIGATOIRES)**

### **Supabase**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://obrijgptqztacolemsbk.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Stripe**
- [ ] `STRIPE_SECRET_KEY` = `sk_live_51DzUAlKG9MsM6fdScqo3...`
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_jL5xDF4ylCaiXVDswVAliVA3`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_rgKvTaCDRSLV6Iv6yrF8fNBh9c2II3uu`

### **OpenAI**
- [ ] `OPENAI_API_KEY` = `sk-proj-ochcMwBSI98MLeIX9DV9...`

### **Cloudinary**
- [ ] `CLOUDINARY_CLOUD_NAME` = `deh4aokbx`
- [ ] `CLOUDINARY_API_KEY` = `541766291559917`
- [ ] `CLOUDINARY_API_SECRET` = `s0yc_QR4w9IsM6_HRq2hM5SDnfI`

### **OAuth**
- [ ] `GOOGLE_CLIENT_ID` = `212705987732-qa90mdvfdv3b2ca441li1b7bivfariru...`
- [ ] `GOOGLE_CLIENT_SECRET` = `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`
- [ ] `GITHUB_CLIENT_ID` = `Ov23liJmVOHyn8tfxgLi`
- [ ] `GITHUB_CLIENT_SECRET` = `81bbea63bfc5651e048e5e7f62f69c5d4aad55f9`

### **Encryption (NOUVEAU)**
- [ ] `MASTER_ENCRYPTION_KEY` = _(générer avec commande ci-dessous)_

**Commande pour générer** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🟡 **OPTIONNELLES (Recommandées)**

### **SendGrid (Emails)**
- [ ] `SENDGRID_API_KEY` = `SG.FcB2AoR_QqSWnoIxaNV2xQ...`

### **Redis (Caching)**
- [ ] `REDIS_URL` = `redis://default:VwrMZrbLGx3t8MX5wT2S7cYPnbBXIuG2@...`

### **Sentry (Monitoring)**
- [ ] `SENTRY_DSN` = _(à créer sur sentry.io)_

### **Analytics**
- [ ] `VERCEL_ANALYTICS_ID` = _(auto-configuré par Vercel)_

---

## 📋 **COMMENT AJOUTER UNE VARIABLE**

### **Étape par étape** :

1. **Ouvrir Vercel Dashboard**
   ```
   https://vercel.com/luneos-projects/frontend/settings/environment-variables
   ```

2. **Cliquer "Add New"**

3. **Remplir** :
   - **Name** : (nom de la variable, ex: MASTER_ENCRYPTION_KEY)
   - **Value** : (valeur de la variable)
   - **Environment** : Cocher "Production" + "Preview" + "Development"

4. **Save**

5. **Redéployer** :
   ```bash
   cd apps/frontend
   npx vercel --prod
   ```

---

## 🔐 **GÉNÉRER MASTER_ENCRYPTION_KEY**

```bash
# Méthode 1 : Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Méthode 2 : OpenSSL
openssl rand -hex 32

# Méthode 3 : Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**⚠️ IMPORTANT** :
- Sauvegarder cette clé dans un gestionnaire de mots de passe
- NE JAMAIS la commiter dans Git
- La même clé doit être utilisée partout

---

## ✅ **VÉRIFICATION RAPIDE**

```bash
# Dans le terminal Vercel :
vercel env ls

# Devrait lister toutes les variables
```

---

## 🚀 **APRÈS CONFIGURATION**

Une fois toutes les variables ajoutées :

1. **Redéployer** :
   ```bash
   cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
   npx vercel --prod --yes
   ```

2. **Vérifier le déploiement** :
   ```
   https://app.luneo.app
   ```

3. **Tester** :
   - [ ] Login (email + OAuth)
   - [ ] AI Studio (génération)
   - [ ] Orders (création)
   - [ ] Billing (Stripe)
   - [ ] Legal pages
   - [ ] Cookie banner

---

## 📊 **STATUS**

**Variables requises** : 15  
**Variables optionnelles** : 4  
**Total** : 19

**Une fois complété** : **Prêt pour production 100%** ✅

---

**🎯 Prochaine étape** : Ajouter les variables manquantes puis redéployer !

