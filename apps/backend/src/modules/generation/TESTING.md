# Guide de Test - Module Generation

## Test 1 : Module Generation (Base de données) ✅

### Exécution
```bash
cd apps/backend
npx ts-node src/modules/generation/test-generation.ts
```

### Ce qui est testé
- ✅ Création de Brand et Product si nécessaire
- ✅ Création de CustomizationZone
- ✅ Création d'une génération
- ✅ Mise à jour du statut
- ✅ Incrémentation du compteur de générations
- ✅ Relations Prisma

### Résultat attendu
```
✅ Tous les tests du module Generation sont passés !
```

## Test 2 : API Generation (HTTP)

### Prérequis
- Serveur backend démarré : `npm run start:dev`
- API Key valide dans la base de données

### Exécution
```bash
cd apps/backend
npx ts-node src/modules/generation/test-generation-api.ts
```

### Ce qui est testé
- ✅ POST /generation/create - Création d'une génération
- ✅ GET /generation/:publicId/status - Récupération du statut
- ✅ GET /generation/:publicId - Récupération complète

### Configuration
Le script utilise :
- API URL : `http://localhost:3000` (ou variable d'environnement `API_URL`)
- Crée automatiquement une API Key de test si nécessaire

## Test 3 : Widget avec Génération IA

### Prérequis
1. Build du widget :
```bash
cd packages/widget
pnpm build
```

2. Serveur de développement (pour servir le widget) :
```bash
cd packages/widget
pnpm dev
# ou utiliser un serveur HTTP simple
python3 -m http.server 8080
```

### Exécution
1. Ouvrir `packages/widget/test/generation-test.html` dans un navigateur
2. Entrer :
   - API Key (depuis la base de données)
   - Product ID (ex: `sample-product-1`)
   - API URL (ex: `http://localhost:3000/api`)
3. Cliquer sur "Initialiser le Widget"
4. Utiliser le bouton "AI Generate" dans le widget

### Ce qui est testé
- ✅ Initialisation du widget
- ✅ Chargement du produit
- ✅ Affichage du panel de génération IA
- ✅ Création d'une génération via API
- ✅ Polling du statut
- ✅ Affichage du résultat

## Test 4 : AR Viewer

### Prérequis
- Appareil compatible WebXR (mobile AR ou navigateur avec support)
- Génération complétée avec `arEnabled: true`

### Exécution
1. Dans le widget, après une génération réussie
2. Cliquer sur le bouton "AR View"
3. Autoriser l'accès à la caméra
4. Tester les différents types de tracking :
   - Surface (par défaut)
   - Face (si disponible)
   - Hand (si disponible)

### Ce qui est testé
- ✅ Détection du support WebXR
- ✅ Initialisation de la session AR
- ✅ Chargement du modèle 3D
- ✅ Application de la texture personnalisée
- ✅ Tracking selon le type configuré

## Dépannage

### Erreur : "Widget non trouvé"
```bash
cd packages/widget
pnpm build
```

### Erreur : "API Key invalide"
Vérifier dans la base de données :
```sql
SELECT * FROM "ApiKey" WHERE "isActive" = true AND "revokedAt" IS NULL;
```

### Erreur : "Product not found"
Vérifier que le Product existe et a `status = 'ACTIVE'` :
```sql
SELECT id, name, status FROM "Product" WHERE status = 'ACTIVE';
```

### Erreur : "WebXR not supported"
- Utiliser un navigateur compatible (Chrome Android, Safari iOS 15+)
- Activer les flags expérimentaux si nécessaire
- Tester sur un appareil mobile avec caméra


