from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RepoBase(BaseModel):
    """Base schema for Repo."""

    repo_name: str
    enabled: bool = True
    team: str | None = None


class RepoCreate(RepoBase):
    """Schema for creating a new Repo."""

    pass


class RepoUpdate(BaseModel):
    """Schema for updating a Repo."""

    enabled: bool | None = None
    team: str | None = None


class RepoResponse(RepoBase):
    """Schema for Repo response."""

    subscribed_at: datetime

    model_config = ConfigDict(from_attributes=True)
