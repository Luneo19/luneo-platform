# ElastiCache Redis Module
# Purpose: Managed Redis cluster for caching/session storage

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.name}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name      = "${var.name}-subnet-group"
    Component = "cache"
  })
}

# Security Group
resource "aws_security_group" "redis" {
  name        = "${var.name}-sg"
  description = "Security group for ElastiCache Redis ${var.name}"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from VPC"
    from_port      = 6379
    to_port        = 6379
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
    Component = "cache"
  })
}

# Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.name}-params"
  family = var.parameter_group_family

  dynamic "parameter" {
    for_each = var.redis_parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = merge(var.tags, {
    Name      = "${var.name}-params"
    Component = "cache"
  })
}

# KMS Key for encryption (if not provided)
resource "aws_kms_key" "redis" {
  count = var.kms_key_id == null && var.at_rest_encryption_enabled ? 1 : 0

  description             = "KMS key for ElastiCache Redis ${var.name}"
  deletion_window_in_days = var.kms_deletion_window_days
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name      = "${var.name}-kms-key"
    Component = "cache"
  })
}

resource "aws_kms_alias" "redis" {
  count = var.kms_key_id == null && var.at_rest_encryption_enabled ? 1 : 0

  name          = "alias/${var.name}-redis"
  target_key_id = aws_kms_key.redis[0].id
}

# Replication Group (Redis Cluster Mode Disabled)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = var.name
  description                = "Redis replication group for ${var.name}"

  # Engine configuration
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  # Cluster configuration
  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  # Network configuration
  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  # Snapshot configuration
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = var.snapshot_window

  # Backup configuration
  automatic_failover_enabled = var.automatic_failover_enabled
  at_rest_encryption_enabled  = var.at_rest_encryption_enabled
  kms_key_id                 = var.at_rest_encryption_enabled ? (var.kms_key_id != null ? var.kms_key_id : aws_kms_key.redis[0].arn) : null
  transit_encryption_enabled  = var.transit_encryption_enabled

  # Auth token (if transit encryption enabled)
  auth_token = var.transit_encryption_enabled ? var.auth_token : null

  # Maintenance
  maintenance_window         = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # Logging
  log_delivery_configuration {
    destination      = var.log_delivery_configuration != null ? var.log_delivery_configuration.destination : null
    destination_type = var.log_delivery_configuration != null ? var.log_delivery_configuration.destination_type : null
    log_format       = var.log_delivery_configuration != null ? var.log_delivery_configuration.log_format : null
    log_type         = var.log_delivery_configuration != null ? var.log_delivery_configuration.log_type : null
  }

  # Notification
  notification_topic_arn = var.notification_topic_arn

  tags = merge(var.tags, {
    Name      = var.name
    Component = "cache"
  })

  lifecycle {
    ignore_changes = [auth_token]
  }
}

# CloudWatch Alarms (optional)
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "Alert when Redis CPU utilization exceeds ${var.cpu_utilization_threshold}%"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(var.tags, {
    Name      = "${var.name}-cpu-alarm"
    Component = "cache"
  })
}

resource "aws_cloudwatch_metric_alarm" "memory_utilization" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_utilization_threshold
  alarm_description   = "Alert when Redis memory utilization exceeds ${var.memory_utilization_threshold}%"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(var.tags, {
    Name      = "${var.name}-memory-alarm"
    Component = "cache"
  })
}
