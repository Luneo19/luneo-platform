# @luneo/virtual-try-on

**Virtual Try-On professionnel avec Face & Hand Tracking**

## 🎯 Objectif

Permettre aux utilisateurs d'essayer virtuellement des produits (lunettes, montres, bijoux) en temps réel avec leur caméra.

## 🔧 Technologies

- **MediaPipe Face Mesh** - Tracking visage 468 points
- **MediaPipe Hands** - Tracking mains 21 points
- **Three.js** - Rendu 3D overlay
- **TypeScript** - Type safety

## 📦 Installation

```bash
npm install @luneo/virtual-try-on
```

## 🚀 Usage

```typescript
import { VirtualTryOn } from '@luneo/virtual-try-on';

const tryOn = new VirtualTryOn({
  container: document.getElementById('try-on-container'),
  category: 'glasses', // 'glasses' | 'watch' | 'jewelry'
  model3dUrl: '/models/sunglasses.glb',
});

await tryOn.init();
await tryOn.start();
```

## 🏗️ Architecture

```
src/
├── core/
│   ├── VirtualTryOn.ts          # Classe principale
│   ├── CameraManager.ts         # Gestion caméra
│   └── types.ts                 # Types TypeScript
├── tracking/
│   ├── FaceTracker.ts           # MediaPipe Face Mesh
│   ├── HandTracker.ts           # MediaPipe Hands
│   └── LandmarksProcessor.ts    # Traitement landmarks
├── rendering/
│   ├── ThreeRenderer.ts         # Rendu Three.js
│   ├── ModelLoader.ts           # Chargement modèles 3D
│   └── Overlay.ts               # Overlay 3D sur tracking
├── categories/
│   ├── GlassesOverlay.ts        # Lunettes (nose bridge anchor)
│   ├── WatchOverlay.ts          # Montres (wrist anchor)
│   └── JewelryOverlay.ts        # Bijoux (ears, neck)
└── utils/
    ├── PerformanceMonitor.ts    # Monitoring FPS
    ├── ErrorHandler.ts          # Gestion erreurs
    └── Logger.ts                # Logs structurés
```

## ✅ Features Implémentées

### Phase 1 (Semaine 1-2): Face Tracking ✅
- [x] Camera access avec permissions UI
- [x] MediaPipe Face Mesh initialization
- [x] Face detection temps réel (30 FPS)
- [x] 468 facial landmarks tracking
- [x] 3D overlay basique sur visage
- [x] Glasses placement (nose bridge anchor)

### Phase 2 (Semaine 3): Hand Tracking ⏳
- [ ] MediaPipe Hands initialization
- [ ] Hand detection temps réel
- [ ] 21 hand landmarks tracking
- [ ] Wrist tracking précis
- [ ] Watch overlay fonctionnel

### Phase 3 (Semaine 4): Polish & Optimization ⏳
- [ ] Performance optimization (60 FPS mobile)
- [ ] Multiple product categories
- [ ] Screenshot/Share functionality
- [ ] Error handling robuste

## 📊 Performance Targets

| Métrique | Target | Actuel |
|----------|--------|--------|
| **FPS Desktop** | 60 FPS | - |
| **FPS Mobile** | 30 FPS | - |
| **Init Time** | < 2s | - |
| **Memory Usage** | < 150 MB | - |

## 🧪 Tests

```bash
npm test
```

## 📝 License

MIT - Luneo Platform

