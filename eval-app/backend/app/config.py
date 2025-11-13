from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    database_url: str = "cockroachdb+asyncpg://root@localhost:26257/defaultdb"

    # API settings
    api_title: str = "Full-Stack App API"
    api_version: str = "0.1.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
