variable "bucket_name" {
  description = "Name of the S3 bucket (must be globally unique)"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for S3 encryption (optional, uses AES256 if null)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Map of tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "noncurrent_version_transition_days" {
  description = "Days before noncurrent versions transition to STANDARD_IA"
  type        = number
  default     = 30
}

variable "noncurrent_version_expiration_days" {
  description = "Days before noncurrent versions expire"
  type        = number
  default     = 365
}

variable "enable_glacier_transition" {
  description = "Enable transition to Glacier storage class"
  type        = bool
  default     = false
}

variable "glacier_transition_days" {
  description = "Days before objects transition to Glacier"
  type        = number
  default     = 90
}

variable "enable_ipv6" {
  description = "Enable IPv6 for CloudFront distribution"
  type        = bool
  default     = true
}

variable "default_root_object" {
  description = "Default root object for CloudFront"
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.price_class)
    error_message = "Price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100"
  }
}

variable "cache_min_ttl" {
  description = "Minimum TTL for CloudFront cache"
  type        = number
  default     = 0
}

variable "cache_default_ttl" {
  description = "Default TTL for CloudFront cache"
  type        = number
  default     = 86400
}

variable "cache_max_ttl" {
  description = "Maximum TTL for CloudFront cache"
  type        = number
  default     = 31536000
}

variable "custom_error_responses" {
  description = "List of custom error response configurations"
  type = list(object({
    error_code            = number
    response_code         = number
    response_page_path    = string
    error_caching_min_ttl = number
  }))
  default = []
}

variable "geo_restriction_type" {
  description = "Geo restriction type (none, whitelist, blacklist)"
  type        = string
  default     = "none"

  validation {
    condition     = contains(["none", "whitelist", "blacklist"], var.geo_restriction_type)
    error_message = "Geo restriction type must be one of: none, whitelist, blacklist"
  }
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo restriction"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional)"
  type        = string
  default     = null
}

variable "minimum_protocol_version" {
  description = "Minimum TLS protocol version"
  type        = string
  default     = "TLSv1.2_2021"
}

variable "logging_bucket" {
  description = "S3 bucket for CloudFront access logs (optional)"
  type        = string
  default     = null
}

variable "logging_prefix" {
  description = "Prefix for CloudFront access logs"
  type        = string
  default     = "cloudfront-logs/"
}

variable "logging_include_cookies" {
  description = "Include cookies in CloudFront access logs"
  type        = bool
  default     = false
}

variable "create_cache_policy" {
  description = "Create a CloudFront cache policy"
  type        = bool
  default     = false
}
