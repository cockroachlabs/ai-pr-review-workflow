export interface AIReview {
  review_id: string
  repo_name: string
  pr_number: number
  pr_url: string
  pr_title?: string | null
  comment_id: number
  comment_url: string
  workflow_version?: string | null
  posted_at: string
  sentiment: 'positive' | 'negative' | 'neutral' | null
  last_updated: string
}

export interface Repo {
  repo_name: string
  enabled: boolean
  team?: string | null
  subscribed_at: string
}
