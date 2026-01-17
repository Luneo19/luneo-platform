# 🔑 Obtenir la Clé Stripe de Production

La clé actuelle dans .env.production est invalide. Pour créer les produits en PRODUCTION :

## Option 1 : Depuis Stripe Dashboard (RECOMMANDÉ)

1. Aller sur https://dashboard.stripe.com/apikeys
2. **Mode LIVE** (pas test mode)
3. Créer une nouvelle clé secrète ou copier une clé existante
4. La clé doit commencer par `sk_live_...`
5. L'utiliser pour créer les produits :

```bash
cd apps/frontend
STRIPE_LIVE_SECRET_KEY="sk_live_VOTRE_CLE" npx tsx scripts/create-stripe-production.ts
```

## Option 2 : Via Stripe CLI

```bash
# Se connecter en mode live
stripe login

# Vérifier que vous êtes en mode live
stripe config --list

# Utiliser le script avec la clé depuis CLI
cd apps/frontend
npx tsx scripts/create-stripe-production.ts
```

## Option 3 : Depuis le Dashboard Stripe

Les produits peuvent aussi être créés manuellement depuis le Dashboard :
1. https://dashboard.stripe.com/products
2. Créer les produits manuellement
3. Noter les Price IDs créés
4. Les ajouter dans Vercel

