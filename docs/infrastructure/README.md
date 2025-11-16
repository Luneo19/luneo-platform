# Infrastructure Documentation - Luneo Platform

## Overview

This document describes the AWS infrastructure setup for the Luneo platform, managed with Terraform. The infrastructure is designed for high availability with multi-region support.

## Architecture

### Components

- **VPC & Networking**: Multi-region VPC setup (eu-west-1 primary, us-east-1 secondary)
- **EKS Clusters**: Kubernetes clusters in both regions
- **RDS PostgreSQL**: Managed PostgreSQL database (can be configured as Aurora Global)
- **ElastiCache Redis**: Managed Redis for caching and session storage
- **S3 + CloudFront**: Static assets storage with CDN distribution
- **ECR**: Container registry for Docker images
- **KMS**: Key management for encryption and secrets

### Modules

All infrastructure is organized into reusable Terraform modules:

```
infrastructure/terraform/modules/
├── storage/      # S3 + CloudFront for assets
├── rds/          # RDS PostgreSQL
├── redis/         # ElastiCache Redis
├── ecr/           # ECR repositories
└── kms/           # KMS keys for secrets
```

## Prerequisites

### Required Tools

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- kubectl (for Kubernetes resources)
- Access to AWS account with required permissions

### AWS Account Setup

1. **Create S3 Backend Bucket** (one-time setup):
   ```bash
   aws s3 mb s3://luneo-terraform-state --region eu-west-1
   aws s3api put-bucket-versioning \
     --bucket luneo-terraform-state \
     --versioning-configuration Status=Enabled
   aws s3api put-bucket-encryption \
     --bucket luneo-terraform-state \
     --server-side-encryption-configuration '{
       "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
     }'
   ```

2. **Create DynamoDB Lock Table** (one-time setup):
   ```bash
   aws dynamodb create-table \
     --table-name luneo-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region eu-west-1
   ```

### IAM Permissions

The Terraform execution role/user needs the following permissions (see `IAM_POLICIES.md` for detailed policies):

- VPC management
- EKS cluster management
- RDS management
- ElastiCache management
- S3 bucket management
- CloudFront management
- ECR management
- KMS key management
- Route53 DNS management
- CloudWatch monitoring

## Quick Start

### 1. Configure Variables

Copy the example variables file and customize:

```bash
cd infrastructure/terraform/aws-multi-region
cp ../../terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific values, especially:
- `db_master_password`: Strong password (min 16 characters)
- `primary_ingress_hostname`: EKS load balancer hostname
- `secondary_ingress_hostname`: EKS load balancer hostname

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Changes

```bash
terraform plan -out=plan.tfplan
```

Review the plan carefully, especially for production environments.

### 4. Apply Changes

```bash
terraform apply plan.tfplan
```

**⚠️ Warning**: For production, always review the plan and get approval before applying.

## Module Usage Examples

### S3 + CloudFront Module

```hcl
module "assets" {
  source = "../../modules/storage"

  bucket_name = "luneo-prod-assets"
  kms_key_id  = module.kms_secrets.key_id

  tags = {
    Environment = "prod"
    Project     = "luneo"
  }
}
```

### RDS PostgreSQL Module

```hcl
module "postgres" {
  source = "../../modules/rds"

  name              = "luneo-prod-db"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnets
  database_name     = "luneo"
  master_username   = "luneo_admin"
  master_password   = var.db_password
  instance_class    = "db.r6g.large"
  allocated_storage = 100

  tags = {
    Environment = "prod"
  }
}
```

### Redis Module

```hcl
module "redis" {
  source = "../../modules/redis"

  name                    = "luneo-prod-redis"
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnets
  node_type               = "cache.r6g.large"
  num_cache_clusters      = 2
  automatic_failover_enabled = true
  multi_az_enabled        = true

  tags = {
    Environment = "prod"
  }
}
```

### ECR Module

```hcl
module "ecr_worker_ia" {
  source = "../../modules/ecr"

  repository_name = "luneo-worker-ia"
  scan_on_push    = true

  tags = {
    Environment = "prod"
  }
}

module "ecr_usdz_converter" {
  source = "../../modules/ecr"

  repository_name = "luneo-usdz-converter"
  scan_on_push    = true

  tags = {
    Environment = "prod"
  }
}
```

### KMS Module

```hcl
module "kms_secrets" {
  source = "../../modules/kms"

  name        = "luneo-secrets"
  description = "KMS key for application secrets"

  allowed_services = [
    "secretsmanager.amazonaws.com",
    "rds.amazonaws.com"
  ]

  tags = {
    Environment = "prod"
  }
}
```

## State Management

### Remote State Backend

Terraform state is stored in S3 with DynamoDB locking:

- **S3 Bucket**: `luneo-terraform-state`
- **State Key**: `global/multi-region/terraform.tfstate`
- **DynamoDB Table**: `luneo-terraform-locks`
- **Region**: `eu-west-1`
- **Encryption**: Enabled

### State Locking

The DynamoDB table prevents concurrent Terraform executions. If a lock is stuck:

1. Check the lock table: `aws dynamodb scan --table-name luneo-terraform-locks`
2. Verify no Terraform processes are running
3. If safe, delete the lock entry manually

### State Backup

State files are versioned in S3. To restore a previous state:

```bash
aws s3api list-object-versions \
  --bucket luneo-terraform-state \
  --prefix global/multi-region/terraform.tfstate

# Restore specific version
aws s3api get-object \
  --bucket luneo-terraform-state \
  --key global/multi-region/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.backup
```

## Operations

### Updating Infrastructure

1. **Make changes** to Terraform files
2. **Run plan**: `terraform plan -out=plan.tfplan`
3. **Review changes** carefully
4. **Apply**: `terraform apply plan.tfplan`

### Scaling Resources

#### EKS Nodes

Update variables in `terraform.tfvars`:

```hcl
eks_primary_desired_size = 5
eks_primary_max_size     = 10
```

Then apply: `terraform apply`

#### RDS Instance

Update `db_primary_instance_class`:

```hcl
db_primary_instance_class = "db.r6g.xlarge"
```

**Note**: RDS scaling may cause brief downtime. Plan accordingly.

#### Redis Cluster

Update `redis_node_type` and `num_cache_clusters`:

```hcl
redis_node_type          = "cache.r6g.large"
redis_num_cache_clusters = 3
```

### Database Backups

- **Automated backups**: Configured via `backup_retention_period` (default: 7 days)
- **Backup window**: Configured via `backup_window` (default: 04:00-05:00 UTC)
- **Manual snapshots**: Create via AWS Console or CLI:

```bash
aws rds create-db-snapshot \
  --db-instance-identifier luneo-prod-db \
  --db-snapshot-identifier luneo-prod-manual-$(date +%Y%m%d)
```

### Monitoring

#### CloudWatch Alarms

Key alarms are configured for:
- RDS replication lag
- S3 replication latency
- Redis CPU/memory utilization (if enabled)

#### Logs

- **RDS logs**: Exported to CloudWatch Logs (postgresql, upgrade)
- **CloudFront logs**: Optional, configure via `logging_bucket` variable

### Disaster Recovery

#### Multi-Region Setup

The infrastructure supports multi-region deployment:
- **Primary region**: eu-west-1 (write operations)
- **Secondary region**: us-east-1 (read replicas, failover)

#### Failover Procedure

1. **Detect failure** via Route53 health checks
2. **Promote secondary** (if using Aurora Global Database)
3. **Update DNS** to point to secondary region
4. **Verify** application functionality

#### Backup Restoration

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier luneo-prod-db

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier luneo-prod-db-restored \
  --db-snapshot-identifier <snapshot-id>
```

## Security Best Practices

### Secrets Management

- **Database passwords**: Store in AWS Secrets Manager or use Terraform variables with `sensitive = true`
- **KMS keys**: Use separate keys for different purposes (RDS, Redis, S3, secrets)
- **IAM roles**: Follow least privilege principle (see `IAM_POLICIES.md`)

### Network Security

- **Private subnets**: All databases and caches are in private subnets
- **Security groups**: Restrict access to specific CIDR blocks or security groups
- **VPC endpoints**: Consider using VPC endpoints for AWS services to avoid internet traffic

### Encryption

- **At rest**: All resources use encryption (RDS, Redis, S3, EBS)
- **In transit**: Enable TLS/SSL where possible (Redis transit encryption, CloudFront HTTPS)
- **KMS**: Use customer-managed keys for sensitive data

## Cost Optimization

### Recommendations

1. **Use Spot instances** for EKS nodes (already configured)
2. **Right-size instances** based on actual usage
3. **Enable S3 lifecycle policies** to transition to cheaper storage classes
4. **Use CloudFront caching** to reduce origin requests
5. **Monitor costs** via AWS Cost Explorer

### Estimated Costs (Staging)

- EKS: ~$150/month (2 nodes)
- RDS: ~$50/month (db.t3.medium)
- Redis: ~$15/month (cache.t3.micro)
- S3 + CloudFront: ~$10/month (low traffic)
- **Total**: ~$225/month

### Estimated Costs (Production)

- EKS: ~$450/month (3 nodes + spot)
- RDS: ~$200/month (db.r6g.large)
- Redis: ~$100/month (cache.r6g.large, multi-AZ)
- S3 + CloudFront: ~$50/month (moderate traffic)
- **Total**: ~$800/month

*Note: Actual costs vary based on usage*

## Troubleshooting

### Common Issues

#### Terraform State Lock

```bash
# Check for locks
aws dynamodb scan --table-name luneo-terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

#### EKS Access Issues

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region eu-west-1 \
  --name luneo-prod-eks-primary

# Verify access
kubectl get nodes
```

#### RDS Connection Issues

1. Check security group rules
2. Verify subnet group includes correct subnets
3. Check VPC routing and NACLs
4. Verify database is not publicly accessible (should be false)

#### CloudFront Cache Issues

```bash
# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

## CI/CD Integration

### GitHub Actions

The infrastructure includes GitHub Actions workflows:

- **`infra-plan.yml`**: Runs `terraform plan` on PRs
- **`infra-apply.yml`**: Runs `terraform apply` with manual approval for production

### Workflow

1. **Staging**: Auto-apply on merge to `staging` branch
2. **Production**: Manual approval required via GitHub Environments

See `.github/workflows/infra-*.yml` for details.

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

## Support

For infrastructure issues:
1. Check CloudWatch logs and alarms
2. Review Terraform state: `terraform show`
3. Consult AWS Service Health Dashboard
4. Contact DevOps team

---

**Last Updated**: 2025-01-16
**Maintained by**: DevOps Team
