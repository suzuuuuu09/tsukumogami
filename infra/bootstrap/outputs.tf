output "terraform_state_bucket" {
  description = "S3 bucket name to use for the main Terraform backend."
  value       = aws_s3_bucket.tfstate.bucket
}

output "terraform_lock_table" {
  description = "DynamoDB table name to use for Terraform state locking."
  value       = aws_dynamodb_table.locks.name
}

output "backend_config_example" {
  description = "Suggested backend.hcl contents for the main infra stack."
  value       = <<EOF
bucket         = "${aws_s3_bucket.tfstate.bucket}"
key            = "infra/terraform.tfstate"
region         = "${var.aws_region}"
dynamodb_table = "${aws_dynamodb_table.locks.name}"
encrypt        = true
EOF
}
