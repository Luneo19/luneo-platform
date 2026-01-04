# Phase 4 Completed - Schema Prisma

## Date: 2024-12-19
## Statut: ✅ COMPLÉTÉ

---

## 📦 Modèles Ajoutés

### 1. CustomizableArea

**Fichier**: `apps/backend/prisma/schema.prisma`

**Description**: Définit les zones personnalisables sur un produit (comme Zakeke)

**Champs**:
- Position & dimensions (x, y, width, height)
- Contraintes (min/max width/height, aspect ratio)
- Types de layers autorisés (text, image, shape, clipart)
- Contraintes texte (maxLength, fonts, fontSizes)
- Contraintes image (formats, dimensions, file size)
- Contraintes formes (shapes autorisées)
- Contraintes couleurs (couleurs autorisées, couleur par défaut)
- Paramètres d'affichage (required, active, displayOrder)

**Relations**:
- `product Product` - Lien vers le produit

**Index**:
- `productId`
- `isActive`
- `displayOrder`
- `productId, isActive` (composite)

---

### 2. DesignLayer

**Fichier**: `apps/backend/prisma/schema.prisma`

**Description**: Stocke les layers d'un design créé avec le widget éditeur

**Champs**:
- `type` - Type de layer (text, image, shape, clipart)
- Position & Transform (x, y, rotation, scaleX, scaleY, opacity)
- Visibility & Lock (visible, locked)
- `data` - JSON contenant les données spécifiques au type (TextLayerData, ImageLayerData, etc.)
- `zIndex` - Ordre dans la pile de layers
- `metadata` - Métadonnées supplémentaires

**Relations**:
- `design Design` - Lien vers le design

**Index**:
- `designId`
- `type`
- `visible`
- `zIndex`
- `designId, zIndex` (composite)

---

## 📦 Modèles Modifiés

### 1. Design

**Ajouts**:
- `canvasWidth` - Largeur du canvas en pixels
- `canvasHeight` - Hauteur du canvas en pixels
- `canvasBackgroundColor` - Couleur de fond (défaut: #ffffff)
- `designData` - JSON contenant les données complètes du design (DesignData type)
- Relation `layers DesignLayer[]` - Layers du design

---

### 2. Product

**Ajouts**:
- Relation `customizableAreas CustomizableArea[]` - Zones personnalisables

---

## ✅ Checklist Phase 4

- [x] Modèle CustomizableArea créé
- [x] Modèle DesignLayer créé
- [x] Modèle Design amélioré (canvas, designData, layers)
- [x] Modèle Product amélioré (customizableAreas)
- [x] Index optimisés
- [x] Relations Prisma configurées

---

## 🎯 Migration

Pour appliquer les changements :

```bash
cd apps/backend
pnpm prisma migrate dev --name add_widget_editor_models
pnpm prisma generate
```

---

## 📝 Notes

### Structure des données

**CustomizableArea** permet de :
- Définir plusieurs zones personnalisables par produit
- Contrôler précisément ce qui peut être personnalisé
- Appliquer des contraintes strictes (dimensions, formats, etc.)

**DesignLayer** permet de :
- Stocker chaque élément du design (texte, image, forme)
- Conserver les transformations (position, rotation, scale)
- Gérer l'ordre des layers (zIndex)
- Stocker les données spécifiques au type dans JSON

**Design** amélioré permet de :
- Stocker les dimensions du canvas
- Conserver les données complètes du design
- Accéder facilement aux layers via relation

---

**Phase 4 : ✅ COMPLÉTÉE AVEC SUCCÈS**

Le schema Prisma est maintenant prêt pour supporter le widget éditeur Zakeke-like !


