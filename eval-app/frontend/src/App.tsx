import { useEffect, useState, useMemo } from 'react'
import { Box, Container, SimpleGrid, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react'
import { client } from './client'
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
    <Box minH="100vh" bg="neutral.100" py={6} px={4}>
      <Container maxW="1400px">
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
          <Alert status="error" borderRadius="lg" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>Error Loading Reviews</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
          <TrendChart data={dailyTrends} />
          <RepositoryPerformanceChart data={repoStats} maxRepos={5} />
        </SimpleGrid>

        <ReviewsList reviews={reviews} loading={loading} />
      </Container>
    </Box>
  )
}

export default App
