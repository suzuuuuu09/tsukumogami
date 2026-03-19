#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
BOOTSTRAP_DIR="$ROOT_DIR/infra/bootstrap"
TFVARS_FILE="${TFVARS_FILE:-$BOOTSTRAP_DIR/terraform.tfvars}"
ACTION="${1:-apply}"

usage() {
  cat <<EOF
Usage: $(basename "$0") [plan|apply|destroy|output]

Environment variables:
  TFVARS_FILE   Path to the bootstrap tfvars file. Default: $BOOTSTRAP_DIR/terraform.tfvars

Examples:
  cp $BOOTSTRAP_DIR/terraform.tfvars.example $BOOTSTRAP_DIR/terraform.tfvars
  ./scripts/bootstrap_tf_backend.sh plan
  ./scripts/bootstrap_tf_backend.sh apply
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

cd "$BOOTSTRAP_DIR"

echo "==> Running terraform init"
terraform init

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
