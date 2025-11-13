from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.repo import Repo
from app.schemas.repo import RepoResponse

router = APIRouter()


@router.get("/", response_model=List[RepoResponse])
async def list_repos(
    skip: int = 0,
    limit: int = 100,
    enabled_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """List all tracked repositories.

    Data is populated by the scraper script, not through this API.
    """
    query = select(Repo)

    if enabled_only:
        query = query.where(Repo.enabled == True)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    repos = result.scalars().all()
    return repos


@router.get("/{repo_name}", response_model=RepoResponse)
async def get_repo(
    repo_name: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific repository by name."""
    result = await db.execute(
        select(Repo).where(Repo.repo_name == repo_name)
    )
    repo = result.scalar_one_or_none()

    if repo is None:
        raise HTTPException(status_code=404, detail="Repository not found")

    return repo
