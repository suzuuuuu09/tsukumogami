resource "aws_security_group" "ecs_services" {
  name        = "${local.name_prefix}-ecs-sg"
  description = "ECS service security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = var.backend_container_port
    to_port     = var.backend_container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db_ec2" {
  name        = "${local.name_prefix}-db-ec2-sg"
  description = "Security group for the PostgreSQL EC2 DB server"
  vpc_id      = aws_vpc.main.id

  # SSH アクセス (db_ssh_allowed_cidr で制限)
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.db_ssh_allowed_cidr]
  }

  # ECS タスクから PostgreSQL への接続
  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_services.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
