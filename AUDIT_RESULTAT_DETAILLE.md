# 🔍 AUDIT AUTOMATISÉ - 185 PAGES

**Date:** 03/11/2025
**Pages analysées:** 139

---

## 📊 RÉSUMÉ

| Métrique | Valeur |
|----------|--------|
| **Pages analysées** | 139 |
| **Lignes totales** | 25,494 |
| **Issues critiques** | 6 |
| **Warnings** | 152 |
| **Pages responsive** | 16/139 (12%) |

---

## 🚨 ISSUES CRITIQUES

### BROKEN_IMPORT (15 occurrences)

Pages affectées: /demo/3d-configurator, /demo/ar-export, /demo/playground, /demo/virtual-try-on

### HARDCODED_URL (2 occurrences)

Pages affectées: /help/documentation/quickstart/configuration, /help/documentation/quickstart/first-customizer

---

## 📄 DÉTAILS PAR PAGE

### Pages avec issues critiques

#### /demo/3d-configurator
- **Fichier:** `/(public)/demo/3d-configurator/page.tsx`
- **Lignes:** 374
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules
- **Warnings:**
  - ⚠️ NO_RESPONSIVE: Peu/pas de classes responsive (sm:, md:, lg:)

#### /demo/ar-export
- **Fichier:** `/(public)/demo/ar-export/page.tsx`
- **Lignes:** 363
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules
- **Warnings:**
  - ⚠️ NO_RESPONSIVE: Peu/pas de classes responsive (sm:, md:, lg:)

#### /demo/playground
- **Fichier:** `/(public)/demo/playground/page.tsx`
- **Lignes:** 312
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules
- **Warnings:**
  - ⚠️ NO_RESPONSIVE: Peu/pas de classes responsive (sm:, md:, lg:)
  - ⚠️ CONSOLE_LOG: console.log/debug présents (à retirer en prod)

#### /demo/virtual-try-on
- **Fichier:** `/(public)/demo/virtual-try-on/page.tsx`
- **Lignes:** 520
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules
- **Warnings:**
  - ⚠️ NO_RESPONSIVE: Peu/pas de classes responsive (sm:, md:, lg:)
  - ⚠️ CONSOLE_LOG: console.log/debug présents (à retirer en prod)

#### /help/documentation/quickstart/configuration
- **Fichier:** `/(public)/help/documentation/quickstart/configuration/page.tsx`
- **Lignes:** 340
- **Issues:**
  - ❌ HARDCODED_URL: URLs localhost hardcodées
- **Warnings:**
  - ⚠️ NO_RESPONSIVE: Peu/pas de classes responsive (sm:, md:, lg:)

#### /help/documentation/quickstart/first-customizer
- **Fichier:** `/(public)/help/documentation/quickstart/first-customizer/page.tsx`
- **Lignes:** 284
- **Issues:**
  - ❌ HARDCODED_URL: URLs localhost hardcodées
- **Warnings:**
  - ⚠️ NO_RESPONSIVE: Peu/pas de classes responsive (sm:, md:, lg:)
  - ⚠️ CONSOLE_LOG: console.log/debug présents (à retirer en prod)


---

## 📋 LISTE COMPLÈTE DES PAGES

| Route | Lignes | Responsive | Issues | Warnings |
|-------|--------|------------|--------|----------|
| /login | 245 | ❌ | 0 | 2 |
| /register | 323 | ❌ | 0 | 2 |
| /reset-password | 127 | ❌ | 0 | 1 |
| /3d-view/[productId] | 141 | ❌ | 0 | 2 |
| /ai-studio/luxury | 429 | ❌ | 0 | 1 |
| /ai-studio | 403 | ❌ | 0 | 3 |
| /analytics | 243 | ❌ | 0 | 2 |
| /ar-studio | 469 | ❌ | 0 | 1 |
| /billing | 269 | ❌ | 0 | 1 |
| /configure-3d/[productId] | 198 | ❌ | 0 | 2 |
| /customize/[productId] | 117 | ❌ | 0 | 2 |
| /integrations | 334 | ❌ | 0 | 1 |
| /library | 50 | ❌ | 0 | 3 |
| /orders | 268 | ❌ | 0 | 1 |
| /overview | 245 | ❌ | 0 | 2 |
| /plans | 19 | ❌ | 0 | 1 |
| /products | 363 | ❌ | 0 | 2 |
| /settings/enterprise | 497 | ❌ | 0 | 1 |
| /settings | 546 | ❌ | 0 | 2 |
| /team | 406 | ❌ | 0 | 2 |
| /try-on/[productId] | 189 | ❌ | 0 | 2 |
| /virtual-try-on | 306 | ❌ | 0 | 1 |
| /about | 376 | ✅ | 0 | 0 |
| /blog/[id] | 186 | ❌ | 0 | 1 |
| /blog | 245 | ✅ | 0 | 0 |
| /contact | 303 | ✅ | 0 | 0 |
| /demo/3d-configurator | 374 | ❌ | 1 | 1 |
| /demo/ar-export | 363 | ❌ | 1 | 1 |
| /demo/bulk-generation | 534 | ❌ | 0 | 2 |
| /demo | 300 | ❌ | 0 | 1 |
| /demo/playground | 312 | ❌ | 1 | 2 |
| /demo/virtual-try-on | 520 | ❌ | 1 | 2 |
| /entreprise | 370 | ✅ | 0 | 0 |
| /features | 83 | ❌ | 0 | 1 |
| /gallery | 228 | ❌ | 0 | 1 |
| /help/documentation/3d/export | 78 | ❌ | 0 | 1 |
| /help/documentation/3d/materials | 110 | ❌ | 0 | 1 |
| /help/documentation/3d/models | 81 | ❌ | 0 | 1 |
| /help/documentation/3d/setup | 138 | ❌ | 0 | 2 |
| /help/documentation/ai/generation | 76 | ❌ | 0 | 1 |
| /help/documentation/ai/models | 98 | ❌ | 0 | 1 |
| /help/documentation/ai/prompts | 73 | ❌ | 0 | 1 |
| /help/documentation/analytics/dashboards | 51 | ❌ | 0 | 1 |
| /help/documentation/analytics/events | 49 | ❌ | 0 | 1 |
| /help/documentation/analytics/overview | 97 | ❌ | 0 | 1 |
| /help/documentation/api/authentication | 178 | ❌ | 0 | 2 |
| /help/documentation/api/designs | 133 | ❌ | 0 | 1 |
| /help/documentation/api/orders | 89 | ❌ | 0 | 1 |
| /help/documentation/api/products | 195 | ❌ | 0 | 1 |
| /help/documentation/api/rate-limiting | 65 | ❌ | 0 | 1 |

*... et 89 autres pages*
