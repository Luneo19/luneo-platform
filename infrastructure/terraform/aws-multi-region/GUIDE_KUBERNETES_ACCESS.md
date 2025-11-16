# Guide : Configuration de l'accès Kubernetes aux clusters EKS

## Problème

Les ressources Kubernetes ne peuvent pas être créées car l'utilisateur IAM n'a pas encore accès aux clusters EKS. Le configmap `aws-auth` doit être mis à jour pour autoriser l'utilisateur IAM.

## Solution

### Étape 1 : Installer kubectl

```bash
# macOS
brew install kubectl

# Ou via curl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Étape 2 : Mettre à jour kubeconfig

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Cluster primary (eu-west-1)
aws eks update-kubeconfig --region eu-west-1 --name luneo-prod-eks-primary

# Cluster secondary (us-east-1)
aws eks update-kubeconfig --region us-east-1 --name luneo-prod-eks-secondary
```

### Étape 3 : Ajouter l'utilisateur IAM au configmap aws-auth

#### Pour le cluster primary (eu-west-1)

```bash
# Récupérer le configmap actuel
kubectl get configmap aws-auth -n kube-system \
  --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary" \
  -o yaml > /tmp/aws-auth-primary.yaml

# Ajouter l'utilisateur IAM au configmap
kubectl patch configmap aws-auth -n kube-system \
  --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary" \
  --type merge \
  -p '{
    "data": {
      "mapUsers": "- userarn: arn:aws:iam::115849270532:user/191197Em.\n  username: 191197Em.\n  groups:\n  - system:masters\n"
    }
  }'
```

#### Pour le cluster secondary (us-east-1)

```bash
# Ajouter l'utilisateur IAM au configmap
kubectl patch configmap aws-auth -n kube-system \
  --context "arn:aws:eks:us-east-1:115849270532:cluster/luneo-prod-eks-secondary" \
  --type merge \
  -p '{
    "data": {
      "mapUsers": "- userarn: arn:aws:iam::115849270532:user/191197Em.\n  username: 191197Em.\n  groups:\n  - system:masters\n"
    }
  }'
```

### Étape 4 : Vérifier l'accès

```bash
# Vérifier l'accès au cluster primary
kubectl get nodes --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary"

# Vérifier l'accès au cluster secondary
kubectl get nodes --context "arn:aws:eks:us-east-1:115849270532:cluster/luneo-prod-eks-secondary"
```

Si ces commandes fonctionnent, vous avez accès aux clusters.

### Étape 5 : Relancer Terraform

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform apply -auto-approve
```

## Alternative : Via la console AWS

Si vous préférez utiliser la console AWS :

1. Allez dans **EKS** > **Clusters** > **luneo-prod-eks-primary**
2. Cliquez sur l'onglet **Access**
3. Cliquez sur **Add user** ou **Edit config map**
4. Ajoutez l'utilisateur IAM `191197Em.` avec le groupe `system:masters`
5. Répétez pour le cluster **luneo-prod-eks-secondary**

## Note importante

Une fois le configmap `aws-auth` mis à jour avec l'utilisateur IAM, Terraform pourra créer les ressources Kubernetes suivantes :
- Namespaces (`luneo-platform`)
- Service Accounts pour l'ALB Controller
- Helm releases pour l'ALB Controller

Ces ressources sont nécessaires pour déployer des applications sur les clusters EKS.

