# 🔑 Guide : Obtenir une Clé Stripe de Production

## ⚠️ Situation Actuelle

La clé de production trouvée (`sk_live_51DzUA1KG9Ms...`) est invalide ou révoquée. Il faut obtenir une nouvelle clé valide.

## 📋 Étapes pour Obtenir une Nouvelle Clé

### Option 1 : Depuis Stripe Dashboard (RECOMMANDÉ)

1. **Se connecter à Stripe** : https://dashboard.stripe.com/login

2. **Aller dans les API Keys** : https://dashboard.stripe.com/apikeys
   - ⚠️ **IMPORTANT** : S'assurer d'être en mode **LIVE** (pas test mode)
   - Le toggle en haut doit être sur "Live mode" (pas "Test mode")

3. **Créer une nouvelle clé secrète** :
   - Cliquer sur "Create secret key" ou "Révéler la clé secrète"
   - Nommer la clé (ex: "Luneo Production - January 2025")
   - ⚠️ **La clé n'est affichée qu'une seule fois !** Copier immédiatement

4. **Format attendu** : La clé doit commencer par `sk_live_...`

5. **Une fois la clé obtenue** :
   ```bash
   cd apps/frontend
   STRIPE_LIVE_SECRET_KEY="sk_live_VOTRE_NOUVELLE_CLE" npx tsx scripts/create-stripe-production.ts
   ```

### Option 2 : Utiliser Stripe CLI

Si vous avez déjà Stripe CLI configuré :

```bash
# Se connecter en mode live
stripe login

# Vérifier que vous êtes en mode live
stripe config --list

# Utiliser le script qui récupère la clé depuis CLI
cd apps/frontend
npx tsx scripts/create-stripe-production.ts
```

### Option 3 : Créer les Produits Manuellement

Si vous préférez créer les produits depuis le Dashboard :

1. Aller sur https://dashboard.stripe.com/products
2. Créer les produits suivants :

#### Plans de Base

**Professional** :
- Nom : "Luneo Professional"
- Description : "Pour les créateurs et PME qui veulent passer à la vitesse supérieure"
- Prix mensuel : 29.00 EUR
- Prix annuel : 278.40 EUR

**Business** :
- Nom : "Luneo Business"
- Description : "Pour les équipes qui ont besoin de collaboration et de volume"
- Prix mensuel : 99.00 EUR
- Prix annuel : 950.40 EUR

#### Add-ons

Créer les add-ons avec leurs prix mensuels/annuels.

3. **Noter les Price IDs** créés
4. **Les ajouter dans Vercel** (Settings > Environment Variables)

## ✅ Une Fois la Clé Obtenue

Exécuter le script :

```bash
cd apps/frontend
STRIPE_LIVE_SECRET_KEY="sk_live_VOTRE_CLE" npx tsx scripts/create-stripe-production.ts
```

Le script va :
- ✅ Créer tous les produits
- ✅ Créer tous les prix (mensuels + annuels)
- ✅ Créer tous les add-ons
- ✅ Afficher toutes les variables à configurer dans Vercel

## 🔒 Sécurité

- ⚠️ Ne jamais commiter les clés dans le code
- ⚠️ Les clés doivent être dans les variables d'environnement uniquement
- ⚠️ Utiliser Vercel Secrets pour la production

---

**Note** : Si vous obtenez une nouvelle clé, je peux immédiatement créer tous les produits en production !
