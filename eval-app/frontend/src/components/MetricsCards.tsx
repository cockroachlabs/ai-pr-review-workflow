import { SimpleGrid, Box, Text, HStack, Progress, VStack } from '@chakra-ui/react'

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

  interface MetricCardProps {
    title: string
    count: number
    percentage: number
    color: string
    bgColor: string
  }

  const MetricCard = ({ title, count, percentage, color, bgColor }: MetricCardProps) => {
    const isZero = count === 0

    return (
      <Box
        bg={isZero ? 'gray.50' : bgColor}
        borderRadius="xl"
        p={4}
        boxShadow={isZero ? 'sm' : 'md'}
        opacity={isZero ? 0.6 : 1}
        transition="all 0.3s"
        _hover={!isZero ? { boxShadow: 'lg', transform: 'translateY(-2px)' } : {}}
      >
        <VStack align="stretch" spacing={3}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {title}
          </Text>

          {isZero ? (
            <Text fontSize="4xl" fontWeight="bold" color="gray.400" lineHeight="1">
              —
            </Text>
          ) : (
            <HStack align="baseline" spacing={2}>
              <Text fontSize="4xl" fontWeight="bold" color={color} lineHeight="1">
                {count}
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color={color} opacity={0.7}>
                {percentage.toFixed(1)}%
              </Text>
            </HStack>
          )}

          {!isZero && (
            <Progress
              value={percentage}
              colorScheme={
                color.includes('green') ? 'green' :
                color.includes('red') ? 'red' : 'orange'
              }
              size="sm"
              borderRadius="full"
            />
          )}
        </VStack>
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
      <MetricCard
        title="Positive Reviews"
        count={positiveCount}
        percentage={positivePercent}
        color="green.500"
        bgColor="green.50"
      />
      <MetricCard
        title="Negative Reviews"
        count={negativeCount}
        percentage={negativePercent}
        color="red.500"
        bgColor="red.50"
      />
      <MetricCard
        title="Neutral Reviews"
        count={neutralCount}
        percentage={neutralPercent}
        color="orange.500"
        bgColor="orange.50"
      />
    </SimpleGrid>
  )
}
