# 🧹 Plan de Nettoyage des Tests - Luneo Platform

**Document identifiant les tests obsolètes et les actions de migration**

---

## 📋 Doublons Identifiés

### 1. Tests Button Component

**Fichiers:**
- `__tests__/components/Button.test.tsx` (196 lignes) - ⚠️ **OBSOLÈTE**
- `src/components/ui/__tests__/button.test.tsx` (296 lignes) - ✅ **À GARDER**

**Action:** Supprimer `__tests__/components/Button.test.tsx` car le test dans `src/components/ui/__tests__/` est plus récent et plus complet.

**Raison:** Le test dans `src/components/ui/__tests__/` suit la nouvelle structure et contient plus de cas de test.

---

### 2. Tests E2E Authentication

**Fichiers:**
- `e2e/auth.spec.ts` - ⚠️ **OBSOLÈTE**
- `tests/e2e/auth.spec.ts` - ✅ **À GARDER**

**Action:** Supprimer `e2e/auth.spec.ts` car `tests/e2e/auth.spec.ts` utilise les helpers modernes (`setLocale`, `ensureCookieBannerClosed`).

**Raison:** Le test dans `tests/e2e/` suit les patterns modernes avec helpers réutilisables.

---

### 3. Tests E2E Navigation

**Fichiers:**
- `e2e/navigation.spec.ts` - ⚠️ **OBSOLÈTE**
- `tests/e2e/navigation.spec.ts` - ✅ **À GARDER**

**Action:** Supprimer `e2e/navigation.spec.ts` car `tests/e2e/navigation.spec.ts` utilise les helpers modernes.

**Raison:** Le test dans `tests/e2e/` suit les patterns modernes avec helpers réutilisables.

---

### 4. Tests E2E Pricing

**Fichiers:**
- `e2e/pricing.spec.ts` - ⚠️ **OBSOLÈTE**
- `tests/e2e/pricing.spec.ts` - ✅ **À GARDER**

**Action:** Supprimer `e2e/pricing.spec.ts` car `tests/e2e/pricing.spec.ts` est plus complet (255 lignes vs 101 lignes).

**Raison:** Le test dans `tests/e2e/` est plus complet et suit les patterns modernes.

---

### 5. Tests useBilling Hook

**Fichiers:**
- `__tests__/hooks/useBilling.test.tsx` - ⚠️ **À VÉRIFIER**
- `src/lib/hooks/__tests__/useBilling.test.ts` - ✅ **À GARDER**

**Action:** Vérifier si les deux tests couvrent les mêmes fonctionnalités. Si oui, supprimer celui dans `__tests__/`.

**Raison:** Le test dans `src/lib/hooks/__tests__/` suit la nouvelle structure.

---

## 📁 Structure de Migration

### Tests à Migrer Progressivement

**Dossier `__tests__/` → `src/**/__tests__/`**

1. `__tests__/components/LoginForm.test.tsx` → `src/components/auth/__tests__/LoginForm.test.tsx`
2. `__tests__/components/RegisterForm.test.tsx` → `src/components/auth/__tests__/RegisterForm.test.tsx`
3. `__tests__/components/NotificationCenter.test.tsx` → `src/components/notifications/__tests__/NotificationCenter.test.tsx` (déjà migré)
4. `__tests__/components/ProductCustomizer.test.tsx` → `src/components/dashboard/__tests__/ProductCustomizer.test.tsx`

**Dossier `e2e/` → `tests/e2e/`**

1. `e2e/customization-flow.spec.ts` → `tests/e2e/workflows/customization-flow.spec.ts`
2. `e2e/ar-viewer.spec.ts` → `tests/e2e/ar-viewer.spec.ts`

---

## 🗑️ Fichiers à Supprimer Immédiatement

### Tests Obsolètes

```bash
# Tests Button (doublon)
rm __tests__/components/Button.test.tsx

# Tests E2E obsolètes (doublons)
rm e2e/auth.spec.ts
rm e2e/navigation.spec.ts
rm e2e/pricing.spec.ts
```

### Tests à Vérifier Avant Suppression

```bash
# Vérifier si useBilling.test.tsx est identique à useBilling.test.ts
diff __tests__/hooks/useBilling.test.tsx src/lib/hooks/__tests__/useBilling.test.ts
```

---

## ✅ Checklist de Migration

- [ ] Supprimer `__tests__/components/Button.test.tsx`
- [ ] Supprimer `e2e/auth.spec.ts`
- [ ] Supprimer `e2e/navigation.spec.ts`
- [ ] Supprimer `e2e/pricing.spec.ts`
- [ ] Vérifier et supprimer `__tests__/hooks/useBilling.test.tsx` si doublon
- [ ] Migrer `__tests__/components/LoginForm.test.tsx`
- [ ] Migrer `__tests__/components/RegisterForm.test.tsx`
- [ ] Migrer `__tests__/components/ProductCustomizer.test.tsx`
- [ ] Migrer `e2e/customization-flow.spec.ts`
- [ ] Migrer `e2e/ar-viewer.spec.ts`
- [ ] Mettre à jour les imports dans les fichiers qui référencent les anciens chemins
- [ ] Vérifier que tous les tests passent après migration

---

## 📝 Notes

- **Priorité:** Supprimer d'abord les doublons évidents, puis migrer progressivement
- **Tests:** Vérifier que tous les tests passent après chaque suppression/migration
- **CI:** S'assurer que la CI fonctionne après les changements

---

## 🔄 Prochaines Étapes

1. **Phase 1:** Supprimer les doublons évidents (Button, auth, navigation, pricing)
2. **Phase 2:** Vérifier les tests useBilling
3. **Phase 3:** Migrer les tests restants de `__tests__/` vers `src/**/__tests__/`
4. **Phase 4:** Migrer les tests E2E de `e2e/` vers `tests/e2e/`
5. **Phase 5:** Supprimer les dossiers vides `__tests__/` et `e2e/`

