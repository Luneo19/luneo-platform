# Guide : Ajouter l'utilisateur IAM au configmap aws-auth via la console AWS

## Problème

L'utilisateur IAM `191197Em.` doit être ajouté au configmap `aws-auth` dans chaque cluster EKS pour permettre à Terraform de créer les ressources Kubernetes.

## Solution via la console AWS

### Étape 1 : Accéder au cluster EKS Primary (eu-west-1)

1. Ouvrez la **console AWS** et allez dans le service **EKS**
2. Cliquez sur **Clusters** dans le menu de gauche
3. Sélectionnez le cluster **luneo-prod-eks-primary**
4. Cliquez sur l'onglet **Access** en haut de la page
5. Vous verrez une section **ConfigMap** avec le contenu actuel

### Étape 2 : Modifier le configmap pour le cluster Primary

1. Dans la section **ConfigMap**, cliquez sur **Edit config map**
2. Vous verrez le contenu YAML du configmap `aws-auth`
3. Ajoutez l'utilisateur IAM dans la section `mapUsers` :

```yaml
apiVersion: v1
data:
  mapRoles: |
    # Les rôles des node groups sont déjà présents ici
  mapUsers: |
    - userarn: arn:aws:iam::115849270532:user/191197Em.
      username: 191197Em.
      groups:
        - system:masters
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
```

4. Cliquez sur **Save changes**

### Étape 3 : Répéter pour le cluster Secondary (us-east-1)

1. Retournez à la liste des clusters EKS
2. Sélectionnez le cluster **luneo-prod-eks-secondary**
3. Répétez les étapes 1-2 ci-dessus

### Étape 4 : Vérifier l'accès

Une fois les configmaps modifiés, vérifiez l'accès avec :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Cluster primary
kubectl get nodes --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary"

# Cluster secondary
kubectl get nodes --context "arn:aws:eks:us-east-1:115849270532:cluster/luneo-prod-eks-secondary"
```

Si ces commandes fonctionnent, vous avez accès aux clusters.

### Étape 5 : Activer les ressources Kubernetes dans Terraform

1. Modifiez `terraform.tfvars` :
   ```hcl
   create_kubernetes_resources = true
   ```

2. Relancez Terraform :
   ```bash
   terraform apply -auto-approve
   ```

## Alternative : Via AWS CLI (si vous avez un compte admin)

Si vous avez un compte administrateur AWS avec accès complet, vous pouvez utiliser :

```bash
# Installer kubectl si ce n'est pas déjà fait
brew install kubectl

# Mettre à jour kubeconfig
aws eks update-kubeconfig --region eu-west-1 --name luneo-prod-eks-primary
aws eks update-kubeconfig --region us-east-1 --name luneo-prod-eks-secondary

# Ajouter l'utilisateur au configmap (nécessite un compte avec accès)
kubectl patch configmap aws-auth -n kube-system \
  --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary" \
  --type merge \
  -p '{"data":{"mapUsers":"- userarn: arn:aws:iam::115849270532:user/191197Em.\n  username: 191197Em.\n  groups:\n  - system:masters\n"}}'

kubectl patch configmap aws-auth -n kube-system \
  --context "arn:aws:eks:us-east-1:115849270532:cluster/luneo-prod-eks-secondary" \
  --type merge \
  -p '{"data":{"mapUsers":"- userarn: arn:aws:iam::115849270532:user/191197Em.\n  username: 191197Em.\n  groups:\n  - system:masters\n"}}'
```

## Note importante

Cette étape est **obligatoire** pour que Terraform puisse créer les ressources Kubernetes suivantes :
- Namespaces (`luneo-platform`)
- Service Accounts pour l'ALB Controller
- Helm releases pour l'ALB Controller

Sans cette configuration, Terraform ne pourra pas accéder aux clusters EKS pour créer ces ressources.

