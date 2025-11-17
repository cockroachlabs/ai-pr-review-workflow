import { Card, Typography, Empty } from 'antd'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ColorBaseSuccess, ColorBaseDanger, ColorBaseWarning } from '../tokens'
import { RepoStats } from '../utils/analytics'

const { Title, Text } = Typography

interface RepositoryPerformanceChartProps {
  data: RepoStats[]
  maxRepos?: number
}

export const RepositoryPerformanceChart = ({ data, maxRepos = 5 }: RepositoryPerformanceChartProps) => {
  // Show only top N repositories by total count
  const topRepos = data.slice(0, maxRepos)

  if (topRepos.length === 0) {
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
        <Title level={3} style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          Repository Performance
        </Title>
        <div style={{ padding: '30px 10px', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: '13px' }}>
                No repository data available
              </Text>
            }
          />
        </div>
      </Card>
    )
  }

  // Prepare data for chart - shorten repo names
  const chartData = topRepos.map(repo => ({
    name: repo.repo_name.split('/').pop() || repo.repo_name,
    fullName: repo.repo_name,
    positive: repo.positive,
    negative: repo.negative,
    neutral: repo.neutral,
    positiveRate: repo.positiveRate,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            {data.fullName}
          </Text>
          <div style={{ fontSize: '13px' }}>
            <div style={{ color: ColorBaseSuccess }}>
              Positive: {data.positive} ({data.positiveRate.toFixed(1)}%)
            </div>
            <div style={{ color: ColorBaseDanger }}>
              Negative: {data.negative}
            </div>
            <div style={{ color: ColorBaseWarning }}>
              Neutral: {data.neutral}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

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
        Repository Performance
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '16px', fontSize: '12px' }}>
        Top {maxRepos} repositories by review volume
      </Text>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            stroke="#999"
            style={{ fontSize: '12px' }}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#999"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          />
          <Bar
            dataKey="positive"
            name="Positive"
            fill={ColorBaseSuccess}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="negative"
            name="Negative"
            fill={ColorBaseDanger}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="neutral"
            name="Neutral"
            fill={ColorBaseWarning}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
