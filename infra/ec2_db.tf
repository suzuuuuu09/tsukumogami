# ─────────────────────────────────────────────
# EC2 PostgreSQL Database Server
# ─────────────────────────────────────────────

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_instance" "db" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.db_instance_type
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.db_ec2.id]
  key_name               = var.db_key_name

  root_block_device {
    volume_size           = var.db_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/templates/db_user_data.sh", {
    db_name     = var.db_name
    db_username = var.db_username
    db_password = var.db_password
  }))

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}
