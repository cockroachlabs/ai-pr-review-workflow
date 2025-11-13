import { useEffect, useState } from 'react'
import { client } from './client'

interface AIReview {
  review_id: string
  repo_name: string
  pr_number: number
  pr_url: string
  pr_title: string | null
  comment_id: number
  comment_url: string
  workflow_version: string | null
  posted_at: string
  sentiment: 'positive' | 'negative' | 'neutral' | null
  last_updated: string
}

function App() {
  const [reviews, setReviews] = useState<AIReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [repoFilter, setRepoFilter] = useState<string>('')

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params: { sentiment?: string; repo_name?: string } = {}

      if (sentimentFilter !== 'all') {
        params.sentiment = sentimentFilter
      }
      if (repoFilter) {
        params.repo_name = repoFilter
      }

      const { data, error } = await client.GET('/api/reviews/', {
        params: { query: params },
      })

      if (error) {
        setError('Failed to fetch reviews')
        return
      }

      setReviews(data || [])
      setError(null)
    } catch (err) {
      setError('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [sentimentFilter, repoFilter])

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return '#4caf50'
      case 'negative':
        return '#f44336'
      case 'neutral':
        return '#ff9800'
      default:
        return '#9e9e9e'
    }
  }

  const getSentimentEmoji = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return '👍'
      case 'negative':
        return '👎'
      case 'neutral':
        return '😐'
      default:
        return '❓'
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>AI PR Review Feedback Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Monitoring AI-generated pull request review feedback across repositories
      </p>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0 }}>Filters</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Sentiment:
            </label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="all">All</option>
              <option value="positive">Positive 👍</option>
              <option value="negative">Negative 👎</option>
              <option value="neutral">Neutral 😐</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Repository:
            </label>
            <input
              type="text"
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              placeholder="e.g., cockroachdb/cockroach"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <h2>Recent AI Reviews ({reviews.length})</h2>

      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No reviews found. Data is populated by the scraper script.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reviews.map((review) => (
            <div
              key={review.review_id}
              style={{
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
                    <a
                      href={review.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0366d6', textDecoration: 'none' }}
                    >
                      {review.pr_title || `PR #${review.pr_number}`}
                    </a>
                  </h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <strong>{review.repo_name}</strong> • PR #{review.pr_number}
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backgroundColor: getSentimentColor(review.sentiment),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getSentimentEmoji(review.sentiment)} {(review.sentiment || 'unknown').toUpperCase()}
                </div>
              </div>

              <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                <div style={{ marginBottom: '5px' }}>
                  <a
                    href={review.comment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0366d6', textDecoration: 'none' }}
                  >
                    View Comment →
                  </a>
                </div>
                <div>
                  Posted: {new Date(review.posted_at).toLocaleString()}
                  {review.workflow_version && ` • Version: ${review.workflow_version}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
