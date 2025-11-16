# 📱 Luneo AR Viewer

**Last Updated:** November 16, 2025

React component library for 3D model visualization and AR (Augmented Reality) viewing in web browsers. Supports iOS Quick Look, Android Scene Viewer, and WebXR.

---

## 🚀 Quick Start

### Installation

```bash
# From monorepo root
pnpm install

# Build the package
cd apps/ar-viewer
pnpm build
```

### Usage

```tsx
import { ModelViewer } from '@luneo/ar-viewer';

function ProductPage() {
  return (
    <ModelViewer
      modelUrl="https://cdn.luneo.app/models/product.glb"
      posterUrl="https://cdn.luneo.app/previews/product.jpg"
      alt="Custom T-Shirt"
      arMode={true}
      autoRotate={true}
      cameraControls={true}
      onLoad={() => console.log('Model loaded')}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

---

## 📦 Package Information

- **Name:** `@luneo/ar-viewer`
- **Version:** 1.0.0
- **Type:** React Component Library
- **Build:** tsup (ESM + CJS + UMD)

---

## ✨ Features

- ✅ **3D Model Viewing** - Display GLB/GLTF models
- ✅ **AR Support** - iOS Quick Look, Android Scene Viewer, WebXR
- ✅ **Auto-rotation** - Automatic model rotation
- ✅ **Camera Controls** - Interactive camera manipulation
- ✅ **Loading States** - Built-in loading indicators
- ✅ **Error Handling** - Graceful error display
- ✅ **Responsive** - Mobile and desktop optimized
- ✅ **Accessible** - ARIA labels and keyboard navigation

---

## 🏗️ Architecture

### Components

```
apps/ar-viewer/
├── src/
│   ├── components/
│   │   └── ModelViewer.tsx      # Main AR viewer component
│   ├── lib/
│   │   └── arCapabilities.ts    # AR capability detection
│   ├── types/
│   │   └── model-viewer.d.ts    # TypeScript definitions
│   └── index.ts                 # Public API exports
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Dependencies

- **@google/model-viewer** - Web component for 3D/AR viewing
- **three** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **framer-motion** - Animation library
- **lucide-react** - Icon library

---

## 📖 API Reference

### `ModelViewer` Component

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelUrl` | `string` | **required** | URL to GLB/GLTF model file |
| `posterUrl` | `string` | `undefined` | Preview image URL (shown while loading) |
| `alt` | `string` | `"3D Model"` | Alt text for accessibility |
| `arMode` | `boolean` | `true` | Enable AR viewing capabilities |
| `autoRotate` | `boolean` | `true` | Automatically rotate model |
| `cameraControls` | `boolean` | `true` | Enable interactive camera controls |
| `onLoad` | `() => void` | `undefined` | Callback when model loads |
| `onError` | `(error: string) => void` | `undefined` | Callback on error |

#### Example

```tsx
<ModelViewer
  modelUrl="/models/product.glb"
  posterUrl="/previews/product.jpg"
  alt="Custom Product"
  arMode={true}
  autoRotate={true}
  cameraControls={true}
  onLoad={() => {
    console.log('Model loaded successfully');
  }}
  onError={(error) => {
    console.error('Failed to load model:', error);
  }}
/>
```

---

## 🌐 AR Platform Support

### iOS (Quick Look)

- **Format:** USDZ
- **Activation:** `rel="ar"` attribute
- **Requirements:** iOS 12+, Safari
- **Usage:** Tap AR button → Quick Look opens

### Android (Scene Viewer)

- **Format:** GLB (optimized)
- **Activation:** Intent URL
- **Requirements:** Android 7+, Chrome/Google App
- **Usage:** Tap AR button → Scene Viewer opens

### WebXR (Experimental)

- **Format:** GLB
- **Activation:** WebXR API
- **Requirements:** Compatible browser + device
- **Usage:** Tap AR button → WebXR session starts

---

## 🔧 Development

### Setup

```bash
# Install dependencies
pnpm install

# Start development (watch mode)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Build Outputs

- `dist/index.js` - ESM build
- `dist/index.cjs` - CommonJS build
- `dist/index.d.ts` - TypeScript definitions

---

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm test

# Test AR capabilities detection
# See: src/lib/arCapabilities.ts
```

---

## 📱 Browser Compatibility

### Desktop

- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+

### Mobile

- ✅ iOS Safari 12+
- ✅ Android Chrome 90+
- ✅ Samsung Internet 14+

### AR Support

- ✅ iOS Quick Look (iOS 12+)
- ✅ Android Scene Viewer (Android 7+)
- 🟡 WebXR (experimental, varies by device)

---

## 🎨 Styling

The component uses Tailwind CSS classes. Customize via:

```tsx
<ModelViewer
  modelUrl="/model.glb"
  className="w-full h-[600px] rounded-lg shadow-lg"
/>
```

### CSS Variables

The component exposes CSS variables for customization:

```css
.luneo-model-viewer {
  --poster-color: transparent;
  --progress-bar-color: #3B82F6;
  --progress-mask: #ffffff;
}
```

---

## 🔍 AR Capability Detection

The library automatically detects AR capabilities:

```tsx
import { detectARCapability } from '@luneo/ar-viewer';

const capability = await detectARCapability();

console.log(capability);
// {
//   webxr: true,
//   quickLook: false,
//   sceneViewer: true,
//   platform: 'android'
// }
```

---

## 🐛 Troubleshooting

### Issue: Model Not Loading

**Symptoms:** Model doesn't appear, error callback fired

**Solutions:**
1. Verify model URL is accessible (CORS enabled)
2. Check model format (GLB/GLTF supported)
3. Verify file size (< 50MB recommended)
4. Check browser console for errors

---

### Issue: AR Button Not Showing

**Symptoms:** AR button missing or disabled

**Solutions:**
1. Verify `arMode={true}` prop
2. Check AR capabilities: `detectARCapability()`
3. Verify model format (USDZ for iOS, GLB for Android)
4. Check device compatibility

---

### Issue: Performance Issues

**Symptoms:** Slow loading, laggy interaction

**Solutions:**
1. Optimize model (reduce polygons, compress textures)
2. Use poster image for faster initial display
3. Enable lazy loading
4. Reduce model file size

---

## 📚 Related Documentation

- [Architecture: AR Conversion Flow](../../ARCHITECTURE.md#ar-conversion-flow)
- [Runbook: Convert AR Model](../../docs/runbooks/CONVERT_AR.md)
- [AR Implementation Guide](../../docs/AR_IMPLEMENTATION.md)
- [Google Model Viewer Docs](https://modelviewer.dev/)

---

## 🤝 Contribution

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

Proprietary © 2025 Luneo SAS

---

**Maintained By:** Frontend Team  
**Last Review:** November 16, 2025
