variable "project" {
  description = "Nom court du projet utilisé pour les tags et les ressources."
  type        = string
  default     = "luneo"
}

variable "environment" {
  description = "Environnement ciblé (prod, staging, dev)."
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "L'environnement doit être 'prod', 'staging' ou 'dev'."
  }
}

variable "primary_region" {
  description = "Région AWS primaire (écriture)."
  type        = string
  default     = "eu-west-1"
}

variable "secondary_region" {
  description = "Région AWS secondaire (reprise)."
  type        = string
  default     = "us-east-1"
}

variable "primary_az_count" {
  description = "Nombre de zones de disponibilité utilisées dans la région primaire."
  type        = number
  default     = 3

  validation {
    condition     = var.primary_az_count >= 2
    error_message = "La région primaire doit exploiter au moins deux zones de disponibilité."
  }
}

variable "secondary_az_count" {
  description = "Nombre de zones de disponibilité utilisées dans la région secondaire."
  type        = number
  default     = 3

  validation {
    condition     = var.secondary_az_count >= 2
    error_message = "La région secondaire doit exploiter au moins deux zones de disponibilité."
  }
}

variable "vpc_primary_cidr" {
  description = "Bloc CIDR du VPC primaire."
  type        = string
  default     = "10.10.0.0/16"
}

variable "vpc_secondary_cidr" {
  description = "Bloc CIDR du VPC secondaire."
  type        = string
  default     = "10.20.0.0/16"
}

variable "kubernetes_version" {
  description = "Version de Kubernetes pour EKS."
  type        = string
  default     = "1.29"
}

variable "eks_primary_instance_types" {
  description = "Types d'instances on-demand pour le node group principal de la région primaire."
  type        = list(string)
  default     = ["m6i.large"]
}

variable "eks_primary_min_size" {
  description = "Taille minimale du node group principal primaire."
  type        = number
  default     = 3
}

variable "eks_primary_max_size" {
  description = "Taille maximale du node group principal primaire."
  type        = number
  default     = 9
}

variable "eks_primary_desired_size" {
  description = "Taille désirée du node group principal primaire."
  type        = number
  default     = 3
}

variable "eks_primary_spot_instance_types" {
  description = "Types d'instances spot pour la région primaire."
  type        = list(string)
  default     = ["m6i.large", "m5.large"]
}

variable "eks_primary_spot_min_size" {
  description = "Nombre minimum d'instances spot pour la région primaire."
  type        = number
  default     = 0
}

variable "eks_primary_spot_max_size" {
  description = "Nombre maximum d'instances spot pour la région primaire."
  type        = number
  default     = 6
}

variable "eks_primary_spot_desired_size" {
  description = "Nombre désiré d'instances spot pour la région primaire."
  type        = number
  default     = 2
}

variable "eks_secondary_instance_types" {
  description = "Types d'instances on-demand pour le node group principal de la région secondaire."
  type        = list(string)
  default     = ["m6i.large"]
}

variable "eks_secondary_min_size" {
  description = "Taille minimale du node group principal secondaire."
  type        = number
  default     = 2
}

variable "eks_secondary_max_size" {
  description = "Taille maximale du node group principal secondaire."
  type        = number
  default     = 6
}

variable "eks_secondary_desired_size" {
  description = "Taille désirée du node group principal secondaire."
  type        = number
  default     = 3
}

variable "eks_secondary_spot_instance_types" {
  description = "Types d'instances spot pour la région secondaire."
  type        = list(string)
  default     = ["m6i.large", "m5.large"]
}

variable "eks_secondary_spot_min_size" {
  description = "Nombre minimum d'instances spot pour la région secondaire."
  type        = number
  default     = 0
}

variable "eks_secondary_spot_max_size" {
  description = "Nombre maximum d'instances spot pour la région secondaire."
  type        = number
  default     = 4
}

variable "eks_secondary_spot_desired_size" {
  description = "Nombre désiré d'instances spot pour la région secondaire."
  type        = number
  default     = 2
}

variable "db_engine_version" {
  description = "Version du moteur Aurora PostgreSQL (doit supporter les clusters globaux)."
  type        = string
  default     = "14.13"
}

variable "db_name" {
  description = "Nom logique de la base de données applicative."
  type        = string
  default     = "luneo"
}

variable "db_master_username" {
  description = "Utilisateur principal de la base Aurora."
  type        = string
  default     = "luneo_admin"
}

variable "db_master_password" {
  description = "Mot de passe de l'utilisateur principal Aurora."
  type        = string
  sensitive   = true
}

variable "db_primary_instance_class" {
  description = "Classe d'instance pour les noeuds Aurora primaires."
  type        = string
  default     = "db.r6g.large"
}

variable "db_secondary_instance_class" {
  description = "Classe d'instance pour la région secondaire Aurora."
  type        = string
  default     = "db.r6g.large"
}

variable "db_primary_reader_count" {
  description = "Nombre d'instances reader supplémentaires dans la région primaire."
  type        = number
  default     = 1
}

variable "db_backup_retention_days" {
  description = "Nombre de jours de rétention des sauvegardes automatiques Aurora."
  type        = number
  default     = 7
}

variable "create_kubernetes_resources" {
  description = "Créer les ressources Kubernetes (namespaces, service accounts). Nécessite kubeconfig configuré."
  type        = bool
  default     = false
}

variable "db_backup_window" {
  description = "Fenêtre de sauvegarde Aurora (UTC)."
  type        = string
  default     = "04:00-05:00"
}

variable "db_maintenance_window" {
  description = "Fenêtre de maintenance Aurora (UTC)."
  type        = string
  default     = "mon:05:00-mon:06:00"
}

variable "artifact_bucket_suffix" {
  description = "Suffixe utilisé pour nommer les buckets S3 multi-régions."
  type        = string
  default     = "artifacts"
}

variable "route53_zone_id" {
  description = "Identifiant de la zone Route53 hébergeant le domaine API."
  type        = string
}

variable "api_domain_name" {
  description = "Nom de domaine de l'API exposée (ex: api.luneo.app)."
  type        = string
}

variable "primary_ingress_hostname" {
  description = "Hostname du load balancer créé par EKS dans la région primaire."
  type        = string
}

variable "secondary_ingress_hostname" {
  description = "Hostname du load balancer créé par EKS dans la région secondaire."
  type        = string
}

variable "primary_health_check_domain" {
  description = "Domaine ou sous-domaine utilisé pour le health check primaire."
  type        = string
}

variable "secondary_health_check_domain" {
  description = "Domaine ou sous-domaine utilisé pour le health check secondaire."
  type        = string
}

variable "health_check_path" {
  description = "Chemin HTTP interrogé lors des health checks Route53."
  type        = string
  default     = "/health"
}

variable "health_check_port" {
  description = "Port HTTPS interrogé pour les health checks."
  type        = number
  default     = 443
}

variable "db_replication_lag_threshold" {
  description = "Seuil (en secondes) déclenchant une alerte de lag de réplication Aurora."
  type        = number
  default     = 45
}

variable "s3_replication_pending_threshold" {
  description = "Seuil (en octets) déclenchant une alerte sur la réplication S3."
  type        = number
  default     = 524288000 # 500 MB
}

