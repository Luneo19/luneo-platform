# Technical Debt Cleanup Roadmap

**Date:** November 2025  
**Status:** In Progress  
**Goal:** Systematic cleanup of technical debt with safe, incremental refactors

---

## 📊 Current State Analysis

### Metrics Summary

- **`any` types:** 589 instances across 201 files
- **Large files (>500 lines):** 5 identified
- **Duplicated utilities:** 8+ functions across multiple packages
- **Unused imports:** To be analyzed

### Critical Issues Identified

1. **Type Safety**
   - 589 `any` types reducing type safety
   - Missing DTOs in several modules
   - Inconsistent User type usage

2. **Code Duplication**
   - Utility functions duplicated between `apps/frontend/src/lib/utils.ts` and `packages/ui/src/lib/utils.ts`
   - Formatting functions (`formatDate`, `formatCurrency`, `slugify`, `debounce`) exist in multiple places

3. **Large Modules**
   - `product-rules.service.ts`: ~824 lines
   - `public-api.service.ts`: ~389 lines
   - `order-sync.service.ts`: ~375 lines
   - `webhook-handler.service.ts`: ~381 lines
   - `pricing-engine.service.ts`: ~565 lines

---

## 🎯 Refactoring Strategy

### Principles

1. **Small, focused PRs** (max 200 lines changed)
2. **Comprehensive tests** for each refactor
3. **Backward compatibility** maintained
4. **Metrics tracked** in PR descriptions

### Phases

---

## Phase 1: Type Safety Improvements ✅ (In Progress)

### PR #1: Fix `any` types in Designs Module ✅

**Status:** Completed  
**Files Changed:** 4 files, ~150 lines  
**Metrics:**
- Removed 6 `any` types
- Added 2 DTOs (`CreateDesignDto`, `ReprojectMaskDto`)
- Added comprehensive test coverage

**Changes:**
- Created `dto/create-design.dto.ts`
- Created `dto/reproject-mask.dto.ts`
- Updated `designs.service.ts` to use proper types
- Updated `designs.controller.ts` to use DTOs
- Added `designs.service.spec.ts` with test coverage

**Next Steps:**
- Apply same pattern to other modules (Orders, Products, Users)

---

## Phase 2: Extract Shared Utilities

### PR #2: Consolidate Formatting Utilities

**Target:** Create `@luneo/utils` package  
**Scope:** Extract duplicated formatting functions  
**Estimated Lines:** ~200

**Functions to consolidate:**
- `formatDate` (2 implementations)
- `formatCurrency` / `formatPrice` (2 names, same purpose)
- `formatNumber` (2 implementations)
- `formatFileSize` / `formatBytes` (2 names, same purpose)
- `slugify` (2 implementations)
- `debounce` (2 implementations)
- `throttle` (1 implementation)

**Plan:**
1. Create `packages/utils/` package
2. Extract common utilities with unified API
3. Update `apps/frontend` and `packages/ui` to use shared package
4. Add tests for all utilities

---

## Phase 3: Split Large Services

### PR #3: Split Product Rules Service

**Target:** `apps/backend/src/modules/product-engine/services/product-rules.service.ts`  
**Current:** 824 lines  
**Goal:** Split into focused services (~200 lines each)

**Proposed Split:**
- `product-rules.service.ts` - Core rule engine
- `product-validation.service.ts` - Validation logic
- `product-constraints.service.ts` - Constraint checking
- `product-rules-cache.service.ts` - Caching layer

**Estimated PRs:** 3-4 small PRs

---

### PR #4: Split Public API Service

**Target:** `apps/backend/src/modules/public-api/public-api.service.ts`  
**Current:** 389 lines  
**Goal:** Split by domain

**Proposed Split:**
- `public-api.service.ts` - Core orchestration
- `public-api-designs.service.ts` - Design endpoints
- `public-api-products.service.ts` - Product endpoints
- `public-api-orders.service.ts` - Order endpoints

**Estimated PRs:** 2-3 small PRs

---

### PR #5: Split Order Sync Service

**Target:** `apps/backend/src/modules/ecommerce/services/order-sync.service.ts`  
**Current:** 375 lines  
**Goal:** Split by responsibility

**Proposed Split:**
- `order-sync.service.ts` - Core sync logic
- `order-transformer.service.ts` - Data transformation
- `order-validator.service.ts` - Validation
- `order-conflict-resolver.service.ts` - Conflict resolution

**Estimated PRs:** 2-3 small PRs

---

## Phase 4: Remove Unused Code

### PR #6: Remove Unused Imports

**Target:** All TypeScript files  
**Tool:** ESLint `unused-imports` plugin  
**Estimated Impact:** ~50-100 unused imports

**Plan:**
1. Run ESLint with `--fix` for unused imports
2. Review and verify no breaking changes
3. Commit as single PR

---

## Phase 5: Bundle Size Optimization

### PR #7: Analyze and Optimize Bundle Sizes

**Target:** Frontend bundles  
**Tool:** `@next/bundle-analyzer`  
**Goal:** Identify large dependencies

**Plan:**
1. Add bundle analyzer to build process
2. Identify large dependencies
3. Propose code splitting or lazy loading
4. Document findings

---

## 📈 Success Metrics

### Type Safety
- **Current:** 589 `any` types
- **Target:** <100 `any` types (83% reduction)
- **Progress:** 6 removed (1%)

### Code Duplication
- **Current:** 8+ duplicated utilities
- **Target:** 0 duplicated utilities
- **Progress:** 0% (Phase 2 pending)

### Large Files
- **Current:** 5 files >500 lines
- **Target:** 0 files >500 lines
- **Progress:** 0% (Phase 3 pending)

### Test Coverage
- **Current:** Variable coverage
- **Target:** >80% coverage for refactored code
- **Progress:** 1 module tested

---

## 🚦 Risk Mitigation

### Breaking Changes
- ✅ All changes covered by tests
- ✅ Backward compatibility maintained
- ✅ Incremental rollout

### Performance
- Monitor bundle sizes after utility consolidation
- Track API response times after service splits

### Team Impact
- Small PRs for easy review
- Clear documentation in each PR
- Migration guides for shared utilities

---

## 📅 Timeline

- **Week 1:** Phase 1 (Type Safety) - 3-4 PRs
- **Week 2:** Phase 2 (Shared Utilities) - 2-3 PRs
- **Week 3-4:** Phase 3 (Split Services) - 8-10 PRs
- **Week 5:** Phase 4 (Unused Code) - 1 PR
- **Week 6:** Phase 5 (Bundle Analysis) - 1 PR + analysis

**Total Estimated PRs:** 15-19 PRs over 6 weeks

---

## 📝 PR Template

Each PR should include:

```markdown
## Technical Debt Refactor

### Scope
- [ ] Type safety improvements
- [ ] Code deduplication
- [ ] Service splitting
- [ ] Unused code removal
- [ ] Bundle optimization

### Changes
- List of files changed
- Brief description of changes

### Metrics
- **Lines changed:** X
- **`any` types removed:** X
- **Duplicated code removed:** X lines
- **Test coverage:** X%

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

### Breaking Changes
- [ ] None
- [ ] Documented migration guide
```

---

## 🔄 Review Process

1. **Automated Checks**
   - ESLint passes
   - TypeScript compiles
   - Tests pass
   - Bundle size within limits

2. **Code Review**
   - Focus on type safety
   - Verify test coverage
   - Check for regressions

3. **Merge Criteria**
   - ✅ All checks pass
   - ✅ 2 approvals
   - ✅ Metrics documented
   - ✅ No breaking changes (or migration guide provided)

---

## 📚 References

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [NestJS DTOs](https://docs.nestjs.com/techniques/validation)
- [Monorepo Best Practices](https://monorepo.tools/)

---

**Last Updated:** November 2025  
**Next Review:** After Phase 1 completion
