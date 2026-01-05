# @luneo/widget-editor

Widget éditeur de design embarquable type Zakeke pour Luneo Platform.

## Installation

```bash
pnpm add @luneo/widget-editor
```

## Usage

### Script Tag

```html
<div id="luneo-widget"></div>
<script src="https://cdn.luneo.app/widget/v1/bundle.js"></script>
<script>
  window.LuneoWidget.init({
    container: '#luneo-widget',
    apiKey: 'your-api-key',
    productId: 'product-id',
    locale: 'fr',
    theme: 'light',
    onSave: (designData) => {
      console.log('Design saved:', designData);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
    onReady: () => {
      console.log('Widget ready');
    }
  });
</script>
```

### NPM/ES Modules

```typescript
import { LuneoWidget } from '@luneo/widget-editor';

LuneoWidget.init({
  container: '#luneo-widget',
  apiKey: 'your-api-key',
  productId: 'product-id',
});
```

## API

### `LuneoWidget.init(config)`

Initialise le widget avec la configuration fournie.

### `LuneoWidget.open(config)`

Ouvre le widget avec une nouvelle configuration.

### `LuneoWidget.close()`

Ferme le widget.

### `LuneoWidget.getDesign()`

Récupère les données du design actuel.

### `LuneoWidget.destroy()`

Détruit complètement le widget.

## Développement

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Structure

```
packages/widget/
├── src/
│   ├── components/     # Composants React
│   ├── store/          # Store Zustand
│   ├── types/          # Types TypeScript
│   ├── services/       # Services (API, storage, etc.)
│   ├── utils/          # Utilitaires
│   ├── constants/      # Constantes
│   ├── App.tsx         # Composant principal
│   ├── init.ts         # Fonction d'initialisation
│   └── index.ts        # Point d'entrée
├── package.json
├── tsconfig.json
└── vite.config.ts
```



