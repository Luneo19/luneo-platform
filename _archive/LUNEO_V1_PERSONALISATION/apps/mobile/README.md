# 📱 Luneo Enterprise Mobile

Application mobile React Native pour la plateforme Luneo Enterprise.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (pour Android)
- Xcode (pour iOS - macOS uniquement)

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
```

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   ├── forms/          # Formulaires
│   ├── charts/         # Graphiques
│   └── media/          # Images, vidéos
├── screens/            # Écrans de l'app
│   ├── auth/           # Authentification
│   ├── dashboard/      # Tableau de bord
│   ├── ai-studio/      # Studio IA
│   ├── products/       # Gestion produits
│   ├── orders/         # Commandes
│   └── profile/        # Profil utilisateur
├── navigation/         # Configuration navigation
├── services/           # Services API
├── store/              # State management
├── hooks/              # Hooks personnalisés
├── utils/              # Utilitaires
└── types/              # Types TypeScript
```

## 🛠️ Technologies Utilisées

- **React Native** 0.74+ avec Expo SDK 51
- **TypeScript** pour le typage
- **Zustand** pour la gestion d'état
- **React Query** pour la synchronisation des données
- **React Navigation** pour la navigation
- **NativeBase** pour les composants UI
- **Expo** pour les APIs natives

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` :

```env
# API
API_BASE_URL=https://api.luneo.app/api/v1
WS_URL=wss://api.luneo.app/ws

# Features
ENABLE_BIOMETRICS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
```

### Configuration Expo

Le fichier `app.json` contient la configuration Expo :

```json
{
  "expo": {
    "name": "Luneo Enterprise",
    "slug": "luneo-enterprise",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.luneo.enterprise"
    },
    "android": {
      "package": "com.luneo.enterprise"
    }
  }
}
```

## 📱 Fonctionnalités

### ✅ Implémentées
- [x] Structure de base du projet
- [x] Configuration TypeScript
- [x] Services API avec authentification
- [x] Store Zustand pour l'état
- [x] Écran de connexion basique
- [x] Support biométrique
- [x] Gestion des tokens JWT

### 🚧 En Développement
- [ ] Navigation complète
- [ ] Dashboard avec métriques
- [ ] AI Studio mobile
- [ ] Gestion des produits
- [ ] Système de commandes
- [ ] Mode hors ligne
- [ ] Push notifications

### 📋 À Faire
- [ ] Tests unitaires et E2E
- [ ] Optimisation des performances
- [ ] Déploiement sur les stores
- [ ] Analytics et monitoring

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests E2E
npm run test:e2e
```

## 📦 Build et Déploiement

### Build Local

```bash
# Build Android
npm run build:android

# Build iOS
npm run build:ios
```

### Déploiement EAS

```bash
# Installer EAS CLI
npm install -g eas-cli

# Configurer le projet
eas build:configure

# Build pour les stores
eas build --platform all

# Soumettre aux stores
eas submit --platform all
```

## 🔐 Sécurité

- **Authentification JWT** avec refresh tokens
- **Biométrie** pour déverrouillage rapide
- **Chiffrement local** avec Keychain/Keystore
- **Certificat pinning** pour les API calls
- **Obfuscation** du code en production

## 📊 Performance

- **Bundle size** optimisé avec code splitting
- **Images** compressées et lazy loading
- **Cache intelligent** avec WatermelonDB
- **Animations** 60fps avec Reanimated
- **Memory management** optimisé

## 🐛 Debugging

### Flipper
```bash
# Installer Flipper
# https://fbflipper.com/

# Activer le debugging
npm start
```

### Logs
```bash
# Logs Android
adb logcat

# Logs iOS
xcrun simctl spawn booted log stream --predicate 'process == "LuneoEnterprise"'
```

## 📚 Documentation

- [Architecture Mobile](docs/MOBILE_APP_ARCHITECTURE.md)
- [Guide de Développement](docs/DEVELOPMENT_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation** : [docs.luneo.app](https://docs.luneo.app)
- **Issues** : [GitHub Issues](https://github.com/luneo/enterprise/issues)
- **Email** : support@luneo.app

---

**Luneo Enterprise Mobile - L'IA qui révolutionne votre création mobile ! 📱🚀**


