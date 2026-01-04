# 🧪 Guide Complet de Test - Phase 2 & 3

## 📋 Prérequis

1. **Base de données PostgreSQL** accessible
2. **Node.js** v20+ installé
3. **pnpm** installé
4. **Variables d'environnement** configurées dans `apps/backend/.env`

## 🚀 Test 1 : API HTTP Generation

### Étape 1 : Démarrer le serveur backend

```bash
# Terminal 1
cd apps/backend
npm run start:dev
```

Attendre que le serveur démarre (vous devriez voir "🚀 Application is running on: http://0.0.0.0:3000")

### Étape 2 : Tester l'API

```bash
# Terminal 2
cd apps/backend
npx ts-node src/modules/generation/test-generation-api.ts
```

**Résultat attendu** :
```
✅ Brand trouvé: ...
✅ API Key trouvée/créée: ...
✅ Product trouvé: ...
✅ Génération créée via API
   - Public ID: ...
   - Status: pending
✅ Statut récupéré
✅ Génération complète récupérée
```

### Dépannage

**Erreur : "Serveur non accessible"**
- Vérifier que le serveur est bien démarré dans le Terminal 1
- Vérifier le port (par défaut 3000)
- Vérifier les logs du serveur pour les erreurs

**Erreur : "API Key invalide"**
- Le script crée automatiquement une API Key si nécessaire
- Vérifier dans la base de données : `SELECT * FROM "ApiKey" WHERE "isActive" = true;`

**Erreur : "Product not found"**
- Vérifier qu'il y a des produits actifs : `SELECT id, name, status FROM "Product" WHERE status = 'ACTIVE';`

---

## 🎨 Test 2 : Widget avec Génération IA

### Étape 1 : Build le widget

```bash
cd packages/widget
pnpm install  # Si pas encore fait
pnpm build
```

**Vérifier que le build a réussi** :
```bash
ls -la dist/
# Devrait contenir : luneo-widget.iife.js, luneo-widget.es.js, etc.
```

### Étape 2 : Servir les fichiers de test

**Option A : Python (simple)**
```bash
cd packages/widget/test
python3 -m http.server 8080
```

**Option B : Node.js serve**
```bash
cd packages/widget/test
npx serve -p 8080
```

**Option C : Vite dev server**
```bash
cd packages/widget
pnpm dev
# Puis ouvrir http://localhost:5173/test/generation-test.html
```

### Étape 3 : Ouvrir dans le navigateur

1. Ouvrir `http://localhost:8080/generation-test.html` (ou le port que vous avez choisi)
2. **Configurer** :
   - **API Key** : Utiliser l'ID de l'API Key créée lors du test 1 (ou créer une nouvelle)
   - **Product ID** : Utiliser un Product ID actif (ex: `sample-product-1`)
   - **API URL** : `http://localhost:3000/api` (ou l'URL de votre serveur)
3. Cliquer sur **"Initialiser le Widget"**
4. Attendre que le widget se charge
5. Cliquer sur le bouton **"AI Generate"** dans la toolbar du widget
6. Entrer un prompt optionnel (ex: "Make it elegant")
7. Cliquer sur **"Generate Image"**
8. Attendre la génération (10-30 secondes)
9. Vérifier que l'image générée s'affiche

### Dépannage

**Erreur : "Widget non trouvé"**
```bash
cd packages/widget
pnpm build
```

**Erreur : "API Key invalide"**
- Vérifier que vous utilisez l'**ID** de l'API Key, pas le hash
- Vérifier dans la DB : `SELECT id, name, "isActive" FROM "ApiKey";`

**Erreur : "Product not found"**
- Vérifier que le Product ID existe et a `status = 'ACTIVE'`
- Vérifier que le Product a des `customizationZones`

**Erreur CORS**
- Vérifier que le serveur backend a CORS activé pour `http://localhost:8080`
- Vérifier la configuration dans `apps/backend/src/main.ts`

---

## 📱 Test 3 : AR Viewer

### Prérequis

- **Appareil mobile** compatible WebXR :
  - **Android** : Chrome 81+ (ARCore requis)
  - **iOS** : Safari 15+ (ARKit requis)
- **Génération complétée** avec `arEnabled: true`
- **Modèle 3D** disponible (`model3dUrl` dans le Product)

### Étape 1 : Préparer une génération avec AR

1. Dans le widget, créer une génération (voir Test 2)
2. Attendre que la génération soit complétée
3. Vérifier que le Product a `arEnabled: true` :
   ```sql
   SELECT id, name, "arEnabled", "arTrackingType", "model3dUrl" 
   FROM "Product" 
   WHERE id = 'YOUR_PRODUCT_ID';
   ```

### Étape 2 : Tester l'AR

1. Dans le widget, après une génération réussie
2. Cliquer sur le bouton **"AR View"** dans la toolbar
3. Autoriser l'accès à la caméra si demandé
4. Cliquer sur **"Enter AR"**
5. Pointer la caméra vers une **surface plane** (table, sol, etc.)
6. Le modèle 3D devrait apparaître avec la texture personnalisée

### Types de tracking testés

- **Surface** (par défaut) : Hit testing sur surfaces planes
- **Face** : Tracking du visage (nécessite MediaPipe ou similaire)
- **Hand** : Tracking des mains (nécessite MediaPipe)
- **Body** : Tracking du corps (nécessite MediaPipe)

### Dépannage

**Erreur : "WebXR not supported"**
- Utiliser Chrome Android ou Safari iOS 15+
- Activer les flags expérimentaux si nécessaire
- Tester sur un appareil mobile réel (pas d'émulateur)

**Erreur : "AR Session failed"**
- Vérifier que l'appareil supporte ARCore (Android) ou ARKit (iOS)
- Vérifier les permissions de caméra
- Vérifier que le modèle 3D est accessible (`model3dUrl`)

**Modèle 3D ne s'affiche pas**
- Vérifier que `model3dUrl` est valide et accessible
- Vérifier le format (GLTF/GLB recommandé)
- Vérifier la console du navigateur pour les erreurs de chargement

---

## 📊 Résumé des Tests

| Test | Status | Commandes |
|------|--------|-----------|
| **API HTTP** | ⏳ À tester | `npm run start:dev` + `npx ts-node test-generation-api.ts` |
| **Widget Build** | ✅ Prêt | `cd packages/widget && pnpm build` |
| **Widget Génération IA** | ⏳ À tester | Servir `test/generation-test.html` |
| **AR Viewer** | ⏳ À tester | Sur appareil mobile compatible |

## 🔧 Commandes Rapides

```bash
# 1. Démarrer le serveur
cd apps/backend && npm run start:dev

# 2. Tester l'API (dans un autre terminal)
cd apps/backend && npx ts-node src/modules/generation/test-generation-api.ts

# 3. Build le widget
cd packages/widget && pnpm build

# 4. Servir les tests
cd packages/widget/test && python3 -m http.server 8080

# 5. Ouvrir dans le navigateur
open http://localhost:8080/generation-test.html
```

## 📝 Notes Importantes

1. **API Key** : Utiliser l'**ID** de l'API Key (pas le hash, pas la valeur `key`)
2. **Product** : Doit avoir `status = 'ACTIVE'` et des `customizationZones`
3. **AR** : Nécessite un appareil mobile réel avec support WebXR
4. **CORS** : Vérifier que le backend autorise les requêtes depuis `localhost:8080`

## 🎯 Prochaines Étapes

Une fois tous les tests passés :
1. ✅ Module Generation fonctionnel
2. ✅ Widget avec génération IA opérationnel
3. ✅ AR Viewer avec Three.js implémenté
4. ⏳ Tests d'intégration complets
5. ⏳ Optimisations de performance
6. ⏳ Tests sur différents appareils


