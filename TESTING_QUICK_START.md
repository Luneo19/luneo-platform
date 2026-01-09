# 🚀 Quick Start - Tests Phase 2 & 3

## ✅ État Actuel

- ✅ **Module Generation** : Créé et testé (base de données)
- ✅ **Widget Build** : Build réussi (923 KB)
- ✅ **AR Viewer** : Implémenté avec Three.js
- ⏳ **Tests API HTTP** : Scripts prêts, nécessite serveur démarré
- ⏳ **Tests Widget** : Page de test créée, prête à être servie
- ⏳ **Tests AR** : Prêt pour test sur mobile

## 🎯 Tests à Exécuter Maintenant

### 1️⃣ Test API HTTP (5 minutes)

**Terminal 1** - Démarrer le serveur :
```bash
cd apps/backend
npm run start:dev
```

**Terminal 2** - Tester l'API :
```bash
cd apps/backend
npx ts-node src/modules/generation/test-generation-api.ts
```

**Résultat attendu** : Génération créée avec succès via API

---

### 2️⃣ Test Widget (10 minutes)

**Terminal 1** - Servir les fichiers de test :
```bash
cd packages/widget/test
python3 -m http.server 8080
# ou: npx serve -p 8080
```

**Navigateur** :
1. Ouvrir `http://localhost:8080/generation-test.html`
2. Entrer :
   - **API Key** : ID de l'API Key (depuis la DB ou créée par le test 1)
   - **Product ID** : `sample-product-1` (ou un autre Product actif)
   - **API URL** : `http://localhost:3000/api`
3. Cliquer sur **"Initialiser le Widget"**
4. Cliquer sur **"AI Generate"** dans le widget
5. Entrer un prompt (ex: "Make it elegant")
6. Cliquer sur **"Generate Image"**
7. Attendre 10-30 secondes
8. Vérifier que l'image s'affiche

---

### 3️⃣ Test AR (15 minutes - Mobile requis)

**Prérequis** :
- Appareil mobile (Android Chrome ou iOS Safari)
- Génération complétée (depuis Test 2)
- Product avec `arEnabled: true` et `model3dUrl`

**Étapes** :
1. Sur mobile, ouvrir la page du widget
2. Après une génération réussie, cliquer sur **"AR View"**
3. Autoriser la caméra
4. Cliquer sur **"Enter AR"**
5. Pointer vers une surface plane
6. Vérifier que le modèle 3D apparaît

---

## 📁 Fichiers Créés

### Backend
- ✅ `apps/backend/src/modules/generation/` - Module complet
- ✅ `apps/backend/src/modules/generation/test-generation.ts` - Test DB
- ✅ `apps/backend/src/modules/generation/test-generation-api.ts` - Test API
- ✅ `apps/backend/src/modules/generation/TESTING.md` - Guide détaillé

### Widget
- ✅ `packages/widget/src/components/Generation/` - Panel génération IA
- ✅ `packages/widget/src/components/AR/ARViewer.tsx` - Viewer AR avec Three.js
- ✅ `packages/widget/test/generation-test.html` - Page de test
- ✅ `packages/widget/dist/` - Build du widget (923 KB)

### Documentation
- ✅ `TESTING_GUIDE.md` - Guide complet
- ✅ `TESTING_QUICK_START.md` - Ce fichier
- ✅ `TESTING_SUMMARY.md` - Résumé des tests

---

## 🔧 Commandes Utiles

```bash
# Vérifier les API Keys
cd apps/backend
npx prisma studio
# Ou en SQL:
psql $DATABASE_URL -c "SELECT id, name, \"isActive\" FROM \"ApiKey\";"

# Vérifier les Products
psql $DATABASE_URL -c "SELECT id, name, status, \"arEnabled\" FROM \"Product\" WHERE status = 'ACTIVE';"

# Vérifier les Générations
psql $DATABASE_URL -c "SELECT \"publicId\", status, \"createdAt\" FROM \"Generation\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

---

## ⚠️ Problèmes Courants

### "Serveur non accessible"
- Vérifier que le serveur est démarré : `curl http://localhost:3000/health`
- Vérifier le port dans `.env` : `PORT=3000`

### "API Key invalide"
- Utiliser l'**ID** de l'API Key (pas le hash)
- Vérifier que `isActive = true`
- Le script de test crée automatiquement une API Key si nécessaire

### "Widget non chargé"
- Vérifier que le build est à jour : `cd packages/widget && pnpm build`
- Vérifier la console du navigateur pour les erreurs
- Vérifier que le fichier `dist/luneo-widget.iife.js` existe

### "AR not supported"
- Utiliser un appareil mobile réel (pas d'émulateur)
- Chrome Android 81+ ou Safari iOS 15+
- Vérifier que ARCore (Android) ou ARKit (iOS) est installé

---

## 📊 Checklist de Test

- [ ] Serveur backend démarré
- [ ] Test API HTTP réussi
- [ ] Widget buildé
- [ ] Page de test servie
- [ ] Widget initialisé dans le navigateur
- [ ] Génération IA créée
- [ ] Image générée affichée
- [ ] AR Viewer testé sur mobile (si disponible)

---

## 🎉 Prochaines Étapes

Une fois tous les tests passés :
1. Optimiser les performances du rendu 3D
2. Ajouter plus de types de tracking AR
3. Améliorer l'UI du widget
4. Ajouter des tests unitaires
5. Déployer en staging






