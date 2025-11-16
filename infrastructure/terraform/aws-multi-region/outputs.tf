output "primary_vpc_id" {
  description = "Identifiant du VPC primaire."
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "Identifiant du VPC secondaire."
  value       = module.vpc_secondary.vpc_id
}

output "primary_private_subnets" {
  description = "Sous-réseaux privés utilisés par EKS dans la région primaire."
  value       = module.vpc_primary.private_subnets
}

output "secondary_private_subnets" {
  description = "Sous-réseaux privés utilisés par EKS dans la région secondaire."
  value       = module.vpc_secondary.private_subnets
}

output "eks_primary_cluster_name" {
  description = "Nom du cluster EKS primaire."
  value       = module.eks_primary.cluster_name
}

output "eks_secondary_cluster_name" {
  description = "Nom du cluster EKS secondaire."
  value       = module.eks_secondary.cluster_name
}

output "eks_primary_endpoint" {
  description = "Endpoint API du cluster EKS primaire."
  value       = module.eks_primary.cluster_endpoint
}

output "eks_secondary_endpoint" {
  description = "Endpoint API du cluster EKS secondaire."
  value       = module.eks_secondary.cluster_endpoint
}

output "rds_primary_endpoint" {
  description = "Endpoint writer du cluster Aurora primaire."
  value       = aws_rds_cluster.primary.endpoint
  sensitive   = true
}

output "rds_secondary_endpoint" {
  description = "Endpoint reader du cluster Aurora secondaire."
  value       = aws_rds_cluster.secondary.reader_endpoint
  sensitive   = true
}

output "artifact_bucket_primary" {
  description = "Bucket S3 primaire utilisé pour les artefacts."
  value       = aws_s3_bucket.artifacts_primary.bucket
}

output "artifact_bucket_secondary" {
  description = "Bucket S3 secondaire utilisé pour la réplication."
  value       = aws_s3_bucket.artifacts_secondary.bucket
}

output "alb_controller_primary_role_arn" {
  description = "ARN du rôle IAM attribué au contrôleur de load balancer en région primaire."
  value       = aws_iam_role.alb_controller_primary.arn
}

output "alb_controller_secondary_role_arn" {
  description = "ARN du rôle IAM attribué au contrôleur de load balancer en région secondaire."
  value       = aws_iam_role.alb_controller_secondary.arn
}

output "route53_records" {
  description = "Entrées Route53 créées pour le routage actif-passif."
  value = {
    primary   = aws_route53_record.api_failover_primary.fqdn
    secondary = aws_route53_record.api_failover_secondary.fqdn
  }
}

