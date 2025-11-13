from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


class AIReviewBase(BaseModel):
    """Base schema for AIReview."""

    repo_name: str
    pr_number: int
    pr_url: str
    pr_title: str | None = None
    comment_id: int
    comment_url: str
    workflow_version: str | None = None
    posted_at: datetime
    sentiment: Literal["positive", "negative", "neutral"] | None = "neutral"


class AIReviewCreate(AIReviewBase):
    """Schema for creating a new AIReview."""

    review_id: str


class AIReviewUpdate(BaseModel):
    """Schema for updating an AIReview."""

    sentiment: Literal["positive", "negative", "neutral"] | None = None
    pr_title: str | None = None
    workflow_version: str | None = None


class AIReviewResponse(AIReviewBase):
    """Schema for AIReview response."""

    review_id: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)
