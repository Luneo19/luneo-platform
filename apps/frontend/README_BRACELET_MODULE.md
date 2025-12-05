# 🎨 Module de Personnalisation de Bracelet - Documentation Complète

## 📋 Vue d'ensemble

Module complet et professionnel pour la personnalisation de bracelets avec gravure et visualisation en réalité augmentée (AR).

### Fonctionnalités principales

✅ **Personnalisation complète**
- Saisie de texte avec support des accents
- 6 polices différentes (Serif, Sans, Monospace, Cursive, Times New Roman, Georgia)
- Taille de police ajustable (10-80px)
- Alignement (Gauche, Centre, Droite)
- Position (Intérieur, Extérieur, Face Gauche, Face Droite)

✅ **Matériaux & Finitions**
- Acier inoxydable
- Or
- Cuir
- Couleur personnalisable

✅ **Visualisation**
- Aperçu 3D temps réel (Three.js + react-three-fiber)
- Aperçu 2D haute qualité (Canvas)
- AR Quick Look (iOS)
- WebXR (Android/Desktop)
- Scene Viewer (Android)

✅ **Export**
- PNG haute résolution (4K)
- Sauvegarde de personnalisation
- Partage

---

## 🏗️ Architecture

### Structure des fichiers

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── bracelet/
│   │   │       └── customize/
│   │   │           └── page.tsx          # Page principale
│   │   └── api/
│   │       └── bracelet/
│   │           ├── customizations/
│   │           │   └── route.ts          # API sauvegarde
│   │           ├── render/
│   │           │   └── route.ts          # API rendu PNG
│   │           └── models/
│   │               └── route.ts          # API liste modèles
│   ├── components/
│   │   └── bracelet/
│   │       ├── Bracelet3DViewer.tsx      # Visualiseur 3D
│   │       ├── Bracelet2DPreview.tsx     # Aperçu 2D
│   │       └── BraceletARViewer.tsx      # Visualiseur AR
│   └── lib/
│       └── bracelet/
│           └── texture-generator.ts      # Générateur texture
│
└── public/
    └── models/
        └── bracelets/
            ├── bracelet.glb              # Modèle 3D
            └── bracelet.usdz             # Modèle AR iOS
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- Next.js 14+
- React 18+

### Dépendances

Les dépendances suivantes sont déjà installées dans le projet :

```json
{
  "@react-three/fiber": "^9.4.0",
  "@react-three/drei": "^10.7.6",
  "three": "^0.159.0"
}
```

### Modèle 3D

1. Placez votre modèle `.glb` dans `public/models/bracelets/bracelet.glb`
2. Pour AR iOS, générez un fichier `.usdz` :
   ```bash
   # Utiliser Blender avec USD exporter
   # Ou utiliser usdzconvert (Apple tool)
   ```

---

## 📖 Utilisation

### Accès au module

```
/dashboard/bracelet/customize
```

### Workflow utilisateur

1. **Saisie du texte**
   - Entrer le texte de gravure (max 50 caractères)
   - Support complet des accents et caractères spéciaux

2. **Personnalisation**
   - Choisir la police parmi 6 options
   - Ajuster la taille (slider 10-80px)
   - Sélectionner l'alignement
   - Choisir la position de gravure

3. **Matériau & Couleur**
   - Sélectionner la finition (Acier, Or, Cuir)
   - Ajuster la couleur personnalisée

4. **Visualisation**
   - Onglet 3D : Aperçu interactif 3D
   - Onglet 2D : Aperçu 2D haute qualité
   - Onglet AR : Visualisation AR (mobile)

5. **Export & Sauvegarde**
   - Sauvegarder la personnalisation
   - Exporter en PNG 4K

---

## 🔧 API Endpoints

### POST `/api/bracelet/customizations`

Enregistre une personnalisation.

**Request:**
```json
{
  "text": "Votre texte",
  "font": "serif",
  "fontSize": 28,
  "alignment": "center",
  "position": "exterior",
  "color": "#c0c0c0",
  "material": "steel",
  "texture": "data:image/png;base64,...",
  "model": "bracelet.glb"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customization": { ... },
    "message": "Personnalisation enregistrée avec succès"
  }
}
```

### POST `/api/bracelet/render`

Génère une image PNG haute résolution.

**Request:**
```json
{
  "text": "Votre texte",
  "font": "serif",
  "fontSize": 28,
  "alignment": "center",
  "position": "exterior",
  "color": "#c0c0c0",
  "material": "steel",
  "width": 3840,
  "height": 2160,
  "format": "png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Rendu en cours",
    "canvasData": { ... }
  }
}
```

### GET `/api/bracelet/models`

Liste les modèles disponibles.

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "bracelet-classic",
        "name": "Bracelet Classique",
        "modelUrl": "/models/bracelets/bracelet.glb",
        "usdzUrl": "/models/bracelets/bracelet.usdz"
      }
    ],
    "count": 1
  }
}
```

---

## 🎨 Personnalisation du modèle 3D

### Remplacement du modèle

1. **Préparer le modèle**
   - Format: `.glb` (glTF Binary)
   - Compression Draco recommandée
   - UV mapping correct pour la zone de gravure

2. **Zones de gravure**
   - Le modèle doit avoir des UVs dédiés à la zone de gravure
   - Nommer le mesh/material pour faciliter l'application de texture

3. **Optimisation**
   - Réduire le nombre de polygones si possible
   - Utiliser des textures optimisées
   - Tester la performance sur mobile

### Configuration UV

Pour que la texture de gravure s'affiche correctement :

1. Dans Blender :
   - Sélectionner le mesh du bracelet
   - Ouvrir l'éditeur UV
   - Déployer les UVs de la zone de gravure
   - Exporter en `.glb`

2. Mapping recommandé :
   - Zone extérieure : UVs de 0.0 à 1.0 en X, 0.5 à 1.0 en Y
   - Zone intérieure : UVs de 0.0 à 1.0 en X, 0.0 à 0.5 en Y

---

## 📱 Support AR

### iOS (Quick Look)

1. Générer un fichier `.usdz` :
   ```bash
   # Utiliser Blender avec USD exporter
   # Ou utiliser usdzconvert (Apple tool)
   ```

2. Placer le fichier dans `public/models/bracelets/bracelet.usdz`

3. Le composant `BraceletARViewer` charge automatiquement le `.usdz` sur iOS

### Android (Scene Viewer)

- Utilise automatiquement le `.glb`
- Compatible avec Google Scene Viewer
- Fonctionne dans Chrome/Edge sur Android

### WebXR (Desktop/Mobile)

- Support WebXR pour expériences immersives
- Compatible avec Oculus Quest, HoloLens, etc.

---

## 🧪 Tests

### Tests unitaires

```bash
npm run test bracelet
```

### Tests E2E

```bash
npm run test:e2e bracelet
```

---

## 🚀 Déploiement

### Production

1. **Optimiser les assets**
   - Compresser les modèles `.glb` avec Draco
   - Optimiser les textures
   - Utiliser un CDN pour les assets

2. **Configuration**
   - Vérifier les variables d'environnement
   - Configurer le stockage (S3, etc.)
   - Configurer la base de données

3. **Performance**
   - Lazy loading des composants 3D
   - Préchargement des modèles
   - Cache des textures

---

## 📝 Notes techniques

### Génération de texture

La texture de gravure est générée côté client via Canvas 2D, puis appliquée comme texture sur le modèle 3D. Cela permet :

- Mise à jour en temps réel
- Pas de charge serveur pour le preview
- Export haute résolution possible

### Rendu haute résolution

Pour la production, utilisez :
- `node-canvas` côté serveur
- Ou un renderer 3D headless (Blender CLI)
- Ou un service de rendu cloud

### Sécurité

- Validation des inputs (longueur texte, caractères autorisés)
- Rate limiting sur les APIs
- Authentification requise pour sauvegarder

---

## 🐛 Dépannage

### Le modèle 3D ne charge pas

- Vérifier que le fichier `.glb` existe dans `public/models/bracelets/`
- Vérifier la console pour les erreurs de chargement
- Vérifier que le modèle est valide (glTF validator)

### La texture ne s'affiche pas

- Vérifier le mapping UV du modèle
- Vérifier que le mesh a un material
- Vérifier la console pour les erreurs de texture

### AR ne fonctionne pas

- Vérifier que `model-viewer` est chargé
- Vérifier la compatibilité du navigateur
- Vérifier que le `.usdz` existe (iOS)
- Tester sur un appareil mobile

---

## 📚 Ressources

- [react-three-fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [model-viewer Documentation](https://modelviewer.dev/)
- [glTF Specification](https://www.khronos.org/gltf/)
- [USDZ Documentation](https://developer.apple.com/augmented-reality/quick-look/)

---

## 👥 Support

Pour toute question ou problème, contactez l'équipe Luneo Platform.

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-01-XX  
**Auteur:** Luneo Platform Team

