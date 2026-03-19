# Tsukumogami

This repository contains a React frontend and a Flask backend.

## Local Docker

Start both services locally:

```bash
docker compose up -d --build
```

Local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Health check: `http://localhost:5001/health`

## Terraform Infrastructure

The `infra` directory provisions the following AWS resources with Terraform:

- VPC with public and private subnets
- ECS Fargate cluster, services, and NLB
- ECR repositories for frontend and backend images
- RDS PostgreSQL
- S3 buckets for pipeline artifacts and app storage
- CloudWatch log groups
- CodeBuild and CodePipeline for CI/CD

### Files to edit

Set your environment-specific values in:

- `infra/terraform.tfvars`

The file is intentionally ignored by Git so you can keep secrets local.

### Apply Terraform

```bash
cd infra
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

You can also use the helper script:

```bash
./scripts/deploy_infra.sh plan
./scripts/deploy_infra.sh apply
```

### Important notes

- After Terraform creates the CodeStar connection, complete the GitHub connection handshake in the AWS console before the pipeline can pull source code.
- The backend task definition receives database, S3, Yahoo API, and Gemini API settings from Terraform variables.
- The NLB exposes the frontend on port `80` and the backend on port `5001`.
- Because NLB does not support path-based routing, the production frontend build is configured to call the backend on the same NLB DNS name with port `5001`.
- NAT Gateway is not used. ECS tasks run in public subnets with public IPs, while RDS remains in private subnets.
- `scripts/deploy_infra.sh` runs `terraform init`, `fmt`, `validate`, and then the selected action with your `tfvars` file.

## CI/CD

`buildspec.yml` is used by CodeBuild to:

1. Build the backend and frontend Docker images
2. Push both images to ECR
3. Emit ECS image definition artifacts for CodePipeline

CodePipeline then deploys both ECS services from those artifacts.

## GitHub Actions

GitHub Actions workflows are configured for:

- frontend lint and build checks
- backend dependency install and import checks
- Terraform plan on pull requests
- Terraform plan on merges to `main`
- Terraform apply after review on merges to `main`

### Merge protection

To prevent merges into `main` when the app has errors, configure GitHub branch protection and require these checks:

- `Frontend Check`
- `Backend Check`
- `Terraform Plan`

### Required GitHub secrets and variables

Configure these repository secrets:

- `AWS_ROLE_ARN`: IAM role ARN used by GitHub OIDC to run Terraform
- `TF_VAR_AWS_REGION`
- `TF_VAR_PROJECT_NAME`
- `TF_VAR_ENVIRONMENT`
- `TF_VAR_VPC_CIDR`
- `TF_VAR_PUBLIC_SUBNET_CIDRS`
- `TF_VAR_PRIVATE_SUBNET_CIDRS`
- `TF_VAR_DB_NAME`
- `TF_VAR_DB_USERNAME`
- `TF_VAR_DB_PASSWORD`
- `TF_VAR_YAHOO_APP_ID`
- `TF_VAR_GEMINI_API_KEY`
- `TF_VAR_GITHUB_OWNER`
- `TF_VAR_GITHUB_REPO`
- `TF_VAR_PIPELINE_BRANCH`
- `TF_VAR_CODESTAR_CONNECTION_NAME`

Optional repository secret:

- `TF_VAR_TAGS`

For list and map variables, store valid Terraform/HCL values in the secret, for example:

- `TF_VAR_PUBLIC_SUBNET_CIDRS`: `["10.0.1.0/24","10.0.2.0/24"]`
- `TF_VAR_PRIVATE_SUBNET_CIDRS`: `["10.0.11.0/24","10.0.12.0/24"]`
- `TF_VAR_TAGS`: `{"Owner":"your-name"}`

### Pull request Terraform plan

When a pull request targets `main`, GitHub Actions will:

1. run `terraform fmt`
2. run `terraform init`
3. run `terraform validate`
4. run `terraform plan`
5. post a PR comment showing create, update, delete, and replace counts

### Review before apply

When code is merged into `main`, the `Terraform Deploy` workflow will:

1. run `terraform plan`
2. upload the reviewed plan artifact from that workflow run
3. pause before `terraform apply` at the GitHub Environment gate
4. wait for a reviewer to approve the `terraform-apply` environment
5. apply the exact reviewed plan artifact after approval

To make this work as an approval gate:

1. create a GitHub Environment named `terraform-apply`
2. add required reviewers to that environment
3. merge into `main`
4. review the `Terraform Plan` job output in the `Terraform Deploy` workflow
5. approve the `Terraform Apply` job
