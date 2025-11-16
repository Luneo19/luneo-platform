# 📋 GUIDE RAPIDE - ALERTE PRIORITAIRE CLÉS API

## 🚨 QUAND UTILISER CE DOCUMENT

**Utilisez ce document quand** :
- ✅ La production est **100% finalisée**
- ✅ Tous les déploiements sont terminés
- ✅ L'application fonctionne correctement
- ✅ Vous êtes prêt à régénérer les clés API

---

## 🎯 INSTRUCTIONS RAPIDES

### Pour l'utilisateur

Quand vous serez prêt, dites simplement :

> **"Régénère les clés API maintenant"**

ou

> **"Exécute le script de régénération des clés API"**

### Pour l'assistant IA

Quand l'utilisateur demande la régénération :

1. **Lire l'alerte prioritaire** :
   ```bash
   cat .github/ALERTE_PRIORITAIRE_REGENERATION_CLES_API.md
   ```

2. **Exécuter le script automatisé** :
   ```bash
   ./.github/scripts/regenerate-api-keys.sh
   ```

3. **Suivre les instructions interactives** du script

4. **Vérifier la configuration** :
   ```bash
   gh secret list --repo Luneo19/luneo-platform
   ```

---

## 📝 CE QUI SERA FAIT AUTOMATIQUEMENT

Le script va :

1. ✅ **Vérifier** que la production est finalisée
2. ✅ **Demander** les nouvelles clés API (SendGrid, OpenAI, Mailgun)
3. ✅ **Tester** chaque clé pour vérifier sa validité
4. ✅ **Configurer** automatiquement dans GitHub Secrets
5. ✅ **Guider** pour la configuration Vercel
6. ✅ **Afficher** un résumé complet

---

## 🔗 DOCUMENTS ASSOCIÉS

- **Alerte prioritaire** : `.github/ALERTE_PRIORITAIRE_REGENERATION_CLES_API.md`
- **Script automatisé** : `.github/scripts/regenerate-api-keys.sh`
- **Guide détaillé** : `.github/REGENERATE_API_KEYS.md`
- **Rapport incident** : `.github/URGENT_SECURITY_INCIDENT.md`

---

## ⚠️ IMPORTANT

**NE PAS exécuter avant** :
- ❌ La production n'est pas finalisée
- ❌ Des changements majeurs sont prévus
- ❌ L'application n'est pas stable

**Exécuter uniquement quand** :
- ✅ Tout est terminé et fonctionnel
- ✅ Aucun changement majeur prévu
- ✅ Prêt à régénérer les clés

---

**Document créé le**: 16 novembre 2025  
**Status**: ⏳ En attente de finalisation production

