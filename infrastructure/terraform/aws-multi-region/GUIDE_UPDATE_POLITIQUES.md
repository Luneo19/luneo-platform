# Guide : Mettre à jour les politiques IAM

## 🎯 Objectif

Mettre à jour les politiques IAM existantes avec les nouvelles permissions nécessaires pour Terraform.

## 📋 Méthode 1 : Script automatique (recommandé)

Un script a été créé pour automatiser la mise à jour :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
./update-policies.sh
```

Ce script va :
1. Vérifier que chaque politique existe
2. Créer une nouvelle version de chaque politique avec le JSON mis à jour
3. Définir la nouvelle version comme version par défaut
4. Gérer automatiquement la limite de 5 versions par politique

## 📋 Méthode 2 : Via AWS CLI (manuelle)

Pour chaque politique à mettre à jour :

### Étape 1 : Vérifier la politique existe

```bash
aws iam get-policy --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management
```

### Étape 2 : Créer une nouvelle version

```bash
# Exemple pour terraform-backup-management
aws iam create-policy-version \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management \
  --policy-document file://iam-policies/09-terraform-backup-management.json \
  --set-as-default
```

### Étape 3 : Si limite de versions atteinte

Si vous avez déjà 5 versions, supprimez d'abord une ancienne version :

```bash
# Lister les versions
aws iam list-policy-versions \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management

# Supprimer une ancienne version (remplacez VERSION_ID)
aws iam delete-policy-version \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management \
  --version-id v1
```

Puis créez la nouvelle version.

## 📋 Méthode 3 : Via la console AWS

1. **AWS Console** → **IAM** → **Politiques**
2. Recherchez la politique (ex: `terraform-backup-management`)
3. Cliquez sur la politique
4. Onglet **"Versions"**
5. Cliquez sur **"Créer une version"**
6. Onglet **"JSON"**
7. **Copiez-collez** le contenu du fichier JSON depuis `iam-policies/`
8. Cliquez sur **"Créer une version"**
9. **Cochez** "Définir comme version par défaut"
10. Cliquez sur **"Créer une version"**

## 📝 Liste des politiques à mettre à jour

| # | Nom de la politique | Fichier JSON |
|---|---------------------|--------------|
| 1 | `terraform-backup-management` | `09-terraform-backup-management.json` |
| 2 | `terraform-s3-artifacts` | `06-terraform-s3-artifacts.json` |
| 3 | `terraform-cloudwatch-monitoring` | `08-terraform-cloudwatch-monitoring.json` |
| 4 | `terraform-vpc-networking` | `03-terraform-vpc-networking.json` |
| 5 | `terraform-iam-management` | `10-terraform-iam-management.json` |

## ✅ Vérification après mise à jour

Vérifiez que les politiques ont été mises à jour :

```bash
# Vérifier la version par défaut
aws iam get-policy \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management \
  --query 'Policy.DefaultVersionId' \
  --output text

# Voir le contenu de la version par défaut
aws iam get-policy-version \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management \
  --version-id v$(aws iam get-policy --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management --query 'Policy.DefaultVersionId' --output text | sed 's/v//')
```

## 🚀 Après la mise à jour

Une fois toutes les politiques mises à jour, attendez **1-2 minutes** pour la propagation, puis :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform plan -out tfplan
terraform apply tfplan
```

## ⚠️ Notes importantes

1. **Limite de versions** : AWS limite à 5 versions par politique. Le script gère automatiquement cette limite.

2. **Propagation** : Les changements peuvent prendre jusqu'à 5 minutes pour se propager.

3. **Rollback** : Si nécessaire, vous pouvez toujours revenir à une version précédente via la console AWS.

4. **Sécurité** : Les nouvelles permissions sont ajoutées, aucune permission n'est retirée.

