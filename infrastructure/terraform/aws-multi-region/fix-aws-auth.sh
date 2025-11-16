#!/bin/bash
# Script pour ajouter l'utilisateur IAM au configmap aws-auth via l'API Kubernetes

set -e

USER_ARN="arn:aws:iam::115849270532:user/191197Em."
PRIMARY_CLUSTER="luneo-prod-eks-primary"
SECONDARY_CLUSTER="luneo-prod-eks-secondary"
PRIMARY_REGION="eu-west-1"
SECONDARY_REGION="us-east-1"

echo "🔐 Ajout de l'utilisateur IAM aux configmaps aws-auth"
echo "======================================================"
echo ""

# Fonction pour obtenir le token EKS
get_eks_token() {
  local cluster_name=$1
  local region=$2
  aws eks get-token --cluster-name "$cluster_name" --region "$region" --query 'status.token' --output text 2>/dev/null || {
    aws eks get-token --cluster-name "$cluster_name" --region "$region" --output text 2>/dev/null | grep -oP 'token:\s*\K[^\s]+' || echo ""
  }
}

# Fonction pour obtenir l'endpoint du cluster
get_cluster_endpoint() {
  local cluster_name=$1
  local region=$2
  aws eks describe-cluster --region "$region" --name "$cluster_name" --query 'cluster.endpoint' --output text 2>/dev/null
}

# Fonction pour obtenir le certificat CA
get_cluster_ca() {
  local cluster_name=$1
  local region=$2
  aws eks describe-cluster --region "$region" --name "$cluster_name" --query 'cluster.certificateAuthority.data' --output text 2>/dev/null
}

# Fonction pour ajouter l'utilisateur au configmap via kubectl avec token temporaire
add_user_via_kubectl() {
  local cluster_name=$1
  local region=$2
  
  echo "📋 Traitement du cluster $cluster_name ($region)"
  
  # Obtenir le token
  TOKEN=$(get_eks_token "$cluster_name" "$region")
  ENDPOINT=$(get_cluster_endpoint "$cluster_name" "$region")
  CA_CERT=$(get_cluster_ca "$cluster_name" "$region")
  
  if [ -z "$TOKEN" ] || [ -z "$ENDPOINT" ]; then
    echo "❌ Impossible d'obtenir les informations du cluster"
    return 1
  fi
  
  # Créer un fichier temporaire pour le certificat CA
  CA_FILE=$(mktemp)
  echo "$CA_CERT" | base64 -d > "$CA_FILE" 2>/dev/null || echo "$CA_CERT" > "$CA_FILE"
  
  # Essayer d'utiliser kubectl avec le token
  KUBECONFIG_TMP=$(mktemp)
  cat > "$KUBECONFIG_TMP" <<EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $CA_CERT
    server: $ENDPOINT
  name: $cluster_name
contexts:
- context:
    cluster: $cluster_name
    user: $cluster_name-user
  name: $cluster_name-context
current-context: $cluster_name-context
users:
- name: $cluster_name-user
  user:
    token: $TOKEN
EOF
  
  # Essayer de récupérer le configmap
  kubectl --kubeconfig="$KUBECONFIG_TMP" get configmap aws-auth -n kube-system -o yaml > /tmp/aws-auth-$cluster_name.yaml 2>&1 || {
    echo "⚠️  Le configmap n'existe pas encore ou l'accès est refusé"
    echo "💡 Le configmap sera créé automatiquement par le module EKS lors du prochain terraform apply"
    rm -f "$KUBECONFIG_TMP" "$CA_FILE"
    return 1
  }
  
  # Vérifier si l'utilisateur existe déjà
  if grep -q "191197Em." /tmp/aws-auth-$cluster_name.yaml 2>/dev/null; then
    echo "✅ L'utilisateur est déjà présent dans le configmap"
    rm -f "$KUBECONFIG_TMP" "$CA_FILE"
    return 0
  fi
  
  # Ajouter l'utilisateur
  kubectl --kubeconfig="$KUBECONFIG_TMP" patch configmap aws-auth -n kube-system \
    --type merge \
    -p "{\"data\":{\"mapUsers\":\"- userarn: $USER_ARN\n  username: 191197Em.\n  groups:\n  - system:masters\n\"}}" 2>&1 && {
    echo "✅ Utilisateur ajouté avec succès"
    rm -f "$KUBECONFIG_TMP" "$CA_FILE"
    return 0
  } || {
    echo "⚠️  Impossible d'ajouter l'utilisateur automatiquement"
    echo "💡 Veuillez l'ajouter manuellement via la console AWS EKS"
    rm -f "$KUBECONFIG_TMP" "$CA_FILE"
    return 1
  }
}

# Essayer d'ajouter l'utilisateur aux deux clusters
add_user_via_kubectl "$PRIMARY_CLUSTER" "$PRIMARY_REGION" || true
add_user_via_kubectl "$SECONDARY_CLUSTER" "$SECONDARY_REGION" || true

echo ""
echo "✨ Terminé !"
echo ""
echo "💡 Si les configmaps n'ont pas pu être modifiés automatiquement,"
echo "   veuillez les modifier via la console AWS EKS :"
echo "   1. Allez dans EKS > Clusters > [nom-du-cluster] > Access"
echo "   2. Cliquez sur 'Edit config map'"
echo "   3. Ajoutez l'utilisateur IAM: $USER_ARN avec le groupe system:masters"

