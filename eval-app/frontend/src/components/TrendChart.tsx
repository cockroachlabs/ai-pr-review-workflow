import { Box, Heading } from '@chakra-ui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DailyTrend } from '../utils/analytics'

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
    <Box bg="white" borderRadius="xl" p={5} boxShadow="sm">
      <Heading size="md" mb={4}>
        Sentiment Trends
      </Heading>
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
              border: '1px solid #e2e8f0',
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
              stroke="#38a169"
              strokeWidth={2}
              name="Positive"
              dot={{ fill: '#38a169', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {hasNegative && (
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#e53e3e"
              strokeWidth={2}
              name="Negative"
              dot={{ fill: '#e53e3e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {hasNeutral && (
            <Line
              type="monotone"
              dataKey="neutral"
              stroke="#ed8936"
              strokeWidth={2}
              name="Neutral"
              dot={{ fill: '#ed8936', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
