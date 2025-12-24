# ✅ Checklist de Validation - Backend Luneo

## 🎯 Objectif
Cette checklist permet de valider que le backend est correctement configuré et fonctionnel.

## 📋 Tests de Base

### 1. Installation et Configuration
- [ ] `pnpm install` s'exécute sans erreur
- [ ] `pnpm prisma generate` génère le client Prisma
- [ ] Le fichier `.env` est configuré avec toutes les variables requises
- [ ] `pnpm prisma migrate dev --name init` crée les tables
- [ ] `pnpm seed` peuple la base de données avec les données de test

### 2. Démarrage de l'application
- [ ] `pnpm dev` démarre l'application sans erreur
- [ ] L'application répond sur `http://localhost:3000`
- [ ] Le health check `/health` retourne un statut 200
- [ ] Swagger est accessible sur `/api/docs`

### 3. Base de données
- [ ] Connexion PostgreSQL fonctionnelle
- [ ] Toutes les tables sont créées
- [ ] Les données de seed sont présentes
- [ ] Prisma Studio fonctionne (`pnpm studio`)

## 🔐 Tests d'Authentification

### 4. Inscription utilisateur
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```
- [ ] Retourne un statut 201
- [ ] Inclut un token d'accès
- [ ] L'utilisateur est créé en base

### 5. Connexion utilisateur
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
- [ ] Retourne un statut 200
- [ ] Inclut un token d'accès et de refresh
- [ ] Le lastLoginAt est mis à jour

### 6. Accès protégé
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```
- [ ] Retourne les informations de l'utilisateur
- [ ] Sans token, retourne 401

## 🏢 Tests Multi-tenant

### 7. Création de marque
```bash
curl -X POST http://localhost:3000/api/v1/brands \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Brand",
    "slug": "test-brand",
    "description": "Test brand"
  }'
```
- [ ] Retourne un statut 201
- [ ] La marque est créée avec l'utilisateur associé

### 8. Isolation des données
- [ ] Un utilisateur ne peut accéder qu'aux données de sa marque
- [ ] Les requêtes sont automatiquement filtrées par brandId
- [ ] Les permissions RBAC fonctionnent

## 🛍️ Tests Produits

### 9. Liste des produits publics
```bash
curl -X GET http://localhost:3000/api/v1/products
```
- [ ] Retourne la liste des produits publics
- [ ] Inclut les informations de marque
- [ ] Supporte les filtres (brandId, isActive, isPublic)

### 10. Création de produit
```bash
curl -X POST http://localhost:3000/api/v1/brands/{brandId}/products \
  -H "Authorization: Bearer <brand_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 29.99,
    "description": "Test product"
  }'
```
- [ ] Retourne un statut 201
- [ ] Le produit est associé à la bonne marque
- [ ] Seuls les brand admins peuvent créer des produits

## 🎨 Tests IA et Designs

### 11. Création de design
```bash
curl -X POST http://localhost:3000/api/v1/designs \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "sample-product-1",
    "prompt": "A beautiful design",
    "options": {
      "style": "realistic",
      "resolution": "1024x1024"
    }
  }'
```
- [ ] Retourne un statut 201
- [ ] Le design est créé avec le statut PENDING
- [ ] Un job est ajouté à la queue IA

### 12. Traitement IA (simulé)
- [ ] Le processeur IA traite les jobs
- [ ] Les designs passent en statut COMPLETED
- [ ] Les URLs de preview sont générées
- [ ] Les coûts sont enregistrés

## 💳 Tests Commandes

### 13. Création de commande
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": "sample-design-1",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe"
  }'
```
- [ ] Retourne un statut 201
- [ ] Inclut une URL de checkout Stripe
- [ ] La commande est créée avec le bon calcul de prix

### 14. Webhook Stripe (simulé)
- [ ] Le webhook traite les événements Stripe
- [ ] Les commandes passent en statut PAID
- [ ] Les notifications sont envoyées aux marques

## 🔧 Tests Techniques

### 15. Rate Limiting
```bash
# Faire 100+ requêtes rapides
for i in {1..110}; do
  curl -X GET http://localhost:3000/api/v1/products
done
```
- [ ] Les requêtes sont limitées après 100 appels
- [ ] Retourne 429 Too Many Requests

### 16. Validation des entrées
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'
```
- [ ] Retourne 400 avec les erreurs de validation
- [ ] Les entrées sont sanitizées

### 17. Gestion d'erreurs
```bash
curl -X GET http://localhost:3000/api/v1/users/nonexistent
```
- [ ] Retourne 404 avec un message d'erreur clair
- [ ] Le format d'erreur est cohérent

## 📊 Tests Monitoring

### 18. Health Check
```bash
curl -X GET http://localhost:3000/health
```
- [ ] Retourne le statut de tous les services
- [ ] Inclut la base de données et Redis

### 19. Métriques
```bash
curl -X GET http://localhost:3000/metrics
```
- [ ] Retourne les métriques Prometheus
- [ ] Inclut les métriques d'application

## 🐳 Tests Docker

### 20. Docker Compose
```bash
docker-compose up --build
```
- [ ] Tous les services démarrent
- [ ] L'API répond sur le port 3000
- [ ] PostgreSQL est accessible sur le port 5432
- [ ] Redis est accessible sur le port 6379
- [ ] Adminer est accessible sur le port 8080

## 🧪 Tests Automatisés

### 21. Tests unitaires
```bash
pnpm test
```
- [ ] Tous les tests passent
- [ ] Couverture de code > 80%

### 22. Tests E2E
```bash
pnpm test:e2e
```
- [ ] Tous les tests E2E passent
- [ ] Les scénarios critiques sont couverts

## 📋 Résumé

### ✅ Critères de succès
- [ ] Tous les tests de base passent
- [ ] L'authentification fonctionne
- [ ] Le multi-tenant est isolé
- [ ] Les intégrations externes sont configurées
- [ ] La sécurité est en place
- [ ] Les performances sont acceptables
- [ ] La documentation est accessible

### 🚨 Problèmes critiques
- [ ] Aucune erreur de sécurité
- [ ] Aucune fuite de données entre tenants
- [ ] Aucune erreur 500 non gérée

### 📈 Métriques de performance
- [ ] Temps de réponse < 200ms (95%)
- [ ] Disponibilité > 99.9%
- [ ] Taux d'erreur < 1%

## 🔄 Validation continue

Cette checklist doit être exécutée :
- ✅ Après chaque déploiement
- ✅ Avant chaque release
- ✅ Après chaque modification majeure
- ✅ Régulièrement en production

---

**Status**: 🔄 À valider  
**Dernière validation**: Non effectuée  
**Prochaine validation**: À planifier
