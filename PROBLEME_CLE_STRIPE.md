# ⚠️ PROBLÈME IDENTIFIÉ - CLÉ STRIPE INVALIDE

**Erreur:** `Invalid API Key provided`

**Cause:** La clé Stripe que vous utilisez dans Vercel n'est PAS valide!

---

## ✅ SOLUTION

**Dans Stripe Dashboard Workbench, VOUS AVEZ 3 CLÉS:**

1. ✅ **Clé publique:** `pk_live_jL5xDF4ylCaiXVDswVAliVA3`
2. ❌ **Clé secrète:** `sk_live_...W2jE` (celle que vous utilisez actuellement - INVALIDE)
3. ⚠️ **Clé Secrète - Luneo projet:** `sk_live_...3V0h` (différente!)

---

## 🎯 ACTION REQUISE

**1. Allez sur Stripe Dashboard:**
- https://dashboard.stripe.com/apikeys

**2. Trouvez la BONNE clé secrète** qui fonctionne

**3. Dans Vercel:**
- https://vercel.com/luneos-projects/frontend/settings/environment-variables
- Modifiez `STRIPE_SECRET_KEY`
- Utilisez la BONNE clé (celle qui fonctionne, pas celle avec ...W2jE)

---

**Une fois que vous avez remplacé la clé dans Vercel, redéployez et testez!**

