# 🚀 Guide de Configuration Stripe pour Luneo

## 📋 Vue d'ensemble

Ce guide explique comment créer automatiquement tous les produits et prix Stripe pour Luneo, incluant les plans de base et les add-ons.

## 🎯 Ce que fait le script

Le script `setup-stripe-pricing-complete.ts` crée automatiquement :

### Plans de base
- **Starter** : Gratuit (0€)
- **Professional** : 29€/mois ou 278.40€/an (-20%)
- **Business** : 99€/mois ou 950.40€/an (-20%)

### Add-ons
- **Designs supplémentaires** : 20€/mois ou 192€/an (Pack de 100)
- **Stockage supplémentaire** : 5€/mois ou 48€/an (100 GB)
- **Membres d'équipe supplémentaires** : 10€/mois ou 96€/an (10 membres)
- **API calls supplémentaires** : 15€/mois ou 144€/an (50K appels)
- **Rendus 3D supplémentaires** : 25€/mois ou 240€/an (50 rendus)

## ⚙️ Prérequis

1. **Clé API Stripe** configurée dans `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_... # Pour le test
   # ou
   STRIPE_SECRET_KEY=sk_live_... # Pour la production
   ```

2. **Dépendances installées**:
   ```bash
   cd apps/frontend
   npm install
   # ou
   pnpm install
   ```

## 🚀 Exécution du script

### Méthode 1: Avec tsx (recommandé)

```bash
cd apps/frontend
npx tsx scripts/setup-stripe-pricing-complete.ts
```

### Méthode 2: Avec ts-node

```bash
cd apps/frontend
npx ts-node scripts/setup-stripe-pricing-complete.ts
```

### Méthode 3: Compiler puis exécuter

```bash
cd apps/frontend
npx tsc scripts/setup-stripe-pricing-complete.ts --esModuleInterop --module commonjs --resolveJsonModule
node scripts/setup-stripe-pricing-complete.js
```

## 📝 Résultat du script

Le script affichera :
1. Les produits créés avec leurs IDs
2. Les prix mensuels et annuels créés
3. Un résumé avec toutes les variables d'environnement à configurer

Exemple de sortie :
```
📋 RÉSUMÉ - Variables d'environnement à configurer
========================================

# Starter
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRICE_STARTER_MONTHLY=null  # Gratuit
STRIPE_PRICE_STARTER_YEARLY=null   # Gratuit

# Professional
STRIPE_PRODUCT_PROFESSIONAL=prod_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...

# Business
STRIPE_PRODUCT_BUSINESS=prod_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...

# Add-ons
STRIPE_ADDON_EXTRA_DESIGNS_PRODUCT_ID=prod_...
STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY=price_...
STRIPE_ADDON_EXTRA_DESIGNS_YEARLY=price_...
...
```

## 🔧 Configuration dans Vercel

1. **Copier les variables** affichées par le script
2. **Aller sur Vercel** : https://vercel.com/[votre-team]/[votre-projet]/settings/environment-variables
3. **Ajouter chaque variable** pour l'environnement approprié (Production, Preview, Development)
4. **Redéployer** l'application

## 🔧 Configuration en local

Ajouter les variables dans `.env.local` :

```env
# Plans de base
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_PROFESSIONAL=prod_...
STRIPE_PRODUCT_BUSINESS=prod_...

STRIPE_PRICE_STARTER_MONTHLY=null  # Gratuit
STRIPE_PRICE_STARTER_YEARLY=null   # Gratuit
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...

# Add-ons
STRIPE_ADDON_EXTRA_DESIGNS_PRODUCT_ID=prod_...
STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY=price_...
STRIPE_ADDON_EXTRA_DESIGNS_YEARLY=price_...

# ... (continuer pour tous les add-ons)
```

## ✅ Vérification

Après configuration, tester le flux :

1. **Aller sur la page pricing** : https://app.luneo.app/pricing
2. **Cliquer sur un plan payant** (Professional ou Business)
3. **Vérifier la redirection** vers Stripe Checkout
4. **Tester un paiement** avec une carte de test Stripe :
   - Carte de test : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
   - Code postal : n'importe quel code postal

## 🐛 Dépannage

### Erreur "STRIPE_SECRET_KEY non configurée"
- Vérifier que la variable est bien définie dans `.env.local`
- Redémarrer le terminal après modification de `.env.local`

### Erreur "Product already exists"
- Les produits existent déjà dans Stripe
- Option 1 : Utiliser les IDs existants (les trouver dans Stripe Dashboard)
- Option 2 : Supprimer les produits existants dans Stripe Dashboard puis relancer le script

### Erreur de connexion API
- Vérifier que la clé API Stripe est valide
- Vérifier que vous utilisez la bonne clé (test vs production)
- Vérifier votre connexion internet

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Cartes de test Stripe](https://stripe.com/docs/testing)

## ⚠️ Important

- **Ne jamais commiter** les clés API Stripe dans le code
- **Utiliser des clés de test** (`sk_test_...`) pour le développement
- **Utiliser des clés de production** (`sk_live_...`) uniquement en production
- **Les Price IDs sont différents** entre test et production
