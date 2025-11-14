# Cloud Run Deployment Guide for AI PR Review Evaluation App

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cloud Run Service: eval-app-backend               │    │
│  │  - FastAPI application                              │    │
│  │  - Auto-scaling (0-10 instances)                   │    │
│  │  - Internal + External traffic                     │    │
│  │  - Health checks: /health                          │    │
│  └──────────────┬──────────────────────────────────────┘    │
│                 │                                             │
│                 │ DATABASE_URL (env var)                     │
│                 │                                             │
│  ┌──────────────▼──────────────────────────────────────┐    │
│  │  CockroachDB Serverless                            │    │
│  │  - Managed by Cockroach Cloud                       │    │
│  │  - Connection via Secret Manager                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cloud Run Service: eval-app-frontend              │    │
│  │  - Static React app (Nginx)                        │    │
│  │  - Points to backend via API_URL                   │    │
│  │  - Public access                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cloud Build Triggers                               │    │
│  │  - Auto-deploy on main branch push                 │    │
│  │  - Run migrations before backend deploy            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Secret Manager                                     │    │
│  │  - DATABASE_URL                                     │    │
│  │  - GITHUB_TOKEN                                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

### ✅ What We'll Implement

1. **Secret Management**

   - Store `DATABASE_URL` in Google Secret Manager
   - Mount secrets as environment variables at runtime
   - No secrets in container images

2. **Network Security**

   - Backend: Allow only authenticated requests (IAM)
   - Frontend: Public access for UI
   - CockroachDB: SSL/TLS required connections

3. **Authentication**

   - Use Google IAM for service-to-service auth
   - Consider adding Identity-Aware Proxy (IAP) for user access

4. **Least Privilege**
   - Service account with minimal permissions
   - Read-only access to secrets
   - No admin privileges

---

## Part 1: Manual Deployment

### Prerequisites

```bash
# Install required tools
brew install google-cloud-sdk

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 1: Set Up Secret Manager

```bash
# Create secrets
echo -n "cockroachdb+psycopg://user:pass@host:26257/db?sslmode=verify-full" | \
  gcloud secrets create DATABASE_URL \
    --data-file=- \
    --replication-policy=automatic

# Optional: GitHub token for scraper
echo -n "ghp_your_token_here" | \
  gcloud secrets create GITHUB_TOKEN \
    --data-file=- \
    --replication-policy=automatic

# Verify secrets
gcloud secrets list
```

### Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create eval-app-backend \
    --display-name="AI PR Review Eval Backend"

# Grant secret accessor role
PROJECT_ID=$(gcloud config get-value project)
gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:eval-app-backend@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GITHUB_TOKEN \
    --member="serviceAccount:eval-app-backend@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Step 3: Create Dockerfiles

**Backend Dockerfile** (`eval-app/backend/Dockerfile`):

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Copy alembic files
COPY alembic.ini ./
COPY alembic ./alembic

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Run migrations and start app
CMD uv run alembic upgrade head && \
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8080
```

**Frontend Dockerfile** (`eval-app/frontend/Dockerfile`):

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build app (will need API_URL at runtime)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx config** (`eval-app/frontend/nginx.conf`):

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Step 4: Build and Push Backend

```bash
cd eval-app/backend

# Set variables
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="eval-app-backend"

# Create Artifact Registry repository (first time only)
gcloud artifacts repositories create eval-app \
    --repository-format=docker \
    --location=$REGION \
    --description="AI PR Review Evaluation App"

# Build and push
gcloud builds submit \
    --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/eval-app/${SERVICE_NAME}:latest
```

### Step 5: Deploy Backend to Cloud Run

```bash
gcloud run deploy eval-app-backend \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/eval-app/${SERVICE_NAME}:latest \
    --platform=managed \
    --region=$REGION \
    --service-account=eval-app-backend@${PROJECT_ID}.iam.gserviceaccount.com \
    --set-secrets=DATABASE_URL=DATABASE_URL:latest,GITHUB_TOKEN=GITHUB_TOKEN:latest \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300 \
    --min-instances=0 \
    --max-instances=10 \
    --port=8080 \
    --allow-unauthenticated \
    --set-env-vars="API_TITLE=AI PR Review Evaluation API,API_VERSION=0.1.0"

# Get the backend URL
BACKEND_URL=$(gcloud run services describe eval-app-backend \
    --region=$REGION \
    --format='value(status.url)')

echo "Backend deployed at: $BACKEND_URL"
```

### Step 6: Update Backend CORS

Update `eval-app/backend/app/main.py` to allow frontend origin:

```python
# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://eval-app-frontend-*.run.app",  # Cloud Run frontend
        os.getenv("FRONTEND_URL", ""),  # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or set it via environment variable during deployment:

```bash
gcloud run services update eval-app-backend \
    --region=$REGION \
    --set-env-vars="ALLOWED_ORIGINS=https://eval-app-frontend-*.run.app"
```

### Step 7: Build and Deploy Frontend

```bash
cd eval-app/frontend

# Get backend URL
BACKEND_URL=$(gcloud run services describe eval-app-backend \
    --region=$REGION \
    --format='value(status.url)')

# Build with backend URL
gcloud builds submit \
    --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/eval-app/eval-app-frontend:latest \
    --substitutions=_VITE_API_URL=${BACKEND_URL}

# Deploy frontend
gcloud run deploy eval-app-frontend \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/eval-app/eval-app-frontend:latest \
    --platform=managed \
    --region=$REGION \
    --memory=256Mi \
    --cpu=1 \
    --port=8080 \
    --allow-unauthenticated \
    --set-env-vars="VITE_API_URL=${BACKEND_URL}"

# Get the frontend URL
FRONTEND_URL=$(gcloud run services describe eval-app-frontend \
    --region=$REGION \
    --format='value(status.url)')

echo "Frontend deployed at: $FRONTEND_URL"
```

### Step 8: Run Database Migrations

**Option A: Run migrations locally**

```bash
# Export DATABASE_URL from Secret Manager
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL)

# Run migrations
cd eval-app/backend
uv run alembic upgrade head
```

**Option B: Run migrations as a Cloud Run Job**

```bash
# Deploy migration job
gcloud run jobs create eval-app-migrate \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/eval-app/eval-app-backend:latest \
    --region=$REGION \
    --service-account=eval-app-backend@${PROJECT_ID}.iam.gserviceaccount.com \
    --set-secrets=DATABASE_URL=DATABASE_URL:latest \
    --command="uv,run,alembic,upgrade,head" \
    --max-retries=3 \
    --task-timeout=300

# Execute migration
gcloud run jobs execute eval-app-migrate --region=$REGION --wait
```

### Step 9: Test the Deployment

```bash
# Test backend health
curl https://eval-app-backend-*.run.app/health

# Test backend API
curl https://eval-app-backend-*.run.app/api/repos

# Open frontend
open https://eval-app-frontend-*.run.app
```

---

## Part 2: Terraform Deployment

### Directory Structure

```
eval-app/terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── secrets.tf
├── backend.tf
├── frontend.tf
└── cloudbuild.tf
```

### `terraform/main.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Store state in GCS bucket
  backend "gcs" {
    bucket = "YOUR_TERRAFORM_STATE_BUCKET"
    prefix = "eval-app"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
  ])

  service            = each.key
  disable_on_destroy = false
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "eval_app" {
  location      = var.region
  repository_id = "eval-app"
  format        = "DOCKER"
  description   = "AI PR Review Evaluation App container images"

  depends_on = [google_project_service.required_apis]
}
```

### `terraform/variables.tf`

```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run services"
  type        = string
  default     = "us-central1"
}

variable "database_url" {
  description = "CockroachDB connection string"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GitHub personal access token for scraper"
  type        = string
  sensitive   = true
  default     = ""
}

variable "backend_min_instances" {
  description = "Minimum number of backend instances"
  type        = number
  default     = 0
}

variable "backend_max_instances" {
  description = "Maximum number of backend instances"
  type        = number
  default     = 10
}

variable "allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = []
}
```

### `terraform/secrets.tf`

```hcl
# Create secrets in Secret Manager
resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}

resource "google_secret_manager_secret" "github_token" {
  count     = var.github_token != "" ? 1 : 0
  secret_id = "GITHUB_TOKEN"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "github_token" {
  count       = var.github_token != "" ? 1 : 0
  secret      = google_secret_manager_secret.github_token[0].id
  secret_data = var.github_token
}

# Service account for backend
resource "google_service_account" "backend" {
  account_id   = "eval-app-backend"
  display_name = "AI PR Review Eval Backend"
}

# Grant secret access to service account
resource "google_secret_manager_secret_iam_member" "backend_database_url" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "backend_github_token" {
  count     = var.github_token != "" ? 1 : 0
  secret_id = google_secret_manager_secret.github_token[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}
```

### `terraform/backend.tf`

```hcl
# Cloud Run service for backend
resource "google_cloud_run_v2_service" "backend" {
  name     = "eval-app-backend"
  location = var.region

  template {
    service_account = google_service_account.backend.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-backend:latest"

      ports {
        container_port = 8080
      }

      env {
        name  = "API_TITLE"
        value = "AI PR Review Evaluation API"
      }

      env {
        name  = "API_VERSION"
        value = "0.1.0"
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      dynamic "env" {
        for_each = var.github_token != "" ? [1] : []
        content {
          name = "GITHUB_TOKEN"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.github_token[0].secret_id
              version = "latest"
            }
          }
        }
      }

      resources {
        limits = {
          memory = "512Mi"
          cpu    = "1"
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 30
        timeout_seconds       = 3
        period_seconds        = 30
      }
    }

    scaling {
      min_instance_count = var.backend_min_instances
      max_instance_count = var.backend_max_instances
    }

    timeout = "300s"
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_iam_member.backend_database_url
  ]
}

# Allow unauthenticated access
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Job for migrations
resource "google_cloud_run_v2_job" "migrate" {
  name     = "eval-app-migrate"
  location = var.region

  template {
    template {
      service_account = google_service_account.backend.email

      containers {
        image   = "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-backend:latest"
        command = ["uv", "run", "alembic", "upgrade", "head"]

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.database_url.secret_id
              version = "latest"
            }
          }
        }
      }

      max_retries = 3
      timeout     = "300s"
    }
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_iam_member.backend_database_url
  ]
}
```

### `terraform/frontend.tf`

```hcl
# Cloud Run service for frontend
resource "google_cloud_run_v2_service" "frontend" {
  name     = "eval-app-frontend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-frontend:latest"

      ports {
        container_port = 8080
      }

      env {
        name  = "VITE_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }

      resources {
        limits = {
          memory = "256Mi"
          cpu    = "1"
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis,
    google_cloud_run_v2_service.backend
  ]
}

# Allow unauthenticated access
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  name     = google_cloud_run_v2_service.frontend.name
  location = google_cloud_run_v2_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

### `terraform/cloudbuild.tf`

```hcl
# Cloud Build trigger for backend
resource "google_cloudbuild_trigger" "backend" {
  name        = "eval-app-backend-deploy"
  description = "Deploy backend on main branch push"

  github {
    owner = "cockroachlabs"
    name  = "ai-pr-review-workflow"
    push {
      branch = "^main$"
    }
  }

  included_files = ["eval-app/backend/**"]

  build {
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build",
        "-t", "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-backend:$SHORT_SHA",
        "-t", "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-backend:latest",
        "eval-app/backend"
      ]
    }

    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "push",
        "--all-tags",
        "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-backend"
      ]
    }

    # Run migrations
    step {
      name = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      args = [
        "gcloud", "run", "jobs", "execute", "eval-app-migrate",
        "--region", var.region,
        "--wait"
      ]
    }

    # Deploy to Cloud Run
    step {
      name = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      args = [
        "gcloud", "run", "deploy", "eval-app-backend",
        "--image", "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-backend:$SHORT_SHA",
        "--region", var.region,
        "--platform", "managed"
      ]
    }
  }
}

# Cloud Build trigger for frontend
resource "google_cloudbuild_trigger" "frontend" {
  name        = "eval-app-frontend-deploy"
  description = "Deploy frontend on main branch push"

  github {
    owner = "cockroachlabs"
    name  = "ai-pr-review-workflow"
    push {
      branch = "^main$"
    }
  }

  included_files = ["eval-app/frontend/**"]

  build {
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build",
        "--build-arg", "VITE_API_URL=${google_cloud_run_v2_service.backend.uri}",
        "-t", "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-frontend:$SHORT_SHA",
        "-t", "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-frontend:latest",
        "eval-app/frontend"
      ]
    }

    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "push",
        "--all-tags",
        "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-frontend"
      ]
    }

    step {
      name = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      args = [
        "gcloud", "run", "deploy", "eval-app-frontend",
        "--image", "${var.region}-docker.pkg.dev/${var.project_id}/eval-app/eval-app-frontend:$SHORT_SHA",
        "--region", var.region,
        "--platform", "managed"
      ]
    }
  }
}
```

### `terraform/outputs.tf`

```hcl
output "backend_url" {
  description = "URL of the backend Cloud Run service"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "URL of the frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "backend_service_account" {
  description = "Email of the backend service account"
  value       = google_service_account.backend.email
}

output "migration_job_name" {
  description = "Name of the migration Cloud Run Job"
  value       = google_cloud_run_v2_job.migrate.name
}
```

### Terraform Usage

```bash
# Initialize Terraform
cd eval-app/terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id   = "your-gcp-project-id"
region       = "us-central1"
database_url = "cockroachdb+psycopg://user:pass@host:26257/db?sslmode=verify-full"
github_token = "ghp_your_token_here"
EOF

# Plan deployment
terraform plan

# Apply deployment
terraform apply

# Get outputs
terraform output backend_url
terraform output frontend_url
```

---

## Database Migration Strategy

### Option 1: Manual Migrations (Simple)

Run migrations locally before deploying:

```bash
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL)
cd eval-app/backend
uv run alembic upgrade head
```

### Option 2: Cloud Run Job (Recommended)

Execute migration job before each deployment:

```bash
gcloud run jobs execute eval-app-migrate --region=us-central1 --wait
```

### Option 3: Init Container (Advanced)

Add init container to Cloud Run service that runs migrations before starting the app.

### Option 4: Cloud Build Step (Automated)

Include migration step in Cloud Build pipeline (shown in Terraform example above).

---

## CI/CD Pipeline

### Recommended Workflow

1. **Developer pushes to main branch**
2. **Cloud Build triggers**:
   - Build Docker image
   - Push to Artifact Registry
   - Run database migrations (Cloud Run Job)
   - Deploy to Cloud Run
   - Run health checks

### GitHub Actions Alternative

```yaml
# .github/workflows/deploy-eval-app.yml
name: Deploy Eval App

on:
  push:
    branches: [main]
    paths:
      - "eval-app/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Build and Push Backend
        run: |
          gcloud builds submit eval-app/backend \
            --tag us-central1-docker.pkg.dev/$PROJECT_ID/eval-app/eval-app-backend:latest

      - name: Run Migrations
        run: |
          gcloud run jobs execute eval-app-migrate \
            --region us-central1 \
            --wait

      - name: Deploy Backend
        run: |
          gcloud run deploy eval-app-backend \
            --image us-central1-docker.pkg.dev/$PROJECT_ID/eval-app/eval-app-backend:latest \
            --region us-central1

      - name: Build and Deploy Frontend
        run: |
          BACKEND_URL=$(gcloud run services describe eval-app-backend \
            --region us-central1 \
            --format='value(status.url)')

          gcloud builds submit eval-app/frontend \
            --tag us-central1-docker.pkg.dev/$PROJECT_ID/eval-app/eval-app-frontend:latest \
            --substitutions=_VITE_API_URL=$BACKEND_URL

          gcloud run deploy eval-app-frontend \
            --image us-central1-docker.pkg.dev/$PROJECT_ID/eval-app/eval-app-frontend:latest \
            --region us-central1
```

---

## Monitoring & Observability

### Health Checks

Both services have `/health` endpoints:

```bash
# Check backend
curl https://eval-app-backend-*.run.app/health

# Check frontend
curl https://eval-app-frontend-*.run.app/health
```

### Cloud Logging

```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=eval-app-backend" --limit=50

# View frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=eval-app-frontend" --limit=50
```

### Cloud Monitoring

Set up alerts for:

- High error rates (>5% 5xx responses)
- High latency (>2s p95)
- Low availability (<99%)
- High memory usage (>80%)

---

## Cost Optimization

### Backend

- **Min instances**: 0 (scale to zero when idle)
- **Max instances**: 10 (adjust based on load)
- **Memory**: 512Mi (sufficient for FastAPI)
- **CPU**: 1 (sufficient for API workload)

### Frontend

- **Min instances**: 0 (static content, can scale to zero)
- **Max instances**: 5 (lower traffic expected)
- **Memory**: 256Mi (nginx is lightweight)
- **CPU**: 1

### Expected Monthly Cost (Low Traffic)

- **Backend**: $5-20/month (mostly request charges)
- **Frontend**: $2-10/month (very light)
- **Artifact Registry**: $0.10/GB/month
- **Secret Manager**: $0.06/secret/month
- **Total**: ~$10-40/month for low traffic

---

## Security Checklist

- [ ] Secrets stored in Secret Manager (not in code)
- [ ] Service account with minimal permissions
- [ ] SSL/TLS for database connections
- [ ] CORS properly configured
- [ ] Health checks enabled
- [ ] Container images scanned for vulnerabilities
- [ ] IAM policies follow least privilege
- [ ] Audit logging enabled
- [ ] Consider adding Identity-Aware Proxy for admin access
- [ ] Regular secret rotation policy

---

## Troubleshooting

### Issue: "Cannot connect to database"

```bash
# Check secret value
gcloud secrets versions access latest --secret=DATABASE_URL

# Test connection locally
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL)
cd eval-app/backend
uv run python -c "from app.database import engine; print(engine.url)"
```

### Issue: "Migration failed"

```bash
# Check migration job logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=eval-app-migrate" --limit=20

# Run migration manually with verbose output
gcloud run jobs execute eval-app-migrate --region=us-central1 --wait
```

### Issue: "CORS error in frontend"

Update backend CORS settings:

```bash
gcloud run services update eval-app-backend \
  --region=us-central1 \
  --update-env-vars="ALLOWED_ORIGINS=https://eval-app-frontend-*.run.app"
```

### Issue: "Service not receiving traffic"

```bash
# Check service status
gcloud run services describe eval-app-backend --region=us-central1

# Check IAM bindings
gcloud run services get-iam-policy eval-app-backend --region=us-central1
```

---

## Next Steps

1. **Initial Setup** (1-2 hours)

   - Create GCP project
   - Enable APIs
   - Set up secrets
   - Create service accounts

2. **First Deployment** (2-3 hours)

   - Create Dockerfiles
   - Build and push images
   - Deploy backend
   - Run migrations
   - Deploy frontend
   - Test end-to-end

3. **Automation** (2-4 hours)

   - Set up Terraform
   - Configure Cloud Build triggers
   - Set up monitoring/alerts

4. **Production Hardening** (Ongoing)
   - Add custom domain
   - Set up IAP for admin access
   - Configure backup strategy
   - Implement secret rotation
   - Set up staging environment

---

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Cloud Build Configuration](https://cloud.google.com/build/docs/configuring-builds/create-basic-configuration)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
