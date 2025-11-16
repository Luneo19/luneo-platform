# Mise à jour des politiques IAM

## ✅ Fichiers JSON mis à jour

Les fichiers JSON suivants ont été mis à jour avec les permissions manquantes :

1. **09-terraform-backup-management.json** - Ajout de `backup-storage:*`
2. **06-terraform-s3-artifacts.json** - Ajout de `s3:GetBucketCORS`, `PutBucketCORS`, `DeleteBucketCORS`
3. **08-terraform-cloudwatch-monitoring.json** - Ajout de `logs:ListTagsForResource`, `TagResource`, `UntagResource`
4. **03-terraform-vpc-networking.json** - Ajout de `ec2:DescribeVpcAttribute`
5. **10-terraform-iam-management.json** - Ajout des patterns `primary-*`, `secondary-*`, `primary_spot-*`, `secondary_spot-*`

## 📋 Actions requises

### 1. Mettre à jour les politiques dans AWS

Pour chaque politique mise à jour :

1. **AWS Console** → **IAM** → **Politiques**
2. Recherchez la politique (ex: `terraform-backup-management`)
3. Cliquez sur **"Modifier"** → Onglet **"JSON"**
4. **Copiez-collez le nouveau contenu** depuis le fichier JSON correspondant dans `iam-policies/`
5. Cliquez sur **"Vérifier la politique"** puis **"Enregistrer les modifications"**

### 2. Vérifier la version RDS

La version du moteur RDS a été mise à jour de `15.3` à `14.13` dans `variables.tf` car la version 15.3 ne supporte pas les clusters globaux.

Si vous préférez une autre version, vérifiez d'abord qu'elle supporte les clusters globaux :
```bash
aws rds describe-db-engine-versions \
  --engine aurora-postgresql \
  --query 'DBEngineVersions[?SupportsGlobalDatabases==`true`].EngineVersion' \
  --output table
```

### 3. Relancer Terraform

Après avoir mis à jour les politiques :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform plan -out tfplan
terraform apply tfplan
```

## 📝 Liste des politiques à mettre à jour

- [ ] terraform-backup-management
- [ ] terraform-s3-artifacts
- [ ] terraform-cloudwatch-monitoring
- [ ] terraform-vpc-networking
- [ ] terraform-iam-management

## ⚠️ Note

Certaines ressources ont déjà été créées avec succès lors de la première tentative :
- ✅ Health checks Route53
- ✅ Enregistrements DNS
- ✅ Clés KMS
- ✅ Rôles IAM de base
- ✅ VPCs (partiellement)

Terraform reprendra là où il s'est arrêté lors du prochain `apply`.

