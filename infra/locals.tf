data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 2)

  artifact_bucket_name = lower(replace("${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-artifacts", "_", "-"))
  app_bucket_name      = lower(replace("${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-app", "_", "-"))

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  backend_environment = [
    { name = "PORT", value = tostring(var.backend_container_port) },
    { name = "YAHOO_APP_ID", value = var.yahoo_app_id },
    { name = "GEMINI_API_KEY", value = var.gemini_api_key },
    { name = "DB_HOST", value = aws_db_instance.postgres.address },
    { name = "DB_PORT", value = tostring(var.db_port) },
    { name = "DB_NAME", value = var.db_name },
    { name = "DB_USER", value = var.db_username },
    { name = "DB_PASSWORD", value = var.db_password },
    { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:${var.db_port}/${var.db_name}" },
    { name = "APP_BUCKET", value = aws_s3_bucket.app_storage.bucket },
    { name = "AWS_REGION", value = var.aws_region }
  ]
}
