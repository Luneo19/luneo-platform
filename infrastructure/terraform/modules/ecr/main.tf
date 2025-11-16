# ECR Repository Module
# Purpose: Container registry for Docker images

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ECR Repository
resource "aws_ecr_repository" "repo" {
  name                 = var.repository_name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = var.encryption_type
    kms_key         = var.kms_key_id
  }

  tags = merge(var.tags, {
    Name      = var.repository_name
    Component = "container-registry"
  })
}

# Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "repo" {
  repository = aws_ecr_repository.repo.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.keep_last_n_images} images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = var.tag_prefix_list
          countType     = "imageCountMoreThan"
          countNumber   = var.keep_last_n_images
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images older than ${var.untagged_image_expiration_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_image_expiration_days
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Repository Policy (optional)
resource "aws_ecr_repository_policy" "repo" {
  count = var.repository_policy != null ? 1 : 0

  repository = aws_ecr_repository.repo.name
  policy     = var.repository_policy
}

# Replication Configuration (optional, for multi-region)
resource "aws_ecr_replication_configuration" "repo" {
  count = var.enable_replication ? 1 : 0

  replication_configuration {
    dynamic "replication_configuration" {
      for_each = var.replication_regions
      content {
        region = replication_configuration.value
      }
    }
  }
}
