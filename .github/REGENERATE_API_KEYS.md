# 🔄 Guide de Régénération des Clés API

**Date**: 16 novembre 2025  
**Raison**: Clés API exposées et désactivées par les fournisseurs

---

## 📋 Clés à Régénérer

### 1. SendGrid (Twilio) ✅ PRIORITÉ HAUTE

**URL** : https://app.sendgrid.com/settings/api_keys

**Étapes** :
1. Connectez-vous à votre compte SendGrid
2. Allez dans **Settings** → **API Keys**
3. Cliquez sur **"Create API Key"**
4. Nom : `luneo-platform-production-2025-11-16`
5. Permissions : **"Full Access"** (ou Restricted selon besoins)
6. **⚠️ IMPORTANT** : Copiez la clé immédiatement (format: `SG.xxxxx`)
7. Supprimez l'ancienne clé désactivée

**Configuration** :
```bash
# GitHub Secrets
echo "VOTRE_NOUVELLE_CLE_SENDGRID" | gh secret set SENDGRID_API_KEY --repo Luneo19/luneo-platform

# Vercel (via dashboard)
# https://vercel.com/dashboard → Settings → Environment Variables
# Ajouter: SENDGRID_API_KEY = VOTRE_NOUVELLE_CLE_SENDGRID
```

---

### 2. OpenAI ✅ PRIORITÉ HAUTE

**URL** : https://platform.openai.com/api-keys

**Étapes** :
1. Connectez-vous à votre compte OpenAI
2. Allez dans **API Keys**
3. Cliquez sur **"Create new secret key"**
4. Nom : `luneo-platform-production`
5. **⚠️ IMPORTANT** : Copiez la clé immédiatement (format: `sk-proj-xxxxx`)
6. Supprimez l'ancienne clé désactivée

**Configuration** :
```bash
# GitHub Secrets
echo "VOTRE_NOUVELLE_CLE_OPENAI" | gh secret set OPENAI_API_KEY --repo Luneo19/luneo-platform

# Vercel (via dashboard)
# https://vercel.com/dashboard → Settings → Environment Variables
# Ajouter: OPENAI_API_KEY = VOTRE_NOUVELLE_CLE_OPENAI
```

---

### 3. Mailgun ⚠️ SI UTILISÉ

**URL** : https://app.mailgun.com/app/account/security/api_keys

**Étapes** :
1. Connectez-vous à votre compte Mailgun
2. Allez dans **Account** → **Security** → **API Keys**
3. Cliquez sur **"Create API Key"**
4. Nom : `luneo-platform-production`
5. **⚠️ IMPORTANT** : Copiez la clé immédiatement
6. Supprimez l'ancienne clé désactivée

**Configuration** :
```bash
# GitHub Secrets (si utilisé)
echo "VOTRE_NOUVELLE_CLE_MAILGUN" | gh secret set MAILGUN_API_KEY --repo Luneo19/luneo-platform

# Vercel (via dashboard)
# https://vercel.com/dashboard → Settings → Environment Variables
# Ajouter: MAILGUN_API_KEY = VOTRE_NOUVELLE_CLE_MAILGUN
```

---

## ✅ Vérification Post-Régénération

### Test SendGrid
```bash
# Via l'API SendGrid
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer VOTRE_NOUVELLE_CLE_SENDGRID" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"no-reply@luneo.app"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

### Test OpenAI
```bash
# Via l'API OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer VOTRE_NOUVELLE_CLE_OPENAI"
```

### Test Mailgun (si utilisé)
```bash
# Via l'API Mailgun
curl -s --user 'api:VOTRE_NOUVELLE_CLE_MAILGUN' \
  https://api.mailgun.net/v3/VOTRE_DOMAIN/messages \
  -F from='test@luneo.app' \
  -F to='test@example.com' \
  -F subject='Test' \
  -F text='Test'
```

---

## 📝 Checklist Complète

- [ ] SendGrid : Nouvelle clé créée
- [ ] SendGrid : Clé ajoutée dans GitHub Secrets
- [ ] SendGrid : Clé ajoutée dans Vercel
- [ ] SendGrid : Ancienne clé supprimée
- [ ] SendGrid : Test réussi

- [ ] OpenAI : Nouvelle clé créée
- [ ] OpenAI : Clé ajoutée dans GitHub Secrets
- [ ] OpenAI : Clé ajoutée dans Vercel
- [ ] OpenAI : Ancienne clé supprimée
- [ ] OpenAI : Test réussi

- [ ] Mailgun : Nouvelle clé créée (si utilisé)
- [ ] Mailgun : Clé ajoutée dans GitHub Secrets (si utilisé)
- [ ] Mailgun : Clé ajoutée dans Vercel (si utilisé)
- [ ] Mailgun : Ancienne clé supprimée (si utilisé)
- [ ] Mailgun : Test réussi (si utilisé)

---

## 🛡️ Prévention Future

1. ✅ **NE JAMAIS hardcoder** les clés dans le code
2. ✅ **Utiliser uniquement** les variables d'environnement
3. ✅ **Vérifier avant chaque commit** avec `./scripts/check-secrets.sh`
4. ✅ **Utiliser GitHub Secrets** pour les workflows CI/CD
5. ✅ **Utiliser Vercel Environment Variables** pour le déploiement

---

**Une fois toutes les clés régénérées et configurées, l'incident sera résolu.**

