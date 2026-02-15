# Virtual Try-On - Architecture Technique

> Module de Virtual Try-On 3D temps réel pour la plateforme Luneo.
> Permet aux marques de luxe d'intégrer un essayage virtuel de montres, bagues, boucles d'oreilles, colliers et lunettes.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Backend](#architecture-backend)
3. [Architecture Frontend](#architecture-frontend)
4. [API Endpoints](#api-endpoints)
5. [Widget Public Intégrable](#widget-public-intégrable)
6. [Pipeline 3D / Tracking](#pipeline-3d--tracking)
7. [Performance & Optimisation](#performance--optimisation)
8. [Schéma de données](#schéma-de-données)
9. [Tests](#tests)
10. [Déploiement](#déploiement)

---

## Vue d'ensemble

Le module Virtual Try-On offre un essayage virtuel en temps réel basé sur :

- **MediaPipe** (Hands + Face Mesh) pour le tracking corporel
- **Three.js** (via des classes vanilla) pour le rendu 3D
- **glTF/GLB** comme format de modèle 3D standard, **USDZ** pour iOS AR Quick Look
- **Fallback natif AR** (iOS AR Quick Look, Android Scene Viewer) pour les appareils bas de gamme

### Modes d'utilisation

| Mode | Contexte | Auth |
|------|----------|------|
| Dashboard Admin | `/virtual-try-on` | JWT (JwtAuthGuard) |
| Widget Public | `/widget/try-on/:brandSlug/:productId` | Public (slug + productId) |

---

## Architecture Backend

### Services

| Service | Fichier | Responsabilité |
|---------|---------|----------------|
| `TryOnService` | `try-on.service.ts` | Gestion des configurations, sessions, screenshots |
| `ModelManagementService` | `model-management.service.ts` | Upload/validation/suppression de modèles 3D |
| `CalibrationService` | `calibration.service.ts` | Sauvegarde/recommandation de calibration par appareil |
| `PerformanceService` | `performance.service.ts` | Métriques de performance, compatibilité device |
| `TryOnScreenshotService` | `try-on-screenshot.service.ts` | Upload screenshots (unitaire + batch) |

### Controllers

| Controller | Préfixe de route | Auth |
|------------|-----------------|------|
| `TryOnController` | `/api/v1/try-on` | JWT |
| `WidgetTryOnController` | `/api/v1/public/try-on` | Public |

### DTOs

- `UploadModelDto` : Validation des uploads de modèles 3D (format, position, rotation, occlusion, shadows)
- `BatchScreenshotsDto` : Validation des uploads batch de captures d'écran
- `PerformanceMetricDto` / `BatchPerformanceMetricsDto` : Métriques FPS, latence
- `CalibrationDataDto` : Données de calibration (pixelToRealRatio, accuracyScore, etc.)

---

## Architecture Frontend

### Bibliothèques de tracking

| Classe | Fichier | Rôle |
|--------|---------|------|
| `HandTracker` | `HandTracker.ts` | Wrapper MediaPipe Hands avec accès synchrone |
| `FaceTracker` | `FaceTracker.ts` | Wrapper MediaPipe Face Mesh avec positions oreilles/menton |

### Moteur de rendu

| Classe | Fichier | Rôle |
|--------|---------|------|
| `TryOnEngine` | `TryOnEngine.ts` | Orchestrateur tracking + Three.js render loop |
| `BaseProductRenderer` | `renderers/BaseProductRenderer.ts` | Classe abstraite : chargement glTF, LOD, transforms |
| `WatchRenderer` | `renderers/WatchRenderer.ts` | Placement montre au poignet (HandTracker) |
| `RingRenderer` | `renderers/RingRenderer.ts` | Placement bague sur l'annulaire (HandTracker) |
| `EarringRenderer` | `renderers/EarringRenderer.ts` | Placement boucles d'oreilles (FaceTracker) |
| `NecklaceRenderer` | `renderers/NecklaceRenderer.ts` | Placement collier sous le menton (FaceTracker) |
| `EyewearRenderer` | `renderers/EyewearRenderer.ts` | Placement lunettes sur le nez (FaceTracker) |

### Utilitaires

| Classe | Fichier | Rôle |
|--------|---------|------|
| `FPSOptimizer` | `FPSOptimizer.ts` | Ajustement dynamique qualité (high -> 2d_fallback) |
| `CalibrationSystem` | `CalibrationSystem.ts` | Wizard de calibration pixel -> réalité |
| `DeviceCompatibility` | `DeviceCompatibility.ts` | Détection WebGL, caméra, GPU, recommandation mode |
| `ARQuickLookFallback` | `ARQuickLookFallback.ts` | AR natif iOS (USDZ) et Android (Scene Viewer) |

### Composants React

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `TryOnView` | `TryOnView.tsx` | Vue unifiée : compatibilité, calibration, rendu, HUD, captures |
| `TryOnScreenshotGallery` | `TryOnScreenshotGallery.tsx` | Galerie de captures avec preview, suppression, partage |
| `WatchTryOn` | `WatchTryOn.tsx` | Composant spécifique montre (utilise TryOnEngine) |
| `JewelryTryOn` | `JewelryTryOn.tsx` | Composant bijoux dynamique (ring/earring/necklace) |
| `EyewearTryOn` | `EyewearTryOn.tsx` | Composant lunettes |
| `TryOnWidget` | `widget/TryOnWidget.tsx` | Widget intégrable pour storefronts |

### Hooks React

| Hook | Fichier | Rôle |
|------|---------|------|
| `useTryOn` | `hooks/useTryOn.ts` | Lifecycle session, screenshots batch, perf metrics |
| `useTryOnConfig` | `hooks/useTryOnConfig.ts` | CRUD admin : configurations, mappings, modèles 3D |

---

## API Endpoints

### Endpoints authentifiés (`/api/v1/try-on`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/configurations` | Liste des configurations |
| `POST` | `/configurations` | Créer une configuration |
| `PUT` | `/configurations/:id` | Mettre à jour une configuration |
| `DELETE` | `/configurations/:id` | Supprimer une configuration |
| `POST` | `/configurations/:id/model` | Upload modèle 3D |
| `DELETE` | `/configurations/:id/model` | Supprimer modèle 3D |
| `GET` | `/configurations/:id/model/preview` | Info modèle 3D |
| `POST` | `/sessions` | Démarrer une session |
| `POST` | `/sessions/:sessionId/end` | Terminer une session |
| `POST` | `/sessions/:sessionId/screenshots/batch` | Upload batch screenshots |
| `POST` | `/sessions/:sessionId/performance` | Soumettre métriques perf |
| `POST` | `/sessions/:sessionId/calibration` | Soumettre calibration |
| `GET` | `/performance/device-stats` | Stats performance par device |
| `GET` | `/device-compatibility` | Vérifier compatibilité |

### Endpoints publics (`/api/v1/public/try-on`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/:brandSlug/config/:productId` | Config pour un produit |
| `POST` | `/sessions` | Démarrer session publique |
| `POST` | `/sessions/:sessionId/end` | Terminer session publique |
| `POST` | `/sessions/:sessionId/screenshots/batch` | Batch screenshots |
| `POST` | `/sessions/:sessionId/calibration` | Calibration |
| `GET` | `/calibration/recommend` | Recommandation calibration |
| `POST` | `/sessions/:sessionId/performance` | Métriques perf |
| `GET` | `/device-compatibility` | Compatibilité device |

---

## Widget Public Intégrable

### Intégration côté storefront

```html
<!-- Bouton Try-On sur la page produit -->
<a
  href="https://app.luneo.com/widget/try-on/{brandSlug}/{productId}"
  target="_blank"
  rel="noopener"
>
  Essayer en Virtual Try-On
</a>

<!-- Ou en iframe -->
<iframe
  src="https://app.luneo.com/widget/try-on/{brandSlug}/{productId}"
  width="100%"
  height="700px"
  allow="camera"
  style="border: none;"
/>
```

### Architecture du widget

1. **Page Next.js** : `/app/widget/try-on/[brandSlug]/[productId]/page.tsx`
2. **Composant** : `TryOnWidget.tsx` charge la config via l'API publique
3. **Pas d'auth requise** : Le brand slug + product ID servent d'identifiant
4. **Session anonyme** : Un visitor ID est généré localement

---

## Pipeline 3D / Tracking

```
Camera WebRTC -> MediaPipe (Hands/Face) -> Landmarks normalisés
                                              |
                                    TryOnEngine (orchestrateur)
                                              |
                              ProductRenderer.updateFromTracking()
                                              |
                              Three.js Scene -> Canvas overlay -> Affichage
```

### Flux de données tracking

1. **Camera** : `getUserMedia()` avec contraintes adaptées au device
2. **MediaPipe** : Analyse frame par frame, extrait landmarks normalisés [0-1]
3. **TryOnEngine** : Orchestre la boucle `requestAnimationFrame`, passe les landmarks au renderer actif
4. **Renderer** : Convertit les landmarks normalisés en coordonnées 3D, applique position/rotation/scale au modèle glTF
5. **FPSOptimizer** : Monitore le FPS et ajuste dynamiquement la qualité de tracking et de rendu

### Niveaux de qualité

| Niveau | FPS cible | Détails |
|--------|-----------|---------|
| `high` | >= 30 | Full resolution, modèles HD, ombres activées |
| `medium` | 24-30 | Résolution standard, ombres simplifiées |
| `low` | 15-24 | Résolution réduite, modèles LOD medium |
| `2d_fallback` | < 15 | Overlay 2D simple, pas de Three.js |

---

## Performance & Optimisation

### Côté client

- **FPSOptimizer** : Ajuste automatiquement la qualité en fonction du FPS mesuré
- **LOD (Level of Detail)** : `BaseProductRenderer` supporte 3 niveaux de modèle
- **Calibration** : Améliore la précision du placement en mesurant le ratio pixel/réalité
- **AR Fallback** : iOS AR Quick Look / Android Scene Viewer pour les devices incapables de WebGL

### Côté serveur

- **Batch uploads** : Les screenshots sont stockés localement puis uploadés en batch à la fin de la session
- **Performance metrics** : Collectées côté client, envoyées en batch, agrégées pour les statistiques device
- **Cloudinary** : Stockage et transformation des images (thumbnails automatiques)

---

## Schéma de données

### Modèles Prisma principaux

```
TryOnConfiguration
+-- id, name, type (WATCH/JEWELRY/EYEWEAR)
+-- targetZone, renderSettings, calibrationRules
+-- products -> TryOnProductMapping[]
+-- sessions -> TryOnSession[]

TryOnProductMapping
+-- configurationId, productId
+-- model3dUrl, modelUSDZUrl, thumbnailUrl
+-- defaultPosition, defaultRotation
+-- lodLevels, enableOcclusion, enableShadows
+-- scaleFactor, anchorPoints, adjustments

TryOnSession
+-- sessionId (UUID externe), visitorId, deviceInfo
+-- calibrationData (JSON), performanceMetrics (JSON)
+-- renderQuality, conversionAction
+-- startedAt, endedAt, duration
+-- screenshots -> TryOnScreenshot[]

TryOnPerformanceMetric
+-- sessionId, fps, detectionLatencyMs, renderLatencyMs
+-- gpuInfo, deviceType, browserInfo
+-- createdAt
```

---

## Tests

### Backend (Jest)

| Fichier | Service testé | Scénarios |
|---------|---------------|-----------|
| `model-management.service.spec.ts` | ModelManagementService | Upload GLB/USDZ, validation taille/extension, suppression, info modèle |
| `performance.service.spec.ts` | PerformanceService | Enregistrement métrique, agrégation batch, compatibilité device |
| `calibration.service.spec.ts` | CalibrationService | Sauvegarde calibration, recommandation par device, agrégation historique |

### Frontend (Jest + Testing Library)

| Fichier | Module testé | Scénarios |
|---------|-------------|-----------|
| `FPSOptimizer.test.ts` | FPSOptimizer | Downgrade/upgrade qualité, force, reset, average FPS |
| `DeviceCompatibility.test.ts` | DeviceCompatibility | Détection iOS/Android/desktop, type device, browser info, WASM |
| `CalibrationSystem.test.ts` | CalibrationSystem | Samples, completion, accuracy, localStorage, needsCalibration |
| `ARQuickLookFallback.test.ts` | ARQuickLookFallback | iOS/Android availability, link creation, launch fallback |
| `useTryOn.test.ts` | useTryOn hook | Session lifecycle, screenshots, product switching, compatibility |

### Lancer les tests

```bash
# Backend
cd apps/backend && pnpm run test -- --testPathPattern=try-on

# Frontend
cd apps/frontend && pnpm run test -- --testPathPattern=virtual-tryon
cd apps/frontend && pnpm run test -- --testPathPattern=useTryOn
```

---

## Déploiement

### Backend (Railway)

- Le module `TryOnModule` est chargé automatiquement dans l'application NestJS
- Variables d'environnement requises : `CLOUDINARY_URL` pour le stockage des modèles 3D et screenshots
- Aucune infrastructure supplémentaire nécessaire

### Frontend (Vercel)

- Les pages dashboard (`/virtual-try-on`) sont protégées par l'auth
- Le widget (`/widget/try-on/[brandSlug]/[productId]`) est public
- Headers CSP : autoriser `blob:` et `data:` pour Three.js et les captures d'écran
- Permissions caméra : le header `Permissions-Policy: camera=*` doit être configuré pour les iframes

### CDN & Assets 3D

- Les modèles 3D sont stockés sur Cloudinary
- Recommandation : configurer un CDN (CloudFront/CloudFlare) devant Cloudinary pour les modèles fréquemment accédés
- Taille max modèle : 50 MB (configurable dans `ModelManagementService`)

---

*Dernière mise à jour : Février 2026*
