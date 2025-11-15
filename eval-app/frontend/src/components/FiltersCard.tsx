import { Card, Row, Col, Space, Select, Typography, Segmented } from 'antd'
import { ColorFont3, ColorCoreNeutral1 } from '../tokens'
import { Repo } from '../types'

const { Text } = Typography

interface FiltersCardProps {
  sentimentFilter: string
  onSentimentChange: (value: string) => void
  repoFilter: string
  onRepoChange: (value: string) => void
  daysFilter: number
  onDaysChange: (value: number) => void
  repos: Repo[]
}

export const FiltersCard = ({
  sentimentFilter,
  onSentimentChange,
  repoFilter,
  onRepoChange,
  daysFilter,
  onDaysChange,
  repos,
}: FiltersCardProps) => {
  const repoOptions = [
    { value: 'all', label: 'All Repositories' },
    ...repos.map(repo => ({
      value: repo.repo_name,
      label: repo.repo_name,
    }))
  ]

  return (
    <Card
      style={{
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        background: ColorCoreNeutral1,
      }}
      styles={{
        body: { padding: '16px' }
      }}
    >
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: '12px', color: ColorFont3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Time Range
            </Text>
            <Segmented
              value={daysFilter}
              onChange={(value) => onDaysChange(value as number)}
              options={[
                { label: '7D', value: 7 },
                { label: '14D', value: 14 },
                { label: '30D', value: 30 },
                { label: '90D', value: 90 },
              ]}
              block
              size="large"
              style={{
                backgroundColor: '#f0f0f0',
              }}
            />
          </Space>
        </Col>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: '12px', color: ColorFont3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sentiment
            </Text>
            <Select
              value={sentimentFilter}
              onChange={onSentimentChange}
              size="large"
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'All Sentiments' },
                { value: 'positive', label: '👍 Positive' },
                { value: 'negative', label: '👎 Negative' },
                { value: 'neutral', label: '😐 Neutral' },
              ]}
            />
          </Space>
        </Col>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: '12px', color: ColorFont3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Repository
            </Text>
            <Select
              value={repoFilter}
              onChange={onRepoChange}
              size="large"
              style={{ width: '100%' }}
              options={repoOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Space>
        </Col>
      </Row>
    </Card>
  )
}
