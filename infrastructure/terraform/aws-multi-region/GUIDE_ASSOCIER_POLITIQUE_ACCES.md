# Guide : Associer la politique d'accès Kubernetes aux Access Entries

## Étape finale pour activer l'accès Kubernetes

Les Access Entries ont été créées avec succès, mais il faut maintenant associer la politique d'accès Kubernetes pour donner les permissions nécessaires.

## Étapes détaillées

### Pour le cluster Primary (eu-west-1)

1. **Ouvrez la console AWS** et allez dans le service **EKS**
2. Dans le menu de gauche, cliquez sur **Clusters**
3. Cliquez sur le cluster **luneo-prod-eks-primary**
4. Cliquez sur l'onglet **Access** en haut de la page
5. Dans la section **Access entries**, vous verrez l'entrée avec le principal `arn:aws:iam::115849270532:user/191197Em.`
6. Cliquez sur cette entrée (ou sur le bouton **View details**)
7. Dans la page de détails, cliquez sur le bouton **Associate access policy**
8. Dans le formulaire qui s'ouvre :
   - **Policy**: Sélectionnez `AmazonEKSClusterAdminPolicy`
   - **Access scope**: Sélectionnez `Cluster` (ou laissez par défaut)
9. Cliquez sur **Associate**

### Pour le cluster Secondary (us-east-1)

Répétez exactement les mêmes étapes pour le cluster **luneo-prod-eks-secondary**.

## Vérification

Une fois les politiques associées, attendez 10-15 secondes, puis testez :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Vérifier l'accès au cluster primary
kubectl get nodes --context "arn:aws:eks:eu-west-1:115849270532:cluster/luneo-prod-eks-primary"

# Vérifier l'accès au cluster secondary
kubectl get nodes --context "arn:aws:eks:us-east-1:115849270532:cluster/luneo-prod-eks-secondary"
```

Si ces commandes fonctionnent et affichent les nodes, l'accès est configuré !

## Relancer Terraform

Une fois l'accès vérifié :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform apply -auto-approve
```

Les ressources Kubernetes suivantes seront créées :
- Namespaces `luneo-platform` dans les deux clusters
- Service Accounts pour l'ALB Controller
- Helm releases pour l'ALB Controller (si configuré)

## Note importante

Cette étape est **obligatoire** et ne peut pas être automatisée via CLI car la permission `eks:AssociateAccessPolicy` nécessite une propagation plus longue ou peut être bloquée par une politique Deny. La console AWS est la méthode la plus fiable pour cette dernière étape.

