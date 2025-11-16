# KMS Secrets Encryption Integration Example
# 
# This example demonstrates how to use AWS KMS for encrypting/decrypting secrets
# in the Luneo platform. Secrets are stored encrypted in AWS Secrets Manager
# and decrypted at runtime using KMS keys.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ==================== KMS Key for Application Secrets ====================

module "app_secrets_kms" {
  source = "../modules/kms"

  name        = "luneo-app-secrets"
  description = "KMS key for encrypting application secrets (JWT, API keys, etc.)"
  purpose     = "application-secrets"

  # Enable automatic key rotation (recommended)
  enable_key_rotation = true
  deletion_window_days = 30
  multi_region = false

  # Allow these AWS services to use the key
  allowed_services = [
    "secretsmanager.amazonaws.com",
    "ec2.amazonaws.com",
    "ecs.amazonaws.com",
    "lambda.amazonaws.com",
  ]

  # Allow specific IAM roles (adjust to your infrastructure)
  allowed_iam_entities = {
    "backend-role" = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/luneo-backend-*",
    ]
    "lambda-role" = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/luneo-lambda-*",
    ]
  }

  # IAM actions allowed for entities
  iam_entity_actions = [
    "kms:Decrypt",
    "kms:Encrypt",
    "kms:ReEncrypt*",
    "kms:GenerateDataKey",
    "kms:DescribeKey",
  ]

  tags = {
    Environment = "production"
    Application = "luneo"
    ManagedBy   = "terraform"
  }
}

data "aws_caller_identity" "current" {}

# ==================== AWS Secrets Manager Integration ====================

# Store JWT secret encrypted
resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "luneo/jwt-secret"
  description = "JWT signing secret for Luneo platform"

  kms_key_id = module.app_secrets_kms.kms_key_id

  tags = {
    Name        = "luneo-jwt-secret"
    Environment = "production"
    Type        = "jwt-secret"
  }
}

# Store initial secret value (use aws_secretsmanager_secret_version for updates)
resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    secret = var.jwt_secret_value # Set via terraform.tfvars or environment
  })
}

# Store API keys encrypted
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "luneo/api-keys"
  description = "Third-party API keys (Stripe, OpenAI, etc.)"

  kms_key_id = module.app_secrets_kms.kms_key_id

  tags = {
    Name        = "luneo-api-keys"
    Environment = "production"
    Type        = "api-keys"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    stripe_secret_key = var.stripe_secret_key
    openai_api_key    = var.openai_api_key
    redis_password    = var.redis_password
    # Add other API keys as needed
  })
}

# ==================== IAM Policy for Application Access ====================

# Policy document for backend services to access secrets
data "aws_iam_policy_document" "secrets_access" {
  statement {
    sid    = "AllowSecretsManagerAccess"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [
      aws_secretsmanager_secret.jwt_secret.arn,
      aws_secretsmanager_secret.api_keys.arn,
    ]
  }

  statement {
    sid    = "AllowKMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
    ]
    resources = [
      module.app_secrets_kms.kms_key_arn,
    ]
  }
}

# Create IAM policy
resource "aws_iam_policy" "secrets_access" {
  name        = "luneo-secrets-access"
  description = "Policy for accessing encrypted secrets via KMS"
  policy      = data.aws_iam_policy_document.secrets_access.json
}

# ==================== Variables ====================

variable "jwt_secret_value" {
  description = "JWT secret value (will be encrypted)"
  type        = string
  sensitive   = true
  # In production, use:
  # - terraform.tfvars (gitignored)
  # - Environment variables: TF_VAR_jwt_secret_value
  # - AWS Secrets Manager (for existing secrets)
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

# ==================== Outputs ====================

output "kms_key_id" {
  description = "KMS key ID for application secrets"
  value       = module.app_secrets_kms.kms_key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = module.app_secrets_kms.kms_key_arn
}

output "jwt_secret_arn" {
  description = "ARN of JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "api_keys_secret_arn" {
  description = "ARN of API keys secret in Secrets Manager"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "secrets_access_policy_arn" {
  description = "ARN of IAM policy for secrets access"
  value       = aws_iam_policy.secrets_access.arn
}

# ==================== Usage Example (Node.js/TypeScript) ====================
#
# In your application code, use AWS SDK to decrypt secrets:
#
# ```typescript
# import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
#
# const client = new SecretsManagerClient({ region: 'us-east-1' });
#
# async function getJWTSecret(): Promise<string> {
#   const command = new GetSecretValueCommand({
#     SecretId: 'luneo/jwt-secret',
#   });
#   const response = await client.send(command);
#   const secret = JSON.parse(response.SecretString || '{}');
#   return secret.secret;
# }
# ```
#
# KMS automatically decrypts the secret when retrieved from Secrets Manager.
# Ensure your application's IAM role has the secrets_access policy attached.
