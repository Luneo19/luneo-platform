# Guide : Création des politiques IAM via la console AWS

## ⚠️ Important

Votre utilisateur `191197Em.` n'a pas la permission `iam:CreatePolicy`. Vous devez créer les politiques via la console AWS ou demander à un administrateur de le faire.

## 📋 Étapes pour créer chaque politique

### Méthode rapide (recommandée)

1. **Ouvrez AWS Console** : https://console.aws.amazon.com/
2. **Allez dans IAM** → **"Politiques"** (Policies) → **"Créer une politique"** (Create policy)
3. **Cliquez sur l'onglet "JSON"**
4. **Copiez-collez le contenu** du fichier JSON correspondant depuis le dossier `iam-policies/`
5. **Cliquez sur "Suivant"**
6. **Nommez la politique** (ex: `terraform-state-backend`)
7. **Ajoutez une description** (ex: "Permissions pour le backend Terraform")
8. **Cliquez sur "Créer une politique"**
9. **Répétez pour les 10 politiques**

---

## 📝 Liste des politiques à créer

### 1. terraform-state-backend
- **Fichier** : `iam-policies/01-terraform-state-backend.json`
- **Description** : Permissions pour le backend Terraform (S3 + DynamoDB)

### 2. terraform-infrastructure-readonly
- **Fichier** : `iam-policies/02-terraform-infrastructure-readonly.json`
- **Description** : Permissions en lecture seule pour découvrir les ressources AWS

### 3. terraform-vpc-networking
- **Fichier** : `iam-policies/03-terraform-vpc-networking.json`
- **Description** : Permissions pour créer et gérer les VPC et réseaux

### 4. terraform-eks-management
- **Fichier** : `iam-policies/04-terraform-eks-management.json`
- **Description** : Permissions pour créer et gérer les clusters EKS

### 5. terraform-rds-aurora
- **Fichier** : `iam-policies/05-terraform-rds-aurora.json`
- **Description** : Permissions pour créer et gérer les clusters Aurora PostgreSQL

### 6. terraform-s3-artifacts
- **Fichier** : `iam-policies/06-terraform-s3-artifacts.json`
- **Description** : Permissions pour créer et gérer les buckets S3 d'artifacts

### 7. terraform-route53-dns
- **Fichier** : `iam-policies/07-terraform-route53-dns.json`
- **Description** : Permissions pour gérer les enregistrements DNS et health checks

### 8. terraform-cloudwatch-monitoring
- **Fichier** : `iam-policies/08-terraform-cloudwatch-monitoring.json`
- **Description** : Permissions pour créer des alarmes et métriques CloudWatch

### 9. terraform-backup-management
- **Fichier** : `iam-policies/09-terraform-backup-management.json`
- **Description** : Permissions pour créer et gérer les plans de sauvegarde AWS Backup

### 10. terraform-iam-management
- **Fichier** : `iam-policies/10-terraform-iam-management.json`
- **Description** : Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS

---

## 🔗 Attacher les politiques à l'utilisateur

Une fois toutes les politiques créées :

1. **IAM** → **"Personnes"** (Users) → **`191197Em.`**
2. **Onglet "Autorisations"** (Permissions)
3. **Cliquez sur "Ajouter des autorisations"** (Add permissions)
4. **Sélectionnez "Attacher directement des politiques"** (Attach policies directly)
5. **Recherchez et cochez toutes les politiques** `terraform-*` créées
6. **Cliquez sur "Suivant"** puis **"Ajouter des autorisations"**

---

## ✅ Vérification

Après avoir créé et attaché toutes les politiques, testez :

```bash
# Vérifier les politiques attachées
aws iam list-attached-user-policies --user-name 191197Em.

# Tester les permissions
aws ec2 describe-availability-zones --region eu-west-1
aws route53 list-hosted-zones

# Tester Terraform
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform plan -out tfplan
```

---

## 🚀 Alternative : Script pour attacher uniquement

Si les politiques sont déjà créées par un administrateur, vous pouvez utiliser ce script pour les attacher :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Liste des noms de politiques
POLICIES=(
  "terraform-state-backend"
  "terraform-infrastructure-readonly"
  "terraform-vpc-networking"
  "terraform-eks-management"
  "terraform-rds-aurora"
  "terraform-s3-artifacts"
  "terraform-route53-dns"
  "terraform-cloudwatch-monitoring"
  "terraform-backup-management"
  "terraform-iam-management"
)

ACCOUNT_ID="115849270532"
USER_NAME="191197Em."

for policy_name in "${POLICIES[@]}"; do
  echo "Attachement de: $policy_name"
  aws iam attach-user-policy \
    --user-name "$USER_NAME" \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
done
```

