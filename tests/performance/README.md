# 🚀 Tests de Performance

Ce dossier contient les tests de performance et de charge pour la plateforme Luneo.

## 📋 Outils Utilisés

- **k6** : Tests de charge avancés avec métriques détaillées
- **Artillery** : Tests de stress et scénarios complexes

## 🧪 Installation

### k6

```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

### Artillery

```bash
npm install -g artillery
```

## 🎯 Exécution des Tests

### Tests k6

```bash
# Test de charge basique
k6 run k6-load-test.js

# Test avec variables d'environnement
BASE_URL=https://api.luneo.com TEST_EMAIL=test@example.com TEST_PASSWORD=password k6 run k6-load-test.js

# Test avec plus d'utilisateurs
k6 run --vus 500 --duration 5m k6-load-test.js

# Test avec sortie JSON
k6 run --out json=results.json k6-load-test.js
```

### Tests Artillery

```bash
# Test basique
artillery run artillery-config.yml

# Test avec rapport HTML
artillery run --output report.json artillery-config.yml
artillery report report.json

# Test avec variables
artillery run --target https://api.luneo.com artillery-config.yml
```

## 📊 Métriques Surveillées

- **Latence** : p95, p99
- **Taux d'erreur** : < 1%
- **Throughput** : Requêtes par seconde
- **Temps de réponse** : Par endpoint
- **Utilisation CPU/Mémoire** : Si disponible

## 🎯 Seuils de Performance

### Endpoints Publics
- **Health Check** : < 100ms (p95)
- **Products List** : < 500ms (p95)
- **Product Details** : < 300ms (p95)

### Endpoints Authentifiés
- **Login** : < 500ms (p95)
- **Profile** : < 300ms (p95)
- **Analytics** : < 1000ms (p95)

### Endpoints Critiques
- **Order Creation** : < 1000ms (p95)
- **Design Generation** : < 5000ms (p95)

## 📈 Interprétation des Résultats

### Excellent
- p95 < 500ms
- Taux d'erreur < 0.1%
- Throughput élevé

### Bon
- p95 < 1000ms
- Taux d'erreur < 1%
- Throughput acceptable

### À Améliorer
- p95 > 1000ms
- Taux d'erreur > 1%
- Throughput faible

## 🔧 Configuration CI/CD

Les tests de performance sont intégrés dans le pipeline CI/CD :

```yaml
# .github/workflows/performance-tests.yml
- name: Run Performance Tests
  run: |
    k6 run tests/performance/k6-load-test.js
    artillery run tests/performance/artillery-config.yml
```

## 📝 Notes

- Les tests utilisent des données de test, pas de données de production
- Les tests sont configurés pour ne pas surcharger les serveurs
- Les résultats sont sauvegardés pour analyse
- Les alertes sont déclenchées si les seuils sont dépassés
