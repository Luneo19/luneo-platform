# Guide : Attacher les politiques IAM à votre utilisateur

## ⚠️ Important

Votre utilisateur `191197Em.` n'a pas la permission `iam:AttachUserPolicy`. Vous devez attacher les politiques via la console AWS.

## 📋 Étapes pour attacher les politiques

### Méthode via la console AWS

1. **Connectez-vous à AWS Console** : https://console.aws.amazon.com/
2. **Allez dans IAM** → **"Personnes"** (Users)
3. **Recherchez et cliquez sur** `191197Em.`
4. **Onglet "Autorisations"** (Permissions)
5. **Cliquez sur "Ajouter des autorisations"** (Add permissions)
6. **Sélectionnez "Attacher directement des politiques"** (Attach policies directly)
7. **Dans la barre de recherche**, tapez `terraform` pour filtrer
8. **Cochez toutes les politiques** qui commencent par `terraform-` :
   - ✅ terraform-state-backend
   - ✅ terraform-infrastructure-readonly
   - ✅ terraform-vpc-networking
   - ✅ terraform-eks-management
   - ✅ terraform-rds-aurora
   - ✅ terraform-s3-artifacts
   - ✅ terraform-route53-dns
   - ✅ terraform-cloudwatch-monitoring
   - ✅ terraform-backup-management
   - ✅ terraform-iam-management
9. **Cliquez sur "Suivant"** (Next)
10. **Cliquez sur "Ajouter des autorisations"** (Add permissions)

## ✅ Vérification

Après avoir attaché les politiques, attendez **1-2 minutes** pour la propagation, puis testez :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Test des permissions de base
aws ec2 describe-availability-zones --region eu-west-1
aws route53 list-hosted-zones

# Test Terraform
terraform plan -out tfplan
```

## 🔍 Si les politiques ne sont pas visibles

Si vous ne voyez pas les politiques dans la liste :

1. **Vérifiez les noms exacts** : Les politiques doivent avoir exactement ces noms :
   - `terraform-state-backend`
   - `terraform-infrastructure-readonly`
   - `terraform-vpc-networking`
   - `terraform-eks-management`
   - `terraform-rds-aurora`
   - `terraform-s3-artifacts`
   - `terraform-route53-dns`
   - `terraform-cloudwatch-monitoring`
   - `terraform-backup-management`
   - `terraform-iam-management`

2. **Vérifiez qu'elles existent** : IAM → Politiques → Recherchez `terraform`

3. **Si elles ont des noms différents**, notez les noms exacts et attachez-les quand même

## 📝 Note

Si vous avez créé les politiques avec des noms légèrement différents (par exemple avec des majuscules ou des tirets différents), attachez-les quand même. L'important est que les permissions soient présentes.

