# Luneo Widget SDK

**Last Updated:** November 16, 2025

Embed SDK for integrating Luneo AI design widget into third-party websites. Supports secure iframe embedding with JWT token authentication and postMessage handshake.

## Installation

### Via CDN (Recommended)

```html
<!-- UMD build -->
<script src="https://cdn.luneo.app/widget/luneo-widget.js"></script>

<!-- Or ES Module -->
<script type="module">
  import LuneoWidget from 'https://cdn.luneo.app/widget/luneo-widget.mjs';
</script>
```

### Via npm

```bash
npm install @luneo/widget
```

```javascript
import LuneoWidget from '@luneo/widget';
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <div id="luneo-widget"></div>
  
  <script src="https://cdn.luneo.app/widget/luneo-widget.js"></script>
  <script>
    LuneoWidget.init({
      shop: 'your-shop.myshopify.com',
      tokenUrl: 'https://api.luneo.app/api/embed/token',
      container: '#luneo-widget',
      onReady: () => console.log('Widget ready!'),
      onError: (err) => console.error('Error:', err),
    });
  </script>
</body>
</html>
```

## API Reference

### `LuneoWidget.init(config)`

Initialize the widget with the provided configuration.

#### Parameters

- `shop` (string, required): Shop domain (e.g., "myshop.myshopify.com")
- `tokenUrl` (string, required): Backend token endpoint URL
- `container` (HTMLElement | string, required): Container element or selector
- `widgetUrl` (string, optional): Widget iframe URL (defaults to CDN)
- `onReady` (function, optional): Callback when widget is ready
- `onError` (function, optional): Callback for errors

#### Returns

Promise that resolves to a `LuneoWidget` instance.

### `widget.destroy()`

Destroy the widget instance and clean up resources.

## Security

- **Short-lived tokens**: JWT tokens expire after 5 minutes
- **One-time nonces**: Each token includes a unique nonce that can only be used once
- **Origin validation**: Nonces are validated against the requesting origin
- **Sandboxed iframe**: Widget runs in a sandboxed iframe with restricted permissions

## Backend Integration

The widget requires a backend endpoint at `/api/embed/token` that:

1. Validates the shop installation
2. Generates a short-lived JWT (5 minutes)
3. Creates a one-time nonce
4. Returns `{ token, nonce, expiresIn }`

See `apps/backend/src/modules/widget/` for the reference implementation.

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run type-check

# Lint
npm run lint
```

## Build Outputs

- `dist/index.cjs` - CommonJS build
- `dist/index.mjs` - ES Module build
- `dist/index.js` - UMD/IIFE build (for CDN)
- `dist/index.d.ts` - TypeScript definitions

## License

MIT
