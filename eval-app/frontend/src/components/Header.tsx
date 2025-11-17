import { Box, Heading, Text, Flex, VStack, HStack } from '@chakra-ui/react'

interface HeaderProps {
  totalReviews: number
}

export const Header = ({ totalReviews }: HeaderProps) => {
  return (
    <Box
      bgGradient="linear(to-r, brand.electricPurple, brand.iridescentBlue)"
      borderRadius="xl"
      p={6}
      mb={6}
      boxShadow="xl"
      color="white"
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'start', md: 'center' }}
        justify="space-between"
        gap={4}
      >
        <HStack spacing={3} align="center">
          <Text fontSize="4xl">🤖</Text>
          <VStack align="start" spacing={1}>
            <Heading size="lg" fontWeight="bold" letterSpacing="tight">
              AI Review Health Dashboard
            </Heading>
            <Text fontSize="sm" opacity={0.9}>
              Monitor the quality and sentiment of AI-generated PR reviews
            </Text>
          </VStack>
        </HStack>

        <Box textAlign={{ base: 'left', md: 'center' }} px={4}>
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wide"
            fontWeight="semibold"
            opacity={0.8}
            mb={1}
          >
            Total Reviews
          </Text>
          <Text fontSize="4xl" fontWeight="bold" lineHeight="1">
            {totalReviews.toLocaleString()}
          </Text>
        </Box>
      </Flex>
    </Box>
  )
}
