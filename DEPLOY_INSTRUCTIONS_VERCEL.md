# 🚀 DÉPLOIEMENT VERCEL - INSTRUCTIONS

**Date:** 3 Novembre 2025  
**Status:** ✅ Prêt à déployer

---

## ✅ **PRÉPARATION COMPLÈTE**

- ✅ SQL exécuté dans Supabase (8 tables créées)
- ✅ Bucket 'ar-models' créé dans Supabase Storage
- ✅ speakeasy ajouté au package.json
- ✅ 419 fichiers committé (69,712 insertions)
- ✅ Code prêt pour production

---

## 🚀 **MÉTHODE 1: VERCEL DASHBOARD (RECOMMANDÉ)**

### **Étapes:**

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/
   - Login avec votre compte

2. **Sélectionner le projet "frontend"**
   - Cliquer sur le projet dans la liste

3. **Déployer**
   - Option A: Attendre auto-deploy (si GitHub connecté)
   - Option B: Cliquer sur "Deployments" → "Deploy"

4. **Attendre le build** (3-5 minutes)
   - Vercel va installer dependencies (npm install)
   - speakeasy sera installé automatiquement
   - Build Next.js
   - Optimisation production

5. **Vérifier le déploiement**
   - URL de production: https://app.luneo.app
   - Vérifier qu'il n'y a pas d'erreur 404
   - Tester les pages dashboard

---

## 🚀 **MÉTHODE 2: VERCEL CLI** (si Dashboard ne marche pas)

```bash
cd /Users/emmanuelabougadous/luneo-platform

# Deploy
VERCEL_ORG_ID="team_m4fHNK6lNGSgQUzovFbLNVJN" \
VERCEL_PROJECT_ID="prj_xLZwb7TqyG2KBj5APZvGmj4UHHV5" \
vercel --prod --yes --token=A3KiTbgitoyJjBuODZq0gYXq
```

---

## ✅ **APRÈS DÉPLOIEMENT: TESTS**

### **1. Pages Publiques**
- [ ] https://app.luneo.app (homepage)
- [ ] https://app.luneo.app/pricing
- [ ] https://app.luneo.app/solutions
- [ ] https://app.luneo.app/help/documentation

### **2. Auth**
- [ ] https://app.luneo.app/login
- [ ] https://app.luneo.app/register
- [ ] Tester OAuth Google

### **3. Dashboard (IMPORTANT)**

**Settings:**
- [ ] Modifier profil → Rafraîchir → Vérifier persistance
- [ ] Changer mot de passe → Tester nouveau mdp
- [ ] Activer 2FA → Vérifier QR code

**Team:**
- [ ] Inviter membre → Vérifier email reçu
- [ ] Changer rôle → Rafraîchir → Vérifier changement
- [ ] Supprimer membre → Rafraîchir → Confirmer suppression

**Billing:**
- [ ] Voir factures → Data correcte
- [ ] Ajouter moyen paiement → Tester Stripe

**Library:**
- [ ] Créer template → Rafraîchir → Toujours là
- [ ] Toggle favori → Rafraîchir → Toujours favori
- [ ] Supprimer → Rafraîchir → Bien supprimé

**Integrations:**
- [ ] Créer API key → Copier → Tester
- [ ] Connecter intégration → Vérifier status

**AR Studio:**
- [ ] Upload modèle 3D (.glb) → Vérifier storage
- [ ] Supprimer modèle → Vérifier suppression

**Orders:**
- [ ] Voir commandes → Data correcte
- [ ] Changer statut → Rafraîchir → Vérifier changement

---

## 🎯 **SI ERREURS**

### **Build Error**
```
Erreur: Module not found
→ Vérifier que speakeasy est dans package.json
→ Re-deploy
```

### **Runtime Error**
```
Erreur: Unauthorized
→ Vérifier env variables Supabase
→ Vérifier que SQL a été exécuté
```

### **404 Error**
```
→ Vérifier que toutes les pages sont dans le commit
→ Clear cache Vercel et redeploy
```

---

## 🎊 **SUCCÈS ATTENDU**

```
✅ Build réussi (3-5min)
✅ Toutes pages accessibles
✅ Dashboard fonctionnel
✅ Chaque CTA persiste en DB
✅ Zéro erreur 404
✅ Performance optimale

SCORE: 100/100 ⭐⭐⭐⭐⭐
```

---

**Emmanuel, déployez via Vercel Dashboard et dites-moi si tout fonctionne ! 🚀**

