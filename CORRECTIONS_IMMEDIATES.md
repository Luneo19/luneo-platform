# 🔧 CORRECTIONS IMMÉDIATES À APPLIQUER

**Date:** Décembre 2024  
**Priorité:** 🔴 CRITIQUE

---

## 1. ERREURS TYPESCRIPT (2 erreurs)

### **Fichier:** `apps/frontend/src/app/api/designs/[id]/versions/auto/route.ts`

**Actions:**
```bash
# 1. Nettoyer cache
cd apps/frontend
rm -rf .next node_modules/.cache

# 2. Réinstaller si nécessaire
npm install

# 3. Redémarrer TypeScript server (VS Code)
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# 4. Vérifier build
npm run build
```

**Si erreurs persistent:**
- Vérifier que Next.js 15 est bien installé
- Vérifier tsconfig.json paths
- Vérifier que le fichier est bien dans le workspace

---

## 2. REMPLACER `any` PAR TYPES APPROPRIÉS (23 occurrences)

### **Fichier:** `apps/frontend/src/app/api/webhooks/woocommerce/route.ts`

**À corriger:**
```typescript
// AVANT (❌)
let data: any;
let result: any;
async function handleOrderCreated(supabase: any, orderData: any, integration: any)
catch (error: any)

// APRÈS (✅)
interface WooCommerceOrder {
  id: number;
  line_items: Array<{...}>;
  // ...
}
let data: WooCommerceOrder;
let result: { success: boolean; orderId: string };
async function handleOrderCreated(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: Integration
)
catch (error: unknown)
```

**Action:** Créer interfaces TypeScript pour tous les types WooCommerce

---

## 3. REMPLACER `console.log` PAR `logger`

**Fichiers à vérifier:**
- Tous les fichiers API routes
- Tous les composants avec console.log

**Action:** Remplacer par `logger.info()`, `logger.error()`, etc.

---

## 4. AMÉLIORER GESTION D'ERREURS

**Pattern à utiliser:**
```typescript
// ✅ BON
try {
  // ...
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', error, { context });
    throw { status: 500, message: error.message, code: 'ERROR' };
  }
  throw { status: 500, message: 'Unknown error', code: 'UNKNOWN_ERROR' };
}
```

---

## 📋 CHECKLIST RAPIDE

- [ ] Nettoyer cache TypeScript
- [ ] Vérifier build passe
- [ ] Corriger 23 occurrences de `any`
- [ ] Remplacer console.log par logger
- [ ] Améliorer gestion erreurs
- [ ] Tester build final

**Temps estimé:** 2-3h

