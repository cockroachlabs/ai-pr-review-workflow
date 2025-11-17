import { AIReview } from '../types'

export interface DailyTrend {
  date: string
  positive: number
  negative: number
  neutral: number
  total: number
}

export interface RepoStats {
  repo_name: string
  positive: number
  negative: number
  neutral: number
  total: number
  positiveRate: number
}

export interface VersionStats {
  version: string
  positive: number
  negative: number
  neutral: number
  total: number
  positiveRate: number
}

/**
 * Groups reviews by day and calculates sentiment counts
 */
export const calculateDailyTrends = (reviews: AIReview[], days: number = 7): DailyTrend[] => {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // Create a map for each day
  const dailyMap = new Map<string, DailyTrend>()

  // Initialize all days with zero counts
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toISOString().split('T')[0]
    dailyMap.set(dateKey, {
      date: dateKey,
      positive: 0,
      negative: 0,
      neutral: 0,
      total: 0,
    })
  }

  // Count reviews for each day
  reviews.forEach(review => {
    const reviewDate = new Date(review.created_at)
    if (reviewDate >= startDate) {
      const dateKey = reviewDate.toISOString().split('T')[0]
      const dayData = dailyMap.get(dateKey)

      if (dayData) {
        dayData.total++
        if (review.sentiment === 'positive') dayData.positive++
        else if (review.sentiment === 'negative') dayData.negative++
        else if (review.sentiment === 'neutral') dayData.neutral++
      }
    }
  })

  return Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculates statistics per repository
 */
export const calculateRepoStats = (reviews: AIReview[]): RepoStats[] => {
  const repoMap = new Map<string, RepoStats>()

  reviews.forEach(review => {
    if (!repoMap.has(review.repo_name)) {
      repoMap.set(review.repo_name, {
        repo_name: review.repo_name,
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0,
        positiveRate: 0,
      })
    }

    const stats = repoMap.get(review.repo_name)!
    stats.total++
    if (review.sentiment === 'positive') stats.positive++
    else if (review.sentiment === 'negative') stats.negative++
    else if (review.sentiment === 'neutral') stats.neutral++
  })

  // Calculate positive rate
  return Array.from(repoMap.values())
    .map(stats => ({
      ...stats,
      positiveRate: stats.total > 0 ? (stats.positive / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Calculates statistics per workflow version
 */
export const calculateVersionStats = (reviews: AIReview[]): VersionStats[] => {
  const versionMap = new Map<string, VersionStats>()

  reviews.forEach(review => {
    const version = review.workflow_version || 'unknown'

    if (!versionMap.has(version)) {
      versionMap.set(version, {
        version,
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0,
        positiveRate: 0,
      })
    }

    const stats = versionMap.get(version)!
    stats.total++
    if (review.sentiment === 'positive') stats.positive++
    else if (review.sentiment === 'negative') stats.negative++
    else if (review.sentiment === 'neutral') stats.neutral++
  })

  // Calculate positive rate
  return Array.from(versionMap.values())
    .map(stats => ({
      ...stats,
      positiveRate: stats.total > 0 ? (stats.positive / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}
