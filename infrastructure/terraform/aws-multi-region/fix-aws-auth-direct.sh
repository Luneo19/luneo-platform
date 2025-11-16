#!/bin/bash
# Script pour ajouter l'utilisateur IAM au configmap aws-auth via l'API Kubernetes directe

set -e

USER_ARN="arn:aws:iam::115849270532:user/191197Em."
PRIMARY_CLUSTER="luneo-prod-eks-primary"
SECONDARY_CLUSTER="luneo-prod-eks-secondary"
PRIMARY_REGION="eu-west-1"
SECONDARY_REGION="us-east-1"

echo "🔐 Ajout de l'utilisateur IAM aux configmaps aws-auth via API Kubernetes"
echo "=========================================================================="
echo ""

add_user_to_cluster() {
  local cluster_name=$1
  local region=$2
  
  echo "📋 Traitement du cluster $cluster_name ($region)"
  
  # Obtenir les informations du cluster
  CLUSTER_INFO=$(aws eks describe-cluster --region "$region" --name "$cluster_name" --output json)
  ENDPOINT=$(echo "$CLUSTER_INFO" | jq -r '.cluster.endpoint')
  CA_CERT=$(echo "$CLUSTER_INFO" | jq -r '.cluster.certificateAuthority.data')
  
  if [ -z "$ENDPOINT" ] || [ "$ENDPOINT" == "null" ]; then
    echo "❌ Impossible d'obtenir l'endpoint du cluster"
    return 1
  fi
  
  # Obtenir le token EKS
  TOKEN=$(aws eks get-token --cluster-name "$cluster_name" --region "$region" --output json | jq -r '.status.token' 2>/dev/null || \
          aws eks get-token --cluster-name "$cluster_name" --region "$region" --output text | grep -oP 'token:\s*\K[^\s]+' 2>/dev/null || \
          aws eks get-token --cluster-name "$cluster_name" --region "$region" --query 'status.token' --output text 2>/dev/null)
  
  if [ -z "$TOKEN" ]; then
    echo "❌ Impossible d'obtenir le token EKS"
    return 1
  fi
  
  # Créer un fichier temporaire pour le certificat CA
  CA_FILE=$(mktemp)
  echo "$CA_CERT" | base64 -d > "$CA_FILE" 2>/dev/null || echo "$CA_CERT" > "$CA_FILE"
  
  # Récupérer le configmap actuel
  CONFIGMAP=$(curl -s --fail-with-body \
    --cacert "$CA_FILE" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "${ENDPOINT}/api/v1/namespaces/kube-system/configmaps/aws-auth" 2>&1) || {
    echo "⚠️  Le configmap n'existe pas encore"
    echo "💡 Création du configmap..."
    
    # Créer le configmap avec l'utilisateur
    CREATE_RESPONSE=$(curl -s --fail-with-body -X POST \
      --cacert "$CA_FILE" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"apiVersion\": \"v1\",
        \"kind\": \"ConfigMap\",
        \"metadata\": {
          \"name\": \"aws-auth\",
          \"namespace\": \"kube-system\"
        },
        \"data\": {
          \"mapUsers\": \"- userarn: $USER_ARN\\n  username: 191197Em.\\n  groups:\\n  - system:masters\\n\"
        }
      }" \
      "${ENDPOINT}/api/v1/namespaces/kube-system/configmaps" 2>&1) && {
      echo "✅ Configmap créé avec l'utilisateur"
      rm -f "$CA_FILE"
      return 0
    } || {
      echo "❌ Impossible de créer le configmap: $CREATE_RESPONSE"
      rm -f "$CA_FILE"
      return 1
    }
  }
  
  # Vérifier si l'utilisateur existe déjà
  if echo "$CONFIGMAP" | grep -q "191197Em." 2>/dev/null; then
    echo "✅ L'utilisateur est déjà présent dans le configmap"
    rm -f "$CA_FILE"
    return 0
  fi
  
  # Extraire les données actuelles
  CURRENT_MAPUSERS=$(echo "$CONFIGMAP" | jq -r '.data.mapUsers // ""' 2>/dev/null || echo "")
  CURRENT_MAPROLES=$(echo "$CONFIGMAP" | jq -r '.data.mapRoles // ""' 2>/dev/null || echo "")
  
  # Préparer les nouvelles données
  NEW_MAPUSERS="- userarn: $USER_ARN
  username: 191197Em.
  groups:
  - system:masters"
  
  if [ -n "$CURRENT_MAPUSERS" ] && [ "$CURRENT_MAPUSERS" != "null" ]; then
    NEW_MAPUSERS="$CURRENT_MAPUSERS
$NEW_MAPUSERS"
  fi
  
  # Mettre à jour le configmap
  UPDATE_RESPONSE=$(curl -s --fail-with-body -X PATCH \
    --cacert "$CA_FILE" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/merge-patch+json" \
    -d "{
      \"data\": {
        \"mapUsers\": $(echo "$NEW_MAPUSERS" | jq -Rs .),
        \"mapRoles\": $(echo "$CURRENT_MAPROLES" | jq -Rs .)
      }
    }" \
    "${ENDPOINT}/api/v1/namespaces/kube-system/configmaps/aws-auth" 2>&1) && {
    echo "✅ Utilisateur ajouté avec succès"
    rm -f "$CA_FILE"
    return 0
  } || {
    echo "❌ Impossible de mettre à jour le configmap: $UPDATE_RESPONSE"
    rm -f "$CA_FILE"
    return 1
  }
}

# Ajouter l'utilisateur aux deux clusters
add_user_to_cluster "$PRIMARY_CLUSTER" "$PRIMARY_REGION"
add_user_to_cluster "$SECONDARY_CLUSTER" "$SECONDARY_REGION"

echo ""
echo "✨ Terminé !"

