from fastapi import APIRouter
from app.api import ai_reviews, repos

api_router = APIRouter()

api_router.include_router(ai_reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(repos.router, prefix="/repos", tags=["repos"])
