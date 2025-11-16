output "key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.secrets.id
}

output "key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.secrets.arn
}

output "alias_name" {
  description = "KMS alias name"
  value       = aws_kms_alias.secrets.name
}

output "alias_arn" {
  description = "KMS alias ARN"
  value       = aws_kms_alias.secrets.arn
}
