# 📊 Statut Setup Stripe - 15 Janvier 2025

## ✅ Ce qui a été fait

1. ✅ **Script de création Stripe créé** : `apps/frontend/scripts/setup-stripe-pricing-complete.ts`
2. ✅ **Script de liste des produits créé** : `apps/frontend/scripts/list-stripe-products.ts`
3. ✅ **Clé Stripe trouvée** dans `apps/frontend/.env.production`
4. ✅ **Clé ajoutée dans `.env.local`** du frontend
5. ✅ **Page pricing modifiée** avec redirection Stripe
6. ✅ **API checkout** avec support des add-ons
7. ✅ **Tableau de comparaison** amélioré

## ⚠️ Problème rencontré

La clé Stripe de production (`sk_live_...`) retourne une erreur "Invalid API Key provided" lors de l'exécution du script.

**Raisons possibles** :
1. La clé est incomplète ou mal formatée
2. La clé a été révoquée ou expirée
3. La clé nécessite des permissions supplémentaires
4. L'API version utilisée n'est pas compatible

## 🔧 Solutions

### Option 1 : Vérifier la clé Stripe (RECOMMANDÉ)

1. Aller sur https://dashboard.stripe.com/apikeys
2. Vérifier que la clé de production existe et est active
3. Si nécessaire, créer une nouvelle clé secrète
4. Mettre à jour `.env.local` avec la nouvelle clé

### Option 2 : Utiliser une clé de test pour créer les produits

1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Créer ou copier une clé de test (`sk_test_...`)
3. Remplacer temporairement dans `.env.local` :
   ```bash
   STRIPE_SECRET_KEY=sk_test_votre_cle_test
   ```
4. Exécuter le script pour créer les produits en test
5. Noter les Price IDs créés
6. Les produits/prices devront être recréés en production

### Option 3 : Vérifier les produits existants dans Stripe

Il est possible que les produits existent déjà dans Stripe :

1. Aller sur https://dashboard.stripe.com/products
2. Vérifier si les produits suivants existent :
   - Luneo Starter
   - Luneo Professional
   - Luneo Business
3. Si oui, noter les Price IDs
4. Les ajouter dans `.env.local`

## 📝 Prochaines étapes

### Si la clé est valide :
```bash
cd apps/frontend
STRIPE_SECRET_KEY="votre_cle_complete" npx tsx scripts/setup-stripe-pricing-complete.ts
```

### Si vous voulez utiliser des produits existants :
```bash
cd apps/frontend
# Avec la clé valide
STRIPE_SECRET_KEY="votre_cle_complete" npx tsx scripts/list-stripe-products.ts
```

## 🔍 Vérification de la clé

Pour vérifier si votre clé Stripe fonctionne, vous pouvez tester avec curl :

```bash
# Remplacer YOUR_KEY par votre clé
curl https://api.stripe.com/v1/products \
  -u YOUR_KEY: \
  -G \
  -d limit=3
```

Si cela retourne une liste de produits, la clé est valide.

## 📋 Variables à configurer

Une fois les produits créés ou récupérés, ajouter ces variables dans `.env.local` :

```env
# Plans de base
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...

# Add-ons (optionnel)
STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY=price_...
STRIPE_ADDON_EXTRA_DESIGNS_YEARLY=price_...
# ... etc
```

## ✅ Une fois les produits configurés

1. Tester la page pricing : `npm run dev` → http://localhost:3000/pricing
2. Cliquer sur un plan payant
3. Vérifier la redirection vers Stripe Checkout
4. Tester avec une carte de test : `4242 4242 4242 4242`

---

**Note** : Les fichiers et scripts sont prêts. Il ne reste plus qu'à résoudre le problème de la clé Stripe pour exécuter le script.
