variable "name" {
  description = "Name identifier for the KMS key and alias"
  type        = string
}

variable "description" {
  description = "Description of the KMS key"
  type        = string
  default     = "KMS key for secrets management"
}

variable "purpose" {
  description = "Purpose of the key (for tagging)"
  type        = string
  default     = "secrets"
}

variable "tags" {
  description = "Map of tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "deletion_window_days" {
  description = "Deletion window in days (7-30)"
  type        = number
  default     = 30

  validation {
    condition     = var.deletion_window_days >= 7 && var.deletion_window_days <= 30
    error_message = "Deletion window must be between 7 and 30 days"
  }
}

variable "enable_key_rotation" {
  description = "Enable automatic key rotation"
  type        = bool
  default     = true
}

variable "multi_region" {
  description = "Enable multi-region key"
  type        = bool
  default     = false
}

variable "key_policy" {
  description = "Custom key policy JSON (optional, uses default if null)"
  type        = string
  default     = null
}

variable "allowed_services" {
  description = "List of AWS service principals allowed to use the key (e.g., ['secretsmanager.amazonaws.com', 'rds.amazonaws.com'])"
  type        = list(string)
  default     = []
}

variable "allowed_iam_entities" {
  description = "Map of IAM entity names to their ARNs (roles/users) allowed to use the key"
  type        = map(list(string))
  default     = {}
}

variable "iam_entity_actions" {
  description = "List of KMS actions allowed for IAM entities"
  type        = list(string)
  default = [
    "kms:Decrypt",
    "kms:Encrypt",
    "kms:ReEncrypt*",
    "kms:GenerateDataKey*",
    "kms:DescribeKey"
  ]
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for key usage"
  type        = bool
  default     = false
}

variable "key_usage_threshold" {
  description = "Threshold for key usage alarm"
  type        = number
  default     = 1000
}
