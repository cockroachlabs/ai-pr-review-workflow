import { useState } from 'react'
import { Card, Space, Tag, Typography, Button, Spin, Alert } from 'antd'
import { ClockCircleOutlined, BranchesOutlined, GithubOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import {
  ColorCoreNeutral3,
  ColorBaseSuccess,
  ColorBaseDanger,
  ColorBaseWarning
} from '../tokens'
import { fetchComment, GitHubComment } from '../utils/github'
import { DiffViewer } from './DiffViewer'
import { CommentViewer } from './CommentViewer'

const { Text, Link } = Typography

interface ReviewCardProps {
  review: {
    ai_review_id: string
    repo_name: string
    pr_number: number
    pr_url: string
    pr_title?: string | null
    review_comment_id: number
    review_comment_url: string
    review_comment_web_url: string
    workflow_version?: string | null
    created_at: string
    sentiment: 'positive' | 'negative' | 'neutral' | null
  }
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState<GitHubComment | null>(null)

  const getSentimentConfig = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return { color: 'success', badgeColor: ColorBaseSuccess, label: 'Positive' }
      case 'negative':
        return { color: 'error', badgeColor: ColorBaseDanger, label: 'Negative' }
      case 'neutral':
        return { color: 'warning', badgeColor: ColorBaseWarning, label: 'Neutral' }
      default:
        return { color: 'default', badgeColor: '#d9d9d9', label: 'Unknown' }
    }
  }

  const sentimentConfig = getSentimentConfig(review.sentiment)

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }

    // Only fetch if we haven't fetched before
    if (!comment) {
      setLoading(true)
      setError(null)

      try {
        const commentData = await fetchComment(review.repo_name, review.review_comment_id)
        setComment(commentData)
        setExpanded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Failed to fetch GitHub data:', err)
      } finally {
        setLoading(false)
      }
    } else {
      setExpanded(true)
    }
  }

  return (
    <Card
      style={{
        borderRadius: '8px',
        border: `1px solid ${ColorCoreNeutral3}`,
        borderLeft: `3px solid ${sentimentConfig.badgeColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
      styles={{
        body: { padding: '12px 14px' }
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* Header: Title + Sentiment Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href={review.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '4px',
                lineHeight: '1.3',
              }}
            >
              {review.pr_title || `PR #${review.pr_number}`}
            </Link>
            <Space size={6} wrap>
              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                <BranchesOutlined style={{ marginRight: '4px' }} />
                {review.repo_name}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                #{review.pr_number}
              </Text>
            </Space>
          </div>
          <Tag
            color={sentimentConfig.badgeColor}
            style={{
              fontSize: '10px',
              fontWeight: 600,
              margin: 0,
              padding: '1px 7px',
              borderRadius: '4px',
              lineHeight: '18px',
            }}
          >
            {sentimentConfig.label}
          </Tag>
        </div>

        {/* Metadata Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <Space size={10} wrap>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {new Date(review.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Space>
          <Space size={6}>
            <Button
              type="link"
              size="small"
              href={review.review_comment_web_url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<GithubOutlined />}
              style={{ fontSize: '11px', padding: '0 6px', height: '24px' }}
            >
              GitHub
            </Button>
            <Button
              type="text"
              size="small"
              onClick={handleExpand}
              loading={loading}
              icon={expanded ? <UpOutlined /> : <DownOutlined />}
              style={{ fontSize: '11px', height: '24px' }}
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
          </Space>
        </div>

        {/* Expanded Content */}
        {error && (
          <Alert
            type="error"
            message="Failed to load details"
            description={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {expanded && !loading && comment && (
          <div style={{ marginTop: '4px' }}>
            {comment.diff_hunk && (
              <DiffViewer diffHunk={comment.diff_hunk} filePath={comment.path} />
            )}
            <CommentViewer comment={comment} />
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Spin size="small" />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Loading comment...</Text>
            </div>
          </div>
        )}
      </Space>
    </Card>
  )
}
