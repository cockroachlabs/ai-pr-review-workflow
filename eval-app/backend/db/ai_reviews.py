from typing import List, Dict
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import func
from app.database import async_session_maker
from app.models import AIReview

IMMUTABLE = {"ai_review_id", "created_at", "last_updated"}

async def upsert_reviews_async(reviews: List[Dict]) -> int:
    if not reviews:
        return 0

    async with async_session_maker() as session:
        ins = insert(AIReview).values(reviews)
        update_set = {
            c.name: ins.excluded[c.name]
            for c in AIReview.__table__.columns
            if c.name not in IMMUTABLE
        } | {"last_updated": func.now()}

        stmt = ins.on_conflict_do_update(
            index_elements=[AIReview.ai_review_id],
            set_=update_set,
        )
        await session.execute(stmt)
        await session.commit()
        return len(reviews)
