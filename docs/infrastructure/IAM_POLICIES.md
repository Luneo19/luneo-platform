# IAM Policies - Minimal Privileges for Terraform

This document outlines the minimal IAM policies required for Terraform to manage the Luneo infrastructure. These policies follow the principle of least privilege.

## Overview

The Terraform execution role/user should have separate policies for different resource types. This allows for:
- Better security (least privilege)
- Easier auditing
- Granular control

## Policy Structure

### 1. Terraform State Backend Policy

**Purpose**: Manage Terraform state in S3 and DynamoDB locks

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3StateBackend",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketVersioning",
        "s3:GetBucketAcl"
      ],
      "Resource": [
        "arn:aws:s3:::luneo-terraform-state",
        "arn:aws:s3:::luneo-terraform-state/*"
      ]
    },
    {
      "Sid": "DynamoDBStateLock",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:eu-west-1:*:table/luneo-terraform-locks"
    }
  ]
}
```

### 2. VPC & Networking Policy

**Purpose**: Manage VPCs, subnets, security groups, and networking components

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VPCManagement",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:DescribeVpcs",
        "ec2:ModifyVpcAttribute",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:DescribeSubnets",
        "ec2:ModifySubnetAttribute",
        "ec2:CreateInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:CreateNatGateway",
        "ec2:DeleteNatGateway",
        "ec2:DescribeNatGateways",
        "ec2:AllocateAddress",
        "ec2:ReleaseAddress",
        "ec2:DescribeAddresses",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeAccountAttributes"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Project": "luneo"
        }
      }
    }
  ]
}
```

### 3. EKS Management Policy

**Purpose**: Manage EKS clusters and node groups

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EKSClusterManagement",
      "Effect": "Allow",
      "Action": [
        "eks:CreateCluster",
        "eks:DeleteCluster",
        "eks:DescribeCluster",
        "eks:ListClusters",
        "eks:UpdateClusterVersion",
        "eks:UpdateClusterConfig",
        "eks:TagResource",
        "eks:UntagResource",
        "eks:AssociateIdentityProviderConfig",
        "eks:DisassociateIdentityProviderConfig",
        "eks:DescribeIdentityProviderConfig",
        "eks:ListIdentityProviderConfigs",
        "eks:CreateNodegroup",
        "eks:DeleteNodegroup",
        "eks:DescribeNodegroup",
        "eks:ListNodegroups",
        "eks:UpdateNodegroupVersion",
        "eks:UpdateNodegroupConfig",
        "eks:CreateAddon",
        "eks:DeleteAddon",
        "eks:DescribeAddon",
        "eks:ListAddons",
        "eks:UpdateAddon",
        "iam:CreateServiceLinkedRole",
        "iam:GetRole",
        "iam:ListAttachedRolePolicies",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy"
      ],
      "Resource": [
        "arn:aws:eks:*:*:cluster/luneo-*",
        "arn:aws:eks:*:*:nodegroup/luneo-*/*",
        "arn:aws:eks:*:*:addon/luneo-*/*/*",
        "arn:aws:iam::*:role/luneo-*"
      ]
    }
  ]
}
```

### 4. RDS Management Policy

**Purpose**: Manage RDS PostgreSQL instances

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSManagement",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBInstance",
        "rds:DeleteDBInstance",
        "rds:DescribeDBInstances",
        "rds:ModifyDBInstance",
        "rds:RebootDBInstance",
        "rds:StartDBInstance",
        "rds:StopDBInstance",
        "rds:CreateDBCluster",
        "rds:DeleteDBCluster",
        "rds:DescribeDBClusters",
        "rds:ModifyDBCluster",
        "rds:CreateDBSubnetGroup",
        "rds:DeleteDBSubnetGroup",
        "rds:DescribeDBSubnetGroups",
        "rds:ModifyDBSubnetGroup",
        "rds:CreateDBParameterGroup",
        "rds:DeleteDBParameterGroup",
        "rds:DescribeDBParameterGroups",
        "rds:ModifyDBParameterGroup",
        "rds:DescribeDBParameters",
        "rds:ResetDBParameterGroup",
        "rds:CreateDBOptionGroup",
        "rds:DeleteDBOptionGroup",
        "rds:DescribeDBOptionGroups",
        "rds:ModifyDBOptionGroup",
        "rds:DescribeDBEngineVersions",
        "rds:DescribeDBLogFiles",
        "rds:DownloadDBLogFilePortion",
        "rds:CreateDBSnapshot",
        "rds:DeleteDBSnapshot",
        "rds:DescribeDBSnapshots",
        "rds:CopyDBSnapshot",
        "rds:RestoreDBInstanceFromDBSnapshot",
        "rds:AddTagsToResource",
        "rds:RemoveTagsFromResource",
        "rds:ListTagsForResource"
      ],
      "Resource": [
        "arn:aws:rds:*:*:db:luneo-*",
        "arn:aws:rds:*:*:cluster:luneo-*",
        "arn:aws:rds:*:*:subgrp:luneo-*",
        "arn:aws:rds:*:*:pg:luneo-*",
        "arn:aws:rds:*:*:og:luneo-*",
        "arn:aws:rds:*:*:snapshot:luneo-*"
      ]
    }
  ]
}
```

### 5. ElastiCache (Redis) Management Policy

**Purpose**: Manage ElastiCache Redis clusters

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ElastiCacheManagement",
      "Effect": "Allow",
      "Action": [
        "elasticache:CreateCacheCluster",
        "elasticache:DeleteCacheCluster",
        "elasticache:DescribeCacheClusters",
        "elasticache:ModifyCacheCluster",
        "elasticache:RebootCacheCluster",
        "elasticache:CreateReplicationGroup",
        "elasticache:DeleteReplicationGroup",
        "elasticache:DescribeReplicationGroups",
        "elasticache:ModifyReplicationGroup",
        "elasticache:CreateCacheSubnetGroup",
        "elasticache:DeleteCacheSubnetGroup",
        "elasticache:DescribeCacheSubnetGroups",
        "elasticache:ModifyCacheSubnetGroup",
        "elasticache:CreateCacheParameterGroup",
        "elasticache:DeleteCacheParameterGroup",
        "elasticache:DescribeCacheParameterGroups",
        "elasticache:ModifyCacheParameterGroup",
        "elasticache:DescribeCacheParameters",
        "elasticache:ResetCacheParameterGroup",
        "elasticache:DescribeEngineDefaultParameters",
        "elasticache:CreateSnapshot",
        "elasticache:DeleteSnapshot",
        "elasticache:DescribeSnapshots",
        "elasticache:CopySnapshot",
        "elasticache:AddTagsToResource",
        "elasticache:RemoveTagsFromResource",
        "elasticache:ListTagsForResource"
      ],
      "Resource": [
        "arn:aws:elasticache:*:*:cluster:luneo-*",
        "arn:aws:elasticache:*:*:replicationgroup:luneo-*",
        "arn:aws:elasticache:*:*:subnetgroup:luneo-*",
        "arn:aws:elasticache:*:*:parametergroup:luneo-*",
        "arn:aws:elasticache:*:*:snapshot:luneo-*"
      ]
    }
  ]
}
```

### 6. S3 & CloudFront Management Policy

**Purpose**: Manage S3 buckets and CloudFront distributions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Management",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:GetBucketAcl",
        "s3:GetBucketCors",
        "s3:GetBucketLogging",
        "s3:GetBucketPolicy",
        "s3:GetBucketTagging",
        "s3:ListBucket",
        "s3:PutBucketAcl",
        "s3:PutBucketCors",
        "s3:PutBucketLogging",
        "s3:PutBucketPolicy",
        "s3:PutBucketTagging",
        "s3:PutBucketVersioning",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketPublicAccessBlock",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:PutObjectVersionTagging",
        "s3:GetObjectVersionTagging",
        "s3:PutBucketLifecycleConfiguration",
        "s3:GetBucketLifecycleConfiguration",
        "s3:PutBucketEncryption",
        "s3:GetBucketEncryption"
      ],
      "Resource": [
        "arn:aws:s3:::luneo-*",
        "arn:aws:s3:::luneo-*/*"
      ]
    },
    {
      "Sid": "CloudFrontManagement",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:GetDistributionConfig",
        "cloudfront:ListDistributions",
        "cloudfront:UpdateDistribution",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations",
        "cloudfront:CreateCloudFrontOriginAccessIdentity",
        "cloudfront:DeleteCloudFrontOriginAccessIdentity",
        "cloudfront:GetCloudFrontOriginAccessIdentity",
        "cloudfront:GetCloudFrontOriginAccessIdentityConfig",
        "cloudfront:ListCloudFrontOriginAccessIdentities",
        "cloudfront:UpdateCloudFrontOriginAccessIdentity",
        "cloudfront:CreateCachePolicy",
        "cloudfront:DeleteCachePolicy",
        "cloudfront:GetCachePolicy",
        "cloudfront:ListCachePolicies",
        "cloudfront:UpdateCachePolicy",
        "cloudfront:TagResource",
        "cloudfront:UntagResource",
        "cloudfront:ListTagsForResource"
      ],
      "Resource": "*"
    }
  ]
}
```

### 7. ECR Management Policy

**Purpose**: Manage ECR repositories

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRManagement",
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DeleteRepository",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:PutImage",
        "ecr:GetRepositoryPolicy",
        "ecr:SetRepositoryPolicy",
        "ecr:DeleteRepositoryPolicy",
        "ecr:GetLifecyclePolicy",
        "ecr:PutLifecyclePolicy",
        "ecr:DeleteLifecyclePolicy",
        "ecr:GetRegistryPolicy",
        "ecr:PutRegistryPolicy",
        "ecr:DeleteRegistryPolicy",
        "ecr:PutReplicationConfiguration",
        "ecr:DescribeReplicationDestinations",
        "ecr:PutImageScanningConfiguration",
        "ecr:GetImageScanningConfiguration",
        "ecr:PutImageTagMutability",
        "ecr:GetImageTagMutability",
        "ecr:TagResource",
        "ecr:UntagResource",
        "ecr:ListTagsForResource",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": [
        "arn:aws:ecr:*:*:repository/luneo-*"
      ]
    },
    {
      "Sid": "ECRRegistry",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:GetRegistryScanningConfiguration",
        "ecr:PutRegistryScanningConfiguration"
      ],
      "Resource": "*"
    }
  ]
}
```

### 8. KMS Management Policy

**Purpose**: Manage KMS keys for encryption

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "KMSManagement",
      "Effect": "Allow",
      "Action": [
        "kms:CreateKey",
        "kms:DeleteKey",
        "kms:DescribeKey",
        "kms:ListKeys",
        "kms:ListAliases",
        "kms:UpdateKeyDescription",
        "kms:EnableKey",
        "kms:DisableKey",
        "kms:EnableKeyRotation",
        "kms:DisableKeyRotation",
        "kms:GetKeyRotationStatus",
        "kms:PutKeyPolicy",
        "kms:GetKeyPolicy",
        "kms:ListKeyPolicies",
        "kms:CreateAlias",
        "kms:DeleteAlias",
        "kms:UpdateAlias",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ListResourceTags",
        "kms:ScheduleKeyDeletion",
        "kms:CancelKeyDeletion",
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:ListGrants",
        "kms:RevokeGrant"
      ],
      "Resource": [
        "arn:aws:kms:*:*:key/*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Project": "luneo"
        }
      }
    }
  ]
}
```

### 9. Route53 DNS Management Policy

**Purpose**: Manage DNS records and health checks

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Route53Management",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ListHostedZonesByName",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListResourceRecordSets",
        "route53:CreateHealthCheck",
        "route53:DeleteHealthCheck",
        "route53:GetHealthCheck",
        "route53:ListHealthChecks",
        "route53:UpdateHealthCheck",
        "route53:GetHealthCheckStatus",
        "route53:GetHealthCheckLastFailureReason",
        "route53:ListTagsForResource",
        "route53:ChangeTagsForResource"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/*",
        "arn:aws:route53:::healthcheck/*"
      ]
    }
  ]
}
```

### 10. CloudWatch Monitoring Policy

**Purpose**: Create and manage CloudWatch alarms and metrics

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchManagement",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricData",
        "cloudwatch:TagResource",
        "cloudwatch:UntagResource",
        "cloudwatch:ListTagsForResource",
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:TagLogGroup",
        "logs:UntagLogGroup",
        "logs:ListTagsLogGroup"
      ],
      "Resource": [
        "arn:aws:cloudwatch:*:*:alarm:luneo-*",
        "arn:aws:logs:*:*:log-group:luneo-*"
      ]
    }
  ]
}
```

## Complete Policy Document

To create a single policy with all permissions (for convenience, but less secure):

```bash
# Combine all policies into one
cat policies/*.json | jq -s '.[] | .Statement' | jq -s '{Version: "2012-10-17", Statement: .}'
```

## Policy Attachment

### For IAM User

```bash
# Create policy
aws iam create-policy \
  --policy-name TerraformLuneoInfrastructure \
  --policy-document file://terraform-infrastructure-policy.json

# Attach to user
aws iam attach-user-policy \
  --user-name terraform-user \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformLuneoInfrastructure
```

### For IAM Role (Recommended for CI/CD)

```bash
# Create policy
aws iam create-policy \
  --policy-name TerraformLuneoInfrastructure \
  --policy-document file://terraform-infrastructure-policy.json

# Attach to role
aws iam attach-role-policy \
  --role-name terraform-execution-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformLuneoInfrastructure
```

## GitHub Actions OIDC Setup

For GitHub Actions, use OIDC instead of access keys:

1. **Create OIDC Provider** (if not exists):
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list <THUMBPRINT>
```

2. **Create Trust Policy** for role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/luneo-platform:*"
        }
      }
    }
  ]
}
```

3. **Create Role**:
```bash
aws iam create-role \
  --role-name GitHubActionsTerraformRole \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name GitHubActionsTerraformRole \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformLuneoInfrastructure
```

## Security Recommendations

1. **Use separate policies** for different environments (staging vs production)
2. **Enable MFA** for IAM users with Terraform access
3. **Use IAM roles** instead of access keys when possible
4. **Enable CloudTrail** to audit all API calls
5. **Review policies regularly** and remove unused permissions
6. **Use resource-based conditions** to restrict actions to specific resources
7. **Tag resources** consistently to enable policy conditions

## Audit

Regularly audit IAM permissions:

```bash
# List all policies attached to user/role
aws iam list-attached-user-policies --user-name terraform-user
aws iam list-attached-role-policies --role-name terraform-execution-role

# Get policy document
aws iam get-policy --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformLuneoInfrastructure
aws iam get-policy-version \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformLuneoInfrastructure \
  --version-id v1
```

---

**Note**: Replace `ACCOUNT_ID`, `YOUR_ORG`, and resource names (`luneo-*`) with your actual values.
