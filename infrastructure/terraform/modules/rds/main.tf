# RDS PostgreSQL Module
# Purpose: Managed PostgreSQL database with automated snapshots, final snapshot disabled

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "postgres" {
  name       = "${var.name}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name      = "${var.name}-subnet-group"
    Component = "database"
  })
}

# Security Group
resource "aws_security_group" "postgres" {
  name        = "${var.name}-sg"
  description = "Security group for RDS PostgreSQL ${var.name}"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from VPC"
    from_port      = 5432
    to_port        = 5432
    protocol       = "tcp"
    cidr_blocks    = var.allowed_cidr_blocks
    security_groups = var.allowed_security_group_ids
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name      = "${var.name}-sg"
    Component = "database"
  })
}

# KMS Key for RDS encryption (if not provided)
resource "aws_kms_key" "rds" {
  count = var.kms_key_id == null ? 1 : 0

  description             = "KMS key for RDS PostgreSQL ${var.name}"
  deletion_window_in_days = var.kms_deletion_window_days
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name      = "${var.name}-kms-key"
    Component = "database"
  })
}

resource "aws_kms_alias" "rds" {
  count = var.kms_key_id == null ? 1 : 0

  name          = "alias/${var.name}-rds"
  target_key_id = aws_kms_key.rds[0].id
}

# DB Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.name}-params"
  family = var.parameter_group_family

  dynamic "parameter" {
    for_each = var.db_parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = merge(var.tags, {
    Name      = "${var.name}-params"
    Component = "database"
  })
}

# DB Option Group (if needed)
resource "aws_db_option_group" "postgres" {
  count = var.create_option_group ? 1 : 0

  name                     = "${var.name}-options"
  option_group_description = "Option group for ${var.name}"
  engine_name              = "postgres"
  major_engine_version     = var.engine_version_major

  tags = merge(var.tags, {
    Name      = "${var.name}-options"
    Component = "database"
  })
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier = var.name

  # Engine configuration
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  # Database configuration
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password
  port     = 5432

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = var.storage_type
  storage_encrypted    = true
  kms_key_id           = var.kms_key_id != null ? var.kms_key_id : aws_kms_key.rds[0].arn

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.postgres.id]
  publicly_accessible    = var.publicly_accessible

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  copy_tags_to_snapshot  = true

  # Maintenance configuration
  maintenance_window         = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  allow_major_version_upgrade = var.allow_major_version_upgrade

  # Snapshot configuration
  skip_final_snapshot       = true  # Final snapshot disabled as per requirements
  final_snapshot_identifier = null  # Explicitly set to null

  # Monitoring
  enabled_cloudwatch_logs_exports = var.cloudwatch_logs_exports
  monitoring_interval            = var.monitoring_interval
  monitoring_role_arn            = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_kms_key_id = var.performance_insights_enabled && var.performance_insights_kms_key_id != null ? var.performance_insights_kms_key_id : null
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.postgres.name
  option_group_name    = var.create_option_group ? aws_db_option_group.postgres[0].name : null

  # Deletion protection
  deletion_protection = var.deletion_protection

  # Multi-AZ
  multi_az = var.multi_az

  # Apply changes
  apply_immediately = var.apply_immediately

  tags = merge(var.tags, {
    Name      = var.name
    Component = "database"
  })

  lifecycle {
    ignore_changes = [
      password,
      final_snapshot_identifier,
    ]
  }
}

# Enhanced Monitoring IAM Role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "${var.name}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name      = "${var.name}-rds-monitoring-role"
    Component = "database"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Automated snapshots via DB Snapshot (manual snapshots can be created separately)
# Note: Automated backups are handled by backup_retention_period
# Manual snapshots can be created via AWS CLI or console
