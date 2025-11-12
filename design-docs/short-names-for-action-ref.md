# Short Names for Reusable Workflow References

## Problem

GitHub Actions requires the full path syntax to reference reusable workflows:

```yaml
uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/test-ai-auth-reusable-workflow.yml@v1.0.0
```

This is verbose and error-prone for users. We want something simpler like `@ai-pr-review/v1`.

## Constraint

GitHub Actions does **not** support alias/short-name syntax for reusable workflows. The full `owner/repo/.github/workflows/FILENAME.yml@ref` format is mandatory.

## Proposed Solution: Standardized Naming + Wrapper Repository Pattern

### Approach 1: Standardized Short Workflow Names (Simplest)

**Rename workflows to be as short as possible while remaining descriptive.**

#### Changes

1. Rename workflow files to minimal names:

   - `test-ai-auth-reusable-workflow.yml` → `ai-review.yml`
   - `test-simple-reusable-workflow.yml` → `ai-review-simple.yml`

2. Create version tags like `v1`, `v2` (not just `v1.0.0`) so the `@ref` part is short.

3. Document the canonical short reference in README:

```yaml
# AI PR Review (with GCP auth)
uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-review.yml@v1

# AI PR Review (simple, no auth)
uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-review-simple.yml@v1
```

**Benefits:**

- No additional repos or indirection
- Workflow file name becomes the "short name"
- Users copy/paste one line from docs
- Still explicit about what they're calling

**Result:**
The reference becomes ~40% shorter and more memorable.

---

### Approach 2: Composite Action Wrapper (If Even Shorter Names Needed)

If we want something like `cockroachlabs/ai-pr-review@v1`, we can create a **composite action** that wraps the workflow call.

#### Changes

1. Create a new repository: `cockroachlabs/ai-pr-review`

2. Add `action.yml` at the root:

```yaml
name: "AI PR Review"
description: "Run AI-powered PR review using Vertex AI"
inputs:
  caller-repo:
    description: "Repository calling this action"
    required: false
  token:
    description: "GitHub token"
    required: true
runs:
  using: "composite"
  steps:
    - name: Call AI Review Workflow
      uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-review.yml@v1
      with:
        caller-repo: ${{ inputs.caller-repo }}
      secrets:
        token: ${{ inputs.token }}
```

3. Callers use:

```yaml
jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: cockroachlabs/ai-pr-review@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

**Drawbacks:**

- Extra maintenance overhead (second repo)
- Indirection makes debugging harder
- Composite actions can't directly call reusable workflows (limitation)
- Would need to implement the logic directly in composite action steps

**Verdict:** Not recommended unless we rewrite the workflow as a composite action entirely.

---

## Recommended Approach

**Use Approach 1: Standardized Short Workflow Names**

### Implementation Plan

1. **Rename workflow files** to minimal, memorable names:

   - `ai-review.yml` (with GCP auth)
   - `ai-review-simple.yml` (no auth)

2. **Create floating version tags:**

   - `v1` (points to latest v1.x.x)
   - `v1.0.0`, `v1.1.0` (specific versions for pinning)

3. **Update README** with canonical short references prominently displayed:

```yaml
# Recommended: Pin to major version
uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-review.yml@v1

# Most secure: Pin to specific release commit SHA
uses: cockroachlabs/ai-pr-review-workflow/.github/workflows/ai-review.yml@abc123...
```

4. **Add a "Quick Start" snippet** at the top of README that users can copy directly

### Migration Path

- Keep old workflow names as symlinks or copies initially
- Add deprecation notice in old workflow files
- Remove after 2-3 releases

---

## Alternative: Org-Level Documentation Pattern

If workflow renaming is too disruptive, create an internal alias table in your org docs:

| Short Name          | Full Reference                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `@ai-review`        | `cockroachlabs/ai-pr-review-workflow/.github/workflows/test-ai-auth-reusable-workflow.yml@v1` |
| `@ai-review-simple` | `cockroachlabs/ai-pr-review-workflow/.github/workflows/test-simple-reusable-workflow.yml@v1`  |

Users refer to "use @ai-review" in conversation/docs, but copy the full path from the table.

**This is purely documentation-based** and requires no code changes.
