import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RepoStats } from '../utils/analytics'

interface RepositoryPerformanceChartProps {
  data: RepoStats[]
  maxRepos?: number
}

export const RepositoryPerformanceChart = ({ data, maxRepos = 5 }: RepositoryPerformanceChartProps) => {
  // Show only top N repositories by total count
  const topRepos = data.slice(0, maxRepos)

  if (topRepos.length === 0) {
    return (
      <Box bg="white" borderRadius="xl" p={5} boxShadow="sm">
        <Heading size="md" mb={4}>
          Repository Performance
        </Heading>
        <VStack py={10}>
          <Text color="gray.500" fontSize="sm">
            No repository data available
          </Text>
        </VStack>
      </Box>
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
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={3}
          boxShadow="md"
        >
          <Text fontWeight="bold" mb={2}>
            {data.fullName}
          </Text>
          <VStack align="stretch" spacing={1} fontSize="sm">
            <Text color="green.500">
              Positive: {data.positive} ({data.positiveRate.toFixed(1)}%)
            </Text>
            <Text color="red.500">
              Negative: {data.negative}
            </Text>
            <Text color="orange.500">
              Neutral: {data.neutral}
            </Text>
          </VStack>
        </Box>
      )
    }
    return null
  }

  return (
    <Box bg="white" borderRadius="xl" p={5} boxShadow="sm">
      <Heading size="md" mb={1}>
        Repository Performance
      </Heading>
      <Text color="gray.600" fontSize="sm" mb={4}>
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
            fill="#38a169"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="negative"
            name="Negative"
            fill="#e53e3e"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="neutral"
            name="Neutral"
            fill="#ed8936"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
