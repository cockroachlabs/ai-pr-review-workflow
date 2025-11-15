# backend/scraper/github.py
import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy import select
from app.database import async_session_maker
from app.models import AIReview, Repo

async def scrape_reviews():
    """Example scraper function - creates sample reviews across multiple repos."""
    async with async_session_maker() as session:
        # Define sample data
        repos = [
            "cockroachdb/cockroach",
            "cockroachdb/molt",
            "cockroachlabs/ai-pr-review-workflow",
            "cockroachdb/docs",
        ]

        sentiments = ["positive", "negative", "neutral"]

        pr_titles = [
            "Fix: Important bug fix",
            "feat: Add new authentication system",
            "refactor: Improve database connection pooling",
            "docs: Update API documentation",
            "chore: Upgrade dependencies",
            "perf: Optimize query performance",
            "fix: Handle edge case in migration",
            "test: Add integration tests for workflow",
            "style: Format code with prettier",
            "build: Update CI/CD pipeline",
        ]

        # Create 20 sample reviews
        for i in range(20):
            # First review uses REAL data from cockroachdb/molt PR #596
            if i == 0:
                review = AIReview(
                    review_id="review-real-molt-596",
                    repo_name="cockroachdb/molt",
                    pr_number=596,
                    pr_url="https://github.com/cockroachdb/molt/pull/596",
                    pr_title=".github: integrate simple Claude Review workflow",
                    comment_id=2528422125,
                    comment_url="https://github.com/cockroachdb/molt/pull/596#discussion_r2528422125",
                    workflow_version="v1.2.0",
                    posted_at=datetime.now() - timedelta(days=1),
                    sentiment="positive"
                )
            else:
                repo = random.choice(repos)
                pr_num = random.randint(500, 1000)
                comment_id = random.randint(100000, 999999)
                sentiment = random.choice(sentiments)
                title = random.choice(pr_titles)

                # Vary the posted_at dates over the last 30 days
                days_ago = random.randint(0, 30)
                posted_at = datetime.now() - timedelta(days=days_ago)

                review = AIReview(
                    review_id=f"review-{i+1}-{random.randint(1000, 9999)}",
                    repo_name=repo,
                    pr_number=pr_num,
                    pr_url=f"https://github.com/{repo}/pull/{pr_num}",
                    pr_title=title,
                    comment_id=comment_id,
                    comment_url=f"https://github.com/{repo}/pull/{pr_num}#issuecomment-{comment_id}",
                    workflow_version=random.choice(["v1.0.0", "v1.1.0", "v1.2.0"]),
                    posted_at=posted_at,
                    sentiment=sentiment
                )

            session.add(review)
            print(f"Created review {i+1}/20: {review.review_id} ({review.repo_name}, sentiment: {review.sentiment})")

        await session.commit()
        print("\nSuccessfully created 20 sample reviews!")

if __name__ == "__main__":
    asyncio.run(scrape_reviews())

