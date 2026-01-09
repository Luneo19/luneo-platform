# Audit Architecture Zakeke - Luneo Platform

**Date**: 2024-12-19  
**Phase**: 0 - Audit Global  
**Objectif**: Analyser l'état actuel du projet avant l'implémentation de l'architecture Zakeke complète

---

## 📊 ÉTAT ACTUEL

### Widget Éditeur

- [ ] **Fabric.js présent** : ❌ Non
- [ ] **Konva.js présent** : ❌ Non
- [ ] **Canvas 2D implémenté** : ⚠️ Partiel (PreviewCanvas basique, pas d'éditeur complet)
- [ ] **Système de layers** : ❌ Non
- [ ] **Undo/Redo** : ❌ Non
- [ ] **Export design JSON** : ⚠️ Partiel (via API, pas depuis widget)
- [ ] **Bundle standalone** : ✅ Oui (Vite config présente)

**État actuel du widget** :
- Widget basique dans `apps/widget/` (version 2.0.0)
- Focus sur génération IA (prompt → design)
- Pas d'éditeur visuel avec canvas interactif
- Composants : `LuneoWidget`, `PreviewCanvas`, `PromptInput`
- Pas de système de layers, outils d'édition, ou gestion d'état complexe

### Plugins E-commerce

- [x] **Plugin Shopify** : ✅ Oui (dans `apps/shopify/` et `apps/backend/src/modules/ecommerce/`)
- [x] **Plugin WooCommerce** : ✅ Oui (connector dans backend)
- [ ] **Plugin PrestaShop** : ❌ Non
- [x] **Webhooks intégrations** : ✅ Oui (webhook handlers présents)

**État actuel des intégrations** :
- Module e-commerce complet dans `apps/backend/src/modules/ecommerce/`
- Connectors : Shopify, WooCommerce, Magento
- Services : ProductSyncService, OrderSyncService, WebhookHandlerService
- Shopify App dans `apps/shopify/` avec OAuth et webhooks
- **Manque** : Theme App Extension pour Shopify, Plugin WordPress pour WooCommerce

### Moteur de Rendu

- [x] **Sharp configuré** : ✅ Oui (dans Render2DService)
- [ ] **node-canvas** : ❌ Non (utilise Sharp uniquement)
- [ ] **Rendu 300 DPI** : ⚠️ Partiel (DPI optionnel, pas forcé à 300)
- [x] **Queue BullMQ render** : ✅ Oui (BullModule configuré)

**État actuel du rendu** :
- Module render dans `apps/backend/src/modules/render/`
- Services : Render2DService, Render3DService, ExportService
- Queues : render-2d, render-3d, render-preview, render-final
- **Manque** : Service spécialisé pour rendu print-ready 300 DPI avec node-canvas

### Schema Prisma

- [ ] **Model CustomizableArea** : ❌ Non
- [x] **Model Integration avec credentials** : ✅ Oui (EcommerceIntegration)
- [x] **Model Design avec designData JSON** : ✅ Oui (Design.designData)
- [ ] **Model DesignLayer** : ❌ Non
- [ ] **Model RenderJob** : ❌ Non (mais RenderResult existe)
- [ ] **Model WidgetSession** : ❌ Non

**État actuel du schéma** :
- Modèles existants : `EcommerceIntegration`, `ProductMapping`, `Design`, `Product`, `Zone`
- `Design.designData` : JSON générique (pas structuré pour layers)
- `Zone` : Pour zones de personnalisation 3D (pas pour widget 2D)
- **Manque** : Modèles spécifiques pour widget éditeur (layers, customizable areas 2D, sessions)

---

## 📁 FICHIERS VOLUMINEUX (>300 lignes)

### Frontend

1. `apps/frontend/src/app/(dashboard)/dashboard/configurator-3d/page.tsx` - **5942 lignes** - ⚠️ **REFACTORER**
2. `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/integrations/page.tsx` - **5194 lignes** - ⚠️ **REFACTORER**
3. `apps/frontend/src/app/(dashboard)/dashboard/ai-studio/templates/page.tsx` - **5144 lignes** - ⚠️ **REFACTORER**
4. `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/collaboration/page.tsx` - **5061 lignes** - ⚠️ **REFACTORER**
5. `apps/frontend/src/app/(dashboard)/dashboard/library/import/page.tsx` - **5044 lignes** - ⚠️ **REFACTORER**
6. `apps/frontend/src/app/(dashboard)/dashboard/analytics-advanced/page.tsx` - **5042 lignes** - ⚠️ **REFACTORER**
7. `apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx` - **5041 lignes** - ⚠️ **REFACTORER**
8. `apps/frontend/src/app/(dashboard)/dashboard/billing/page.tsx` - **5023 lignes** - ⚠️ **REFACTORER**
9. `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx` - **5016 lignes** - ⚠️ **REFACTORER**
10. `apps/frontend/src/app/(dashboard)/dashboard/ab-testing/page.tsx` - **5016 lignes** - ⚠️ **REFACTORER**

**Action requise** : Ces fichiers doivent être découpés en composants < 300 lignes selon la Bible de Développement.

### Backend

1. `apps/backend/src/modules/ecommerce/services/product-sync.service.ts` - **~368 lignes** - ✅ OK
2. `apps/backend/src/modules/ecommerce/services/order-sync.service.ts` - **~388 lignes** - ⚠️ **REFACTORER**
3. `apps/backend/src/modules/render/services/render-2d.service.ts` - **~653 lignes** - ⚠️ **REFACTORER**
4. `apps/backend/src/modules/ecommerce/connectors/shopify/shopify.connector.ts` - **~718 lignes** - ⚠️ **REFACTORER**
5. `apps/backend/src/modules/ecommerce/connectors/woocommerce/woocommerce.connector.ts` - **~632 lignes** - ⚠️ **REFACTORER**

---

## 🗑️ CODE À SUPPRIMER/RÉORGANISER

### Doublons potentiels

1. **Widget** : 
   - `apps/widget/src/components/PreviewCanvas.tsx` - Peut être remplacé par le nouveau Canvas avec Fabric.js
   - `apps/widget/src/components/ARViewer.tsx` - À vérifier si utilisé

2. **E-commerce** :
   - `apps/modules-backup/ecommerce/` - Dossier de backup, à supprimer après validation
   - `apps/backend/api/src/modules/ecommerce/` - Ancien code compilé, à nettoyer

3. **Render** :
   - `apps/modules-backup/render/` - Dossier de backup, à supprimer après validation

### Fichiers inutiles

1. Scripts de fix JSX multiples dans root :
   - `fix-all-jsx-final.js`
   - `fix-jsx-final.js`
   - `fix-jsx-tags.js`
   - `fix-jsx-ultimate.js`
   - `fix-last-3-errors.js`
   - `fix-misplaced-tags.js`
   - **Action** : Supprimer après vérification qu'ils ne sont plus nécessaires

---

## 🔍 RECHERCHES SPÉCIFIQUES

### Canvas/Éditeur

- **Résultats** : 125 fichiers mentionnent "canvas", "fabric", ou "konva"
- **Fichiers clés** :
  - `apps/frontend/src/lib/canvas-editor/CanvasEditor.ts`
  - `apps/frontend/src/lib/canvas-editor/components/Canvas.tsx`
  - `apps/frontend/src/lib/canvas-editor/tools/TextTool.ts`
  - `apps/frontend/src/lib/canvas-editor/tools/ImageTool.ts`
  - `apps/frontend/src/lib/canvas-editor/tools/ShapeTool.ts`
  
**Conclusion** : Il existe déjà un système d'éditeur canvas dans le frontend, mais pas dans le widget standalone. À analyser pour réutiliser ou créer nouveau.

### Widget

- **Résultats** : 28 fichiers mentionnent "widget"
- **Fichiers clés** :
  - `apps/widget/src/components/LuneoWidget.tsx` (161 lignes)
  - `apps/widget/src/index.ts`
  - `apps/widget/vite.config.ts`
  
**Conclusion** : Widget basique existant, à transformer en éditeur complet type Zakeke.

### Intégrations E-commerce

- **Résultats** : 148 fichiers mentionnent "shopify", "woocommerce", ou "prestashop"
- **Fichiers clés** :
  - `apps/backend/src/modules/ecommerce/` (module complet)
  - `apps/shopify/` (Shopify App)
  - `apps/backend/src/modules/ecommerce/connectors/` (connectors)
  
**Conclusion** : Infrastructure e-commerce solide, manque les plugins frontend (Theme Extension, WordPress Plugin).

---

## 📊 DÉCISION GLOBALE

### ✅ REFACTORING PARTIEL - Code récupérable

**Justification** :

1. **Widget** : 
   - Widget basique existe mais doit être complètement réécrit pour éditeur Zakeke
   - Structure Vite correcte, à réutiliser
   - **Action** : Créer nouveau widget éditeur dans `packages/widget/` (nouveau package)

2. **E-commerce** :
   - Infrastructure backend solide et réutilisable
   - Connectors fonctionnels
   - **Action** : Créer plugins frontend (Shopify Theme Extension, WooCommerce Plugin)

3. **Rendu** :
   - Services de rendu existants mais pas optimisés pour print-ready
   - **Action** : Créer nouveau service RenderPrintReady avec node-canvas

4. **Schéma Prisma** :
   - Modèles existants réutilisables
   - **Action** : Ajouter modèles manquants (CustomizableArea, DesignLayer, RenderJob, WidgetSession)

### ⚠️ RÉÉCRITURE COMPLÈTE - Widget Éditeur

**Justification** :
- Le widget actuel est orienté génération IA, pas édition visuelle
- Pas de système de layers, undo/redo, outils d'édition
- **Action** : Créer nouveau widget éditeur de A à Z selon spécifications Zakeke

---

## 📋 CHECKLIST PHASE 0

- [x] Scan complet du projet
- [x] Analyse des fichiers volumineux
- [x] Recherche de code existant
- [x] Analyse du schéma Prisma
- [x] Rapport d'audit généré
- [ ] Validation par l'équipe
- [ ] Décision sur approche (refactoring vs réécriture)

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1 - Widget Éditeur (Priorité 1)

1. Créer nouveau package `packages/widget/` avec structure complète
2. Implémenter Canvas avec Fabric.js
3. Système de layers
4. Undo/Redo (20 états)
5. Outils (Text, Image, Shape)
6. Export PNG/PDF/JSON

### Phase 2 - Plugins E-commerce (Priorité 2)

1. Shopify Theme App Extension
2. WooCommerce Plugin WordPress
3. Intégration avec widget

### Phase 3 - Moteur de Rendu Print-Ready (Priorité 3)

1. Service RenderPrintReady avec node-canvas
2. Queue BullMQ pour rendu asynchrone
3. Upload S3 avec preview basse résolution

### Phase 4 - Schema Prisma (Priorité 4)

1. Ajouter CustomizableArea
2. Ajouter DesignLayer
3. Ajouter RenderJob
4. Ajouter WidgetSession
5. Migration Prisma

---

## 📝 NOTES

- **TypeScript** : Erreurs à vérifier avec `npx tsc --noEmit` (commande échouée lors de l'audit)
- **Build** : Vérifier que `pnpm build` passe dans tous les packages
- **Performance** : Widget doit être < 200KB gzipped
- **Compatibilité** : Widget doit fonctionner standalone (pas de dépendance React externe)

---

**Rapport généré le** : 2024-12-19  
**Prochaine étape** : Validation du rapport et démarrage Phase 1






