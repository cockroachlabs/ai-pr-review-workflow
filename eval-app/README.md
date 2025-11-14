# AI PR Review Feedback Dashboard

A full-stack application for monitoring and analyzing AI-generated pull request review feedback.

## Stack

- **Backend**: FastAPI (Python 3.11+) with async SQLAlchemy
- **Frontend**: React + TypeScript (Vite)
- **Database**: CockroachDB
- **Package Manager**: uv (Python), npm (Node.js)

## Prerequisites

1. **Python 3.11+** - Check with `python3 --version`
2. **Node.js 18+** - Check with `node --version`
3. **uv** - Fast Python package manager
4. **CockroachDB** - Running locally

### Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Add to shell profile permanently
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc  # or ~/.bashrc

# Verify installation
uv --version
```

### Start CockroachDB

#### Locally

```bash
# Start a local single-node cluster
cockroach start-single-node --insecure --listen-addr=localhost:26257
```

#### Serverless

1. Create a new serverless database in Cockroach Cloud, we are currently
   using this one in the CRL Cypress Testing Org:
   https://cockroachlabs.cloud/cluster/b2c31a14-60bd-4777-b7f0-4203bf2ced06/overview
2. Download the postgres cert which will be essential for doing SSL
   connections to the serverless cluster:

```
curl --create-dirs -o $HOME/.postgresql/root.crt 'https://cockroachlabs.cloud/clusters/b2c31a14-60bd-4777-b7f0-4203bf2ced06/cert'
```

3. Make sure to update your `backend/.env` file with an entry for `DATABASE_URL`:

```bash
# For CockroachDB Serverless - include ?sslmode=verify-full
DATABASE_URL=cockroachdb+psycopg://<user>:<password>@<cluster-host>.cockroachlabs.cloud:26257/<database-name>?sslmode=verify-full
```

**Example:**

```bash
DATABASE_URL=cockroachdb+psycopg://myuser:mypassword@my-cluster-1234.aws-us-east-1.cockroachlabs.cloud:26257/ai_review_feedback?sslmode=verify-full
```

## Environment Setup

Create a `backend/.env` file with your database connection:

```bash
# For CockroachDB Serverless
DATABASE_URL=cockroachdb+psycopg://user:password@host.cockroachlabs.cloud:26257/database_name?sslmode=verify-full

# For local CockroachDB (insecure mode)
DATABASE_URL=cockroachdb+psycopg://root@localhost:26257/defaultdb

# Optional: GitHub token for data collection
GITHUB_TOKEN=ghp_your_token_here
```

**Key differences from asyncpg:**

- Use `cockroachdb+psycopg://` instead of `cockroachdb+asyncpg://`
- You **can** and **should** include `?sslmode=verify-full` for Serverless
- psycopg natively supports the `sslmode` parameter

## Quick Start

### 1. Install Dependencies

```bash
cd eval-app
make install
```

This installs:

- Python dependencies (via `uv`)
- Node.js dependencies (via `npm`)

### 2. Run Database Migrations

```bash
make db-upgrade
```

This creates the `ai_reviews` and `repos` tables in CockroachDB.

### 3. Start the Backend

**Terminal 1:**

```bash
cd eval-app
make dev-backend
```

Backend runs on http://localhost:8000

### 4. Generate TypeScript API Client

**Terminal 2:**

```bash
cd eval-app
make generate-client
```

This generates type-safe TypeScript client from the OpenAPI schema.

### 5. Start the Frontend

**Terminal 2 (same as above):**

```bash
make dev-frontend
```

Frontend runs on http://localhost:5173

### 6. Open the Dashboard

Visit http://localhost:5173 in your browser!

## IDE Setup (VS Code / Cursor)

To get Python IntelliSense and debugging working:

### Option 1: Activate venv then open IDE (Easiest ✅)

```bash
# Navigate to the root of the project
cd /Users/ryanluu/go/src/github.com/cockroachlabs/ai-pr-review-workflow

# Activate the virtual environment
source eval-app/backend/.venv/bin/activate

# Verify it's activated (you should see (.venv) in your prompt)
which python  # Should show: .../eval-app/backend/.venv/bin/python

# Open Cursor or VS Code
cursor .  # For Cursor
# OR
code .    # For VS Code
```

The IDE will automatically detect the activated environment.

### Option 2: Manually select interpreter

**Important:** Open your IDE from the project root (`/Users/ryanluu/go/src/github.com/cockroachlabs/ai-pr-review-workflow`)

1. Open Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Python: Select Interpreter"
3. Look for: `Python 3.13.1 ('.venv': venv) ./eval-app/backend/.venv/bin/python`
4. If not visible:
   - Click "Enter interpreter path..."
   - Select "Find..."
   - Browse to: `eval-app/backend/.venv/bin/python` (relative path from project root)
5. Reload: `Cmd+Shift+P` → "Developer: Reload Window"

### Option 3: Configure workspace settings (Most Reliable)

Create `.vscode/settings.json` in the project root directory:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/eval-app/backend/.venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.analysis.extraPaths": ["${workspaceFolder}/eval-app/backend"],
  "python.autoComplete.extraPaths": ["${workspaceFolder}/eval-app/backend"]
}
```

**After creating the file:**

1. Save the file
2. Reload window: `Cmd+Shift+P` → "Developer: Reload Window"
3. Check bottom-right corner - should show "Python 3.13.1 ('.venv': venv)"

**If still not working in Cursor:**

- Close all Python files
- Close Cursor completely
- Reopen Cursor from the project root
- Open a Python file from `eval-app/backend/`

## Running the Scraper

The scraper populates the database with AI review data from GitHub:

```bash
# From eval-app directory
make run-scraper
```

Or manually with uv:

```bash
cd eval-app/backend
uv run python scraper/github.py
```

The scraper has access to all backend dependencies and database models.

## Available Make Commands

```bash
make help              # Show all available commands
make install           # Install all dependencies (backend + frontend)
make setup             # Complete setup: install deps and run migrations
make dev-backend       # Start FastAPI backend server
make dev-frontend      # Start React frontend development server
make db-migrate        # Create a new migration: make db-migrate name="description"
make db-upgrade        # Apply database migrations
make generate-client   # Generate TypeScript API client (requires backend running)
make run-scraper       # Run the GitHub scraper to populate data
make clean             # Clean generated files and caches
```

## Project Structure

```
eval-app/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints (read-only)
│   │   │   ├── ai_reviews.py # GET /api/reviews/
│   │   │   └── repos.py      # GET /api/repos/
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── ai_review.py  # AIReview model
│   │   │   └── repo.py       # Repo model
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── config.py         # App configuration
│   │   ├── database.py       # Database connection
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # Database migrations
│   ├── scraper/              # Data collection scripts
│   │   └── github.py         # GitHub scraper
│   ├── pyproject.toml        # Python dependencies
│   └── alembic.ini           # Alembic configuration
│
├── frontend/
│   ├── src/
│   │   ├── client/           # Auto-generated API client
│   │   ├── App.tsx           # Main React component
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── Makefile                  # Development commands
└── README.md                 # This file
```

## Database Schema

### ai_reviews table

Stores AI-generated PR review feedback with sentiment tracking.

```sql
CREATE TABLE ai_reviews (
    review_id STRING PRIMARY KEY,
    repo_name STRING NOT NULL,
    pr_number INT NOT NULL,
    pr_url STRING NOT NULL,
    pr_title STRING,
    comment_id INT8 NOT NULL,
    comment_url STRING NOT NULL,
    workflow_version STRING,
    posted_at TIMESTAMP NOT NULL,
    sentiment STRING CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    last_updated TIMESTAMP DEFAULT NOW()
);
```

### repos table

Tracks repositories being monitored.

```sql
CREATE TABLE repos (
    repo_name STRING PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    team STRING,
    subscribed_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

All endpoints are **read-only**. Data is populated by the scraper script.

### Reviews

- `GET /api/reviews/` - List reviews (supports `?sentiment=` and `?repo_name=` filters)
- `GET /api/reviews/{review_id}` - Get specific review

### Repositories

- `GET /api/repos/` - List tracked repositories
- `GET /api/repos/{repo_name}` - Get specific repository

### Documentation

- Interactive API docs: http://localhost:8000/docs
- OpenAPI schema: http://localhost:8000/openapi.json

## Development Workflow

### Adding a New Model

1. Create the model in `backend/app/models/`
2. Create Pydantic schemas in `backend/app/schemas/`
3. Create API endpoints in `backend/app/api/` (read-only)
4. Generate migration: `make db-migrate name="add_new_table"`
5. Apply migration: `make db-upgrade`
6. Restart backend server
7. Regenerate client: `make generate-client`

### Updating the Scraper

1. Edit `backend/scraper/github.py`
2. Run with: `make run-scraper`
3. The scraper has access to all models via `from app.models import AIReview, Repo`

Example:

```python
# backend/scraper/github.py
import asyncio
from datetime import datetime
from app.database import async_session_maker
from app.models import AIReview

async def scrape():
    async with async_session_maker() as session:
        review = AIReview(
            review_id="unique-id",
            repo_name="org/repo",
            pr_number=123,
            pr_url="https://github.com/org/repo/pull/123",
            comment_id=456,
            comment_url="https://github.com/org/repo/pull/123#issuecomment-456",
            posted_at=datetime.now(),
            sentiment="positive"
        )
        session.add(review)
        await session.commit()

if __name__ == "__main__":
    asyncio.run(scrape())
```

## Configuration

### Backend Configuration

Create `backend/.env` (copy from `.env.example`):

```env
# Database
DATABASE_URL=cockroachdb+asyncpg://root@localhost:26257/defaultdb

# API
API_TITLE=AI Review Feedback API
API_VERSION=1.0.0
```

### Database URL Format

- **CockroachDB**: `cockroachdb+asyncpg://root@localhost:26257/defaultdb`
- **PostgreSQL**: `postgresql+asyncpg://user:password@localhost:5432/dbname`

## Troubleshooting

### `uv: command not found`

1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Add to PATH: `export PATH="$HOME/.local/bin:$PATH"`
3. Reload shell: `source ~/.zshrc` or restart terminal

### Database connection fails

- Ensure CockroachDB is running: `cockroach start-single-node --insecure`
- Check the `DATABASE_URL` in `backend/.env`

### TypeScript client generation fails

The backend must be running first:

1. Start backend: `make dev-backend`
2. Wait for "Application startup complete"
3. Run: `make generate-client`

### VS Code IntelliSense not working

Make sure VS Code is using the correct Python interpreter:

1. `Cmd+Shift+P` → "Python: Select Interpreter"
2. Choose: `eval-app/backend/.venv/bin/python`

### Port already in use

If ports 8000 or 5173 are in use:

- Backend: Kill process on port 8000: `lsof -ti:8000 | xargs kill -9`
- Frontend: Kill process on port 5173: `lsof -ti:5173 | xargs kill -9`

## Common Tasks

### Reset the database

```bash
# Drop all tables and recreate
make db-downgrade base  # Downgrade to nothing
make db-upgrade         # Reapply all migrations
```

### View database directly

```bash
# Connect to CockroachDB SQL shell
cockroach sql --insecure

# Then run queries
SELECT * FROM ai_reviews ORDER BY posted_at DESC LIMIT 10;
```

### Check what's running

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if database is running
cockroach node status --insecure
```

## License

MIT
