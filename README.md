# AI PR Review Workflow

This repository contains ar reusable, parameterized **AI PR review workflow** for Cockroach Labs repositories, integrating Vertex AI and a cockroach Claude Code fork for automated AI PR analysis.


## Getting Started
To use the AI PR Review Workflow in your repository, two configuration steps are required.

### 1. Enable the AI Review Service Account

The workflow authenticates with GCP to access Vertex AI models. You must enable the `ai-review@dev-inf-prod.iam.gserviceaccount.com` service account for your repository.

Update the Terraform configuration, ensuring the list of repos is alphabetized, in the [`crl-infrastructure` repo](https://github.com/cockroachlabs/crl-infrastructure/blob/main/terraform/gcp/cockroachlabs.com/engineering/developer-infrastructure/dev-inf-prod/ai-review.tf):

```hcl
# File: terraform/gcp/cockroachlabs.com/engineering/developer-infrastructure/dev-inf-prod/ai-review.tf

enabled_repositories = [
  "cockroachdb/cockroach",
  "cockroachlabs/example-repo",  # Add your repo here
  ...
]

...

sa-mapping = {
  "${google_service_account.ai-review.account_id}-<repo-name>" = {
      sa_name   = google_service_account.ai-review.name
      attribute = "attribute.repository/<owner>/<repo>"
    }
    ...
}
```

### 2. Create a Caller Workflow in your repository
<!-- Details TBD -->

## Example workflow 
<!-- Insert example Caller Workflows -->