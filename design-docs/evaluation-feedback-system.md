# AI PR Review Evaluation & Feedback System

## Quick Start: Path to v1 MVP

**Goal:** Get feedback collection + web dashboard working in 2-3 days

**Updated Stack:**

- ✅ **CockroachDB Serverless** (in your dev instance) for storage
- ✅ **FastAPI** for backend API
- ✅ **Jinja2 template + Vue.js** for UI (or separate React app)
- ✅ Data collection script that writes to CRDB

### Critical Path (Do These First)

#### Day 1: Modify the Workflow

1. ✅ **Add unique identifier to AI review comments** (30 min)

   - Edit `.github/workflows/ai-review.yml`
   - Add HTML comment with `review_id`, `version`, `repo`
   - Add "Was this helpful? React 👍/👎" text

2. ✅ **Add PR labels for tracking** (15 min)

   - Auto-apply `ai-reviewed` label when comment is posted
   - This lets us easily find PRs to check

3. ✅ **Deploy updated workflow** (15 min)
   - Merge changes to main
   - Tag a new version (e.g., `v1.3.0`)

#### Day 2: Setup Database & Data Collection

1. ✅ **Create CockroachDB Serverless database** (30 min)

   - Create database `ai_review_feedback` in your dev instance
   - Run SQL schema (see implementation section below)

2. ✅ **Create `scripts/fetch_reactions.py`** (2-3 hours)

   - Uses GitHub API to find all AI review comments (via `ai-reviewed` label)
   - Extracts review IDs from comment HTML
   - Fetches reactions for each comment
   - **Writes directly to CockroachDB** with UPSERT

3. ✅ **Test the script** (30 min)
   - Run with `--days 7` to fetch recent data
   - Verify data appears in database

#### Day 3: Build Web Dashboard

1. ✅ **Create FastAPI app** (`app/main.py`) (2-3 hours)

   - API endpoints: `/api/stats`, `/api/examples`, `/api/repos`
   - Queries CockroachDB for aggregated data
   - Returns JSON for frontend

2. ✅ **Create dashboard template** (`app/templates/dashboard.html`) (1-2 hours)

   - Jinja2 template with Vue.js for interactivity
   - Shows: overall stats, repo table, example PRs
   - Filters by repo and time range

3. ✅ **Run end-to-end** (30 min)

   ```bash
   # Collect data
   python scripts/fetch_reactions.py --days 30

   # Start web app
   uvicorn app.main:app --reload --port 8000

   # Visit http://localhost:8000
   ```

4. ✅ **Share with team** (30 min)
   - Deploy to Cloud Run or share local URL
   - Get feedback on whether this meets needs

### What v1 Delivers

✅ **Functional Requirements Met:**

- [x] Emoji-based feedback collection (👍/👎)
- [x] **CockroachDB Serverless** for persistent storage
- [x] Aggregated data across all subscribed repos
- [x] Filter by repository and time range (7/30/90 days)
- [x] Links to example PRs (positive/negative/neutral)
- [x] **Interactive web UI** (FastAPI + Jinja2 template with Vue.js)
- [x] Success rate metrics with tables

✅ **What's NOT in v1 (comes later):**

- ❌ Real-time updates (manual script runs, add cron later)
- ❌ Automatic labeling from action (manual filtering for now)
- ❌ Webhooks (using GitHub API polling)
- ❌ Advanced analytics (trend charts, A/B testing)
- ❌ Email reports

### After v1: Next Steps

If v1 proves useful, move to Phase 2 (see below) for:

- Automated polling service (cron job for fetch script)
- More advanced filtering and analytics
- Deployed to Cloud Run

---

## v1 Implementation with CockroachDB Serverless + FastAPI

### Architecture

```
GitHub API → fetch_reactions.py → CockroachDB Serverless
                                          ↓
                                   FastAPI Backend
                                          ↓
                              Jinja2 Template / React UI
```

### Key Detail: Linking to Comments

When displaying examples, we link **directly to the AI review comment** (not just the PR):

- **PR URL**: `https://github.com/owner/repo/pull/123`
- **Comment URL**: `https://github.com/owner/repo/pull/123#issuecomment-456789`

This is constructed as: `{pr_url}#issuecomment-{comment_id}`

This way, when users click an example, they jump straight to the AI review comment with its reactions, making it easy to see what worked or didn't work.

### Step 1: Database Setup (CockroachDB Serverless)

**Create the database schema:**

```sql
-- Connect to your CockroachDB Serverless instance in dev-inf-prod
-- postgresql://user:password@host:26257/defaultdb?sslmode=verify-full

CREATE DATABASE ai_review_feedback;

USE ai_review_feedback;

-- Core reviews table
CREATE TABLE ai_reviews (
    review_id STRING PRIMARY KEY,
    repo_name STRING NOT NULL,
    pr_number INT NOT NULL,
    pr_url STRING NOT NULL,
    pr_title STRING,
    comment_id INT8 NOT NULL,
    comment_url STRING NOT NULL,  -- Direct link to the comment
    workflow_version STRING,
    posted_at TIMESTAMP NOT NULL,

    -- Feedback data
    -- Essentially we count the number of thumbs up versus thumbs down
    -- If we have more positive than negative, we are positive. And vice versa
    -- If we have same number or no reactions, neutral.
    sentiment STRING CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    last_updated TIMESTAMP DEFAULT NOW(),

    INDEX sentiment (sentiment),
    INDEX idx_repo_sentiment (repo_name, sentiment),
    INDEX idx_posted_at (posted_at DESC)
);

-- Optional: Track repos for filtering
CREATE TABLE repos (
    repo_name STRING PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    team STRING,
    subscribed_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Data Collection Script with CockroachDB

**`scripts/fetch_reactions.py`** - Now writes directly to CockroachDB:

```python
#!/usr/bin/env python3
import os
import re
import sys
from datetime import datetime, timedelta
from github import Github
import psycopg2
from psycopg2.extras import execute_batch

# Configuration
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
DATABASE_URL = os.environ["COCKROACH_DB_URL"]  # postgresql://...

def extract_metadata(comment_body):
    """Extract metadata from AI review comment."""
    review_id = re.search(r"<!-- ai-review-id: (.*?) -->", comment_body)
    version = re.search(r"<!-- ai-review-version: (.*?) -->", comment_body)

    return {
        "review_id": review_id.group(1) if review_id else None,
        "version": version.group(1) if version else "unknown"
    }

def fetch_and_store_reactions(days=7):
    """Fetch reactions from GitHub and store in CockroachDB."""

    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Initialize GitHub client
    gh = Github(GITHUB_TOKEN)
    org = gh.get_organization("cockroachlabs")

    reviews_to_upsert = []
    processed = 0
    errors = 0

    print(f"Scanning repos in cockroachlabs org...")

    # Find all PRs with ai-reviewed label across all repos
    for repo in org.get_repos():
        try:
            issues = repo.get_issues(
                state="all",
                labels=["ai-reviewed"],
                since=datetime.now() - timedelta(days=days)
            )

            for issue in issues:
                # Find AI review comment
                for comment in issue.get_comments():
                    if "<!-- ai-review-id:" in comment.body:
                        # Extract metadata
                        metadata = extract_metadata(comment.body)

                        if not metadata["review_id"]:
                            continue

                        # Get reactions
                        reactions = comment.get_reactions()
                        positive = sum(1 for r in reactions if r.content == "+1")
                        negative = sum(1 for r in reactions if r.content == "-1")

                        # Determine sentiment
                        if positive > negative:
                            sentiment = "positive"
                        elif negative > positive:
                            sentiment = "negative"
                        else:
                            sentiment = "neutral"

                        # Build comment URL: https://github.com/owner/repo/pull/123#issuecomment-456789
                        comment_url = f"{issue.html_url}#issuecomment-{comment.id}"

                        reviews_to_upsert.append((
                            metadata["review_id"],
                            repo.full_name,
                            issue.number,
                            issue.html_url,
                            issue.title,
                            comment.id,
                            comment_url,  # Add comment URL
                            metadata["version"],
                            comment.created_at,
                            sentiment,
                            positive,
                            negative,
                            datetime.now()
                        ))

                        processed += 1

        except Exception as e:
            print(f"Error processing {repo.name}: {e}", file=sys.stderr)
            errors += 1

    # Batch upsert to database
    if reviews_to_upsert:
        upsert_sql = """
            UPSERT INTO ai_reviews (
                review_id, repo_name, pr_number, pr_url, pr_title,
                comment_id, comment_url, workflow_version, posted_at,
                sentiment, positive_reactions, negative_reactions, last_updated
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        execute_batch(cur, upsert_sql, reviews_to_upsert)
        conn.commit()

    print(f"\n✅ Processed {processed} reviews ({errors} errors)")
    print(f"✅ Stored in CockroachDB: {len(reviews_to_upsert)} records")

    cur.close()
    conn.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch AI review reactions and store in CockroachDB")
    parser.add_argument("--days", type=int, default=7, help="Number of days to look back")
    args = parser.parse_args()

    fetch_and_store_reactions(days=args.days)
```

### Step 3: FastAPI Web App

**`app/main.py`** - Queries CockroachDB and serves data:

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Optional

app = FastAPI(title="AI PR Review Feedback Dashboard")

# Templates for Jinja2
templates = Jinja2Templates(directory="app/templates")

# Database connection
DATABASE_URL = os.environ["COCKROACH_DB_URL"]

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Serve the main dashboard (Jinja2 template)."""
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/api/stats")
async def get_stats(days: Optional[int] = 30, repo: Optional[str] = None):
    """Get aggregate statistics."""
    conn = get_db_connection()
    cur = conn.cursor()

    # Build query with optional filters
    where_clauses = [f"posted_at >= NOW() - INTERVAL '{days} days'"]
    params = []

    if repo:
        where_clauses.append("repo_name = %s")
        params.append(repo)

    where_sql = " AND ".join(where_clauses)

    # Overall stats
    cur.execute(f"""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
            COUNT(*) FILTER (WHERE sentiment = 'negative') as negative,
            COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
            ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'positive') / NULLIF(COUNT(*), 0), 1) as success_rate
        FROM ai_reviews
        WHERE {where_sql}
    """, params)

    overall = cur.fetchone()

    # By repository
    cur.execute(f"""
        SELECT
            repo_name,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
            COUNT(*) FILTER (WHERE sentiment = 'negative') as negative,
            COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
            ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'positive') / COUNT(*), 1) as success_rate
        FROM ai_reviews
        WHERE {where_sql}
        GROUP BY repo_name
        ORDER BY total DESC
    """, params)

    by_repo = cur.fetchall()

    # Time series (daily)
    cur.execute(f"""
        SELECT
            DATE(posted_at) as date,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
            COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
        FROM ai_reviews
        WHERE {where_sql}
        GROUP BY DATE(posted_at)
        ORDER BY date DESC
        LIMIT 30
    """, params)

    timeseries = cur.fetchall()

    cur.close()
    conn.close()

    return {
        "overall": overall,
        "by_repo": by_repo,
        "timeseries": timeseries
    }

@app.get("/api/examples")
async def get_examples(
    sentiment: str = "positive",
    limit: int = 10,
    repo: Optional[str] = None
):
    """Get example PRs for a given sentiment."""
    conn = get_db_connection()
    cur = conn.cursor()

    where_clauses = ["sentiment = %s"]
    params = [sentiment]

    if repo:
        where_clauses.append("repo_name = %s")
        params.append(repo)

    params.append(limit)

    cur.execute(f"""
        SELECT
            review_id,
            repo_name,
            pr_number,
            pr_url,
            pr_title,
            comment_url,
            sentiment,
            positive_reactions,
            negative_reactions,
            posted_at
        FROM ai_reviews
        WHERE {" AND ".join(where_clauses)}
        ORDER BY posted_at DESC
        LIMIT %s
    """, params)

    examples = cur.fetchall()

    cur.close()
    conn.close()

    return {"examples": examples}

@app.get("/api/repos")
async def get_repos():
    """Get list of all repos with reviews."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT repo_name
        FROM ai_reviews
        ORDER BY repo_name
    """)

    repos = [row["repo_name"] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return {"repos": repos}
```

### Step 4: Jinja2 Template (Simple Option)

**`app/templates/dashboard.html`** - Server-side rendered with Vue.js for interactivity:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI PR Review Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  </head>
  <body class="bg-gray-50">
    <div id="app" class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-8">
        🤖 AI PR Review Feedback Dashboard
      </h1>

      <!-- Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Total Reviews</div>
          <div class="text-3xl font-bold">\{{ stats.overall?.total || 0 }}</div>
        </div>
        <div class="bg-green-50 p-6 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Positive</div>
          <div class="text-3xl font-bold text-green-600">
            \{{ stats.overall?.positive || 0 }}
          </div>
        </div>
        <div class="bg-red-50 p-6 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Negative</div>
          <div class="text-3xl font-bold text-red-600">
            \{{ stats.overall?.negative || 0 }}
          </div>
        </div>
        <div class="bg-blue-50 p-6 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Success Rate</div>
          <div class="text-3xl font-bold text-blue-600">
            \{{ stats.overall?.success_rate || 0 }}%
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-lg shadow mb-8">
        <div class="flex gap-4">
          <select
            v-model="selectedRepo"
            @change="fetchData"
            class="border rounded px-4 py-2"
          >
            <option value="">All Repositories</option>
            <option v-for="repo in repos" :value="repo">\{{ repo }}</option>
          </select>
          <select
            v-model="days"
            @change="fetchData"
            class="border rounded px-4 py-2"
          >
            <option :value="7">Last 7 days</option>
            <option :value="30">Last 30 days</option>
            <option :value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <!-- By Repository Table -->
      <div class="bg-white rounded-lg shadow mb-8">
        <h2 class="text-2xl font-bold p-6 border-b">By Repository</h2>
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left">Repository</th>
              <th class="px-6 py-3 text-left">Total</th>
              <th class="px-6 py-3 text-left">Positive</th>
              <th class="px-6 py-3 text-left">Negative</th>
              <th class="px-6 py-3 text-left">Neutral</th>
              <th class="px-6 py-3 text-left">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="repo in stats.by_repo" class="border-t">
              <td class="px-6 py-4">\{{ repo.repo_name }}</td>
              <td class="px-6 py-4">\{{ repo.total }}</td>
              <td class="px-6 py-4 text-green-600">\{{ repo.positive }}</td>
              <td class="px-6 py-4 text-red-600">\{{ repo.negative }}</td>
              <td class="px-6 py-4 text-gray-600">\{{ repo.neutral }}</td>
              <td class="px-6 py-4 font-bold">\{{ repo.success_rate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Examples -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow">
          <h3 class="text-xl font-bold p-4 bg-green-50 rounded-t-lg">
            👍 Positive Examples
          </h3>
          <ul class="divide-y">
            <li v-for="ex in examples.positive" class="p-4 hover:bg-gray-50">
              <a
                :href="ex.comment_url"
                target="_blank"
                class="text-blue-600 hover:underline"
                title="View AI review comment"
              >
                \{{ ex.repo_name }} #\{{ ex.pr_number }}
              </a>
              <div class="text-sm text-gray-500 truncate">
                \{{ ex.pr_title }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                👍 \{{ ex.positive_reactions }} 👎 \{{ ex.negative_reactions }}
              </div>
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow">
          <h3 class="text-xl font-bold p-4 bg-red-50 rounded-t-lg">
            👎 Negative Examples
          </h3>
          <ul class="divide-y">
            <li v-for="ex in examples.negative" class="p-4 hover:bg-gray-50">
              <a
                :href="ex.comment_url"
                target="_blank"
                class="text-blue-600 hover:underline"
                title="View AI review comment"
              >
                \{{ ex.repo_name }} #\{{ ex.pr_number }}
              </a>
              <div class="text-sm text-gray-500 truncate">
                \{{ ex.pr_title }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                👍 \{{ ex.positive_reactions }} 👎 \{{ ex.negative_reactions }}
              </div>
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow">
          <h3 class="text-xl font-bold p-4 bg-gray-50 rounded-t-lg">
            😐 Neutral Examples
          </h3>
          <ul class="divide-y">
            <li v-for="ex in examples.neutral" class="p-4 hover:bg-gray-50">
              <a
                :href="ex.comment_url"
                target="_blank"
                class="text-blue-600 hover:underline"
                title="View AI review comment"
              >
                \{{ ex.repo_name }} #\{{ ex.pr_number }}
              </a>
              <div class="text-sm text-gray-500 truncate">
                \{{ ex.pr_title }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                👍 \{{ ex.positive_reactions }} 👎 \{{ ex.negative_reactions }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <script>
      const { createApp } = Vue;

      createApp({
        data() {
          return {
            stats: { overall: {}, by_repo: [], timeseries: [] },
            examples: { positive: [], negative: [], neutral: [] },
            repos: [],
            selectedRepo: "",
            days: 30,
          };
        },
        mounted() {
          this.fetchRepos();
          this.fetchData();
        },
        methods: {
          async fetchRepos() {
            const response = await fetch("/api/repos");
            const data = await response.json();
            this.repos = data.repos;
          },
          async fetchData() {
            // Fetch stats
            const params = new URLSearchParams({
              days: this.days,
              ...(this.selectedRepo && { repo: this.selectedRepo }),
            });

            const statsResponse = await fetch(`/api/stats?${params}`);
            this.stats = await statsResponse.json();

            // Fetch examples
            for (const sentiment of ["positive", "negative", "neutral"]) {
              const examplesResponse = await fetch(
                `/api/examples?sentiment=${sentiment}&limit=5&${
                  this.selectedRepo ? "repo=" + this.selectedRepo : ""
                }`
              );
              const data = await examplesResponse.json();
              this.examples[sentiment] = data.examples;
            }
          },
        },
      }).mount("#app");
    </script>
  </body>
</html>
```

### Step 5: Dependencies & Setup

**`requirements.txt`:**

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
psycopg2-binary==2.9.9
PyGithub==2.1.1
jinja2==3.1.2
python-multipart==0.0.6
```

**Project structure:**

```
ai-pr-review-workflow/
├── scripts/
│   └── fetch_reactions.py
├── app/
│   ├── main.py
│   └── templates/
│       └── dashboard.html
├── requirements.txt
└── README.md
```

### Step 6: Run Everything

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GITHUB_TOKEN="ghp_your_token_here"
export COCKROACH_DB_URL="postgresql://user:pass@host:26257/ai_review_feedback?sslmode=verify-full"

# Run data collection (can schedule with cron later)
python scripts/fetch_reactions.py --days 30

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Visit http://localhost:8000
```

**For Production:**

```bash
# Run data collection every hour via cron
0 * * * * cd /path/to/repo && python scripts/fetch_reactions.py --days 7

# Deploy FastAPI to Cloud Run
gcloud run deploy ai-review-dashboard \
  --source . \
  --region us-central1 \
  --set-env-vars COCKROACH_DB_URL=$DATABASE_URL
```

### Alternative: Separate React Frontend (Optional)

If you prefer a fully decoupled React app instead of Jinja2 templates:

**1. Keep the FastAPI backend as-is** (just the API endpoints)

**2. Create a separate React app:**

```bash
npx create-react-app ai-review-dashboard-ui
cd ai-review-dashboard-ui
npm install recharts axios
```

**3. Build a simple React dashboard** that calls the FastAPI endpoints:

```jsx
// src/App.js
import { useState, useEffect } from "react";

function App() {
  const [stats, setStats] = useState({ overall: {}, by_repo: [] });
  const [examples, setExamples] = useState({
    positive: [],
    negative: [],
    neutral: [],
  });
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days, selectedRepo]);

  const fetchData = async () => {
    const params = new URLSearchParams({
      days,
      ...(selectedRepo && { repo: selectedRepo }),
    });
    const statsRes = await fetch(`http://localhost:8000/api/stats?${params}`);
    setStats(await statsRes.json());

    for (const sentiment of ["positive", "negative", "neutral"]) {
      const exRes = await fetch(
        `http://localhost:8000/api/examples?sentiment=${sentiment}&limit=5`
      );
      const data = await exRes.json();
      setExamples((prev) => ({ ...prev, [sentiment]: data.examples }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Same UI structure as Jinja2 template */}
    </div>
  );
}
```

**4. Deploy separately:**

- FastAPI backend on Cloud Run
- React frontend on Vercel/Netlify
- Configure CORS in FastAPI

**Verdict:** For v1, the **Jinja2 template approach is simpler** (single deployment, no CORS), but React gives you more flexibility for complex interactions later.

---

## Problem

We need to measure the effectiveness of AI PR reviews across all repos using this workflow. Currently, we have no data on:

- Which reviews are helpful vs unhelpful
- Success rates across different repositories
- Patterns in what makes a good/bad review

## Goal

Build a feedback collection and evaluation system that:

1. Captures user sentiment (positive/negative/neutral) via emoji reactions on PR comments
2. Aggregates data across all subscribed repositories
3. Presents results in a UI with links to examples
4. Helps improve the AI review quality over time

---

## Proposed Solution

### Feedback Mechanism: Emoji Reactions

Use emoji reactions on the AI-generated root PR comment to collect feedback:

- 👍 (`:+1:`) = **Positive** - Review was helpful
- 👎 (`:-1:`) = **Negative** - Review was not helpful
- No reaction = **Neutral** - Undetermined/no feedback

**Why emojis?**

- Zero friction for users
- Native GitHub feature
- No additional UI needed in PR
- Clear sentiment signal

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Repositories (with AI PR Review workflow enabled)   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ (1) AI posts comment with unique identifier
                 │ (2) Users react with emoji
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│              Data Collection Method (choose one)            │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   A. Webhook Push    │  OR  │   B. API Polling     │   │
│  │   (Real-time)        │      │   (Batch)            │   │
│  └──────────┬───────────┘      └──────────┬───────────┘   │
└─────────────┼──────────────────────────────┼──────────────┘
              │                              │
              ▼                              ▼
┌────────────────────────────────────────────────────────────┐
│           Evaluation Service (Backend)                      │
│  - Receives comment IDs, reactions, metadata                │
│  - Stores in database (BigQuery / Postgres)                 │
│  - Aggregates metrics by repo, time, prompt version         │
└────────────────────────────────┬───────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────┐
│               Evaluation UI (Frontend)                      │
│  - Dashboard with metrics (% positive, negative, neutral)   │
│  - Filter by: repo, date range, prompt version              │
│  - Links to example PRs for each category                   │
│  - Trend charts over time                                   │
└────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Auto-Labeling from the Action

Modify the reusable workflow to:

**a) Add unique identifier to each comment**

```yaml
# In .github/workflows/ai-review.yml
- name: Post AI Review Comment
  id: post_comment
  run: |
    COMMENT_BODY="## 🤖 AI Review

    [review content here]

    ---
    <!-- ai-review-id: ${{ github.run_id }}-${{ github.run_attempt }} -->
    <!-- ai-review-version: v1.2.0 -->
    <!-- ai-review-repo: ${{ github.repository }} -->

    **Was this review helpful?** React with 👍 or 👎"

    gh pr comment ${{ github.event.pull_request.number }} --body "$COMMENT_BODY"
```

**b) Apply auto-labels to PR**

```yaml
- name: Label PR for Tracking
  run: |
    gh pr edit ${{ github.event.pull_request.number }} \
      --add-label "ai-reviewed" \
      --add-label "ai-review-feedback-pending"
```

**c) Send initial event to evaluation service**

```yaml
- name: Report Review Posted
  run: |
    curl -X POST https://ai-review-eval.cockroachlabs.net/api/reviews \
      -H "Content-Type: application/json" \
      -d '{
        "review_id": "${{ github.run_id }}-${{ github.run_attempt }}",
        "repo": "${{ github.repository }}",
        "pr_number": ${{ github.event.pull_request.number }},
        "comment_id": "${{ steps.post_comment.outputs.comment_id }}",
        "workflow_version": "v1.2.0",
        "timestamp": "${{ github.event.pull_request.updated_at }}",
        "pr_url": "${{ github.event.pull_request.html_url }}"
      }'
```

### 2. Repository Filtering

Store metadata about subscribed repos:

```sql
-- repos table
CREATE TABLE repos (
  repo_name TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP,
  team TEXT,
  primary_language TEXT
);

-- Populate from crl-infrastructure terraform config
INSERT INTO repos (repo_name, team) VALUES
  ('cockroachdb/cockroach', 'database'),
  ('cockroachlabs/cloud', 'cloud'),
  ...
```

UI can filter by:

- Repository name
- Team
- Language
- Date subscribed

### 3. Data Collection: Webhook vs Polling

#### Option A: Webhook Push (Real-time)

**Setup:**

1. Create GitHub App with webhook subscription for `issue_comment` events
2. Install app on `cockroachlabs` org (requires admin approval)
3. Webhook endpoint receives reaction events in real-time

**Pros:**

- Real-time data
- No rate limits
- Efficient (event-driven)

**Cons:**

- Requires GitHub App setup and org approval
- More complex infrastructure (need webhook receiver)
- Must handle webhook verification, retries

**Implementation:**

```python
# Webhook receiver (Flask/FastAPI)
@app.post("/webhooks/github")
async def handle_webhook(request: Request):
    payload = await request.json()

    if payload["action"] in ["created", "deleted"]:
        reaction = payload["reaction"]
        comment = payload["comment"]

        # Check if comment is from AI review
        if "<!-- ai-review-id:" in comment["body"]:
            review_id = extract_review_id(comment["body"])

            # Update database
            await db.record_reaction(
                review_id=review_id,
                reaction=reaction["content"],  # "+1" or "-1"
                user=reaction["user"]["login"],
                created_at=reaction["created_at"]
            )
```

#### Option B: GitHub API Polling (Batch)

**Setup:**

1. Cron job runs every N minutes/hours
2. Query GitHub API for comments with AI review markers
3. Fetch reactions for each comment

**Pros:**

- Simpler setup (no webhook infrastructure)
- No GitHub App approval needed
- Uses existing GitHub API token

**Cons:**

- Delayed data (polling interval)
- Rate limit concerns (5000 req/hr for org)
- More API calls needed

**Implementation:**

```python
# Polling job (runs every 15 minutes)
async def poll_reactions():
    # Get all reviews from last 24 hours
    reviews = await db.get_reviews_without_feedback(hours=24)

    for review in reviews:
        # Fetch comment reactions
        reactions = await github_api.get_comment_reactions(
            repo=review.repo,
            comment_id=review.comment_id
        )

        # Calculate sentiment
        positive = sum(1 for r in reactions if r.content == "+1")
        negative = sum(1 for r in reactions if r.content == "-1")

        sentiment = "positive" if positive > negative else \
                   "negative" if negative > positive else \
                   "neutral"

        await db.update_review_feedback(
            review_id=review.id,
            sentiment=sentiment,
            positive_count=positive,
            negative_count=negative
        )
```

**Rate Limit Management:**

```python
# Batch requests efficiently
async def poll_with_rate_limiting():
    # Use GraphQL to fetch multiple comments in one request
    query = """
    query($repos: [String!]!) {
      search(query: "org:cockroachlabs is:pr comments:>0",
             type: ISSUE, first: 100) {
        nodes {
          ... on PullRequest {
            comments(last: 10) {
              nodes {
                body
                reactions(first: 20) {
                  nodes { content, createdAt }
                }
              }
            }
          }
        }
      }
    }
    """
```

#### Recommendation: Start with Polling, Migrate to Webhook

- **Phase 1-2**: Use polling (simpler)
- **Phase 3**: Add webhook for real-time updates

---

## Database Schema

```sql
-- Core reviews table
CREATE TABLE ai_reviews (
  review_id TEXT PRIMARY KEY,
  repo_name TEXT NOT NULL,
  pr_number INTEGER NOT NULL,
  pr_url TEXT NOT NULL,
  comment_id BIGINT NOT NULL,
  workflow_version TEXT NOT NULL,
  posted_at TIMESTAMP NOT NULL,

  -- Feedback data
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  positive_reactions INTEGER DEFAULT 0,
  negative_reactions INTEGER DEFAULT 0,
  last_updated TIMESTAMP,

  -- Metadata
  pr_author TEXT,
  pr_title TEXT,
  pr_size TEXT, -- 'small', 'medium', 'large'
  files_changed INTEGER,

  FOREIGN KEY (repo_name) REFERENCES repos(repo_name)
);

-- Index for efficient queries
CREATE INDEX idx_repo_sentiment ON ai_reviews(repo_name, sentiment);
CREATE INDEX idx_posted_at ON ai_reviews(posted_at);
CREATE INDEX idx_workflow_version ON ai_reviews(workflow_version);

-- Aggregate stats (materialized view)
CREATE MATERIALIZED VIEW review_stats AS
SELECT
  repo_name,
  workflow_version,
  DATE(posted_at) as date,
  COUNT(*) as total_reviews,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'positive') / COUNT(*), 1) as positive_pct
FROM ai_reviews
GROUP BY repo_name, workflow_version, DATE(posted_at);
```

---

## Evaluation UI

### Key Features

1. **Dashboard Overview**

   - Overall success rate across all repos
   - Total reviews posted
   - Trend chart (7d, 30d, 90d)

2. **Repository View**

   - Table of all repos with their stats
   - Sortable by success rate, volume
   - Filter by date range, version

3. **Example Browser**

   - Three columns: Positive, Negative, Neutral
   - Each shows list of PRs with links
   - Can filter by repo, date
   - Pagination

4. **PR Detail View**
   - Shows the AI comment
   - Shows PR metadata
   - Link to full PR on GitHub

### UI Mockup (React/Next.js)

```typescript
// components/Dashboard.tsx
export function Dashboard() {
  const { data } = useReviewStats({ days: 30 });

  return (
    <div>
      <StatCards
        total={data.total}
        positive={data.positive}
        negative={data.negative}
        successRate={data.positiveRate}
      />

      <TrendChart data={data.timeseries} />

      <RepoTable repos={data.byRepo} />

      <ExampleBrowser
        positive={data.examples.positive}
        negative={data.examples.negative}
        neutral={data.examples.neutral}
      />
    </div>
  );
}
```

### Tech Stack

**Frontend:**

- Next.js (React) with TypeScript
- Tailwind CSS for styling
- Recharts for visualizations
- Deploy on Vercel or Cloud Run

**Backend:**

- Python FastAPI or Go
- PostgreSQL for data storage (or BigQuery for analytics)
- Deploy on Cloud Run

**Authentication:**

- Cockroach Labs SSO
- Restrict to internal employees

---

## Phased Implementation

### Phase 1: MVP (2-3 days)

**Goal:** Prove the concept with manual data collection

**Scope:**

1. ✅ Modify workflow to add review IDs to comments
2. ✅ Add "Was this helpful?" text to comments
3. ✅ Manual script to fetch reactions from GitHub API
4. ✅ Simple Python script to aggregate data
5. ✅ Static HTML page showing stats

**Deliverables:**

- Updated workflow with identifiers
- Python script: `scripts/fetch_reactions.py`
- HTML report: `reports/feedback_summary.html`

**Effort:** 2-3 days for one engineer

**Tech:**

```bash
# Run manually
python scripts/fetch_reactions.py --days 7 > data.json
python scripts/generate_report.py data.json > report.html
```

---

### Phase 2: Automated Collection + Basic UI (1 week)

**Goal:** Automated polling with basic web dashboard

**Scope:**

1. ✅ Set up PostgreSQL database
2. ✅ Build polling service (runs every 15 min)
3. ✅ REST API for querying data
4. ✅ Basic React dashboard with:
   - Overall stats
   - Repo breakdown table
   - Links to PRs
5. ✅ Deploy to Cloud Run

**Deliverables:**

- Database schema deployed
- Polling service running on Cloud Run (cron)
- API service on Cloud Run
- Dashboard deployed to Vercel
- Internal URL: `https://ai-review-eval.cockroachlabs.net`

**Effort:** 1 week for one engineer

**Tech Stack:**

- Backend: Python FastAPI + PostgreSQL
- Frontend: Next.js + Tailwind
- Deployment: Cloud Run + Vercel

---

### Phase 3: Real-time + Advanced Features (2-3 weeks)

**Goal:** Production-ready system with webhooks and rich analytics

**Scope:**

1. ✅ Create GitHub App for webhook subscriptions
2. ✅ Migrate from polling to webhook-based updates
3. ✅ Add advanced filtering:
   - By team, language, PR size
   - By prompt version
4. ✅ Example browser with preview cards
5. ✅ Trend analysis and anomaly detection
6. ✅ Export functionality (CSV, JSON)
7. ✅ Automated weekly report emails

**Deliverables:**

- GitHub App installed and receiving webhooks
- Rich dashboard with all filtering
- Email reports to team leads
- Documentation for maintainers

**Effort:** 2-3 weeks for one engineer

**Additional Features:**

- Sentiment over time by repo
- Correlation with PR size, file count
- A/B testing different prompts
- Integration with internal metrics (Datadog, etc.)

---

### Phase 4: Long-term Enhancements (Ongoing)

**Continuous improvements:**

1. **ML-based Analysis**

   - Cluster reviews by topic (bug fix, feature, refactor)
   - Predict which reviews will be helpful
   - Auto-tune prompts based on feedback

2. **Advanced Reporting**

   - ROI analysis (time saved estimates)
   - Comparison with manual reviews
   - Developer satisfaction surveys

3. **Feedback Loop**

   - Use negative examples to retrain/adjust prompts
   - A/B test prompt variations
   - Personalized prompts per repo/team

4. **Integration with Review Process**
   - Auto-dismiss if review gets 👎
   - Surface most helpful reviews in docs
   - Badge system for repos with high success rates

---

## Decision Matrix: Webhook vs Polling

| Criteria             | Webhook (Push)             | Polling (Pull)    | Winner  |
| -------------------- | -------------------------- | ----------------- | ------- |
| **Latency**          | Real-time (<1s)            | Delayed (5-15min) | Webhook |
| **Setup Complexity** | High (GitHub App)          | Low (API token)   | Polling |
| **Rate Limits**      | None                       | 5000 req/hr       | Webhook |
| **Infrastructure**   | Webhook receiver + queue   | Cron job          | Polling |
| **Approval Needed**  | Yes (org admin)            | No                | Polling |
| **Scalability**      | High                       | Medium            | Webhook |
| **Cost**             | Medium (always-on service) | Low (periodic)    | Polling |

**Recommendation:**

- **Phase 1-2:** Use polling (faster to ship)
- **Phase 3+:** Migrate to webhooks (better UX)

---

## Success Metrics

Track these KPIs:

1. **Adoption:** % of repos with feedback data
2. **Engagement:** % of reviews with reactions (target: >30%)
3. **Success Rate:** % positive reactions (target: >60%)
4. **Volume:** Total reviews per week
5. **Iteration Speed:** How quickly we improve after seeing negative feedback

---

## Open Questions

1. **Should we track individual user reactions?**

   - Pro: Can analyze by developer segments
   - Con: Privacy concerns
   - Recommendation: Aggregate only, no personal data

2. **How to handle spam reactions?**

   - Filter out reactions from bots
   - Only count first reaction per user per comment

3. **Should we notify on negative reviews?**

   - Could Slack message on 👎 for investigation
   - Risk of alert fatigue

4. **BigQuery vs PostgreSQL?**
   - BigQuery: Better for analytics, higher cost
   - PostgreSQL: Simpler, cheaper, sufficient for MVP
   - Recommendation: Start with Postgres

---

## Risks & Mitigations

| Risk                                 | Impact                | Mitigation                                |
| ------------------------------------ | --------------------- | ----------------------------------------- |
| Low engagement (no reactions)        | Can't measure success | Add prompts, send reminders, make it fun  |
| GitHub API rate limits               | Polling breaks        | Use GraphQL, batch requests, add caching  |
| Webhook delivery failures            | Missing data          | Add retry logic, poll as fallback         |
| No org admin approval for GitHub App | Can't use webhooks    | Use polling (Phase 2), escalate if needed |
| Users game the system                | Bad data              | Track patterns, filter outliers           |

---

## Next Steps

1. **Review this design doc** with team
2. **Get approval** for Phase 1 MVP (2-3 days)
3. **Decide:** Polling vs Webhook for Phase 2
4. **Set up infrastructure:**
   - Create eval service repo
   - Provision database
   - Set up Cloud Run project
5. **Start coding** 🚀

---

## References

- [GitHub API - Reactions](https://docs.github.com/en/rest/reactions)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [GitHub Apps](https://docs.github.com/en/apps)
- [Cloud Run Cron Jobs](https://cloud.google.com/run/docs/triggering/using-scheduler)
