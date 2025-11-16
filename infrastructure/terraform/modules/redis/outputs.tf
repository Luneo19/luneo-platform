output "replication_group_id" {
  description = "ElastiCache replication group ID"
  value       = aws_elasticache_replication_group.redis.id
}

output "replication_group_arn" {
  description = "ElastiCache replication group ARN"
  value       = aws_elasticache_replication_group.redis.arn
}

output "configuration_endpoint_address" {
  description = "Configuration endpoint address (for cluster mode)"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "primary_endpoint_address" {
  description = "Primary endpoint address"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Reader endpoint address"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "security_group_id" {
  description = "Security group ID for Redis"
  value       = aws_security_group.redis.id
}

output "subnet_group_id" {
  description = "Subnet group ID"
  value       = aws_elasticache_subnet_group.redis.id
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = var.at_rest_encryption_enabled && var.kms_key_id == null ? aws_kms_key.redis[0].id : var.kms_key_id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.at_rest_encryption_enabled && var.kms_key_id == null ? aws_kms_key.redis[0].arn : null
}
