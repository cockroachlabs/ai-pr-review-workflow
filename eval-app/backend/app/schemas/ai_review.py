from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, computed_field


class AIReviewBase(BaseModel):
    """Base schema for AIReview."""

    repo_name: str
    pr_number: int
    pr_url: str
    pr_title: str | None = None
    pr_review_id: int
    review_comment_id: int
    review_comment_url: str
    original_commit_sha: str | None = None
    workflow_version: str | None = None
    created_at: datetime
    sentiment: Literal["positive", "negative", "neutral"] | None = "neutral"
    positive_reactions: int
    negative_reactions: int


class AIReviewCreate(AIReviewBase):
    """Schema for creating a new AIReview."""

    ai_review_id: str


class AIReviewUpdate(BaseModel):
    """Schema for updating an AIReview."""

    sentiment: Literal["positive", "negative", "neutral"] | None = None
    pr_title: str | None = None
    workflow_version: str | None = None
    positive_reactions: int | None = None
    negative_reactions: int | None = None


class AIReviewResponse(AIReviewBase):
    """Schema for AIReview response."""

    ai_review_id: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def review_comment_web_url(self) -> str:
        """Convert GitHub API comment URL to web URL.

        Converts:
        https://api.github.com/repos/cockroachdb/molt/pulls/comments/2528422125
        to:
        https://github.com/cockroachdb/molt/pull/596#discussion_r2528422125
        """
        return f"https://github.com/{self.repo_name}/pull/{self.pr_number}#discussion_r{self.review_comment_id}"
