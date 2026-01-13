# 📦 Guides d'Installation - Dépendances Manquantes

Ce document répertorie toutes les dépendances manquantes et leurs guides d'installation.

---

## 🎯 Vue d'ensemble

### Dépendances Backend

1. **Google Ads API SDK** (`google-ads-api`)
   - **Blocage**: Nécessite Node.js >=22.0.0
   - **État actuel**: Node.js 20.11.1
   - **Action requise**: Mettre à jour Node.js

2. **SAML/OIDC Packages**
   - `@node-saml/passport-saml`
   - `passport-openidconnect`
   - **État**: Non installés
   - **Action requise**: Installation simple

### Dépendances Frontend/AR

3. **MediaPipe Packages** (pour AR Trackers avancés)
   - `@mediapipe/pose`
   - `@mediapipe/selfie_segmentation`
   - `@mediapipe/holistic`
   - **État**: Partiellement installés (face_mesh, hands déjà présents)
   - **Action requise**: Installation des packages manquants

### Dépendances ML (optionnelles)

4. **TensorFlow.js** (pour ML côté client)
   - `@tensorflow/tfjs`
   - `@tensorflow/tfjs-node` (backend)
   - **État**: Non installés
   - **Action requise**: Installation si ML côté client souhaité

---

## 📋 Guide 1: Google Ads API SDK

### Problème

Le SDK `google-ads-api` nécessite Node.js >=22.0.0, mais l'environnement utilise Node.js 20.11.1.

### Solution

#### Option A: Mettre à jour Node.js (Recommandé)

```bash
# Vérifier la version actuelle
node --version

# Installer Node.js 22+ avec nvm (recommandé)
nvm install 22
nvm use 22
nvm alias default 22

# Ou avec Homebrew (macOS)
brew install node@22

# Vérifier la nouvelle version
node --version  # Doit afficher v22.x.x
```

#### Option B: Utiliser une version alternative du SDK

Si vous ne pouvez pas mettre à jour Node.js immédiatement, vous pouvez utiliser l'API REST directement :

```bash
# Installer axios si pas déjà présent
cd apps/backend
pnpm add axios
```

Puis utiliser l'API REST Google Ads au lieu du SDK (voir `apps/frontend/src/lib/admin/integrations/google-ads.ts` pour l'implémentation mockée).

### Installation du SDK (après mise à jour Node.js)

```bash
cd apps/backend
pnpm add google-ads-api

# Ou pour le frontend si nécessaire
cd apps/frontend
pnpm add google-ads-api
```

### Activation dans le code

Une fois installé, décommenter les sections dans :
- `apps/frontend/src/lib/admin/integrations/google-ads.ts`

---

## 📋 Guide 2: SAML/OIDC Packages

### Installation

```bash
cd apps/backend
pnpm add @node-saml/passport-saml passport-openidconnect
```

### Configuration

Les stratégies sont déjà préparées dans :
- `apps/backend/src/modules/auth/strategies/saml.strategy.ts`
- `apps/backend/src/modules/auth/strategies/oidc.strategy.ts`

### Activation

1. **Décommenter les imports** dans les fichiers de stratégies :

```typescript
// Dans saml.strategy.ts
import { Strategy as SamlPassportStrategy } from '@node-saml/passport-saml';

// Dans oidc.strategy.ts
import { Strategy as OidcPassportStrategy } from 'passport-openidconnect';
```

2. **Remplacer les classes Mock** par les vraies stratégies Passport

3. **Activer dans `auth.module.ts`** si nécessaire (déjà configuré pour chargement conditionnel)

### Variables d'environnement requises

```env
# SAML
SAML_ENTRY_POINT=https://your-idp.com/sso
SAML_ISSUER=https://your-app.com
SAML_CERT_BASE64=...

# OIDC
OIDC_ISSUER=https://your-idp.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_CALLBACK_URL=https://your-app.com/api/v1/auth/oidc/callback
```

---

## 📋 Guide 3: MediaPipe Packages (AR Trackers)

### Installation

```bash
# Dans le package virtual-try-on
cd packages/virtual-try-on
pnpm add @mediapipe/pose @mediapipe/selfie_segmentation @mediapipe/holistic

# Ou depuis la racine du monorepo
pnpm add @mediapipe/pose @mediapipe/selfie_segmentation @mediapipe/holistic --filter @luneo/virtual-try-on
```

### Packages déjà installés

- ✅ `@mediapipe/face_mesh` (déjà utilisé)
- ✅ `@mediapipe/hands` (déjà utilisé)
- ✅ `@mediapipe/camera_utils` (déjà utilisé)

### Packages à installer

- ⚠️ `@mediapipe/pose` (pour tracking du corps entier)
- ⚠️ `@mediapipe/selfie_segmentation` (pour segmentation arrière-plan)
- ⚠️ `@mediapipe/holistic` (pour tracking combiné face + hands + pose)

### Activation dans le code

Une fois installés, décommenter et implémenter les sections dans :
- `packages/virtual-try-on/src/tracking/ARTrackers.ts`

### Exemple d'utilisation

```typescript
import { ARTrackers } from '@luneo/virtual-try-on/tracking/ARTrackers';

const trackers = new ARTrackers({
  face: { maxNumFaces: 1, refineLandmarks: true },
  hands: { maxNumHands: 2 },
  enablePose: true, // Nécessite @mediapipe/pose
  enableSelfieSegmentation: true, // Nécessite @mediapipe/selfie_segmentation
  enableHolistic: true, // Nécessite @mediapipe/holistic
}, logger);

await trackers.initialize(videoElement);
await trackers.start();
```

---

## 📋 Guide 4: TensorFlow.js (ML Optionnel)

### Installation

```bash
# Backend (Node.js)
cd apps/backend
pnpm add @tensorflow/tfjs-node

# Frontend (si ML côté client souhaité)
cd apps/frontend
pnpm add @tensorflow/tfjs
```

### Configuration

Pour utiliser TensorFlow.js dans le service ML :

1. **Configurer l'endpoint ML** dans `.env` :

```env
# Option 1: TensorFlow Serving (recommandé pour production)
ML_API_URL=http://localhost:8501/v1/models

# Option 2: AWS SageMaker
ML_API_URL=https://runtime.sagemaker.region.amazonaws.com/endpoints/your-endpoint

# Option 3: Google AI Platform
ML_API_URL=https://ml.googleapis.com/v1/projects/your-project/models
```

2. **Activer dans `ml-prediction.service.ts`** :

Décommenter et implémenter la méthode `callMLModel` avec l'infrastructure choisie.

### Exemple d'utilisation

```typescript
// Dans ml-prediction.service.ts
import * as tf from '@tensorflow/tfjs-node';

// Charger un modèle
const model = await tf.loadLayersModel('file://path/to/model.json');

// Faire une prédiction
const prediction = model.predict(tf.tensor2d([features]));
```

---

## 🔧 Script d'Installation Automatique

Créez un script pour installer toutes les dépendances :

```bash
#!/bin/bash
# scripts/install-missing-dependencies.sh

echo "📦 Installing missing dependencies..."

# Vérifier Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "⚠️  Node.js version < 22 detected. Google Ads SDK requires Node.js >= 22."
  echo "   Please update Node.js: nvm install 22 && nvm use 22"
fi

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/backend
pnpm add @node-saml/passport-saml passport-openidconnect

# AR Engine dependencies
echo "📦 Installing AR Engine dependencies..."
cd ../../packages/virtual-try-on
pnpm add @mediapipe/pose @mediapipe/selfie_segmentation @mediapipe/holistic

# ML dependencies (optionnel)
read -p "Install TensorFlow.js? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd ../../apps/backend
  pnpm add @tensorflow/tfjs-node
fi

echo "✅ Installation complete!"
```

---

## 📝 Checklist d'Installation

- [ ] **Node.js 22+** installé (pour Google Ads SDK)
- [ ] **SAML/OIDC packages** installés
- [ ] **MediaPipe packages** installés (pose, selfie_segmentation, holistic)
- [ ] **TensorFlow.js** installé (optionnel, pour ML)
- [ ] **Variables d'environnement** configurées (SAML/OIDC)
- [ ] **Code activé** (décommenter les sections dans les fichiers concernés)
- [ ] **Tests** effectués après installation

---

## 🐛 Dépannage

### Erreur: "Cannot find module '@mediapipe/pose'"

**Solution**: Installer le package :
```bash
cd packages/virtual-try-on
pnpm add @mediapipe/pose
```

### Erreur: "Node.js version mismatch"

**Solution**: Mettre à jour Node.js :
```bash
nvm install 22
nvm use 22
```

### Erreur: "SAML strategy not found"

**Solution**: Vérifier que le package est installé et que les imports sont décommentés :
```bash
cd apps/backend
pnpm add @node-saml/passport-saml
```

---

## 📚 Ressources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [Passport SAML Documentation](https://github.com/node-saml/passport-saml)
- [MediaPipe Documentation](https://mediapipe.dev/)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)

---

*Dernière mise à jour : Janvier 2025*
