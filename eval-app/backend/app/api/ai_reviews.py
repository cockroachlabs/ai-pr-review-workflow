from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ai_review import AIReview
from app.schemas.ai_review import AIReviewResponse

router = APIRouter()


@router.get("/", response_model=List[AIReviewResponse])
async def list_reviews(
    skip: int = 0,
    limit: int = 100,
    sentiment: str | None = None,
    repo_name: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List AI reviews with optional filtering by sentiment and repo.

    Data is populated by the scraper script, not through this API.
    """
    query = select(AIReview).order_by(desc(AIReview.created_at))

    if sentiment:
        query = query.where(AIReview.sentiment == sentiment)
    if repo_name:
        query = query.where(AIReview.repo_name == repo_name)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    reviews = result.scalars().all()
    return reviews


@router.get("/{ai_review_id}", response_model=AIReviewResponse)
async def get_review(
    ai_review_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific AI review by ID."""
    result = await db.execute(
        select(AIReview).where(AIReview.ai_review_id == ai_review_id)
    )
    review = result.scalar_one_or_none()

    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")

    return review
