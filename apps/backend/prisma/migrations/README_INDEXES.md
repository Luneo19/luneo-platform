# 📊 Indexes Composites pour Performance

## Vue d'ensemble

Ce document décrit les index composites ajoutés pour optimiser les requêtes fréquentes de l'application.

## Indexes par Modèle

### Product

1. **idx_product_brand_active_public_created**
   - Colonnes: `brandId`, `isActive`, `isPublic`, `createdAt DESC`
   - Usage: `ProductsService.findAll()` avec filtres multiples
   - Impact: Améliore les requêtes de listing de produits

2. **idx_product_brand_active_created**
   - Colonnes: `brandId`, `isActive`, `createdAt DESC`
   - Usage: Filtrage par brand et statut actif

3. **idx_product_brand_public_created**
   - Colonnes: `brandId`, `isPublic`, `createdAt DESC`
   - Usage: Filtrage des produits publics

### Design

1. **idx_design_brand_status_created**
   - Colonnes: `brandId`, `status`, `createdAt DESC`
   - Usage: Dashboard metrics, listing designs par brand et status
   - Impact: Critique pour les requêtes de dashboard

2. **idx_design_user_status_created**
   - Colonnes: `userId`, `status`, `createdAt DESC`
   - Usage: Designs d'un utilisateur spécifique

3. **idx_design_product_status_created**
   - Colonnes: `productId`, `status`, `createdAt DESC`
   - Usage: Designs d'un produit spécifique

4. **idx_design_brand_created**
   - Colonnes: `brandId`, `createdAt DESC`
   - Usage: Requêtes temporelles par brand

### Order

1. **idx_order_brand_status_created**
   - Colonnes: `brandId`, `status`, `createdAt DESC`
   - Usage: `OrdersService`, `PublicApiService.getOrders()`
   - Impact: Améliore considérablement les requêtes de commandes

2. **idx_order_brand_payment_created**
   - Colonnes: `brandId`, `paymentStatus`, `createdAt DESC`
   - Usage: Filtrage par statut de paiement

3. **idx_order_user_status_created**
   - Colonnes: `userId`, `status`, `createdAt DESC`
   - Usage: Commandes d'un utilisateur

4. **idx_order_status_payment**
   - Colonnes: `status`, `paymentStatus`
   - Usage: Filtres combinés

5. **idx_order_brand_created**
   - Colonnes: `brandId`, `createdAt DESC`
   - Usage: Requêtes temporelles

### User

1. **idx_user_brand_role**
   - Colonnes: `brandId`, `role`
   - Usage: Listing utilisateurs par brand et rôle

2. **idx_user_email_active**
   - Colonnes: `email`, `isActive`
   - Usage: Recherche d'utilisateurs actifs

### UsageMetric

1. **idx_usage_brand_metric_timestamp**
   - Colonnes: `brandId`, `metric`, `timestamp DESC`
   - Usage: Analytics et tracking d'usage

### AuditLog

1. **idx_audit_user_timestamp**
   - Colonnes: `userId`, `timestamp DESC`
   - Usage: Historique d'activité utilisateur

2. **idx_audit_brand_event_timestamp**
   - Colonnes: `brandId`, `eventType`, `timestamp DESC`
   - Usage: Logs d'audit par brand et type d'événement

3. **idx_audit_resource_timestamp**
   - Colonnes: `resourceType`, `resourceId`, `timestamp DESC`
   - Usage: Historique d'une ressource spécifique

### Webhook

1. **idx_webhook_brand_event_created**
   - Colonnes: `brandId`, `event`, `createdAt DESC`
   - Usage: Webhooks par brand et type d'événement

2. **idx_webhook_brand_success_created**
   - Colonnes: `brandId`, `success`, `createdAt DESC`
   - Usage: Analyse des webhooks réussis/échoués

### EcommerceIntegration

1. **idx_ecommerce_brand_platform_status**
   - Colonnes: `brandId`, `platform`, `status`
   - Usage: Intégrations e-commerce par platform

### AICost

1. **idx_aicost_brand_provider_created**
   - Colonnes: `brandId`, `provider`, `createdAt DESC`
   - Usage: Tracking des coûts IA par provider

## Application

### Via Script

```bash
./scripts/apply-database-indexes.sh
```

### Via psql

```bash
psql $DATABASE_URL -f apps/backend/prisma/migrations/add_composite_indexes.sql
```

### Via Prisma Migrate (recommandé pour production)

```bash
# Créer une migration Prisma
npx prisma migrate dev --name add_composite_indexes --create-only

# Ajouter le contenu SQL dans la migration créée
# Puis appliquer
npx prisma migrate deploy
```

## Monitoring

### Vérifier les index créés

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### Analyser l'utilisation des index

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
```

### Identifier les index non utilisés

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
  AND idx_scan = 0
ORDER BY tablename;
```

## Impact Attendu

- **Réduction du temps de requête**: 50-90% pour les requêtes avec WHERE + ORDER BY
- **Amélioration de la scalabilité**: Support de millions d'enregistrements
- **Meilleure performance des dashboards**: Requêtes analytics plus rapides
- **Optimisation de la pagination**: Tri et filtrage plus efficaces

## Maintenance

- Les index sont automatiquement maintenus par PostgreSQL
- Surveiller la taille des index: `pg_total_relation_size('index_name')`
- Supprimer les index non utilisés si nécessaire pour réduire l'overhead d'écriture

## Notes

- Les index composites sont particulièrement efficaces pour les requêtes avec plusieurs conditions WHERE
- L'ordre des colonnes dans l'index est important (colonne la plus sélective en premier)
- Les index avec `DESC` optimisent les `ORDER BY createdAt DESC`

