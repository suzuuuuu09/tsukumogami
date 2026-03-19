#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
INFRA_DIR="$ROOT_DIR/infra"
TFVARS_FILE="${TFVARS_FILE:-$INFRA_DIR/terraform.tfvars}"
ACTION="${1:-apply}"
BACKEND_CONFIG_FILE="${BACKEND_CONFIG_FILE:-}"
TF_BACKEND_BUCKET="${TF_BACKEND_BUCKET:-}"
TF_BACKEND_DYNAMODB_TABLE="${TF_BACKEND_DYNAMODB_TABLE:-}"
TF_BACKEND_STATE_KEY="${TF_BACKEND_STATE_KEY:-infra/terraform.tfstate}"
TF_BACKEND_REGION="${TF_BACKEND_REGION:-${AWS_REGION:-}}"
TEMP_BACKEND_CONFIG=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [plan|apply|destroy|output]

Environment variables:
  TFVARS_FILE   Path to the tfvars file. Default: $INFRA_DIR/terraform.tfvars
  BACKEND_CONFIG_FILE   Path to a Terraform backend config file for the S3 backend
  TF_BACKEND_BUCKET     S3 bucket name for the Terraform remote state
  TF_BACKEND_DYNAMODB_TABLE DynamoDB table name used for state locking
  TF_BACKEND_STATE_KEY  State object key inside the bucket. Default: infra/terraform.tfstate
  TF_BACKEND_REGION     AWS region for the Terraform backend. Defaults to AWS_REGION if set

Examples:
  BACKEND_CONFIG_FILE=./infra/backend.hcl ./scripts/deploy_infra.sh plan
  TF_BACKEND_BUCKET=my-tfstate TF_BACKEND_DYNAMODB_TABLE=my-locks TF_BACKEND_REGION=ap-northeast-1 ./scripts/deploy_infra.sh apply
  TFVARS_FILE=./infra/prod.tfvars ./scripts/deploy_infra.sh apply
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' was not found." >&2
    exit 1
  fi
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Error: required file '$1' was not found." >&2
    exit 1
  fi
}

cleanup() {
  if [ -n "$TEMP_BACKEND_CONFIG" ] && [ -f "$TEMP_BACKEND_CONFIG" ]; then
    rm -f "$TEMP_BACKEND_CONFIG"
  fi
}

trap cleanup EXIT

case "$ACTION" in
  plan|apply|destroy|output)
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    echo "Error: unsupported action '$ACTION'." >&2
    usage >&2
    exit 1
    ;;
esac

require_command terraform
require_file "$TFVARS_FILE"

cd "$INFRA_DIR"

if [ -n "$BACKEND_CONFIG_FILE" ]; then
  require_file "$BACKEND_CONFIG_FILE"
  TERRAFORM_INIT_ARGS="-backend-config=$BACKEND_CONFIG_FILE"
elif [ -n "$TF_BACKEND_BUCKET" ] && [ -n "$TF_BACKEND_DYNAMODB_TABLE" ]; then
  if [ -z "$TF_BACKEND_REGION" ]; then
    echo "Error: TF_BACKEND_REGION or AWS_REGION must be set when using TF_BACKEND_BUCKET/TF_BACKEND_DYNAMODB_TABLE." >&2
    exit 1
  fi

  TEMP_BACKEND_CONFIG="$INFRA_DIR/.backend.hcl"
  cat > "$TEMP_BACKEND_CONFIG" <<EOF
bucket         = "$TF_BACKEND_BUCKET"
key            = "$TF_BACKEND_STATE_KEY"
region         = "$TF_BACKEND_REGION"
dynamodb_table = "$TF_BACKEND_DYNAMODB_TABLE"
encrypt        = true
EOF
  TERRAFORM_INIT_ARGS="-backend-config=$TEMP_BACKEND_CONFIG"
else
  echo "Error: set BACKEND_CONFIG_FILE or TF_BACKEND_BUCKET/TF_BACKEND_DYNAMODB_TABLE before running this script." >&2
  exit 1
fi

echo "==> Running terraform init"
terraform init $TERRAFORM_INIT_ARGS

echo "==> Running terraform fmt"
terraform fmt -recursive

echo "==> Running terraform validate"
terraform validate

case "$ACTION" in
  plan)
    echo "==> Running terraform plan"
    terraform plan -var-file="$TFVARS_FILE"
    ;;
  apply)
    echo "==> Running terraform plan"
    terraform plan -var-file="$TFVARS_FILE" -out=tfplan
    echo "==> Running terraform apply"
    terraform apply tfplan
    rm -f tfplan
    ;;
  destroy)
    echo "==> Running terraform destroy"
    terraform destroy -var-file="$TFVARS_FILE"
    ;;
  output)
    echo "==> Running terraform output"
    terraform output
    ;;
esac
