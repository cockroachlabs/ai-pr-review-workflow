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

Create a workflow file in your repository (e.g., `.github/workflows/ai-pr-review.yml`) to call the reusable AI PR review workflow.

## Usage Options

There are two ways to configure the AI review stages (prompts):

### Option A: Inline Configuration (Simplest)

Define your review stages directly in the workflow file:

```yaml
name: AI PR Review

on:
  pull_request_target:
    types: [synchronize, ready_for_review, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  ai-review:
    uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-pr-review.yml@v1.0.0
    with:
      stages_json: |
        [
          {
            "name": "bug-finder",
            "repo": "cockroachlabs/ai-pr-review-workflow",
            "ref": "main",
            "path": "prompts/bug-finder.md"
          },
          {
            "name": "custom-review",
            "path": ".github/prompts/custom.md"
          }
        ]
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}
```

### Option B: External JSON File (Recommended for Multiple Stages)

Store your stages configuration in a separate JSON file for easier management:

**1. Create `.github/prompts/stages.json` in your repo:**

```json
[
  {
    "name": "bug-finder",
    "repo": "cockroachlabs/ai-pr-review-workflow",
    "path": "prompts/bug-finder.md",
    "ref": "v1.0.0"
  },
  {
    "name": "molt-review",
    "path": ".github/prompts/molt.md"
  }
]
```

**2. Create your workflow file:**

```yaml
name: AI PR Review

on:
  pull_request_target:
    types: [synchronize, ready_for_review, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  fetch-config:
    uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/fetch-json.yml@v1.0.0
    with:
      path: .github/prompts/stages.json
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}

  ai-review:
    needs: fetch-config
    uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-pr-review.yml@v1.0.0
    with:
      stages_json: ${{ needs.fetch-config.outputs.json_string }}
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}
```

## Understanding stages.json Configuration

The `stages_json` parameter defines one or more "review stages" — each stage uses a specific prompt template to analyze your PR.

### Stage Object Properties

Each stage in the array has the following properties:

| Property | Required    | Description                                                                   | Example                                 |
| -------- | ----------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| `name`   | ✅ Yes      | Unique identifier for this review stage                                       | `"bug-finder"`                          |
| `path`   | ✅ Yes      | Path to the prompt markdown file                                              | `"prompts/bug-finder.md"`               |
| `repo`   | ❌ Optional | Repository containing the prompt (defaults to caller repo)                    | `"cockroachlabs/ai-pr-review-workflow"` |
| `ref`    | ❌ Optional | Git ref (branch/tag/commit) to fetch prompt from (defaults to default branch) | `"v1.0.0"` or `"main"`                  |

### Stage Types

**1. Shared Prompt from Central Repo:**

```json
{
  "name": "bug-finder",
  "repo": "cockroachlabs/ai-pr-review-workflow",
  "path": "prompts/bug-finder.md",
  "ref": "v1.0.0"
}
```

- Uses a prompt maintained in the central workflow repo
- Pin to a specific version with `ref` for stability
- Good for standardized reviews across multiple repos

**2. Custom Prompt from Your Repo:**

```json
{
  "name": "custom-review",
  "path": ".github/prompts/custom.md"
}
```

- Fetches prompt from your own repository
- No `repo` specified = uses the calling repository
- Good for repo-specific rules and guidelines

### Multiple Stages Example

Run multiple types of reviews on each PR:

```json
[
  {
    "name": "bug-finder",
    "repo": "cockroachlabs/ai-pr-review-workflow",
    "path": "prompts/bug-finder.md",
    "ref": "v1.0.0"
  },
  {
    "name": "security-check",
    "repo": "cockroachlabs/ai-pr-review-workflow",
    "path": "prompts/security.md",
    "ref": "v1.0.0"
  },
  {
    "name": "team-guidelines",
    "path": ".github/prompts/team-standards.md"
  }
]
```

This will run three separate AI reviews on each PR, each with a different focus.

### Creating Custom Prompts

1. Use the template at `prompts/[template].md` in this repo as a starting point
2. Save your custom prompt in your repo (e.g., `.github/prompts/my-review.md`)
3. Reference it in your `stages.json` configuration

See [prompts/bug-finder.md](prompts/bug-finder.md) for a complete example of a review prompt.

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

## Quick Reference

### Minimal Working Example

```yaml
# .github/workflows/ai-pr-review.yml
name: AI PR Review

on:
  pull_request_target:
    types: [synchronize, ready_for_review, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  ai-review:
    uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-pr-review.yml@v1.0.0
    with:
      stages_json: |
        [
          {
            "name": "bug-finder",
            "repo": "cockroachlabs/ai-pr-review-workflow",
            "path": "prompts/bug-finder.md",
            "ref": "v1.0.0"
          }
        ]
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}
```

### Available Shared Prompts

Prompts maintained in this repository that you can reference:

- `prompts/bug-finder.md` - Comprehensive bug detection focused review
- `prompts/guidelines.md` - General code quality and style guidelines
- `prompts/[template].md` - Template for creating custom prompts

### Example Repositories

See complete working examples:

- [example-caller-workflows/](example-caller-workflows/) - Example workflow configurations
- [example-caller-workflows/stages/](example-caller-workflows/stages/) - Example stages.json files

## References

- Release for custom actions: https://docs.github.com/en/actions/how-tos/create-and-publish-actions/manage-custom-actions
- Reusable workflows: https://docs.github.com/en/actions/using-workflows/reusing-workflows
