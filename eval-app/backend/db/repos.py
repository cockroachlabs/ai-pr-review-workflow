from typing import List
from sqlalchemy import select
from app.database import async_session_maker
from app.models import Repo

async def load_enabled_repositories() -> List[str]:
    async with async_session_maker() as session:
        result = await session.execute(
            select(Repo.repo_name).where(Repo.enabled.is_(True))
        )
        return [row[0] for row in result.all()]
