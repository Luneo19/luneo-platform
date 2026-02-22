# @luneo/ar-engine

Moteur AR pour Virtual Try-On avec WebXR et MediaPipe.

## Installation

```bash
npm install @luneo/ar-engine
```

## Usage

```typescript
import { ARScene } from "@luneo/ar-engine";

const arScene = new ARScene({
  modelUrl: "/models/glasses.glb",
  productType: "glasses",
  enableFaceTracking: true
});

await arScene.initialize();
await arScene.startARSession();

// Get DOM element to mount
const canvas = arScene.getDOMElement();
document.body.appendChild(canvas);
```

## TODO

- [ ] Implémenter HandDetector complet
- [ ] Implémenter tous les placements
- [ ] Tests unitaires
- [ ] Documentation complète

