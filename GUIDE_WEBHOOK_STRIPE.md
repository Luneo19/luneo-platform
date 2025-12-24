# 🔴 GUIDE CRITIQUE - Configuration Webhook Stripe

## ⚠️ ACTION REQUISE AVANT LANCEMENT

**Temps estimé:** 5 minutes  
**Priorité:** 🔴 **CRITIQUE**

---

## 🎯 POURQUOI C'EST CRITIQUE

Sans le webhook Stripe correctement configuré:
- ❌ Les abonnements ne se synchronisent pas automatiquement
- ❌ Les paiements réussis ne sont pas enregistrés
- ❌ Les annulations d'abonnements ne sont pas détectées
- ❌ Les factures ne sont pas traitées

**Impact:** Les utilisateurs peuvent payer mais leur abonnement ne sera pas activé automatiquement.

---

## 📋 ÉTAPES DE CONFIGURATION

### 1. Aller sur Stripe Dashboard

**URL:** https://dashboard.stripe.com/webhooks

**Ou:**
1. Aller sur https://dashboard.stripe.com
2. Menu gauche → **Developers** → **Webhooks**

---

### 2. Vérifier/Créer le Webhook

#### Si le webhook existe déjà:
- Cliquer sur le webhook existant
- Vérifier l'URL: `https://luneo.app/api/stripe/webhook`
- Si l'URL est différente, **modifier** ou **créer un nouveau**

#### Si le webhook n'existe pas:
1. Cliquer sur **"Add endpoint"** (ou **"Add webhook"**)
2. **Endpoint URL:** 
   ```
   https://luneo.app/api/stripe/webhook
   ```
3. **Description (optionnel):** "Luneo Production Webhook"

---

### 3. Sélectionner les Événements

**Sélectionner ces événements (6 au total):**

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**Comment faire:**
1. Dans la section "Events to send"
2. Cliquer sur **"Select events"**
3. Cocher les 6 événements ci-dessus
4. Cliquer sur **"Add events"**

---

### 4. Récupérer le Signing Secret

**Après avoir créé/modifié le webhook:**

1. Stripe affiche le **"Signing secret"**
2. Format: `whsec_...` (commence par `whsec_`)
3. **Copier ce secret**

**Exemple:**
```
whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

---

### 5. Mettre à Jour dans Vercel

**Aller sur:**
https://vercel.com/luneos-projects/luneo-frontend/settings/environment-variables

**Actions:**
1. Chercher la variable `STRIPE_WEBHOOK_SECRET`
2. Si elle existe:
   - Cliquer sur **"Edit"**
   - Remplacer la valeur par le nouveau secret
   - Sauvegarder
3. Si elle n'existe pas:
   - Cliquer sur **"Add New"**
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (le secret copié)
   - **Environments:** ✅ Production
   - Cliquer sur **"Save"**

---

### 6. Redéployer (si nécessaire)

**Si vous avez modifié la variable:**

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
npx vercel --prod --yes
```

**Ou:** Vercel redéploiera automatiquement si vous avez activé "Auto-deploy on variable change"

---

## ✅ VÉRIFICATION

### Test 1: Vérifier que le webhook répond

```bash
curl -X POST https://luneo.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Résultat attendu:** 
- Si signature manquante: `400 Bad Request` (normal)
- Si erreur 500: Vérifier les logs Vercel

### Test 2: Tester avec Stripe CLI (Optionnel)

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Tester le webhook
stripe listen --forward-to https://luneo.app/api/stripe/webhook

# Dans un autre terminal, déclencher un événement test
stripe trigger checkout.session.completed
```

---

## 🐛 DÉPANNAGE

### Problème: "Invalid signature"

**Cause:** Le `STRIPE_WEBHOOK_SECRET` ne correspond pas

**Solution:**
1. Vérifier que le secret dans Vercel correspond à celui dans Stripe
2. Vérifier qu'il n'y a pas d'espaces avant/après
3. Vérifier que c'est bien le secret de **production** (pas test)

### Problème: "Webhook not receiving events"

**Cause:** Événements non sélectionnés ou URL incorrecte

**Solution:**
1. Vérifier les événements sélectionnés dans Stripe
2. Vérifier l'URL du webhook
3. Vérifier les logs Vercel pour voir si les requêtes arrivent

### Problème: "500 Internal Server Error"

**Cause:** Erreur dans le code du webhook

**Solution:**
1. Vérifier les logs Vercel
2. Vérifier que `STRIPE_SECRET_KEY` est configuré
3. Vérifier que la base de données est accessible

---

## 📊 ÉVÉNEMENTS GÉRÉS

Votre webhook gère ces événements:

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Active l'abonnement utilisateur |
| `customer.subscription.created` | Crée l'abonnement dans la DB |
| `customer.subscription.updated` | Met à jour le statut |
| `customer.subscription.deleted` | Annule l'abonnement |
| `invoice.payment_succeeded` | Enregistre le paiement |
| `invoice.payment_failed` | Notifie l'échec |

---

## ✅ CHECKLIST FINALE

- [ ] Webhook créé dans Stripe Dashboard
- [ ] URL correcte: `https://luneo.app/api/stripe/webhook`
- [ ] 6 événements sélectionnés
- [ ] Signing secret copié
- [ ] Variable `STRIPE_WEBHOOK_SECRET` mise à jour dans Vercel
- [ ] Redéploiement effectué (si nécessaire)
- [ ] Test effectué (optionnel)

---

## 🎉 C'EST TERMINÉ!

Une fois ces étapes complétées, votre webhook Stripe est configuré et fonctionnel.

**Temps total:** ~5 minutes  
**Impact:** 🔴 **CRITIQUE** pour la synchronisation des abonnements

---

**Date:** 2025-12-03  
**Statut:** ⚠️ **À FAIRE AVANT LANCEMENT**

