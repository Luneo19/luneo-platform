# ╔═══════════════════════════════════════════════════════════════════╗
# ║  📝 VARIABLES TERRAFORM - LUNEO ENTERPRISE                       ║
# ║     Configuration des variables pour l'infrastructure            ║
# ╚═══════════════════════════════════════════════════════════════════╝

# ========================================
# PROVIDER CONFIGURATION
# ========================================

variable "hetzner_token" {
  description = "Hetzner Cloud API token pour l'authentification"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.hetzner_token) > 0
    error_message = "Le token Hetzner est requis."
  }
}

variable "vault_address" {
  description = "Adresse du serveur Vault pour la gestion des secrets"
  type        = string
  default     = "https://vault.luneo.app"
  
  validation {
    condition     = can(regex("^https?://", var.vault_address))
    error_message = "L'adresse Vault doit commencer par http:// ou https://."
  }
}

variable "vault_token" {
  description = "Token d'authentification Vault (optionnel)"
  type        = string
  sensitive   = true
  default     = ""
}

# ========================================
# DOMAIN & ENVIRONMENT
# ========================================

variable "domain" {
  description = "Nom de domaine principal de l'application"
  type        = string
  default     = "api.luneo.app"
  
  validation {
    condition     = can(regex("^[a-z0-9.-]+\\.[a-z]{2,}$", var.domain))
    error_message = "Le domaine doit être un nom de domaine valide."
  }
}

variable "environment" {
  description = "Environnement de déploiement (prod, staging, dev)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "L'environnement doit être 'prod', 'staging' ou 'dev'."
  }
}

# ========================================
# INFRASTRUCTURE CONFIGURATION
# ========================================

variable "region" {
  description = "Région Hetzner Cloud pour le déploiement"
  type        = string
  default     = "nbg1"
  
  validation {
    condition = contains([
      "nbg1",  # Nuremberg
      "fsn1",  # Falkenstein
      "hel1",  # Helsinki
      "ash",   # Ashburn
      "hil",   # Hillsboro
    ], var.region)
    error_message = "La région doit être une région Hetzner valide."
  }
}

variable "instance_type" {
  description = "Type d'instance pour les serveurs API"
  type        = string
  default     = "cpx31"
  
  validation {
    condition = contains([
      "cx11",   # 1 vCPU, 4GB RAM
      "cx21",   # 2 vCPU, 4GB RAM
      "cx31",   # 2 vCPU, 8GB RAM
      "cpx21",  # 3 vCPU, 4GB RAM
      "cpx31",  # 4 vCPU, 8GB RAM
      "cpx41",  # 8 vCPU, 16GB RAM
    ], var.instance_type)
    error_message = "Le type d'instance doit être valide pour Hetzner."
  }
}

variable "worker_instance_type" {
  description = "Type d'instance pour les workers AI"
  type        = string
  default     = "cpx41"
  
  validation {
    condition = contains([
      "cpx31",  # 4 vCPU, 8GB RAM
      "cpx41",  # 8 vCPU, 16GB RAM
      "cpx51",  # 16 vCPU, 32GB RAM
      "ccx22",  # 4 vCPU, 16GB RAM (compute optimized)
      "ccx32",  # 8 vCPU, 32GB RAM (compute optimized)
    ], var.worker_instance_type)
    error_message = "Le type d'instance worker doit être valide."
  }
}

variable "render_instance_type" {
  description = "Type d'instance pour les workers de rendu 3D"
  type        = string
  default     = "cpx51"
  
  validation {
    condition = contains([
      "cpx41",  # 8 vCPU, 16GB RAM
      "cpx51",  # 16 vCPU, 32GB RAM
      "ccx32",  # 8 vCPU, 32GB RAM (compute optimized)
      "ccx42",  # 16 vCPU, 64GB RAM (compute optimized)
    ], var.render_instance_type)
    error_message = "Le type d'instance de rendu doit être valide."
  }
}

# ========================================
# DATABASE CONFIGURATION
# ========================================

variable "postgres_password" {
  description = "Mot de passe pour l'utilisateur PostgreSQL"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.postgres_password) >= 16
    error_message = "Le mot de passe PostgreSQL doit contenir au moins 16 caractères."
  }
}

variable "redis_password" {
  description = "Mot de passe pour Redis"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.redis_password) >= 8
    error_message = "Le mot de passe Redis doit contenir au moins 8 caractères."
  }
}

variable "postgres_volume_size" {
  description = "Taille du volume PostgreSQL en GB"
  type        = number
  default     = 100
  
  validation {
    condition     = var.postgres_volume_size >= 20 && var.postgres_volume_size <= 1000
    error_message = "La taille du volume PostgreSQL doit être entre 20 et 1000 GB."
  }
}

variable "redis_volume_size" {
  description = "Taille du volume Redis en GB"
  type        = number
  default     = 20
  
  validation {
    condition     = var.redis_volume_size >= 10 && var.redis_volume_size <= 100
    error_message = "La taille du volume Redis doit être entre 10 et 100 GB."
  }
}

# ========================================
# NETWORKING
# ========================================

variable "private_network_cidr" {
  description = "CIDR du réseau privé"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.private_network_cidr, 0))
    error_message = "Le CIDR du réseau privé doit être valide."
  }
}

variable "api_subnet_cidr" {
  description = "CIDR du sous-réseau API"
  type        = string
  default     = "10.0.1.0/24"
}

variable "worker_subnet_cidr" {
  description = "CIDR du sous-réseau workers"
  type        = string
  default     = "10.0.2.0/24"
}

variable "db_subnet_cidr" {
  description = "CIDR du sous-réseau base de données"
  type        = string
  default     = "10.0.3.0/24"
}

# ========================================
# SECURITY
# ========================================

variable "allowed_ssh_ips" {
  description = "Liste des IPs autorisées pour SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"] # À restreindre en production
  
  validation {
    condition = alltrue([
      for ip in var.allowed_ssh_ips : can(cidrhost(ip, 0))
    ])
    error_message = "Toutes les IPs SSH doivent être des CIDR valides."
  }
}

variable "enable_ssh_key" {
  description = "Activer l'utilisation de clés SSH au lieu de mots de passe"
  type        = bool
  default     = true
}

variable "ssh_key_name" {
  description = "Nom de la clé SSH à utiliser (si enable_ssh_key est true)"
  type        = string
  default     = "luneo-deploy-key"
}

# ========================================
# MONITORING & LOGGING
# ========================================

variable "enable_monitoring" {
  description = "Activer le monitoring Prometheus/Grafana"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Activer la collecte de logs centralisée"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Durée de rétention des logs en jours"
  type        = number
  default     = 30
  
  validation {
    condition     = var.log_retention_days >= 7 && var.log_retention_days <= 365
    error_message = "La rétention des logs doit être entre 7 et 365 jours."
  }
}

# ========================================
# BACKUP CONFIGURATION
# ========================================

variable "enable_backups" {
  description = "Activer les sauvegardes automatiques"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Durée de rétention des sauvegardes en jours"
  type        = number
  default     = 30
  
  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 90
    error_message = "La rétention des sauvegardes doit être entre 7 et 90 jours."
  }
}

variable "backup_schedule" {
  description = "Planification des sauvegardes (cron format)"
  type        = string
  default     = "0 2 * * *" # Tous les jours à 2h du matin
}

# ========================================
# SCALING CONFIGURATION
# ========================================

variable "min_api_instances" {
  description = "Nombre minimum d'instances API"
  type        = number
  default     = 2
  
  validation {
    condition     = var.min_api_instances >= 1 && var.min_api_instances <= 10
    error_message = "Le nombre minimum d'instances API doit être entre 1 et 10."
  }
}

variable "max_api_instances" {
  description = "Nombre maximum d'instances API"
  type        = number
  default     = 5
  
  validation {
    condition     = var.max_api_instances >= var.min_api_instances && var.max_api_instances <= 20
    error_message = "Le nombre maximum d'instances API doit être >= minimum et <= 20."
  }
}

variable "enable_auto_scaling" {
  description = "Activer le scaling automatique"
  type        = bool
  default     = false # À implémenter avec des métriques
}

# ========================================
# APPLICATION CONFIGURATION
# ========================================

variable "app_port" {
  description = "Port de l'application"
  type        = number
  default     = 3001
  
  validation {
    condition     = var.app_port >= 1024 && var.app_port <= 65535
    error_message = "Le port de l'application doit être entre 1024 et 65535."
  }
}

variable "health_check_path" {
  description = "Chemin du health check"
  type        = string
  default     = "/health"
}

variable "health_check_interval" {
  description = "Intervalle du health check en secondes"
  type        = number
  default     = 15
  
  validation {
    condition     = var.health_check_interval >= 5 && var.health_check_interval <= 300
    error_message = "L'intervalle du health check doit être entre 5 et 300 secondes."
  }
}

# ========================================
# TAGS & LABELS
# ========================================

variable "project_name" {
  description = "Nom du projet pour les tags"
  type        = string
  default     = "luneo"
}

variable "owner_email" {
  description = "Email du propriétaire pour les tags"
  type        = string
  default     = "admin@luneo.app"
  
  validation {
    condition     = can(regex("^[^@]+@[^@]+\\.[^@]+$", var.owner_email))
    error_message = "L'email du propriétaire doit être valide."
  }
}

variable "cost_center" {
  description = "Centre de coût pour les tags"
  type        = string
  default     = "engineering"
}

# ========================================
# FEATURE FLAGS
# ========================================

variable "enable_ar_features" {
  description = "Activer les fonctionnalités AR/3D"
  type        = bool
  default     = false
}

variable "enable_ai_features" {
  description = "Activer les fonctionnalités IA"
  type        = bool
  default     = true
}

variable "enable_webhook_features" {
  description = "Activer les webhooks"
  type        = bool
  default     = true
}

variable "enable_sso_features" {
  description = "Activer les fonctionnalités SSO"
  type        = bool
  default     = false
}

