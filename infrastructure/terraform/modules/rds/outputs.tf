output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.postgres.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.postgres.arn
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "db_instance_address" {
  description = "RDS instance address"
  value       = aws_db_instance.postgres.address
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "db_instance_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_instance_username" {
  description = "Master username"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "db_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.postgres.id
}

output "db_subnet_group_id" {
  description = "DB subnet group ID"
  value       = aws_db_subnet_group.postgres.id
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = var.kms_key_id != null ? var.kms_key_id : aws_kms_key.rds[0].id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.kms_key_id != null ? null : aws_kms_key.rds[0].arn
}
