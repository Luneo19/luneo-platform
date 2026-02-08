# AGENT-18: Infrastructure Hardening

**Objectif**: Renforcer l'infrastructure pour la production : backups DB, secrets management, CI/CD, monitoring avance

**Priorité**: P1  
**Complexité**: 3/5  
**Estimation**: 2-3 semaines (multi-phase)  
**Dépendances**: Aucune

---

## 📋 SCOPE

### Couverture

Cet agent couvre 3 chantiers du plan :
- **B6** : Backup DB + secrets management (Phase B)
- **C1** : CI/CD production (Phase C)
- **C3** : Monitoring et alerting avance (Phase C)

### Fichiers Cles

- `.github/workflows/deploy-production.yml` - Deploiement production (actuellement `if: false`)
- `.github/workflows/deploy-staging.yml` - Deploiement staging
- `apps/backend/src/modules/health/health.controller.ts` - Health checks
- `monitoring/` - Dashboards Grafana, alertes Prometheus
- `apps/backend/src/config/configuration.ts` - Configuration centralisee

---

## ✅ TÂCHES

### Phase 1: Backup DB et Connection Pooling (3-5 jours)

- [ ] Configurer pg_dump automatise (cron job Railway ou script)
- [ ] Documenter procedure de restauration (playbook)
- [ ] Configurer connection pooling explicite dans Prisma (pool size, timeout)
- [ ] Ajouter monitoring des connexions DB actives dans health check
- [ ] Tester backup/restore sur environnement staging

### Phase 2: Secrets Management (2-3 jours)

- [ ] Documenter toutes les variables d'environnement sensibles
- [ ] Creer une procedure de rotation pour : JWT_SECRET, STRIPE_SECRET_KEY, API keys
- [ ] Ajouter validation des env vars critiques au demarrage (`main.ts`)
- [ ] Verifier que `.env.example` est complet et a jour
- [ ] Ajouter des alertes si des secrets approchent de l'expiration

### Phase 3: CI/CD Production (5-8 jours)

- [ ] Activer `deploy-production.yml` (remplacer `if: false` par conditions reelles)
- [ ] Ajouter health check post-deploiement avec rollback automatique
- [ ] Implementer strategie canary (10% -> 50% -> 100% du trafic)
- [ ] Ajouter notifications Slack/Discord sur deploiement (succes/echec)
- [ ] Ajouter etape de smoke tests post-deploiement
- [ ] Configurer protection de branche `main` (require PR + CI pass)

### Phase 4: Monitoring et Alerting (5-8 jours)

- [ ] Connecter Prometheus a un canal Slack pour les alertes critiques
- [ ] Definir SLA/SLO formels : 99.9% uptime, <200ms P95 latence API, <500ms P95 page load
- [ ] Configurer uptime monitoring externe (BetterStack ou UptimeRobot)
- [ ] Rendre SENTRY_DSN obligatoire en production (fail si absent)
- [ ] Ajouter dashboards Grafana pour : requetes/sec, latence P50/P95/P99, erreurs 5xx, DB connections
- [ ] Configurer alertes sur : error rate >1%, latence P95 >500ms, DB connections >80%

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Script Backup DB

```bash
#!/bin/bash
# scripts/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="luneo_backup_${DATE}.sql.gz"

pg_dump $DATABASE_URL | gzip > /backups/$BACKUP_FILE

# Upload vers S3/Cloudinary
aws s3 cp /backups/$BACKUP_FILE s3://luneo-backups/$BACKUP_FILE

# Cleanup backups > 30 jours
find /backups -name "*.sql.gz" -mtime +30 -delete
```

### Health Check Ameliore

```typescript
@Get('readiness')
async readiness() {
  const checks = {
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
    stripe: await this.checkStripe(),
    diskSpace: await this.checkDiskSpace(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  return { status: healthy ? 'ok' : 'degraded', checks };
}
```

### Workflow Deploy Production

```yaml
# .github/workflows/deploy-production.yml
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: pnpm test
      - name: Deploy to Railway
        run: railway up --service backend
      - name: Health check
        run: |
          sleep 30
          curl -f https://api.luneo.io/health/readiness || exit 1
      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **Backup DB** automatise et teste (restauration validee)
- [ ] **CI/CD** deploie automatiquement sur push to main
- [ ] **Rollback** automatique fonctionne si health check echoue
- [ ] **Alertes** Slack configurees pour erreurs critiques
- [ ] **SLO** definis et monitores
- [ ] **Uptime monitoring** externe operationnel

---

## 🔗 RESSOURCES

- Workflows CI : `.github/workflows/`
- Monitoring : `monitoring/`
- Health checks : `apps/backend/src/modules/health/`
- Config : `apps/backend/src/config/configuration.ts`

---

## 📝 NOTES

- Ne pas deployer en production sans backup DB fonctionnel
- Les canary deployments necessitent un load balancer (Railway ou Vercel)
- Les SLO doivent etre revus mensuellement
- Documenter chaque procedure dans `docs/`
