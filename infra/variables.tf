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
  default     = 5002
}

variable "frontend_container_port" {
  description = "Container port for the frontend service."
  type        = number
  default     = 80
}

variable "frontend_listener_port" {
  description = "Public listener port for the frontend on the NLB."
  type        = number
  default     = 443
}

variable "frontend_listener_protocol" {
  description = "Frontend listener protocol for the NLB."
  type        = string
  default     = "TLS"
}

variable "backend_listener_protocol" {
  description = "Backend listener protocol for the NLB."
  type        = string
  default     = "TLS"
}

variable "app_domain_name" {
  description = "Public DNS name for the application, such as app.example.com."
  type        = string
}

variable "backend_domain_name" {
  description = "Public DNS name for the backend API. Leave null to use api.<app_domain_name>."
  type        = string
  default     = null
  nullable    = true
}

variable "route53_zone_name" {
  description = "Public Route 53 hosted zone name that manages the application domain, such as example.com."
  type        = string
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

variable "database_url" {
  description = "SQLAlchemy database URL. Leave null to auto-generate from the EC2 DB instance."
  type        = string
  default     = null
  nullable    = true
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "app"
}

variable "db_username" {
  description = "PostgreSQL admin username."
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL admin password."
  type        = string
  sensitive   = true
}

variable "db_instance_type" {
  description = "EC2 instance type for the DB server."
  type        = string
  default     = "t3.micro"
}

variable "db_volume_size" {
  description = "Root EBS volume size (GiB) for the DB EC2 instance."
  type        = number
  default     = 20
}

variable "db_key_name" {
  description = "EC2 key pair name for SSH access to the DB server."
  type        = string
  default     = null
  nullable    = true
}

variable "db_ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH into the DB server."
  type        = string
  default     = "0.0.0.0/0"
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
  default     = 7
}

variable "tags" {
  description = "Additional tags to apply to all resources."
  type        = map(string)
  default     = {}
}
