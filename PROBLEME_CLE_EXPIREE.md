# ⚠️ Problème : Clé Stripe de Production Expirée

## ❌ Erreur

La clé fournie retourne : **"Expired API Key provided" (api_key_expired)**

```
Clé fournie : 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
```

## ✅ Solution : Obtenir une Nouvelle Clé

### Étapes Rapides

1. **Aller sur Stripe Dashboard** :
   - https://dashboard.stripe.com/apikeys
   - ⚠️ **Mode LIVE** (pas test mode)

2. **Créer une nouvelle clé secrète** :
   - Cliquer sur "Create secret key" ou "Révéler la clé secrète"
   - Nommer la clé (ex: "Luneo Production - Jan 2025")
   - ⚠️ **Copier immédiatement** (affichée une seule fois)

3. **Format** : La clé doit commencer par `sk_live_...` et avoir ~107 caractères

4. **Utiliser la clé** :
   ```bash
   cd apps/frontend
   STRIPE_LIVE_SECRET_KEY="sk_live_VOTRE_NOUVELLE_CLE" \
   npx tsx scripts/create-all-stripe-prod.ts
   ```

## 📋 Alternative : Produits TEST

En attendant, les produits TEST sont créés et fonctionnels :
- ✅ 3 plans (Starter, Professional, Business)
- ✅ 5 add-ons
- ✅ Page pricing opérationnelle
- ✅ Flux de checkout testable

## 🔧 Scripts Disponibles

Tous ces scripts sont prêts et attendent une clé valide :

1. `scripts/create-all-stripe-prod.ts` - Script principal
2. `scripts/create-stripe-production.ts` - Script alternatif
3. `scripts/create-stripe-prod-complete.sh` - Script Bash

---

**Dès que vous avez une nouvelle clé, le script créera tous les produits en quelques secondes !** 🚀
