# KMS Key Module for Secrets Management
# Purpose: Encrypted key management for application secrets

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# KMS Key
resource "aws_kms_key" "secrets" {
  description             = var.description
  deletion_window_in_days  = var.deletion_window_days
  enable_key_rotation     = var.enable_key_rotation
  multi_region            = var.multi_region

  policy = var.key_policy != null ? var.key_policy : data.aws_iam_policy_document.kms_key.json

  tags = merge(var.tags, {
    Name      = var.name
    Component = "secrets-management"
    Purpose   = var.purpose
  })
}

# Default key policy (if not provided)
data "aws_iam_policy_document" "kms_key" {
  # Allow root account full access
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Allow specific services to use the key
  dynamic "statement" {
    for_each = var.allowed_services
    content {
      sid    = "AllowService${statement.value}"
      effect = "Allow"
      principals {
        type        = "Service"
        identifiers = [statement.value]
      }
      actions = [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:DescribeKey"
      ]
      resources = ["*"]
    }
  }

  # Allow specific IAM roles/users
  dynamic "statement" {
    for_each = var.allowed_iam_entities
    content {
      sid    = "AllowIAMEntity${statement.key}"
      effect = "Allow"
      principals {
        type        = "AWS"
        identifiers = statement.value
      }
      actions = var.iam_entity_actions
      resources = ["*"]
    }
  }
}

data "aws_caller_identity" "current" {}

# KMS Alias
resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.name}"
  target_key_id = aws_kms_key.secrets.id
}

# CloudWatch Alarms (optional)
resource "aws_cloudwatch_metric_alarm" "key_usage" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-key-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfDecryptOperations"
  namespace           = "AWS/KMS"
  period              = 300
  statistic           = "Sum"
  threshold           = var.key_usage_threshold
  alarm_description   = "Alert when KMS key usage exceeds threshold"

  dimensions = {
    KeyId = aws_kms_key.secrets.id
  }

  tags = merge(var.tags, {
    Name      = "${var.name}-usage-alarm"
    Component = "secrets-management"
  })
}
