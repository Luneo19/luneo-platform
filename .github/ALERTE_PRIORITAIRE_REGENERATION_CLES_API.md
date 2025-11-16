# 🚨 ALERTE PRIORITAIRE - RÉGÉNÉRATION CLÉS API

**Status**: ⏳ EN ATTENTE - À FAIRE APRÈS FINALISATION PRODUCTION  
**Priorité**: 🔴 CRITIQUE  
**Date de création**: 16 novembre 2025  
**Action requise**: Régénérer les clés API exposées et désactivées

---

## ⚠️ CONTEXTE

Les clés API suivantes ont été **exposées publiquement** dans le repository GitHub et **automatiquement désactivées** par les fournisseurs :

1. ✅ **SendGrid (Twilio)** - Désactivée automatiquement
2. ✅ **OpenAI** - Désactivée automatiquement  
3. ✅ **Mailgun** - Désactivée automatiquement

**Raison** : Clés hardcodées dans des fichiers commités dans le repository public.

---

## 📋 ACTION REQUISE

**QUAND** : Une fois que la production sera **100% finalisée et fonctionnelle**

**QUOI** : Régénérer automatiquement toutes les clés API et les configurer dans :
- GitHub Secrets
- Vercel Environment Variables

**COMMENT** : Utiliser le script automatisé `.github/scripts/regenerate-api-keys.sh`

---

## 🎯 INSTRUCTIONS POUR L'ASSISTANT IA

Quand l'utilisateur demandera de régénérer les clés API, exécuter :

```bash
# 1. Lire ce document d'alerte
cat .github/ALERTE_PRIORITAIRE_REGENERATION_CLES_API.md

# 2. Exécuter le script de régénération
./.github/scripts/regenerate-api-keys.sh

# 3. Suivre les instructions interactives
# 4. Vérifier que toutes les clés sont configurées
```

---

## 📝 CHECKLIST DE RÉGÉNÉRATION

### Phase 1 : Création des nouvelles clés

- [ ] **SendGrid** : Créer nouvelle clé API sur https://app.sendgrid.com/settings/api_keys
- [ ] **OpenAI** : Créer nouvelle clé API sur https://platform.openai.com/api-keys
- [ ] **Mailgun** : Créer nouvelle clé API sur https://app.mailgun.com/app/account/security/api_keys (si utilisé)

### Phase 2 : Configuration GitHub Secrets

- [ ] `SENDGRID_API_KEY` ajouté dans GitHub Secrets
- [ ] `OPENAI_API_KEY` ajouté dans GitHub Secrets
- [ ] `MAILGUN_API_KEY` ajouté dans GitHub Secrets (si utilisé)

### Phase 3 : Configuration Vercel

- [ ] `SENDGRID_API_KEY` ajouté dans Vercel Environment Variables
- [ ] `OPENAI_API_KEY` ajouté dans Vercel Environment Variables
- [ ] `MAILGUN_API_KEY` ajouté dans Vercel Environment Variables (si utilisé)

### Phase 4 : Suppression des anciennes clés

- [ ] Ancienne clé SendGrid supprimée du compte
- [ ] Ancienne clé OpenAI supprimée du compte
- [ ] Ancienne clé Mailgun supprimée du compte (si utilisé)

### Phase 5 : Tests de validation

- [ ] Test SendGrid : Envoi d'email de test réussi
- [ ] Test OpenAI : Appel API réussi
- [ ] Test Mailgun : Envoi d'email de test réussi (si utilisé)

---

## 🔗 LIENS UTILES

- **SendGrid API Keys** : https://app.sendgrid.com/settings/api_keys
- **OpenAI API Keys** : https://platform.openai.com/api-keys
- **Mailgun API Keys** : https://app.mailgun.com/app/account/security/api_keys
- **GitHub Secrets** : https://github.com/Luneo19/luneo-platform/settings/secrets/actions
- **Vercel Environment Variables** : https://vercel.com/dashboard

---

## 📚 DOCUMENTS ASSOCIÉS

- `.github/URGENT_SECURITY_INCIDENT.md` - Rapport complet de l'incident
- `.github/REGENERATE_API_KEYS.md` - Guide détaillé de régénération
- `.github/scripts/regenerate-api-keys.sh` - Script automatisé

---

## ✅ CRITÈRES DE SUCCÈS

La régénération est considérée comme réussie lorsque :

1. ✅ Toutes les nouvelles clés API sont créées
2. ✅ Toutes les clés sont configurées dans GitHub Secrets
3. ✅ Toutes les clés sont configurées dans Vercel
4. ✅ Tous les tests de validation passent
5. ✅ Toutes les anciennes clés sont supprimées

---

## 🚨 RAPPEL IMPORTANT

**NE PAS régénérer les clés avant que la production soit 100% finalisée !**

Attendre que :
- ✅ Tous les déploiements soient terminés
- ✅ Tous les tests soient passés
- ✅ L'application soit fonctionnelle en production
- ✅ Aucun changement majeur ne soit prévu

**Une fois ces conditions remplies, exécuter le script de régénération.**

---

**Document créé le**: 16 novembre 2025  
**Dernière mise à jour**: 16 novembre 2025  
**Prochaine action**: Régénérer les clés API après finalisation production

