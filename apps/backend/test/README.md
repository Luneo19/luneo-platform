# 🧪 LUNEO - Suite de Tests Complète

> **Tests Unitaires + Intégration + E2E + Performance**

---

## 📋 TABLE DES MATIÈRES

1. [Structure](#structure)
2. [Tests Unitaires](#tests-unitaires)
3. [Tests d'Intégration](#tests-dintégration)
4. [Tests E2E](#tests-e2e)
5. [Tests de Performance](#tests-de-performance)
6. [Commandes](#commandes)
7. [Coverage](#coverage)

---

## 📁 STRUCTURE

```
test/
├── unit/                    # Tests unitaires (Jest)
│   ├── services/           # Tests des services
│   └── controllers/        # Tests des controllers
├── integration/            # Tests d'intégration (Supertest)
│   └── api/               # Tests API endpoints
├── e2e/                   # Tests End-to-End (Playwright)
│   └── workflows/         # Tests workflows complets
└── performance/           # Tests de performance (k6)
    └── load-test.k6.js   # Load testing
```

---

## 🔬 TESTS UNITAIRES

### Objectif
Tester les services et contrôleurs de manière isolée avec des mocks.

### Commandes
```bash
# Tous les tests unitaires
npm run test:unit

# Test spécifique
npm test -- product-rules.service.spec.ts

# Avec coverage
npm run test:cov
```

### Coverage Goal
- **Lignes**: 80%
- **Fonctions**: 75%
- **Branches**: 70%

### Tests Implémentés

#### ✅ ProductRulesService
- `getProductRules()` - Récupération depuis cache et DB
- `validateZone()` - Validation de zones (image, texte, couleur)
- `validateDesign()` - Validation complète de design
- Détection des violations de contraintes

#### ✅ RBACService
- `getRolePermissions()` - Permissions par rôle
- `roleHasPermission()` - Vérification permission
- `userHasPermission()` - Permissions utilisateur
- `authorize()` - Autorisation avec contexte
- `compareRoles()` - Hiérarchie des rôles
- Cross-brand access control

---

## 🔗 TESTS D'INTÉGRATION

### Objectif
Tester les API endpoints avec base de données de test.

### Commandes
```bash
# Tous les tests d'intégration
npm run test:integration

# Tests API spécifiques
npm run test:e2e -- product-engine

# Avec DB de test
DATABASE_URL=postgresql://test:test@localhost:5433/test_db npm run test:e2e
```

### Tests Implémentés

#### ✅ Product Engine API
- `GET /product-engine/products/:id/rules` - Récupération règles
- `PUT /product-engine/products/:id/rules` - Mise à jour règles
- `POST /product-engine/validate/design` - Validation design
- `POST /product-engine/pricing/calculate` - Calcul pricing
- Tests d'authentification (401 sans token)
- Tests de ressources inexistantes (404)

---

## 🌐 TESTS E2E

### Objectif
Tester les workflows utilisateur complets dans le navigateur.

### Setup
```bash
# Installer Playwright
npx playwright install

# Configurer
npx playwright install-deps
```

### Commandes
```bash
# Tous les tests E2E
npm run test:e2e:playwright

# Mode headless
npm run test:e2e:headless

# Mode UI (debug)
npx playwright test --ui

# Générer rapport
npx playwright show-report
```

### Workflows à tester
- [ ] Création de compte et login
- [ ] Création de produit avec zones
- [ ] Personnalisation de design (Visual Editor)
- [ ] Validation et pricing
- [ ] Commande et paiement
- [ ] Sync e-commerce (Shopify)

---

## ⚡ TESTS DE PERFORMANCE

### Objectif
Tester la capacité de charge et les temps de réponse.

### Setup k6
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

### Commandes
```bash
# Test de charge local
k6 run test/performance/load-test.k6.js

# Avec variables d'environnement
k6 run -e BASE_URL=http://localhost:4000 -e AUTH_TOKEN=your-token test/performance/load-test.k6.js

# Test de stress (plus agressif)
k6 run --vus 200 --duration 2m test/performance/load-test.k6.js

# Export résultats vers Grafana Cloud
k6 run --out cloud test/performance/load-test.k6.js
```

### Métriques Surveillées
- **http_req_duration**: < 500ms (p95)
- **http_req_failed**: < 1%
- **Throughput**: > 100 req/s
- **Error rate**: < 5%

### Scénarios Testés
1. **Ramp-up**: 0 → 50 users (1 min)
2. **Steady state**: 50 users (2 min)
3. **Spike**: 50 → 100 users (30s)
4. **Peak**: 100 users (1 min)
5. **Ramp-down**: 100 → 0 users (30s)

**Total duration**: ~5 minutes

---

## 🚀 COMMANDES PRINCIPALES

### Tests Complets
```bash
# Tous les tests
npm test

# Tests avec coverage
npm run test:cov

# Tests en mode watch
npm run test:watch

# Tests silencieux
npm test -- --silent
```

### Tests Par Type
```bash
# Unitaires uniquement
npm run test:unit

# Intégration uniquement
npm run test:integration

# E2E uniquement
npm run test:e2e

# Performance uniquement
k6 run test/performance/load-test.k6.js
```

### CI/CD
```bash
# Pipeline complet
npm run test:ci

# Avec parallélisation
npm test -- --maxWorkers=4

# Génération des rapports
npm run test:report
```

---

## 📊 COVERAGE

### Objectifs
| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Lignes | 80% | 🔄 |
| Fonctions | 75% | 🔄 |
| Branches | 70% | 🔄 |
| Statements | 80% | 🔄 |

### Visualiser le Coverage
```bash
# Générer rapport HTML
npm run test:cov

# Ouvrir dans le navigateur
open coverage/lcov-report/index.html
```

### Exclure des Fichiers
Les fichiers suivants sont exclus du coverage:
- `src/main.ts` (Bootstrap)
- `*.module.ts` (Modules NestJS)
- `*.interface.ts` (Interfaces TypeScript)
- `*.dto.ts` (DTOs)

---

## 🧪 BONNES PRATIQUES

### Tests Unitaires
1. ✅ Un test = une fonctionnalité
2. ✅ Utiliser des mocks pour les dépendances
3. ✅ Tester les cas limites et erreurs
4. ✅ Tests rapides (< 100ms chacun)
5. ✅ Nommage clair: `should do X when Y`

### Tests d'Intégration
1. ✅ Utiliser une DB de test séparée
2. ✅ Nettoyer la DB après chaque test
3. ✅ Tester les vrais endpoints
4. ✅ Vérifier les status codes HTTP
5. ✅ Valider la structure des réponses

### Tests E2E
1. ✅ Tester les workflows métier complets
2. ✅ Utiliser des sélecteurs stables (data-testid)
3. ✅ Attendre le chargement des éléments
4. ✅ Capturer les screenshots en cas d'échec
5. ✅ Tests isolés et indépendants

### Tests de Performance
1. ✅ Définir des seuils réalistes
2. ✅ Tester sur un environnement similaire à la prod
3. ✅ Monitorer les métriques système (CPU, RAM)
4. ✅ Augmenter la charge progressivement
5. ✅ Documenter les résultats

---

## 🔧 CONFIGURATION

### Jest (jest.config.js)
```javascript
module.exports = {
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000,
  maxWorkers: 4,
};
```

### k6 (load-test.k6.js)
```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

---

## 📈 RÉSULTATS ATTENDUS

### Tests Unitaires
- ✅ 200+ tests passent
- ✅ Coverage > 75%
- ✅ Durée < 2 minutes

### Tests d'Intégration
- ✅ 50+ endpoints testés
- ✅ Tous retournent les bons status
- ✅ Durée < 5 minutes

### Tests E2E
- ✅ 10+ workflows complets
- ✅ UI fonctionne sur 3 navigateurs
- ✅ Durée < 10 minutes

### Tests de Performance
- ✅ 100 users concurrents supportés
- ✅ P95 latency < 500ms
- ✅ Error rate < 1%
- ✅ Throughput > 100 req/s

---

## 🐛 DEBUGGING

### Tests Unitaires
```bash
# Mode debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Logs détaillés
npm test -- --verbose
```

### Tests d'Intégration
```bash
# Activer les logs SQL
DEBUG=prisma:* npm run test:e2e

# Voir les requêtes HTTP
DEBUG=supertest npm run test:e2e
```

### Tests E2E
```bash
# Mode debug Playwright
npx playwright test --debug

# Screenshots automatiques
npx playwright test --screenshot=only-on-failure
```

---

## ✅ CHECKLIST PRÉ-DÉPLOIEMENT

Avant chaque déploiement:

- [ ] Tous les tests unitaires passent
- [ ] Coverage > 75%
- [ ] Tests d'intégration API passent
- [ ] Au moins 5 workflows E2E validés
- [ ] Load test réussi avec 100 users
- [ ] P95 latency < 500ms
- [ ] Error rate < 1%
- [ ] Pas de memory leaks détectés
- [ ] Documentation à jour

---

**Prêt pour des tests de qualité production ! 🚀**

