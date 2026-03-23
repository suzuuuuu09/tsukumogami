# Tsukumogami

This repository contains a React frontend and a Flask backend.

## Local Docker

Start both services locally:

```bash
docker compose up -d --build
```

Local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5002`
- Health check: `http://localhost:5002/health`

## Terraform Infrastructure

The `infra` directory provisions the following AWS resources with Terraform:

- VPC with public and private subnets
- ECS Fargate cluster, services, and NLB
- ECR repositories for frontend and backend images
- DynamoDB
- S3 buckets for pipeline artifacts and app storage
- CloudWatch log groups
- CodeBuild and CodePipeline for CI/CD

Terraform state for the main stack is stored remotely in S3 and locked with DynamoDB.

### Files to edit

Set your environment-specific values in:

- `infra/terraform.tfvars`
- `infra/bootstrap/terraform.tfvars` for the Terraform state backend bootstrap stack

The file is intentionally ignored by Git so you can keep secrets local.

### Bootstrap the Terraform backend

Create the remote state bucket and lock table first:

```bash
cp infra/bootstrap/terraform.tfvars.example infra/bootstrap/terraform.tfvars
./scripts/bootstrap_tf_backend.sh apply
```

After that, create `infra/backend.hcl` using the bootstrap outputs. You can start from `infra/backend.hcl.example`:

```hcl
bucket         = "your-tfstate-bucket"
key            = "infra/terraform.tfstate"
region         = "ap-northeast-1"
dynamodb_table = "your-terraform-locks"
encrypt        = true
```

### Apply the main Terraform stack

```bash
cd infra
terraform init -backend-config=backend.hcl
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

You can also use the helper script:

```bash
BACKEND_CONFIG_FILE=./infra/backend.hcl ./scripts/deploy_infra.sh plan
BACKEND_CONFIG_FILE=./infra/backend.hcl ./scripts/deploy_infra.sh apply
```

### Important notes

- After Terraform creates the CodeStar connection, complete the GitHub connection handshake in the AWS console before the pipeline can pull source code.
- The backend task definition receives DynamoDB, S3, Yahoo API, and Gemini API settings from Terraform variables.
- The NLB exposes the frontend on port `443` with TLS termination and the backend on port `5002` with TLS as well.
- HTTPS requires a public Route 53 hosted zone plus an application hostname that you control. Terraform now provisions ACM DNS validation and a Route 53 alias for that hostname.
- Because NLB does not support path-based routing, the production frontend build is configured to call the backend on the same application hostname with port `5002`.
- NAT Gateway is not used. ECS tasks run in public subnets with public IPs.
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
- Terraform backend bootstrap for remote state
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
- `TF_BACKEND_BUCKET`
- `TF_BACKEND_DYNAMODB_TABLE`
- `TF_VAR_AWS_REGION`
- `TF_VAR_PROJECT_NAME`
- `TF_VAR_ENVIRONMENT`
- `TF_VAR_VPC_CIDR`
- `TF_VAR_PUBLIC_SUBNET_CIDRS`
- `TF_VAR_PRIVATE_SUBNET_CIDRS`
- `TF_VAR_DYNAMODB_TABLE_NAME`
- `TF_VAR_YAHOO_APP_ID`
- `TF_VAR_GEMINI_API_KEY`
- `TF_VAR_GITHUB_OWNER`
- `TF_VAR_GITHUB_REPO`
- `TF_VAR_PIPELINE_BRANCH`
- `TF_VAR_CODESTAR_CONNECTION_NAME`
- `TF_VAR_APP_DOMAIN_NAME`
- `TF_VAR_ROUTE53_ZONE_NAME`

Optional repository secret:

- `TF_BACKEND_STATE_KEY`: defaults to `infra/terraform.tfstate`
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

### First-time GitHub Actions setup

Before the normal Terraform workflow can run, execute `Terraform Backend Bootstrap` once from the GitHub Actions UI. It creates the remote state bucket and lock table using:

- `TF_BACKEND_BUCKET`
- `TF_BACKEND_DYNAMODB_TABLE`

After that, the regular `Terraform Deploy` workflow can use the same backend automatically.

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

### Recovering from a failed first apply

If an earlier apply created AWS resources before Terraform remote state was configured, Terraform may fail with `AlreadyExists` errors for ECR, IAM, S3, or CloudWatch resources. In that case:

1. configure the remote backend first
2. delete the orphaned resources from AWS, or import them into state
3. rerun `terraform plan`
