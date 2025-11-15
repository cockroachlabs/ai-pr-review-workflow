import { Row, Col, Card, Space, Typography, Progress } from 'antd'
import {
  ColorBaseSuccess,
  ColorBaseDanger,
  ColorBaseWarning,
  ColorIntentSuccess1,
  ColorIntentDanger1,
  ColorIntentWarning1,
  ColorFont3,
} from '../tokens'

const { Text } = Typography

interface MetricsCardsProps {
  positiveCount: number
  negativeCount: number
  neutralCount: number
}

export const MetricsCards = ({ positiveCount, negativeCount, neutralCount }: MetricsCardsProps) => {
  const total = positiveCount + negativeCount + neutralCount
  const positivePercent = total > 0 ? (positiveCount / total) * 100 : 0
  const negativePercent = total > 0 ? (negativeCount / total) * 100 : 0
  const neutralPercent = total > 0 ? (neutralCount / total) * 100 : 0

  const MetricCard = ({
    title,
    count,
    percentage,
    color,
    bgColor,
  }: {
    title: string
    count: number
    percentage: number
    color: string
    bgColor: string
  }) => {
    const isZero = count === 0

    return (
      <Card
        style={{
          borderRadius: '12px',
          border: 'none',
          background: isZero ? '#fafafa' : bgColor,
          boxShadow: isZero ? '0 1px 3px rgba(0,0,0,0.03)' : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          cursor: 'default',
          opacity: isZero ? 0.6 : 1,
        }}
        styles={{
          body: { padding: '14px' }
        }}
        hoverable={!isZero}
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div>
            <Text
              strong
              style={{
                fontSize: '11px',
                color: ColorFont3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {title}
            </Text>
            {isZero ? (
              <Text
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: ColorFont3,
                  lineHeight: '1',
                  opacity: 0.5,
                }}
              >
                —
              </Text>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Text
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: color,
                    lineHeight: '1',
                  }}
                >
                  {count}
                </Text>
                <Text
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: color,
                    opacity: 0.7,
                  }}
                >
                  {percentage.toFixed(1)}%
                </Text>
              </div>
            )}
          </div>
          {!isZero && (
            <Progress
              percent={percentage}
              strokeColor={color}
              showInfo={false}
              strokeWidth={6}
              trailColor="rgba(0,0,0,0.06)"
            />
          )}
        </Space>
      </Card>
    )
  }

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
      <Col xs={24} sm={8}>
        <MetricCard
          title="Positive Reviews"
          count={positiveCount}
          percentage={positivePercent}
          color={ColorBaseSuccess}
          bgColor={ColorIntentSuccess1}
        />
      </Col>
      <Col xs={24} sm={8}>
        <MetricCard
          title="Negative Reviews"
          count={negativeCount}
          percentage={negativePercent}
          color={ColorBaseDanger}
          bgColor={ColorIntentDanger1}
        />
      </Col>
      <Col xs={24} sm={8}>
        <MetricCard
          title="Neutral Reviews"
          count={neutralCount}
          percentage={neutralPercent}
          color={ColorBaseWarning}
          bgColor={ColorIntentWarning1}
        />
      </Col>
    </Row>
  )
}
