# 🚀 GUIDE DE DÉPLOIEMENT - SOCLE 3D/AR + PERSONNALISATION

**Date**: Décembre 2024  
**Version**: 1.0.0

---

## ✅ PRÉ-REQUIS

### 1. Vérifications

- [ ] Schema Prisma à jour
- [ ] Migrations créées
- [ ] Workers créés
- [ ] Tests passent
- [ ] Lint OK
- [ ] Typecheck OK

### 2. Environnement

- [ ] PostgreSQL accessible
- [ ] Redis accessible
- [ ] Cloudinary/S3 configuré
- [ ] Variables d'environnement configurées

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### Phase 1 : Staging

#### 1.1 Backup Database

```bash
# Backup staging DB
pg_dump $STAGING_DATABASE_URL > backup_staging_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Appliquer Migrations

```bash
cd apps/backend

# Vérifier l'état des migrations
npx prisma migrate status

# Appliquer les migrations
npx prisma migrate deploy

# Vérifier que tout est OK
npx prisma studio
```

#### 1.3 Générer Prisma Client

```bash
npx prisma generate
```

#### 1.4 Build & Test

```bash
# Build backend
npm run build

# Tests
npm run test

# Lint
npm run lint

# Typecheck
npm run type-check
```

#### 1.5 Déployer Backend

```bash
# Selon votre plateforme (Railway, Hetzner, etc.)
# Exemple Railway:
railway up
```

#### 1.6 Vérifier

- [ ] API endpoints répondent
- [ ] Workers démarrent
- [ ] Queues BullMQ fonctionnent
- [ ] Cache Redis fonctionne
- [ ] Logs OK

---

### Phase 2 : Production

#### 2.1 Maintenance Window

**⚠️ IMPORTANT** : Planifier une fenêtre de maintenance

- Durée estimée : 15-30 minutes
- Notifier les utilisateurs si nécessaire

#### 2.2 Backup Production

```bash
# Backup production DB (CRITIQUE)
pg_dump $PRODUCTION_DATABASE_URL > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Vérifier la taille du backup
ls -lh backup_prod_*.sql
```

#### 2.3 Appliquer Migrations

```bash
cd apps/backend

# Vérifier l'état
npx prisma migrate status

# Appliquer (ATTENTION: Production)
npx prisma migrate deploy

# Vérifier
npx prisma studio
```

#### 2.4 Vérifier Données Migrées

```sql
-- Vérifier que les OrderItems ont été créés
SELECT COUNT(*) FROM "OrderItem";

-- Vérifier que les Orders existants ont des OrderItems
SELECT o.id, COUNT(oi.id) as item_count
FROM "Order" o
LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
GROUP BY o.id
HAVING COUNT(oi.id) = 0; -- Devrait être 0

-- Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('DesignSpec', 'Snapshot', 'OrderItem');
```

#### 2.5 Déployer Code

```bash
# Build
npm run build

# Déployer (selon votre plateforme)
# Railway:
railway up --service backend

# Ou Vercel:
vercel deploy --prod
```

#### 2.6 Redémarrer Workers

```bash
# Redémarrer les workers BullMQ
# Selon votre setup (PM2, systemd, etc.)
pm2 restart all
# ou
systemctl restart luneo-workers
```

#### 2.7 Vérifier Production

- [ ] Health check OK
- [ ] Endpoints API répondent
- [ ] Workers traitent les jobs
- [ ] Logs OK
- [ ] Métriques OK (Sentry, etc.)

---

## 🔍 VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Endpoints API

```bash
# Test Specs
curl -X POST https://api.luneo.com/api/v1/specs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "...", "zoneInputs": {...}}'

# Test Snapshots
curl -X POST https://api.luneo.com/api/v1/snapshots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"specHash": "..."}'

# Test Personalization
curl -X POST https://api.luneo.com/api/v1/personalization/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "...", "zoneInputs": {...}}'
```

### 2. Workers BullMQ

```bash
# Vérifier les queues (via Redis CLI ou dashboard)
redis-cli KEYS "bull:*"

# Vérifier les jobs en cours
# (via dashboard BullMQ si configuré)
```

### 3. Database

```sql
-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('DesignSpec', 'Snapshot', 'OrderItem');

-- Vérifier les index
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('DesignSpec', 'Snapshot', 'OrderItem');
```

### 4. Logs

```bash
# Vérifier les logs des workers
tail -f logs/workers.log

# Vérifier les erreurs
grep ERROR logs/*.log
```

---

## 🚨 ROLLBACK PLAN

### Si migration échoue

```bash
# 1. Restaurer le backup
psql $DATABASE_URL < backup_prod_YYYYMMDD_HHMMSS.sql

# 2. Revenir à la version précédente du code
git checkout <previous-commit>
npm run build
# Déployer
```

### Si code déployé échoue

```bash
# 1. Revenir à la version précédente
git checkout <previous-commit>
npm run build
# Déployer

# 2. Redémarrer services
pm2 restart all
```

---

## 📊 MÉTRIQUES À MONITORER

### 1. Performance

- Temps de réponse API (p50, p95, p99)
- Durée des renders
- Durée des exports

### 2. Erreurs

- Taux d'erreur API
- Taux d'échec workers
- Erreurs Sentry

### 3. Ressources

- CPU usage
- Memory usage
- Database connections
- Redis connections

### 4. Queues

- Taille des queues
- Temps d'attente
- Taux de traitement

---

## ✅ CHECKLIST FINALE

### Avant déploiement

- [ ] Backup DB créé
- [ ] Migrations testées sur staging
- [ ] Tests passent
- [ ] Code review OK
- [ ] Documentation à jour
- [ ] Plan de rollback préparé

### Après déploiement

- [ ] Migrations appliquées
- [ ] Endpoints répondent
- [ ] Workers fonctionnent
- [ ] Pas d'erreurs critiques
- [ ] Métriques OK
- [ ] Logs OK

---

## 🆘 SUPPORT

En cas de problème :

1. Vérifier les logs
2. Vérifier Sentry
3. Vérifier les métriques
4. Contacter l'équipe

---

**BON DÉPLOIEMENT ! 🚀**








