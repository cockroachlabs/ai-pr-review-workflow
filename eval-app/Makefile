.PHONY: help install db-migrate db-upgrade dev-backend dev-frontend dev generate-client run-scraper clean

# Ensure uv is in PATH
export PATH := $(HOME)/.local/bin:$(PATH)

help: ## Show this help message
	@echo "Full-Stack App - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies (backend + frontend)
	@echo "Installing backend dependencies with uv..."
	cd backend && uv sync
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ All dependencies installed!"

db-migrate: ## Create a new database migration
	@echo "Creating new migration..."
	cd backend && uv run alembic revision --autogenerate -m "$(name)"
	@echo "✓ Migration created!"

db-upgrade: ## Apply database migrations
	@echo "Applying migrations..."
	cd backend && uv run alembic upgrade head
	@echo "✓ Migrations applied!"

dev-backend: ## Start the FastAPI backend server
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start the React frontend development server
	cd frontend && npm run dev

generate-client: ## Generate TypeScript API client from OpenAPI schema (requires backend running)
	@echo "Generating TypeScript client..."
	@if ! curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then \
		echo "❌ Error: Backend is not running!"; \
		echo "Please start the backend first with: make dev-backend"; \
		exit 1; \
	fi
	cd frontend && npm run generate-client
	@echo "✓ Client generated!"

run-scraper: ## Run the GitHub scraper to populate AI review data
	@echo "Running GitHub scraper..."
	cd backend && uv run python scraper/scrape_github.py

dev: ## Start both backend and frontend (requires tmux or run in separate terminals)
	@echo "Starting full-stack development environment..."
	@echo "Backend will run on http://localhost:8000"
	@echo "Frontend will run on http://localhost:5173"
	@echo ""
	@echo "Run these commands in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

clean: ## Clean generated files and caches
	@echo "Cleaning generated files..."
	rm -rf backend/.venv
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	@echo "✓ Cleaned!"

setup: install db-upgrade ## Complete setup: install deps and run migrations
	@echo ""
	@echo "✓ Initial setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Start the backend: make dev-backend (in a new terminal)"
	@echo "  2. Generate API client: make generate-client (once backend is running)"
	@echo "  3. Start the frontend: make dev-frontend (in another terminal)"
	@echo "  4. Open http://localhost:5173 in your browser"
