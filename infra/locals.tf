data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 2)

  artifact_bucket_name = lower(replace("${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-artifacts", "_", "-"))
  app_bucket_name      = lower(replace("${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-app", "_", "-"))
  frontend_bucket_name = lower(replace("${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-frontend", "_", "-"))
  backend_domain_name  = coalesce(var.backend_domain_name, "api.${var.app_domain_name}")

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  # database_url が明示的に指定されていればそれを使い、なければ EC2 DB から自動生成
  database_url = coalesce(
    var.database_url,
    "postgresql://${var.db_username}:${var.db_password}@${aws_instance.db.private_ip}:5432/${var.db_name}"
  )

  backend_environment = [
    { name = "PORT", value = tostring(var.backend_container_port) },
    { name = "YAHOO_APP_ID", value = var.yahoo_app_id },
    { name = "GEMINI_API_KEY", value = var.gemini_api_key },
    { name = "DATABASE_URL", value = local.database_url },
    { name = "APP_BUCKET", value = aws_s3_bucket.app_storage.bucket },
    { name = "AWS_REGION", value = var.aws_region }
  ]
}
