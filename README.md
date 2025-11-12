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
  "<owner>/<repo-name>",  # Add your repo here and maintain alphabetical order
  ...
]

...

sa-mapping = { # Add your details here and maintain alphabetical order
  "${google_service_account.ai-review.account_id}-<repo-name>" = {
      sa_name   = google_service_account.ai-review.name
      attribute = "attribute.repository/<owner>/<repo>"
    }
    ...
}
```

### 2. Create a Caller Workflow in your repository

In order to create a caller workflow, follow the examples relevant to
your situation in:
https://github.com/cockroachlabs/ai-pr-review-workflow/tree/main/example-caller-workflows

## Example workflow

Here is the general anatomy of a caller workflow in it's most simple
form:

- Set the trigger, in this case pull requests
- Permissions for the Github token
- Create a new job that `uses` the workflow at a given version
- Pass in the secrets from the `GITHUB_TOKEN` secrets

```
name: Label PRs via reusable workflow

on:
  pull_request_target:
    types: [synchronize, ready_for_review, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write
  id-token: write

jobs:
  call-reusable:
    uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/test-ai-auth-reusable-workflow.yml@version
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Pinning a version of the workflow

### General best practices

- You want to ensure that you pin the version you're using for the
  workflow so that even if changes happen (malicious or buggy or
  otherwise), you're unaffected
- You want to specify a specific prompt that applies to your repository
  so that the code review takes into account rules and guidelines that
  best fit (the system prompt may not be helpful enough)
- Ensure that the elevated permissions you give have limited spread and scope

## Release Process

The approach that we plan to take for the release process is to
semantically version (i.e. v1.0.0) so that we can adjust with minor,
major, and patch changes. This will manifest as a tag we create on the
`main` branch each time.

The core requirement from users is that they whitelist the specific
major version they want to use in CI within their own repository
settings. It's recommended (and called out above) to use a pinned
version of the workflow. The safest way to do this is to pin to the hash
of a known-safe released version. However, given, that only CRDB
internal folks have access to contribute to this repository, it's likely
safe to specify a pin to a version.

### Steps

1. Navigate to the root repository page:
   https://github.com/cockroachlabs/ai-pr-review-workflow
2. Click on "Create a new release" on the "Releases" section in the
   right sidebar.
3. Create a new tag that matches the semantic versioning (i.e. if
   previously it was v1.0.1 and we go up a minor version, we will do
   v1.1.0)
4. Ensure that you do the following: set the target branch to main, use
   the auto previous tag and click "Generate release notes"
5. Then click "Publish release"
6. Now, callers can specify the version by replacing "@main" with
   "@version": https://github.com/cockroachlabs/ai-pr-review-workflow/blob/main/example-caller-workflows/example-ai-auth-caller-workflow.yml#L14

## References

Release for custom actions: https://docs.github.com/en/actions/how-tos/create-and-publish-actions/manage-custom-actions
