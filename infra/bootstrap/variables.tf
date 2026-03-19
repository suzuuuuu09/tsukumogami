variable "aws_region" {
  description = "AWS region to deploy the Terraform backend resources into."
  type        = string
}

variable "project_name" {
  description = "Project name prefix for backend resources."
  type        = string
}

variable "environment" {
  description = "Environment name such as dev, stg, or prod."
  type        = string
}

variable "lock_table_name" {
  description = "Optional DynamoDB table name for Terraform state locking."
  type        = string
  default     = null
  nullable    = true
}

variable "state_bucket_name" {
  description = "Optional S3 bucket name for the Terraform remote state."
  type        = string
  default     = null
  nullable    = true
}

variable "force_destroy" {
  description = "Allow deleting the state bucket even when it contains objects."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to all backend resources."
  type        = map(string)
  default     = {}
}
