#!/bin/bash

# Script pour configurer et tester S3
# Usage: ./scripts/configure-s3.sh

set -e

echo "☁️  Configuration S3 pour Storage"
echo "==================================="
echo ""

# Vérifier AWS CLI
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI non installé"
    echo "   Installation: brew install awscli (macOS)"
    echo "   Ou: pip install awscli"
    echo ""
    echo "📝 Configuration manuelle:"
    echo "   - Créer un bucket S3"
    echo "   - Configurer les credentials"
    echo "   - Configurer CORS"
    exit 0
fi

echo "✅ AWS CLI disponible"
echo ""

# Demander les credentials
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "AWS Region (ex: eu-west-1): " AWS_REGION
read -p "S3 Bucket Name: " BUCKET_NAME

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_REGION

echo ""
echo "🔍 Vérification des credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ Credentials valides"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "   Account ID: $ACCOUNT_ID"
else
    echo "❌ Credentials invalides"
    exit 1
fi

echo ""
echo "📦 Vérification du bucket..."
if aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo "✅ Bucket existe: $BUCKET_NAME"
else
    echo "⚠️  Bucket n'existe pas"
    read -p "Voulez-vous créer le bucket? (oui/non): " create_bucket
    if [ "$create_bucket" = "oui" ]; then
        if [ "$AWS_REGION" = "us-east-1" ]; then
            aws s3 mb "s3://$BUCKET_NAME"
        else
            aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
        fi
        echo "✅ Bucket créé: $BUCKET_NAME"
    else
        echo "❌ Bucket requis pour continuer"
        exit 1
    fi
fi

echo ""
echo "🔒 Configuration CORS..."
CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "$CORS_CONFIG" > /tmp/cors.json
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/cors.json
rm /tmp/cors.json
echo "✅ CORS configuré"

echo ""
echo "📋 Configuration des politiques..."
POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

echo "$POLICY" > /tmp/policy.json
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/policy.json
rm /tmp/policy.json
echo "✅ Politique configurée (lecture publique)"

echo ""
echo "🧪 Test d'upload..."
TEST_FILE="/tmp/s3-test-$(date +%s).txt"
echo "Test file created at $(date)" > "$TEST_FILE"
TEST_KEY="test/$(basename $TEST_FILE)"

if aws s3 cp "$TEST_FILE" "s3://$BUCKET_NAME/$TEST_KEY" &> /dev/null; then
    echo "✅ Upload réussi"
    
    # Test de download
    if aws s3 cp "s3://$BUCKET_NAME/$TEST_KEY" /tmp/s3-test-download.txt &> /dev/null; then
        echo "✅ Download réussi"
        rm /tmp/s3-test-download.txt
    fi
    
    # Nettoyer
    aws s3 rm "s3://$BUCKET_NAME/$TEST_KEY" &> /dev/null
    rm "$TEST_FILE"
    echo "✅ Test terminé et nettoyé"
else
    echo "❌ Upload échoué"
    exit 1
fi

echo ""
echo "✅ Configuration S3 terminée"
echo ""
echo "📋 Variables à configurer:"
echo "   AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
echo "   AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
echo "   AWS_REGION=$AWS_REGION"
echo "   AWS_S3_BUCKET=$BUCKET_NAME"






