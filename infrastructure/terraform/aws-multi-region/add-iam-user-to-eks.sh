#!/bin/bash
# Script pour ajouter l'utilisateur IAM aux clusters EKS

set -e

USER_ARN="arn:aws:iam::115849270532:user/191197Em."
PRIMARY_CLUSTER="luneo-prod-eks-primary"
SECONDARY_CLUSTER="luneo-prod-eks-secondary"
PRIMARY_REGION="eu-west-1"
SECONDARY_REGION="us-east-1"

echo "🔐 Ajout de l'utilisateur IAM aux clusters EKS"
echo "=============================================="
echo ""

# Fonction pour ajouter un utilisateur au configmap aws-auth
add_user_to_cluster() {
  local cluster_name=$1
  local region=$2
  
  echo "📋 Mise à jour du configmap aws-auth pour $cluster_name ($region)"
  
  # Récupérer le configmap actuel
  kubectl get configmap aws-auth -n kube-system --context "arn:aws:eks:${region}:115849270532:cluster/${cluster_name}" -o yaml > /tmp/aws-auth-${cluster_name}.yaml 2>&1 || {
    echo "⚠️  Le configmap aws-auth n'existe pas encore, création..."
    kubectl create configmap aws-auth -n kube-system --context "arn:aws:eks:${region}:115849270532:cluster/${cluster_name}" --from-literal=mapUsers='[]' 2>&1 || true
    kubectl get configmap aws-auth -n kube-system --context "arn:aws:eks:${region}:115849270532:cluster/${cluster_name}" -o yaml > /tmp/aws-auth-${cluster_name}.yaml 2>&1
  }
  
  # Vérifier si l'utilisateur existe déjà
  if grep -q "191197Em." /tmp/aws-auth-${cluster_name}.yaml; then
    echo "✅ L'utilisateur est déjà présent dans le configmap"
    return 0
  fi
  
  # Ajouter l'utilisateur au configmap
  kubectl patch configmap aws-auth -n kube-system \
    --context "arn:aws:eks:${region}:115849270532:cluster/${cluster_name}" \
    --type merge \
    -p "{\"data\":{\"mapUsers\":\"[{\\\"userarn\\\":\\\"${USER_ARN}\\\",\\\"username\\\":\\\"191197Em.\\\",\\\"groups\\\":[\\\"system:masters\\\"]}]\"}}" 2>&1 || {
    echo "⚠️  Méthode patch échouée, tentative avec edit..."
    # Alternative: utiliser kubectl edit ou apply
    cat > /tmp/aws-auth-patch.yaml <<EOF
data:
  mapUsers: |
    - userarn: ${USER_ARN}
      username: 191197Em.
      groups:
        - system:masters
EOF
    kubectl patch configmap aws-auth -n kube-system \
      --context "arn:aws:eks:${region}:115849270532:cluster/${cluster_name}" \
      --patch-file /tmp/aws-auth-patch.yaml 2>&1 || {
      echo "❌ Impossible d'ajouter l'utilisateur automatiquement"
      echo "💡 Veuillez l'ajouter manuellement via:"
      echo "   kubectl edit configmap aws-auth -n kube-system --context \"arn:aws:eks:${region}:115849270532:cluster/${cluster_name}\""
      return 1
    }
  }
  
  echo "✅ Utilisateur ajouté avec succès"
}

# Mettre à jour kubeconfig
echo "🔄 Mise à jour de kubeconfig..."
aws eks update-kubeconfig --region ${PRIMARY_REGION} --name ${PRIMARY_CLUSTER} 2>&1
aws eks update-kubeconfig --region ${SECONDARY_REGION} --name ${SECONDARY_CLUSTER} 2>&1

# Ajouter l'utilisateur aux deux clusters
add_user_to_cluster ${PRIMARY_CLUSTER} ${PRIMARY_REGION}
add_user_to_cluster ${SECONDARY_CLUSTER} ${SECONDARY_REGION}

echo ""
echo "✨ Terminé !"
echo ""
echo "💡 Vérification:"
echo "   kubectl get nodes --context \"arn:aws:eks:${PRIMARY_REGION}:115849270532:cluster/${PRIMARY_CLUSTER}\""
echo "   kubectl get nodes --context \"arn:aws:eks:${SECONDARY_REGION}:115849270532:cluster/${SECONDARY_CLUSTER}\""

