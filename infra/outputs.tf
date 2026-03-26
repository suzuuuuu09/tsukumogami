output "nlb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "Public DNS name of the network load balancer."
}

output "frontend_url" {
  value       = "https://${var.app_domain_name}"
  description = "Public HTTPS URL for the CloudFront frontend."
}

output "backend_url" {
  value       = "https://${local.backend_domain_name}"
  description = "Public HTTPS URL for the backend."
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR repository URL for the backend image."
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS cluster name."
}

output "backend_service_name" {
  value       = aws_ecs_service.backend.name
  description = "ECS backend service name."
}

output "pipeline_name" {
  value       = aws_codepipeline.main.name
  description = "CodePipeline name."
}

output "artifact_bucket_name" {
  value       = aws_s3_bucket.artifacts.bucket
  description = "S3 bucket name used for pipeline artifacts."
}

output "app_bucket_name" {
  value       = aws_s3_bucket.app_storage.bucket
  description = "S3 bucket name used by the application."
}

output "frontend_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "S3 bucket name used by the frontend site."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront distribution ID for the frontend site."
}

output "codestar_connection_arn" {
  value       = aws_codestarconnections_connection.github.arn
  description = "CodeStar connection ARN. Complete the GitHub handshake in the AWS console after apply."
}

# ── DB EC2 ──

output "db_instance_id" {
  value       = aws_instance.db.id
  description = "EC2 instance ID of the PostgreSQL DB server."
}

output "db_private_ip" {
  value       = aws_instance.db.private_ip
  description = "Private IP address of the DB server."
}

output "database_url" {
  value       = local.database_url
  description = "PostgreSQL connection URL used by the backend."
  sensitive   = true
}
