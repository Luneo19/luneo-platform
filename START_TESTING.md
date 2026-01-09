# 🚀 Démarrer les Tests - Guide Pratique

## 📋 Checklist Pré-Test

Avant de commencer, vérifiez :

- [ ] Base de données PostgreSQL accessible
- [ ] Variables d'environnement configurées (`.env` dans `apps/backend/`)
- [ ] Node.js v20+ installé
- [ ] pnpm installé
- [ ] Migrations Prisma appliquées

## 🎯 Test 1 : API HTTP Generation

### Option A : Script Automatique (Recommandé)

```bash
# Terminal 1 - Démarrer le serveur
cd apps/backend
npm run start:dev

# Attendre que vous voyez : "🚀 Application is running on: http://0.0.0.0:3000"
# Puis dans Terminal 2 :
cd apps/backend
./src/modules/generation/test-api-step-by-step.sh
```

### Option B : Script TypeScript

```bash
# Terminal 1 - Démarrer le serveur
cd apps/backend
npm run start:dev

# Terminal 2 - Tester l'API
cd apps/backend
npx ts-node src/modules/generation/test-generation-api.ts
```

### Résultat Attendu

```
✅ Serveur accessible
✅ API Key créée/trouvée
✅ Product trouvé
✅ Génération créée via API
✅ Statut récupéré
✅ Génération complète récupérée
```

---

## 🎨 Test 2 : Widget avec Génération IA

### Étape 1 : Vérifier le Build

```bash
cd packages/widget
ls -la dist/luneo-widget.iife.js
# Le fichier doit exister (923 KB)
```

Si le fichier n'existe pas :
```bash
cd packages/widget
pnpm build
```

### Étape 2 : Servir les Fichiers de Test

**Option A : Python (Simple)**
```bash
cd packages/widget/test
python3 -m http.server 8080
```

**Option B : Node.js serve**
```bash
cd packages/widget/test
npx serve -p 8080
```

**Option C : Vite (si configuré)**
```bash
cd packages/widget
pnpm dev
# Puis ouvrir http://localhost:5173/test/generation-test.html
```

### Étape 3 : Tester dans le Navigateur

1. **Ouvrir** : `http://localhost:8080/generation-test.html`

2. **Configurer** :
   - **API Key** : Utiliser l'ID de l'API Key (récupéré du Test 1)
     - Vous pouvez le trouver dans la console du Test 1
     - Ou dans la DB : `SELECT id, name FROM "ApiKey" WHERE "isActive" = true;`
   - **Product ID** : `sample-product-1` (ou un autre Product actif)
   - **API URL** : `http://localhost:3000/api`

3. **Cliquer** sur "Initialiser le Widget"

4. **Attendre** que le widget se charge (vous devriez voir le canvas)

5. **Cliquer** sur le bouton **"AI Generate"** (icône Sparkles) dans la toolbar

6. **Entrer** un prompt optionnel (ex: "Make it elegant and modern")

7. **Cliquer** sur "Generate Image"

8. **Attendre** 10-30 secondes (barre de progression visible)

9. **Vérifier** que l'image générée s'affiche

### Dépannage Widget

**Erreur : "Widget non trouvé"**
```bash
cd packages/widget
pnpm build
# Puis recharger la page
```

**Erreur : "API Key invalide"**
- Vérifier que vous utilisez l'**ID** de l'API Key (pas le hash)
- Vérifier dans la console du navigateur (F12) pour les détails de l'erreur

**Erreur CORS**
- Vérifier que le serveur backend autorise `http://localhost:8080`
- Vérifier `apps/backend/src/main.ts` - section CORS

---

## 📱 Test 3 : AR Viewer (Mobile)

### Prérequis

- **Appareil mobile** avec :
  - Chrome Android 81+ (ARCore) OU Safari iOS 15+ (ARKit)
  - Caméra fonctionnelle
  - Connexion Internet

### Étape 1 : Préparer une Génération avec AR

1. **Vérifier** que le Product a AR activé :
   ```sql
   SELECT id, name, "arEnabled", "arTrackingType", "model3dUrl" 
   FROM "Product" 
   WHERE id = 'YOUR_PRODUCT_ID';
   ```

2. **Créer** une génération depuis le widget (Test 2)

3. **Attendre** que la génération soit complétée

### Étape 2 : Tester l'AR

1. **Sur mobile**, ouvrir la même page du widget
   - Utiliser l'IP locale de votre machine : `http://VOTRE_IP:8080/generation-test.html`
   - Exemple : `http://192.168.1.100:8080/generation-test.html`

2. **Après** une génération réussie, cliquer sur **"AR View"** (icône Box)

3. **Autoriser** l'accès à la caméra si demandé

4. **Cliquer** sur **"Enter AR"**

5. **Pointer** la caméra vers une **surface plane** (table, sol, mur)

6. **Vérifier** que le modèle 3D apparaît avec la texture personnalisée

### Dépannage AR

**Erreur : "WebXR not supported"**
- Utiliser Chrome Android ou Safari iOS
- Vérifier que ARCore (Android) ou ARKit (iOS) est installé
- Tester sur un appareil réel (pas d'émulateur)

**Modèle 3D ne s'affiche pas**
- Vérifier que `model3dUrl` est valide et accessible
- Vérifier le format (GLTF/GLB recommandé)
- Vérifier la console du navigateur (F12) pour les erreurs

---

## 🔧 Commandes Utiles

### Vérifier les Données

```bash
# API Keys
cd apps/backend
npx prisma studio
# Ou en ligne de commande :
psql $DATABASE_URL -c "SELECT id, name, \"isActive\" FROM \"ApiKey\";"

# Products
psql $DATABASE_URL -c "SELECT id, name, status, \"arEnabled\" FROM \"Product\" WHERE status = 'ACTIVE';"

# Générations
psql $DATABASE_URL -c "SELECT \"publicId\", status, \"createdAt\" FROM \"Generation\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

### Trouver votre IP Locale (pour mobile)

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Ou
ipconfig getifaddr en0  # macOS
hostname -I | awk '{print $1}'  # Linux
```

---

## 📊 Résultats Attendus

### Test 1 : API HTTP ✅
- Génération créée avec `status: "pending"`
- Statut récupéré avec succès
- Génération complète récupérée

### Test 2 : Widget ✅
- Widget initialisé
- Panel de génération IA visible
- Image générée affichée après 10-30 secondes

### Test 3 : AR ✅
- AR Viewer s'ouvre
- Session AR démarre
- Modèle 3D apparaît sur surface plane

---

## 🎉 Prochaines Étapes

Une fois tous les tests passés :
1. ✅ Module Generation fonctionnel
2. ✅ Widget avec génération IA opérationnel
3. ✅ AR Viewer avec Three.js implémenté
4. ⏳ Optimisations de performance
5. ⏳ Tests sur différents appareils
6. ⏳ Déploiement en staging






