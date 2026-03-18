output "nlb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "Public DNS name of the network load balancer."
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR repository URL for the backend image."
}

output "frontend_ecr_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR repository URL for the frontend image."
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS cluster name."
}

output "backend_service_name" {
  value       = aws_ecs_service.backend.name
  description = "ECS backend service name."
}

output "frontend_service_name" {
  value       = aws_ecs_service.frontend.name
  description = "ECS frontend service name."
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "RDS endpoint hostname."
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

output "codestar_connection_arn" {
  value       = aws_codestarconnections_connection.github.arn
  description = "CodeStar connection ARN. Complete the GitHub handshake in the AWS console after apply."
}
