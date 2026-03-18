variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
}

variable "project_name" {
  description = "Project name prefix for all resources."
  type        = string
}

variable "environment" {
  description = "Environment name such as dev, stg, or prod."
  type        = string
}

variable "availability_zones" {
  description = "Optional list of AZs. Leave empty to use the first two available AZs."
  type        = list(string)
  default     = []
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks."
  type        = list(string)
}

variable "backend_container_port" {
  description = "Container port for the backend service."
  type        = number
  default     = 5001
}

variable "frontend_container_port" {
  description = "Container port for the frontend service."
  type        = number
  default     = 80
}

variable "backend_cpu" {
  description = "CPU units for the backend task."
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory (MiB) for the backend task."
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for the frontend task."
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MiB) for the frontend task."
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks."
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks."
  type        = number
  default     = 1
}

variable "db_name" {
  description = "RDS database name."
  type        = string
}

variable "db_username" {
  description = "RDS master username."
  type        = string
}

variable "db_password" {
  description = "RDS master password."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GiB."
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "16.3"
}

variable "db_port" {
  description = "Database port."
  type        = number
  default     = 5432
}

variable "rds_skip_final_snapshot" {
  description = "Skip the final snapshot on destroy."
  type        = bool
  default     = true
}

variable "s3_force_destroy" {
  description = "Force destroy S3 buckets on terraform destroy."
  type        = bool
  default     = false
}

variable "yahoo_app_id" {
  description = "Yahoo Shopping API application ID for the backend."
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Gemini API key for the backend."
  type        = string
  sensitive   = true
}

variable "pipeline_branch" {
  description = "Repository branch for CodePipeline."
  type        = string
  default     = "main"
}

variable "github_owner" {
  description = "GitHub organization or user name."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

variable "codestar_connection_name" {
  description = "Name of the CodeStar connection resource."
  type        = string
}

variable "codebuild_compute_type" {
  description = "CodeBuild compute type."
  type        = string
  default     = "BUILD_GENERAL1_MEDIUM"
}

variable "cloudwatch_log_retention_days" {
  description = "Retention period for CloudWatch log groups."
  type        = number
  default     = 14
}

variable "tags" {
  description = "Additional tags to apply to all resources."
  type        = map(string)
  default     = {}
}
