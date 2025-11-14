import { useEffect, useState, useMemo } from 'react'
import { Alert, Row, Col } from 'antd'
import { client } from './client'
import { ColorCoreNeutral1, ColorCoreNeutral0 } from './tokens'
import {
  Header,
  FiltersCard,
  MetricsCards,
  ReviewsList,
  TrendChart,
  RepositoryPerformanceChart
} from './components'
import { AIReview, Repo } from './types'
import { calculateDailyTrends, calculateRepoStats } from './utils/analytics'

function App() {
  const [reviews, setReviews] = useState<AIReview[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [repoFilter, setRepoFilter] = useState<string>('all')
  const [daysFilter, setDaysFilter] = useState<number>(7)

  const fetchRepos = async () => {
    try {
      const { data, error } = await client.GET('/api/repos/')

      if (error) {
        console.error('Failed to fetch repositories:', error)
        return
      }

      setRepos(data || [])
    } catch (err) {
      console.error('Failed to fetch repositories:', err)
    }
  }

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params: { sentiment?: string; repo_name?: string } = {}

      if (sentimentFilter !== 'all') {
        params.sentiment = sentimentFilter
      }
      if (repoFilter !== 'all') {
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
    fetchRepos()
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [sentimentFilter, repoFilter])

  // Filter reviews by days
  const filteredReviewsByDays = useMemo(() => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysFilter)
    return reviews.filter(r => new Date(r.created_at) >= cutoffDate)
  }, [reviews, daysFilter])

  const calculateSentimentCounts = () => {
    return {
      positive: filteredReviewsByDays.filter(r => r.sentiment === 'positive').length,
      negative: filteredReviewsByDays.filter(r => r.sentiment === 'negative').length,
      neutral: filteredReviewsByDays.filter(r => r.sentiment === 'neutral').length,
    }
  }

  const sentimentCounts = calculateSentimentCounts()

  // Calculate analytics data
  const dailyTrends = useMemo(() => calculateDailyTrends(filteredReviewsByDays, daysFilter), [filteredReviewsByDays, daysFilter])
  const repoStats = useMemo(() => calculateRepoStats(filteredReviewsByDays), [filteredReviewsByDays])

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(to bottom, ${ColorCoreNeutral1}, ${ColorCoreNeutral0})`,
      padding: '20px 12px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Header totalReviews={filteredReviewsByDays.length} />

        <FiltersCard
          sentimentFilter={sentimentFilter}
          onSentimentChange={setSentimentFilter}
          repoFilter={repoFilter}
          onRepoChange={setRepoFilter}
          daysFilter={daysFilter}
          onDaysChange={setDaysFilter}
          repos={repos}
        />

        <MetricsCards
          positiveCount={sentimentCounts.positive}
          negativeCount={sentimentCounts.negative}
          neutralCount={sentimentCounts.neutral}
        />

        {error && (
          <Alert
            type="error"
            message="Error Loading Reviews"
            description={error}
            showIcon
            style={{ marginBottom: 24, borderRadius: '12px' }}
          />
        )}

        <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
          <Col xs={24} lg={12}>
            <TrendChart data={dailyTrends} />
          </Col>
          <Col xs={24} lg={12}>
            <RepositoryPerformanceChart data={repoStats} maxRepos={5} />
          </Col>
        </Row>

        <ReviewsList reviews={reviews} loading={loading} />
      </div>
    </div>
  )
}

export default App
