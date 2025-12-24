# 🎨 Génération des Icônes PWA

## Instructions pour créer les icônes PWA

Le logo Luneo est maintenant disponible dans `/apps/frontend/public/logo-icon.svg` et `/apps/frontend/public/favicon.svg`.

### 1. Créer les icônes avec un outil en ligne

**Option 1: PWA Asset Generator (Recommandé)**
- URL: https://www.pwabuilder.com/imageGenerator
- Utiliser le fichier `/apps/frontend/public/logo-icon.svg` comme source
- Générer les icônes aux tailles suivantes:
  - 192x192 (icon-192x192.png)
  - 512x512 (icon-512x512.png)
  - 180x180 (apple-touch-icon.png)

**Option 2: RealFaviconGenerator**
- URL: https://realfavicongenerator.net/
- Upload `/apps/frontend/public/logo-icon.svg`
- Générer tous les formats nécessaires

**Option 3: Utiliser le favicon.svg directement**
- Le fichier `/apps/frontend/public/favicon.svg` peut être converti en PNG
- Utiliser un outil comme https://cloudconvert.com/svg-to-png

### 2. Placer les fichiers dans `apps/frontend/public/`

```
apps/frontend/public/
├── icon-192x192.png
├── icon-512x512.png
├── apple-touch-icon.png
└── favicon.svg (déjà présent)
```

### 3. Vérifier la configuration

Les fichiers suivants sont déjà configurés:
- ✅ `apps/frontend/public/manifest.json`
- ✅ `apps/frontend/src/app/manifest.ts`
- ✅ `apps/frontend/src/app/layout.tsx` (metadata.icons)

### 4. Tester l'installation PWA

1. Build le projet: `pnpm build`
2. Démarrer en production: `pnpm start`
3. Ouvrir dans Chrome/Edge
4. Vérifier l'icône dans l'onglet
5. Tester "Ajouter à l'écran d'accueil"

### Spécifications des icônes

- **Format**: PNG avec transparence
- **192x192**: Pour les écrans Android
- **512x512**: Pour les splash screens et installation
- **Apple Touch Icon**: 180x180 pour iOS
- **Couleur de fond**: Transparent ou noir (#000000) selon le contexte
- **Style**: Croissant de lune avec motif d'empreinte digitale (déjà dans logo-icon.svg)
- **Gradient**: Teal/cyan vers magenta/purple (déjà appliqué dans le SVG)

## Fichiers de logo disponibles

- `/apps/frontend/public/favicon.svg` - Favicon pour les navigateurs
- `/apps/frontend/public/logo-icon.svg` - Icône seule (sans texte)
- `/apps/frontend/public/logo.svg` - Logo complet avec texte "Luneo"
- `/apps/frontend/public/icon.svg` - Icône PWA principale (512x512)

## Note importante

Les fichiers PNG (icon-192x192.png, icon-512x512.png) doivent être générés à partir des SVG fournis. 
Ils ne sont pas inclus dans le dépôt car ils peuvent être régénérés à tout moment depuis les SVG sources.

