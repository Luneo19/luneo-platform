variable "name" {
  description = "Name identifier for the Redis cluster and related resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Redis will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the subnet group"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access Redis"
  type        = list(string)
  default     = []
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to access Redis"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Map of tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "parameter_group_family" {
  description = "Parameter group family (e.g., redis7)"
  type        = string
  default     = "redis7"
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (nodes)"
  type        = number
  default     = 1
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots (0 to disable)"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Daily time range for snapshots (UTC)"
  type        = string
  default     = "03:00-05:00"
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = false
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (optional, creates one if null and at_rest_encryption_enabled)"
  type        = string
  default     = null
}

variable "kms_deletion_window_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

variable "auth_token" {
  description = "Auth token for Redis (required if transit_encryption_enabled)"
  type        = string
  default     = null
  sensitive   = true
}

variable "maintenance_window" {
  description = "Maintenance window (UTC)"
  type        = string
  default     = "mon:05:00-mon:07:00"
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "redis_parameters" {
  description = "List of Redis parameters to set"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications (optional)"
  type        = string
  default     = null
}

variable "log_delivery_configuration" {
  description = "Log delivery configuration (optional)"
  type = object({
    destination      = string
    destination_type = string
    log_format       = string
    log_type         = string
  })
  default = null
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for CPU and memory"
  type        = bool
  default     = true
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization threshold for alarm (%)"
  type        = number
  default     = 80
}

variable "memory_utilization_threshold" {
  description = "Memory utilization threshold for alarm (%)"
  type        = number
  default     = 85
}
