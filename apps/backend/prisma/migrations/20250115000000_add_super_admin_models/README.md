# Migration: Add Super Admin Models

**Date**: 2025-01-15  
**Description**: Ajout de tous les modèles nécessaires pour le Super Admin Dashboard

## Modèles Ajoutés

### Gestion Clients
- `Customer` - Métriques clients (LTV, engagement, churn risk)
- `CustomerActivity` - Tracking activité clients
- `CustomerSegment` - Segments dynamiques

### Email Marketing
- `EmailTemplate` - Templates d'emails
- `EmailCampaign` - Campagnes email
- `EmailAutomation` - Automations email
- `AutomationStep` - Étapes d'automation
- `AutomationRun` - Exécutions d'automation
- `EmailLog` - Logs d'envois

### Intégrations Ads
- `AdPlatformConnection` - Connexions plateformes (Meta, Google, TikTok)
- `AdCampaignSync` - Synchronisation campagnes ads

### Webhooks & Events
- `Event` - Système d'événements
- Extension de `WebhookLog` avec relation `eventId`

### Analytics
- `DailyMetrics` - Snapshots quotidiens
- `MonthlyMetrics` - Snapshots mensuels
- `CohortData` - Données cohortes

### Admin
- `AdminNotification` - Notifications admin
- `AdminAuditLog` - Logs d'audit actions admin

## Relations Ajoutées

- `User.customer` - Relation 1:1 avec Customer
- `WebhookLog.eventRelation` - Relation avec Event
- Toutes les relations nécessaires entre les nouveaux modèles

## Index Créés

Tous les index nécessaires pour optimiser les requêtes ont été créés, notamment :
- Index sur `Customer.userId`, `churnRisk`, `lastSeenAt`
- Index composites sur `CustomerActivity(customerId, createdAt)`
- Index sur `Event(type, createdAt)`, `(customerId, createdAt)`, `(processed, createdAt)`
- Et bien d'autres...

## Notes Importantes

⚠️ **IMPORTANT**: Cette migration doit être appliquée avec précaution :

1. **Vérifier la connexion DB** avant d'appliquer
2. **Sauvegarder la base de données** avant migration
3. **Appliquer en environnement de développement** d'abord
4. **Vérifier les contraintes** après application

## Application de la Migration

```bash
# Option 1: Via Prisma Migrate (recommandé)
cd apps/backend
npx prisma migrate deploy

# Option 2: Via SQL direct (si migrate ne fonctionne pas)
psql $DATABASE_URL -f prisma/migrations/20250115000000_add_super_admin_models/migration.sql

# Après migration, régénérer le client Prisma
npx prisma generate
```

## Vérification Post-Migration

```bash
# Vérifier que les tables existent
npx prisma studio

# Vérifier les relations
npx prisma validate
```

## Rollback

Si nécessaire, le rollback peut être effectué en supprimant les tables créées dans l'ordre inverse des dépendances.
