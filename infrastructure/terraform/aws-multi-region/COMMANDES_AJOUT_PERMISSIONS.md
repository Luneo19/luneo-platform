# Commandes pour ajouter les permissions EKS Access Entry

## Politique complète créée

Le fichier `iam-policies/00-terraform-iam-policy-management-complete.json` contient toutes les permissions nécessaires, y compris :

- ✅ Permissions IAM complètes
- ✅ Permissions EKS Access Entry (CreateAccessEntry, ListAccessEntries, etc.)
- ✅ Permissions EKS Cluster Access
- ✅ Permissions OIDC Provider

## Étapes pour appliquer

### Option 1 : Mettre à jour une politique existante

Si vous avez une politique attachée à votre utilisateur, mettez-la à jour :

```bash
# Trouver le nom de la politique
aws iam list-attached-user-policies --user-name 191197Em. --output table

# Mettre à jour la politique (remplacer POLICY_ARN par l'ARN réel)
aws iam create-policy-version \
  --policy-arn POLICY_ARN \
  --policy-document file://iam-policies/00-terraform-iam-policy-management-complete.json \
  --set-as-default
```

### Option 2 : Créer une nouvelle politique et l'attacher

```bash
# Créer la politique
aws iam create-policy \
  --policy-name terraform-eks-access-management \
  --policy-document file://iam-policies/00-terraform-iam-policy-management-complete.json

# Attacher à l'utilisateur (remplacer POLICY_ARN par l'ARN retourné)
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn POLICY_ARN
```

### Option 3 : Via la console AWS

1. Allez dans **IAM** > **Policies**
2. Créez une nouvelle politique ou modifiez une existante
3. Copiez le contenu de `iam-policies/00-terraform-iam-policy-management-complete.json`
4. Attachez-la à l'utilisateur `191197Em.`

## Après avoir ajouté les permissions

Une fois les permissions ajoutées, attendez 30-60 secondes pour la propagation, puis :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Créer les Access Entries pour les clusters EKS
aws eks create-access-entry \
  --cluster-name luneo-prod-eks-primary \
  --region eu-west-1 \
  --principal-arn "arn:aws:iam::115849270532:user/191197Em." \
  --kubernetes-groups system:masters

aws eks create-access-entry \
  --cluster-name luneo-prod-eks-secondary \
  --region us-east-1 \
  --principal-arn "arn:aws:iam::115849270532:user/191197Em." \
  --kubernetes-groups system:masters

# Vérifier l'accès
kubectl get nodes --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary"
kubectl get nodes --context "arn:aws:eks:us-east-1:115849270532:cluster/luneo-prod-eks-secondary"

# Relancer Terraform
terraform apply -auto-approve
```

