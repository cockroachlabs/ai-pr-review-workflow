from datetime import datetime
from sqlalchemy import String, Integer, DateTime, CheckConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AIReview(Base):
    """AI Review feedback model."""

    __tablename__ = "ai_reviews"

    review_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    repo_name: Mapped[str] = mapped_column(String(255), nullable=False)
    pr_number: Mapped[int] = mapped_column(Integer, nullable=False)
    pr_url: Mapped[str] = mapped_column(String(500), nullable=False)
    pr_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    comment_id: Mapped[int] = mapped_column(Integer, nullable=False)
    comment_url: Mapped[str] = mapped_column(String(500), nullable=False)
    workflow_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Feedback data
    sentiment: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        default="neutral"
    )
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
        Index("idx_posted_at", "posted_at"),
    )
