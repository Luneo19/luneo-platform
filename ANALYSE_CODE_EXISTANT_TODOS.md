# 🔍 ANALYSE CODE EXISTANT - TODOs RESTANTS

**Date:** 20 Novembre 2025  
**Méthodologie:** Analyse approfondie avant implémentation

---

## ✅ WOOCOMMERCE (TODO-031 à TODO-033)

### TODO-031: API route connect WooCommerce
**STATUT:** ✅ **DÉJÀ COMPLÉTÉ**
- **Fichier:** `apps/frontend/src/app/api/integrations/woocommerce/connect/route.ts`
- **Lignes:** 158 lignes
- **Fonctionnalités:**
  - ✅ Validation credentials WooCommerce
  - ✅ Test connexion API
  - ✅ Chiffrement credentials
  - ✅ Création/mise à jour intégration
  - ✅ Gestion erreurs complète
- **Pattern:** Suit le même pattern que Shopify (OAuth-like avec API keys)
- **Qualité:** Production-ready, gestion d'erreurs complète

### TODO-032: API route sync WooCommerce
**STATUT:** ✅ **DÉJÀ COMPLÉTÉ**
- **Fichier:** `apps/frontend/src/app/api/integrations/woocommerce/sync/route.ts`
- **Lignes:** 205 lignes
- **Fonctionnalités:**
  - ✅ Sync produits WooCommerce → Luneo
  - ✅ Logs de synchronisation
  - ✅ Gestion create/update
  - ✅ Statistiques détaillées
  - ✅ Gestion erreurs par produit
- **Pattern:** Suit le pattern de sync standard
- **Qualité:** Production-ready avec logging complet

### TODO-033: Webhooks WooCommerce
**STATUT:** ⚠️ **PARTIEL - À COMPLÉTER**
- **Backend:** ✅ Existe dans `apps/backend/src/modules/ecommerce/connectors/woocommerce/woocommerce.connector.ts`
  - Méthode `handleWebhook()` ligne 286
  - Support topics: order.created, order.updated, product.created, etc.
- **Frontend Route:** ⚠️ Route générique existe `/api/webhooks/ecommerce/route.ts`
  - Vérifie signature WooCommerce
  - Mais pas de route dédiée `/api/webhooks/woocommerce/route.ts`
- **Action requise:** Créer route dédiée ou améliorer route générique

**CONCLUSION WOOCOMMERCE:**
- ✅ TODO-031: COMPLÉTÉ (vérifier si améliorations nécessaires)
- ✅ TODO-032: COMPLÉTÉ (vérifier si améliorations nécessaires)
- ⏳ TODO-033: Créer route webhook dédiée frontend

---

## ✅ COLLECTIONS UI (TODO-038 à TODO-040)

### TODO-038: Page /dashboard/collections
**STATUT:** ❌ **PAGE UI MANQUANTE**
- **API:** ✅ Routes complètes existent
  - `GET /api/collections`
  - `POST /api/collections`
  - `PUT /api/collections/[id]`
  - `DELETE /api/collections/[id]`
  - `GET /api/collections/[id]`
  - `POST /api/collections/[id]/items`
  - `DELETE /api/collections/[id]/items`
- **Hook:** ✅ `useCollections.ts` existe (232 lignes, complet)
- **Page UI:** ❌ `/dashboard/collections/page.tsx` n'existe pas
- **Action requise:** Créer page complète avec grid view, modals, etc.

### TODO-039: Créer/Modifier collection
**STATUT:** ✅ **API COMPLÈTE, UI MANQUANTE**
- **API:** ✅ POST et PUT existent dans `/api/collections/route.ts`
- **Hook:** ✅ `createCollection()` et `updateCollection()` dans `useCollections.ts`
- **UI Modal:** ❌ Pas de composant modal pour créer/modifier
- **Action requise:** Créer composant `CollectionModal.tsx`

### TODO-040: Ajouter designs à collection
**STATUT:** ✅ **API COMPLÈTE, UI MANQUANTE**
- **API:** ✅ POST et DELETE existent dans `/api/collections/[id]/items/route.ts`
- **Hook:** ✅ `addDesignToCollection()` et `removeDesignFromCollection()` dans `useCollections.ts`
- **UI:** ❌ Pas de composant pour drag & drop ou multi-select
- **Action requise:** Créer composant `AddDesignsModal.tsx` avec drag & drop

**CONCLUSION COLLECTIONS:**
- ⏳ TODO-038: Créer page `/dashboard/collections/page.tsx` (200+ lignes)
- ⏳ TODO-039: Créer `CollectionModal.tsx` (100+ lignes)
- ⏳ TODO-040: Créer `AddDesignsModal.tsx` avec drag & drop (150+ lignes)

---

## ❌ DESIGN VERSIONING (TODO-036 à TODO-037)

### TODO-036: Activer versioning automatique
**STATUT:** ❌ **NON IMPLÉMENTÉ**
- **Table:** ⚠️ `design_versions` mentionnée dans plan mais pas trouvée dans code
- **Trigger:** ❌ Pas de trigger automatique sur update designs
- **Backend:** ❌ Pas de service de versioning
- **Action requise:** 
  1. Vérifier/créer table `design_versions` dans Supabase
  2. Créer trigger ou service backend pour versioning automatique
  3. Créer API route pour gérer versions

### TODO-037: UI historique versions
**STATUT:** ❌ **NON IMPLÉMENTÉ**
- **Page:** ❌ Pas de page `/dashboard/designs/[id]/versions/page.tsx`
- **Composants:** ❌ Pas de composants pour timeline, preview diff, restore
- **Action requise:**
  1. Créer page versions avec timeline
  2. Créer composant `VersionPreview.tsx`
  3. Créer composant `VersionDiff.tsx`
  4. Créer fonction restore version

**CONCLUSION VERSIONING:**
- ❌ TODO-036: À créer complètement (backend + trigger)
- ❌ TODO-037: À créer complètement (UI complète)

---

## 📊 RÉSUMÉ PAR TODO

| TODO | Statut | Action Requise | Complexité |
|------|--------|----------------|------------|
| TODO-031 | ✅ Existe | Vérifier/améliorer | Faible |
| TODO-032 | ✅ Existe | Vérifier/améliorer | Faible |
| TODO-033 | ⚠️ Partiel | Créer route webhook dédiée | Moyenne |
| TODO-036 | ❌ Manquant | Créer système complet | Élevée |
| TODO-037 | ❌ Manquant | Créer UI complète | Élevée |
| TODO-038 | ❌ Manquant | Créer page UI (200+ lignes) | Moyenne |
| TODO-039 | ⚠️ Partiel | Créer modal UI | Faible |
| TODO-040 | ⚠️ Partiel | Créer modal drag & drop | Moyenne |

---

## 🎯 PLAN D'ACTION OPTIMISÉ

### Priorité 1: Compléter ce qui existe partiellement
1. **TODO-033:** Créer route webhook WooCommerce dédiée (30 min)
2. **TODO-039:** Créer CollectionModal (1h)
3. **TODO-040:** Créer AddDesignsModal avec drag & drop (2h)

### Priorité 2: Créer ce qui manque
4. **TODO-038:** Créer page Collections complète (2h)
5. **TODO-036:** Créer système versioning backend (3h)
6. **TODO-037:** Créer UI versioning complète (3h)

---

*Analyse effectuée le 20 Novembre 2025*

