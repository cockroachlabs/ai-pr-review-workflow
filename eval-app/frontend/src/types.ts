export interface AIReview {
  ai_review_id: string
  repo_name: string
  pr_number: number
  pr_url: string
  pr_title?: string | null
  pr_review_id: number
  review_comment_id: number
  review_comment_url: string
  review_comment_web_url: string
  original_commit_sha?: string | null
  workflow_version?: string | null
  created_at: string
  sentiment: 'positive' | 'negative' | 'neutral' | null
  positive_reactions: number
  negative_reactions: number
  last_updated: string
}

export interface Repo {
  repo_name: string
  enabled: boolean
  team?: string | null
  subscribed_at: string
}
