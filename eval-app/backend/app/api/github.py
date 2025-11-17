from fastapi import APIRouter, HTTPException
import httpx

from app.config import settings

router = APIRouter()

GITHUB_API_BASE = "https://api.github.com"


def parse_repo_name(repo_name: str) -> tuple[str, str]:
    """Parse repo owner and name from repo_name string.

    Expected format: "owner/repo"
    """
    parts = repo_name.split("/")
    if len(parts) != 2:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid repo name format: {repo_name}. Expected format: owner/repo"
        )
    return parts[0], parts[1]


# TODO: Instead of hitting the GitHub API, we should scrape this information when we 
# do the scraping cron job and just update the database with a cached entry. This 
# would be more efficient than making a Github API call every time a review comes through. 
@router.get("/comment/{repo_name:path}/{comment_id}")
async def get_comment(repo_name: str, comment_id: int):
    """Fetch comment from GitHub (includes diff_hunk snippet).

    Args:
        repo_name: Repository name in format "owner/repo"
        comment_id: Comment ID

    Returns:
        Comment data from GitHub including diff_hunk, path, line, body, etc.
    """
    if not settings.github_token:
        raise HTTPException(
            status_code=500,
            detail="GitHub token not configured on server"
        )

    try:
        owner, repo = parse_repo_name(repo_name)
    except HTTPException:
        raise

    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/comments/{comment_id}"

    headers = {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"GitHub API error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch comment: {str(e)}"
            )
