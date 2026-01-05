# Phase 1 - Migration Prisma Prête

## Date: 2024-12-19
## Migration: `20260103160147_add_saas_personalization_models`

---

## ✅ Backup Créé

**Fichier**: `apps/backend/backups/backup_20260103_160058.sql`  
**Taille**: 192K  
**Status**: ✅ Backup réussi

---

## 📋 Migration Générée

### Statistiques

- **Enums créés**: 6
  - `SubscriptionPlan`
  - `SubscriptionStatus`
  - `GenerationStatus`
  - `CustomizationType`
  - `ProductStatus`
  - `WebhookEvent`

- **Tables créées**: 6
  - `ClientSettings`
  - `CustomizationZone`
  - `Template`
  - `Generation`
  - `Invoice`
  - `UsageRecord`

- **Tables modifiées**: 4
  - `Brand` (9 nouveaux champs)
  - `Product` (18 nouveaux champs + slug)
  - `Webhook` (restructuré)
  - `WebhookLog` (simplifié)

- **Taille**: 366 lignes SQL

---

## ⚠️ Points d'Attention

### 1. Champ `slug` dans Product

Le champ `slug` est ajouté comme `NOT NULL` mais les produits existants n'ont pas de slug.

**Solution avant d'appliquer la migration**:

```sql
-- Ajouter une migration de données pour générer les slugs
UPDATE "Product" 
SET "slug" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;
```

**OU** modifier la migration pour rendre `slug` nullable temporairement, puis le remplir, puis le rendre NOT NULL.

### 2. Migration des données `Brand.settings`

Les données existantes dans `Brand.settings` (JSON) doivent être migrées vers `ClientSettings`.

**Script de migration suggéré**:

```sql
-- Créer ClientSettings pour chaque Brand qui a des settings
INSERT INTO "ClientSettings" ("id", "brandId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  NOW(),
  NOW()
FROM "Brand"
WHERE "settings" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "ClientSettings" WHERE "brandId" = "Brand"."id"
);
```

### 3. Index et contraintes

La migration crée automatiquement:
- Toutes les clés primaires
- Toutes les foreign keys
- Tous les index nécessaires
- Contrainte unique `[brandId, slug]` sur Product

---

## 🚀 Application de la Migration

### Option 1: Migration en développement (recommandé)

```bash
cd apps/backend
npx prisma migrate dev
```

Cette commande va:
1. Appliquer la migration à la base de données
2. Générer le client Prisma
3. Marquer la migration comme appliquée

### Option 2: Migration en production

```bash
cd apps/backend
npx prisma migrate deploy
```

Cette commande applique uniquement les migrations non appliquées sans régénérer le client.

### Option 3: Vérification avant application

```bash
cd apps/backend
# Vérifier l'état
npx prisma migrate status

# Tester la migration sur une base de test
npx prisma migrate deploy --preview-feature
```

---

## 📝 Prochaines Étapes

1. **Résoudre le problème du slug** (voir ci-dessus)
2. **Appliquer la migration** avec `prisma migrate dev`
3. **Générer le client Prisma**: `npx prisma generate`
4. **Vérifier** que tout fonctionne: `npx prisma studio`
5. **Passer à la Phase 2**: Backend NestJS - Module Generation

---

## 🔍 Vérification Post-Migration

Après avoir appliqué la migration, vérifier:

```sql
-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ClientSettings', 
  'CustomizationZone', 
  'Template', 
  'Generation', 
  'Invoice', 
  'UsageRecord'
);

-- Vérifier les nouveaux champs sur Brand
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Brand' 
AND column_name IN (
  'subscriptionPlan', 
  'subscriptionStatus', 
  'monthlyGenerations',
  'arEnabled'
);

-- Vérifier les nouveaux champs sur Product
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN (
  'slug',
  'promptTemplate',
  'aiProvider',
  'arEnabled'
);
```

---

**Migration prête à être appliquée** ✅

**Backup disponible**: `apps/backend/backups/backup_20260103_160058.sql`



