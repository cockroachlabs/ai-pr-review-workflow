from datetime import datetime
from sqlalchemy import String, Integer, DateTime, CheckConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AIReview(Base):
    """AI Review feedback model."""

    __tablename__ = "ai_reviews"

    ai_review_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    repo_name: Mapped[str] = mapped_column(String(255), nullable=False)
    pr_number: Mapped[int] = mapped_column(Integer, nullable=False)
    pr_url: Mapped[str] = mapped_column(String(500), nullable=False)
    pr_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pr_review_id: Mapped[int] = mapped_column(Integer, nullable=False)
    review_comment_id: Mapped[int] = mapped_column(Integer, nullable=False)
    review_comment_url: Mapped[str] = mapped_column(String(500), nullable=False)
    original_commit_sha: Mapped[str] = mapped_column(String(255), nullable=True)
    workflow_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Feedback data
    sentiment: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        default="neutral"
    )
    positive_reactions: Mapped[int] = mapped_column(Integer, nullable=False)
    negative_reactions: Mapped[int] = mapped_column(Integer, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "sentiment IN ('positive', 'negative', 'neutral')",
            name="sentiment_check"
        ),
        Index("idx_sentiment", "sentiment"),
        Index("idx_repo_sentiment", "repo_name", "sentiment"),
        Index("idx_created_at", "created_at"),
    )