# 🚀 QUICK START - LUNEO ENTERPRISE

> Démarrage rapide pour tester les fonctionnalités implémentées

---

## ⚡ DÉMARRAGE RAPIDE (5 MINUTES)

### 1. Prérequis (Installer si nécessaire)

```bash
# Vérifier Node.js
node --version  # Doit être v18+ ou v20+

# Vérifier PostgreSQL
psql --version

# Vérifier Redis
redis-cli --version

# Si manquants sur Mac:
brew install postgresql redis node
```

### 2. Setup Initial

```bash
# 1. Aller dans le projet
cd /Users/emmanuelabougadous/saas-backend

# 2. Installer les dépendances (si pas déjà fait)
npm install

# 3. Configurer l'environnement
cp apps/backend/.env.example apps/backend/.env
# Éditer apps/backend/.env avec vos credentials

# 4. Setup de la base de données
cd apps/backend
npx prisma generate
npx prisma migrate deploy

# 5. Appliquer les nouvelles migrations
cd ../..
psql $DATABASE_URL -f scripts/migrate-product-engine.sql
psql $DATABASE_URL -f scripts/migrate-workers.sql
```

### 3. Démarrer les Services

#### Option A: Terminal Multiple (Recommandé)

```bash
# Terminal 1 - Redis
redis-server

# Terminal 2 - Backend
cd apps/backend
npm run dev

# Terminal 3 - Frontend  
cd apps/frontend
npm run dev
```

#### Option B: Script de démarrage (Plus simple)

```bash
# Créer un fichier start-all.sh
cat > start-all.sh << 'EOF'
#!/bin/bash
redis-server &
cd apps/backend && npm run dev &
cd apps/frontend && npm run dev &
wait
EOF

chmod +x start-all.sh
./start-all.sh
```

### 4. Tester l'Installation

```bash
# Exécuter les tests automatiques
./scripts/test-features.sh

# Ou tests manuels rapides:

# Test Backend
curl http://localhost:4000/health
# Devrait retourner: {"status":"ok"}

# Test Frontend
open http://localhost:3000
# ou
curl http://localhost:3000
```

---

## 🧪 TESTS RAPIDES DES FONCTIONNALITÉS

### Test 1: Product Rules Engine ✅

```bash
# Interface Web (Plus facile)
open http://localhost:3000/products

# Ou via API (besoin d'auth)
# Voir GUIDE_TEST_COMPLET.md pour les commandes curl
```

### Test 2: Visual Editor ✅

```bash
# Ouvrir l'éditeur visuel
open http://localhost:3000/editor

# Actions à tester:
# 1. Cliquer sur "Ajouter" pour créer une zone
# 2. Drag & drop pour déplacer
# 3. Utiliser les poignées pour redimensionner
# 4. Modifier les propriétés dans le panneau de droite
# 5. Sauvegarder
```

### Test 3: Render Engine ✅

```bash
# Via l'interface (plus simple)
# 1. Créer un design dans le Visual Editor
# 2. Cliquer sur "Aperçu"
# 3. Observer le rendu en temps réel
```

### Test 4: Workers ✅

```bash
# Vérifier que les workers tournent
redis-cli KEYS "bull:*"

# Voir les logs du backend pour observer les jobs
# Ils s'affichent quand vous créez un design
```

---

## 🎯 CHECKLIST RAPIDE

### Backend ✅
- [ ] PostgreSQL démarré
- [ ] Redis démarré
- [ ] Backend sur http://localhost:4000
- [ ] Pas d'erreurs dans les logs
- [ ] `/health` retourne OK

### Frontend ✅
- [ ] Frontend sur http://localhost:3000
- [ ] Page d'accueil se charge
- [ ] Pas d'erreurs dans la console navigateur

### Fonctionnalités ✅
- [ ] Peut créer un produit
- [ ] Peut ajouter des zones dans l'éditeur
- [ ] Peut drag & drop les zones
- [ ] Peut sauvegarder
- [ ] Aperçu fonctionne

---

## ⚠️ PROBLÈMES COURANTS

### "Port déjà utilisé"
```bash
# Tuer les processus sur les ports
lsof -ti:4000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:6379 | xargs kill -9  # Redis
```

### "Cannot connect to database"
```bash
# Vérifier PostgreSQL
pg_isready

# Si pas démarré
brew services start postgresql
# ou
sudo systemctl start postgresql
```

### "Redis connection failed"
```bash
# Démarrer Redis
brew services start redis
# ou
redis-server
```

### "Prisma Client not generated"
```bash
cd apps/backend
npx prisma generate
```

---

## 📊 PROCHAINES ÉTAPES

### Une fois que tout fonctionne ✅

1. **Explorez les fonctionnalités**
   - Créez plusieurs produits
   - Testez différents types de zones
   - Jouez avec l'éditeur visuel

2. **Reportez les bugs** (si vous en trouvez)
   - Notez les erreurs dans la console
   - Notez les comportements inattendus
   - Prenez des captures d'écran

3. **Prêt pour la Phase A** 🛒
   - Intégrations e-commerce (Shopify, WooCommerce)
   - Synchronisation automatique des produits
   - Gestion des commandes

---

## 🆘 BESOIN D'AIDE ?

### Logs à vérifier

```bash
# Backend logs
cd apps/backend
npm run dev
# Observer la console

# Frontend logs
# Ouvrir DevTools dans le navigateur (F12)
# Regarder l'onglet Console

# Redis logs
redis-cli MONITOR
# Observer les opérations en temps réel
```

### Reset complet (si tout casse)

```bash
# Arrêter tout
pkill -f node
pkill -f redis

# Nettoyer
rm -rf node_modules
rm -rf apps/backend/node_modules
rm -rf apps/frontend/node_modules

# Réinstaller
npm install

# Regénérer Prisma
cd apps/backend
npx prisma generate

# Redémarrer
cd ../..
./start-all.sh
```

---

## 🎉 C'EST PARTI !

**Temps de setup estimé**: 5-10 minutes  
**Prêt pour les tests**: Immédiat après setup

**Commande ultime pour tout tester**:
```bash
./scripts/test-features.sh
```

**Si tous les tests passent → Vous êtes READY pour la Phase A ! 🚀**

---

**Dernière mise à jour**: 14 Octobre 2025  
**Version**: 1.0.0


