import { useState, useMemo } from 'react'
import { Card, Space, Spin, Typography, Input, Select, Row, Col, Empty } from 'antd'
import { SearchOutlined, SortAscendingOutlined } from '@ant-design/icons'
import { ReviewCard } from './ReviewCard'
import { ColorFont3 } from '../tokens'

const { Title, Text } = Typography

interface Review {
  ai_review_id: string
  repo_name: string
  pr_number: number
  pr_url: string
  pr_title?: string | null
  review_comment_id: number
  review_comment_url: string
  workflow_version?: string | null
  created_at: string
  sentiment: 'positive' | 'negative' | 'neutral' | null
  last_updated: string
}

interface ReviewsListProps {
  reviews: Review[]
  loading: boolean
}

type SortOption = 'newest' | 'oldest' | 'repo-asc' | 'repo-desc'

export const ReviewsList = ({ reviews, loading }: ReviewsListProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(review =>
        review.pr_title?.toLowerCase().includes(query) ||
        review.repo_name.toLowerCase().includes(query) ||
        review.pr_number.toString().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'repo-asc':
          return a.repo_name.localeCompare(b.repo_name)
        case 'repo-desc':
          return b.repo_name.localeCompare(a.repo_name)
        default:
          return 0
      }
    })

    return result
  }, [reviews, searchQuery, sortBy])

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Title level={2} style={{ marginBottom: '10px', fontSize: '20px', fontWeight: 600 }}>
          Review Activity
        </Title>

        <Row gutter={[8, 10]} style={{ marginBottom: '10px' }}>
          <Col xs={24} md={16}>
            <Input
              size="large"
              placeholder="Search reviews..."
              prefix={<SearchOutlined style={{ color: ColorFont3 }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              size="large"
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              suffixIcon={<SortAscendingOutlined />}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'repo-asc', label: 'Repository (A-Z)' },
                { value: 'repo-desc', label: 'Repository (Z-A)' },
              ]}
            />
          </Col>
        </Row>

        {!loading && filteredAndSortedReviews.length !== reviews.length && (
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
          </Text>
        )}
      </div>

      {loading ? (
        <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '80px 24px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Spin size="large" />
          <div style={{ marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Loading reviews...</Text>
          </div>
        </Card>
      ) : filteredAndSortedReviews.length === 0 ? (
        <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '80px 24px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Empty
            description={
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {searchQuery ? 'No reviews match your search' : 'No reviews found'}
              </Text>
            }
          />
        </Card>
      ) : (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {filteredAndSortedReviews.map((review) => (
            <ReviewCard key={review.ai_review_id} review={review} />
          ))}
        </Space>
      )}
    </>
  )
}
