# 💳 Instructions Rapides - Configuration Stripe

**Pour configurer Stripe rapidement, suivez ces étapes :**

---

## 🚀 Méthode Rapide (5 minutes)

### 1. Obtenir vos Clés Stripe

**A. Clés API** (https://dashboard.stripe.com/apikeys)
- **Publishable Key**: `pk_test_...` (visible directement)
- **Secret Key**: `sk_test_...` (cliquez sur "Reveal test key")

**B. Webhook Secret** (https://dashboard.stripe.com/webhooks)
1. Cliquez sur **"Add endpoint"**
2. **URL**: `https://backend-luneos-projects.vercel.app/api/stripe/webhook`
3. **Événements**: Sélectionnez tous les événements de subscription et payment
4. Copiez le **Signing secret** (`whsec_...`)

**C. Price IDs** (https://dashboard.stripe.com/products)
Créez 3 produits avec prix récurrents :
- **Pro**: 47€/mois → Copiez le Price ID (`price_...`)
- **Business**: 97€/mois → Copiez le Price ID
- **Enterprise**: Sur devis ou prix custom → Copiez le Price ID

---

### 2. Exécuter le Script

**Option A - Script Interactif** (recommandé):
```bash
./scripts/configure-stripe-complete.sh
```

**Option B - Script Automatique** (si vous avez déjà les clés):
```bash
./scripts/configure-stripe-auto.sh \
  pk_test_VOTRE_CLE_PUBLIQUE \
  sk_test_VOTRE_CLE_SECRETE \
  whsec_VOTRE_WEBHOOK_SECRET \
  price_VOTRE_PRICE_PRO \
  price_VOTRE_PRICE_BUSINESS \
  price_VOTRE_PRICE_ENTERPRISE
```

---

### 3. Redéployer

Les variables sont automatiquement configurées. Redéployez simplement :

```bash
# Redéployer frontend
cd apps/frontend && vercel --prod

# Redéployer backend
cd apps/backend && vercel --prod
```

Ou attendez le prochain push sur `main` (déploiement automatique).

---

### 4. Tester

1. Allez sur `/dashboard/plans`
2. Cliquez sur "Choisir ce plan"
3. Utilisez la carte de test: `4242 4242 4242 4242`
4. Date d'expiration: N'importe quelle date future
5. CVC: N'importe quel 3 chiffres

---

## 📋 Checklist

- [ ] Compte Stripe créé/vérifié
- [ ] Publishable Key récupérée (`pk_test_...`)
- [ ] Secret Key récupérée (`sk_test_...`)
- [ ] Webhook créé et Secret copié (`whsec_...`)
- [ ] Price IDs créés (Pro, Business, Enterprise)
- [ ] Script de configuration exécuté
- [ ] Projets redéployés
- [ ] Checkout testé avec carte de test

---

## 🔗 Liens Utiles

- **Dashboard Stripe**: https://dashboard.stripe.com
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Products**: https://dashboard.stripe.com/products
- **Test Cards**: https://stripe.com/docs/testing

---

**Besoin d'aide ?** Voir `.github/GUIDE_STRIPE_COMPLET.md` pour le guide détaillé.

