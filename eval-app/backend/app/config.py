from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Use psycopg (async psycopg3) instead of asyncpg
    # For CockroachDB Serverless, include ?sslmode=verify-full in the connection string
    database_url: str = "cockroachdb+psycopg://root@localhost:26257/defaultdb"

    # API settings
    api_title: str = "AI PR Review Evaluation API"
    api_version: str = "0.1.0"

    # GitHub API token
    github_token: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
