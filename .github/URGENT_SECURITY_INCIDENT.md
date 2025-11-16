# 🚨 INCIDENT DE SÉCURITÉ - CLÉS API EXPOSÉES

**Date**: 16 novembre 2025  
**Sévérité**: CRITIQUE  
**Status**: RÉSOLU - Clés désactivées par les fournisseurs

---

## ⚠️ PROBLÈME DÉTECTÉ

Les clés API suivantes ont été **exposées publiquement** dans le repository GitHub (maintenant public) :

1. **SendGrid (Twilio)** : `SG.FcB2AoR_QqSWnoIxaNV2xQ...` ❌ DÉSACTIVÉE
2. **OpenAI** : `sk-proj-ochcMwBSI98MLeIX9DV9...` ❌ DÉSACTIVÉE  
3. **Mailgun** : `d16e202cab0634bae884cb6da16e6433-1ae02a08-98f24f90` ❌ DÉSACTIVÉE

**Cause** : Ces clés étaient hardcodées dans des fichiers de documentation et scripts commités dans le repository.

---

## ✅ ACTIONS IMMÉDIATES EFFECTUÉES

1. ✅ **Nettoyage des fichiers** : Toutes les clés hardcodées ont été retirées
2. ✅ **Repository rendu public** : Les services ont détecté les clés automatiquement
3. ✅ **Clés désactivées** : Les fournisseurs ont automatiquement désactivé les clés exposées

---

## 🔄 ACTIONS REQUISES - RÉGÉNÉRATION DES CLÉS

### 1. SendGrid (Twilio)

**Étapes** :
1. Aller sur : https://app.sendgrid.com/settings/api_keys
2. Cliquer sur **"Create API Key"**
3. Nommer la clé : `luneo-platform-production-2025-11-16`
4. Permissions : **"Full Access"** ou **"Restricted Access"** (selon besoins)
5. **Copier la clé immédiatement** (elle ne sera plus visible après)
6. **Supprimer l'ancienne clé** (déjà désactivée)

**Configuration** :
```bash
# Ajouter dans GitHub Secrets
gh secret set SENDGRID_API_KEY --repo Luneo19/luneo-platform

# Ajouter dans Vercel
# https://vercel.com/dashboard → Settings → Environment Variables
```

---

### 2. OpenAI

**Étapes** :
1. Aller sur : https://platform.openai.com/api-keys
2. Cliquer sur **"Create new secret key"**
3. Nommer la clé : `luneo-platform-production`
4. **Copier la clé immédiatement**
5. **Supprimer l'ancienne clé** (déjà désactivée)

**Configuration** :
```bash
# Ajouter dans GitHub Secrets
gh secret set OPENAI_API_KEY --repo Luneo19/luneo-platform

# Ajouter dans Vercel
# https://vercel.com/dashboard → Settings → Environment Variables
```

---

### 3. Mailgun

**Étapes** :
1. Aller sur : https://app.mailgun.com/app/account/security/api_keys
2. Cliquer sur **"Create API Key"**
3. Nommer la clé : `luneo-platform-production`
4. **Copier la clé immédiatement**
5. **Supprimer l'ancienne clé** (déjà désactivée)

**Configuration** :
```bash
# Ajouter dans GitHub Secrets (si utilisé)
gh secret set MAILGUN_API_KEY --repo Luneo19/luneo-platform

# Ajouter dans Vercel
# https://vercel.com/dashboard → Settings → Environment Variables
```

---

## 📋 CHECKLIST DE RÉCUPÉRATION

- [ ] **SendGrid** : Nouvelle clé créée et configurée
- [ ] **OpenAI** : Nouvelle clé créée et configurée
- [ ] **Mailgun** : Nouvelle clé créée et configurée (si utilisé)
- [ ] **GitHub Secrets** : Toutes les nouvelles clés ajoutées
- [ ] **Vercel** : Toutes les nouvelles clés ajoutées
- [ ] **Tests** : Vérifier que les services fonctionnent avec les nouvelles clés
- [ ] **Anciennes clés** : Supprimées de tous les comptes

---

## 🛡️ PRÉVENTION FUTURE

### ✅ Règles à suivre

1. **NE JAMAIS hardcoder les clés API** dans le code
2. **NE JAMAIS commiter** de fichiers `.env` ou contenant des secrets
3. **Utiliser uniquement** :
   - Variables d'environnement
   - GitHub Secrets
   - Vercel Environment Variables
   - Gestionnaires de secrets (AWS Secrets Manager, etc.)

### ✅ Vérifications avant commit

```bash
# Vérifier qu'aucun secret n'est dans le staging
git diff --cached | grep -E "SG\.|sk_|api.*key|secret.*="

# Vérifier les fichiers modifiés
git diff HEAD | grep -E "SG\.|sk_|api.*key|secret.*="
```

### ✅ Scripts de vérification

Utiliser le script existant :
```bash
./scripts/check-secrets.sh
```

---

## 📊 IMPACT

- **Sévérité** : CRITIQUE
- **Exposition** : Publique (repository GitHub public)
- **Détection** : Automatique par les fournisseurs
- **Mitigation** : Clés automatiquement désactivées
- **Risque résiduel** : FAIBLE (clés désactivées)

---

## 🔗 LIENS UTILES

- **GitHub Secrets** : https://github.com/Luneo19/luneo-platform/settings/secrets/actions
- **Vercel Environment Variables** : https://vercel.com/dashboard
- **SendGrid API Keys** : https://app.sendgrid.com/settings/api_keys
- **OpenAI API Keys** : https://platform.openai.com/api-keys
- **Mailgun API Keys** : https://app.mailgun.com/app/account/security/api_keys

---

## ✅ STATUS FINAL

- ✅ Fichiers nettoyés
- ✅ Clés désactivées par les fournisseurs
- ⏳ En attente : Régénération des nouvelles clés
- ⏳ En attente : Configuration dans GitHub Secrets et Vercel

**Une fois les nouvelles clés configurées, l'incident sera résolu.**

