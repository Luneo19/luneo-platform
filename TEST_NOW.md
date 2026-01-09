# 🚀 Tests - Instructions Immédiates

## ⚠️ Important : Le serveur sur port 3000 n'est PAS le backend NestJS

Le processus actuel sur le port 3000 est un serveur de fichiers statiques (`serve`).

## ✅ Solution : Démarrer le Backend NestJS

### Étape 1 : Arrêter le serveur actuel (si nécessaire)

```bash
# Trouver le processus
lsof -i :3000

# Arrêter si nécessaire (remplacer PID par le numéro du processus)
kill <PID>
```

### Étape 2 : Démarrer le Backend NestJS

**Terminal 1** :
```bash
cd apps/backend
npm run start:dev
```

**Attendre** que vous voyez :
```
🚀 Application is running on: http://0.0.0.0:3000
📚 Swagger documentation: http://0.0.0.0:3000/api/docs
```

### Étape 3 : Tester l'API

**Terminal 2** (une fois le serveur démarré) :
```bash
cd apps/backend
./src/modules/generation/test-api-step-by-step.sh
```

**OU** :
```bash
cd apps/backend
npx ts-node src/modules/generation/test-generation-api.ts
```

---

## 🎨 Test 2 : Widget (Une fois l'API testée)

### Démarrer un serveur pour le widget (port différent)

**Terminal 3** :
```bash
cd packages/widget/test
python3 -m http.server 8080
```

**Navigateur** :
1. Ouvrir `http://localhost:8080/generation-test.html`
2. Configurer avec :
   - **API Key** : ID de l'API Key (récupéré du Test 1)
   - **Product ID** : Le Product créé automatiquement
   - **API URL** : `http://localhost:3000/api`
3. Tester le widget

---

## 📱 Test 3 : AR (Sur Mobile)

Après avoir testé le widget et créé une génération :
1. Sur mobile, ouvrir la page du widget
2. Cliquer sur "AR View"
3. Tester l'AR

---

## 🔍 Vérifications Rapides

### Vérifier que le backend NestJS tourne :
```bash
curl http://localhost:3000/health
# Devrait retourner : {"status":"ok",...}
```

### Vérifier Swagger :
```bash
open http://localhost:3000/api/docs
# Devrait afficher la documentation Swagger
```

### Vérifier les routes disponibles :
```bash
curl http://localhost:3000/api/generation/create -X POST -H "X-API-Key: test" -d '{}'
# Devrait retourner une erreur d'authentification (pas 404)
```

---

## 📝 Résumé des Ports

- **Port 3000** : Backend NestJS (API)
- **Port 8080** : Serveur de test widget (fichiers statiques)

---

## 🎯 Ordre d'Exécution Recommandé

1. ✅ **Démarrer Backend** (Terminal 1) : `cd apps/backend && npm run start:dev`
2. ✅ **Tester API** (Terminal 2) : `./src/modules/generation/test-api-step-by-step.sh`
3. ✅ **Servir Widget** (Terminal 3) : `cd packages/widget/test && python3 -m http.server 8080`
4. ✅ **Tester Widget** (Navigateur) : `http://localhost:8080/generation-test.html`
5. ✅ **Tester AR** (Mobile) : Après génération réussie






