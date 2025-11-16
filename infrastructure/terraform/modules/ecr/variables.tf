variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
}

variable "tags" {
  description = "Map of tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "image_tag_mutability" {
  description = "Image tag mutability (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "Image tag mutability must be MUTABLE or IMMUTABLE"
  }
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "encryption_type" {
  description = "Encryption type (AES256 or KMS)"
  type        = string
  default     = "AES256"

  validation {
    condition     = contains(["AES256", "KMS"], var.encryption_type)
    error_message = "Encryption type must be AES256 or KMS"
  }
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (required if encryption_type is KMS)"
  type        = string
  default     = null
}

variable "keep_last_n_images" {
  description = "Number of images to keep (lifecycle policy)"
  type        = number
  default     = 10
}

variable "tag_prefix_list" {
  description = "List of tag prefixes to apply lifecycle policy to"
  type        = list(string)
  default     = []
}

variable "untagged_image_expiration_days" {
  description = "Days before untagged images expire"
  type        = number
  default     = 7
}

variable "repository_policy" {
  description = "JSON policy document for repository access (optional)"
  type        = string
  default     = null
}

variable "enable_replication" {
  description = "Enable replication to other regions"
  type        = bool
  default     = false
}

variable "replication_regions" {
  description = "List of regions to replicate to"
  type        = list(string)
  default     = []
}
