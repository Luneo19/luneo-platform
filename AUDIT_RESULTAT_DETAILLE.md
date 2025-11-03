# 🔍 AUDIT AUTOMATISÉ - 185 PAGES

**Date:** 03/11/2025
**Pages analysées:** 139

---

## 📊 RÉSUMÉ

| Métrique | Valeur |
|----------|--------|
| **Pages analysées** | 139 |
| **Lignes totales** | 25,489 |
| **Issues critiques** | 5 |
| **Warnings** | 23 |
| **Pages responsive** | 132/139 (95%) |

---

## 🚨 ISSUES CRITIQUES

### BROKEN_IMPORT (15 occurrences)

Pages affectées: /demo/3d-configurator, /demo/ar-export, /demo/playground, /demo/virtual-try-on

### HARDCODED_URL (1 occurrences)

Pages affectées: /help/documentation/quickstart/configuration

---

## 📄 DÉTAILS PAR PAGE

### Pages avec issues critiques

#### /demo/3d-configurator
- **Fichier:** `/(public)/demo/3d-configurator/page.tsx`
- **Lignes:** 374
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules

#### /demo/ar-export
- **Fichier:** `/(public)/demo/ar-export/page.tsx`
- **Lignes:** 363
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules

#### /demo/playground
- **Fichier:** `/(public)/demo/playground/page.tsx`
- **Lignes:** 312
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules
- **Warnings:**
  - ⚠️ CONSOLE_LOG: console.log/debug présents (à retirer en prod)

#### /demo/virtual-try-on
- **Fichier:** `/(public)/demo/virtual-try-on/page.tsx`
- **Lignes:** 520
- **Issues:**
  - ❌ BROKEN_IMPORT: Imports @luneo/* packages qui n'existent pas dans node_modules
- **Warnings:**
  - ⚠️ CONSOLE_LOG: console.log/debug présents (à retirer en prod)

#### /help/documentation/quickstart/configuration
- **Fichier:** `/(public)/help/documentation/quickstart/configuration/page.tsx`
- **Lignes:** 340
- **Issues:**
  - ❌ HARDCODED_URL: URLs localhost hardcodées


---

## 📋 LISTE COMPLÈTE DES PAGES

| Route | Lignes | Responsive | Issues | Warnings |
|-------|--------|------------|--------|----------|
| /login | 245 | ✅ | 0 | 0 |
| /register | 323 | ✅ | 0 | 0 |
| /reset-password | 127 | ✅ | 0 | 0 |
| /3d-view/[productId] | 140 | ✅ | 0 | 1 |
| /ai-studio/luxury | 429 | ✅ | 0 | 0 |
| /ai-studio | 401 | ✅ | 0 | 1 |
| /analytics | 243 | ✅ | 0 | 1 |
| /ar-studio | 469 | ✅ | 0 | 0 |
| /billing | 269 | ✅ | 0 | 0 |
| /configure-3d/[productId] | 198 | ✅ | 0 | 0 |
| /customize/[productId] | 116 | ❌ | 0 | 1 |
| /integrations | 334 | ✅ | 0 | 0 |
| /library | 50 | ✅ | 0 | 1 |
| /orders | 268 | ✅ | 0 | 0 |
| /overview | 245 | ✅ | 0 | 1 |
| /plans | 19 | ❌ | 0 | 1 |
| /products | 363 | ✅ | 0 | 1 |
| /settings/enterprise | 497 | ✅ | 0 | 0 |
| /settings | 546 | ✅ | 0 | 1 |
| /team | 406 | ✅ | 0 | 1 |
| /try-on/[productId] | 189 | ✅ | 0 | 1 |
| /virtual-try-on | 306 | ✅ | 0 | 0 |
| /about | 376 | ✅ | 0 | 0 |
| /blog/[id] | 186 | ✅ | 0 | 0 |
| /blog | 245 | ✅ | 0 | 0 |
| /contact | 303 | ✅ | 0 | 0 |
| /demo/3d-configurator | 374 | ✅ | 1 | 0 |
| /demo/ar-export | 363 | ✅ | 1 | 0 |
| /demo/bulk-generation | 534 | ✅ | 0 | 1 |
| /demo | 300 | ✅ | 0 | 0 |
| /demo/playground | 312 | ✅ | 1 | 1 |
| /demo/virtual-try-on | 520 | ✅ | 1 | 1 |
| /entreprise | 370 | ✅ | 0 | 0 |
| /features | 83 | ✅ | 0 | 0 |
| /gallery | 228 | ✅ | 0 | 0 |
| /help/documentation/3d/export | 78 | ✅ | 0 | 0 |
| /help/documentation/3d/materials | 110 | ✅ | 0 | 0 |
| /help/documentation/3d/models | 81 | ✅ | 0 | 0 |
| /help/documentation/3d/setup | 138 | ✅ | 0 | 0 |
| /help/documentation/ai/generation | 76 | ✅ | 0 | 0 |
| /help/documentation/ai/models | 98 | ✅ | 0 | 0 |
| /help/documentation/ai/prompts | 73 | ✅ | 0 | 0 |
| /help/documentation/analytics/dashboards | 51 | ✅ | 0 | 0 |
| /help/documentation/analytics/events | 49 | ✅ | 0 | 0 |
| /help/documentation/analytics/overview | 97 | ✅ | 0 | 0 |
| /help/documentation/api/authentication | 178 | ✅ | 0 | 0 |
| /help/documentation/api/designs | 133 | ✅ | 0 | 0 |
| /help/documentation/api/orders | 89 | ✅ | 0 | 0 |
| /help/documentation/api/products | 195 | ✅ | 0 | 0 |
| /help/documentation/api/rate-limiting | 65 | ✅ | 0 | 0 |

*... et 89 autres pages*
