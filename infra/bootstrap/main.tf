data "aws_caller_identity" "current" {}

locals {
  name_prefix       = "${var.project_name}-${var.environment}"
  state_bucket_name = coalesce(var.state_bucket_name, lower(replace("${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-tfstate", "_", "-")))
  lock_table_name   = coalesce(var.lock_table_name, "${local.name_prefix}-terraform-locks")

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Stack       = "terraform-backend"
    },
    var.tags
  )
}

resource "aws_s3_bucket" "tfstate" {
  bucket        = local.state_bucket_name
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "locks" {
  name         = local.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
