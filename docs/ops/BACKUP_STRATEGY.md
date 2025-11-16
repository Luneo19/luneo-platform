# Stratégie de sauvegarde

## 1. Objectifs

- Sauvegarder quotidiennement les données critiques (PostgreSQL, Redis, fichiers uploadés).  
- Stockage chiffré sur S3 (`s3://luneo-backups/<env>/<date>`).  
- Rétention : 30 jours rolling, avec snapshot mensuel conservé 12 mois.  
- Tests de restauration trimestriels (automatic DR drill).

## 2. Automatisation AWS (production)

- **Terraform** provisionne :
  - `aws_backup_vault` (primaire + copie secondaire) chiffrés KMS.
  - `aws_backup_plan` quotidien (`var.backup_schedule`, défaut `0 2 * * *`).
  - `aws_backup_selection` couvrant le cluster Aurora et le bucket `artifacts`.
  - Règle de copie cross-région (vers `us-east-1`) avec même rétention (`var.backup_retention_days`).
- **S3** : versioning + transition GLACIER après 30 jours, purge à 12 mois.
- **Restauration** :
  - `aws backup list-recovery-points-by-resource --resource-arn <arn>` pour identifier le snapshot.
  - `aws backup start-restore-job --recovery-point-arn ...` (Aurora) ou `aws s3 cp` (objets).
- Les politiques sont décrites dans `infrastructure/terraform/aws-multi-region/main.tf`.
- Monitorer via AWS Backup → event bridge + Slack (à intégrer).

## 3. Script local

```
DATABASE_URL="postgresql://user:pass@host:5432/db" \
REDIS_URL="rediss://:pass@host:6379/0" \
UPLOADS_DIR="apps/frontend/public/uploads" \
BACKUP_ROOT="backups" \
bash scripts/backup/run-backup.sh
```

Produits :
- `backups/<timestamp>/postgres.sql.gz`
- `backups/<timestamp>/redis.rdb`
- `backups/<timestamp>/uploads.tar.gz`

À exécuter avant toute migration majeure ou en préprod (backup ad hoc).

## 4. Automatisation (Kubernetes / CronJob)

Extrait Helm :

```yaml
schedule: "0 2 * * *"
jobTemplate:
  spec:
    template:
      spec:
        containers:
          - name: backup
            image: ghcr.io/luneo/backup-runner:latest
            envFrom:
              - secretRef:
                  name: backup-secrets
            command: ["bash", "scripts/backup/run-backup.sh"]
            args: ["${DATABASE_URL}"]
```

Variables stockées dans `backup-secrets` :
- `DATABASE_URL`
- `REDIS_URL`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET=luneo-backups`

Upload S3 post-script :

```bash
aws s3 sync "${OUTPUT_DIR}" "s3://${S3_BUCKET}/${ENV}/${TIMESTAMP}/" --sse AES256
```

## 5. Restauration

```
gunzip -c postgres.sql.gz | psql ${DATABASE_URL}
redis-cli -u ${REDIS_URL} --pipe < redis.rdb
tar -xzf uploads.tar.gz -C apps/frontend/public
```

Les procédures complètes (AWS Backup + scripts) seront détaillées dans `docs/ops/DISASTER_RECOVERY.md`.

## 6. Gouvernance

- Alertes Slack en cas d’échec (Github Actions & CronJob).  
- Revue mensuelle des rapports (monitoring S3 / CloudWatch).  
- Tableur de suivi : horodatages, opérateur, notes de restauration.  
- Alignement RGPD : suppression des exports dépassant la rétention.

