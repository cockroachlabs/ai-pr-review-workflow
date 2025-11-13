# backend/scraper/github.py
import asyncio
from datetime import datetime
from sqlalchemy import select
from app.database import async_session_maker
from app.models import AIReview, Repo

async def scrape_reviews():
    """Example scraper function."""
    async with async_session_maker() as session:
        # Create a new review
        review = AIReview(
            review_id="unique-id-123",
            repo_name="cockroachdb/cockroach",
            pr_number=12345,
            pr_url="https://github.com/cockroachdb/cockroach/pull/12345",
            pr_title="Fix: Important bug fix",
            comment_id=987654,
            comment_url="https://github.com/cockroachdb/cockroach/pull/12345#issuecomment-987654",
            workflow_version="v1.0.0",
            posted_at=datetime.now(),
            sentiment="positive"
        )
        session.add(review)
        await session.commit()
        print(f"Created review: {review.review_id}")

if __name__ == "__main__":
    asyncio.run(scrape_reviews())

