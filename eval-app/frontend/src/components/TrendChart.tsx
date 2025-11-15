import { Card, Typography } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ColorBaseSuccess, ColorBaseDanger, ColorBaseWarning } from '../tokens'
import { DailyTrend } from '../utils/analytics'

const { Title } = Typography

interface TrendChartProps {
  data: DailyTrend[]
}

export const TrendChart = ({ data }: TrendChartProps) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: formatDate(item.date),
  }))

  // Check which series have data
  const hasPositive = data.some(item => item.positive > 0)
  const hasNegative = data.some(item => item.negative > 0)
  const hasNeutral = data.some(item => item.neutral > 0)

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '32px',
      }}
      styles={{
        body: { padding: '18px 16px' }
      }}
    >
      <Title level={3} style={{ marginBottom: '4px', fontSize: '18px', fontWeight: 600 }}>
        Sentiment Trends
      </Title>
      <div style={{ height: '16px', marginBottom: '16px' }} /> {/* Spacer to match RepoChart subtitle height */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="dateFormatted"
            stroke="#999"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#999"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          />
          {hasPositive && (
            <Line
              type="monotone"
              dataKey="positive"
              stroke={ColorBaseSuccess}
              strokeWidth={2}
              name="Positive"
              dot={{ fill: ColorBaseSuccess, r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {hasNegative && (
            <Line
              type="monotone"
              dataKey="negative"
              stroke={ColorBaseDanger}
              strokeWidth={2}
              name="Negative"
              dot={{ fill: ColorBaseDanger, r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {hasNeutral && (
            <Line
              type="monotone"
              dataKey="neutral"
              stroke={ColorBaseWarning}
              strokeWidth={2}
              name="Neutral"
              dot={{ fill: ColorBaseWarning, r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
