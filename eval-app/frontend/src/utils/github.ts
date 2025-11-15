const API_BASE = 'http://localhost:8000/api'

export interface GitHubComment {
  id: number
  body: string
  created_at: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
  }
  path?: string
  line?: number
  diff_hunk?: string
}

/**
 * Fetch comment from backend (includes diff_hunk snippet)
 */
export const fetchComment = async (
  repoName: string,
  commentId: number
): Promise<GitHubComment> => {
  const response = await fetch(
    `${API_BASE}/github/comment/${encodeURIComponent(repoName)}/${commentId}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || `Failed to fetch comment: ${response.statusText}`)
  }

  return await response.json()
}
