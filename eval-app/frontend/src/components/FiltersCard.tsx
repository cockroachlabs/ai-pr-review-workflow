import { Box, SimpleGrid, VStack, Text, Button, ButtonGroup, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { Repo } from '../types'

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
  const dayOptions = [
    { label: '7D', value: 7 },
    { label: '14D', value: 14 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ]

  const sentimentOptions = [
    { value: 'all', label: 'All Sentiments', emoji: '📊' },
    { value: 'positive', label: 'Positive', emoji: '👍' },
    { value: 'negative', label: 'Negative', emoji: '👎' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
  ]

  const getSentimentLabel = () => {
    const option = sentimentOptions.find(o => o.value === sentimentFilter)
    return option ? `${option.emoji} ${option.label}` : 'Select Sentiment'
  }

  const getRepoLabel = () => {
    if (repoFilter === 'all') return '📁 All Repositories'
    return `📁 ${repoFilter}`
  }

  return (
    <Box
      bg="white"
      borderRadius="xl"
      p={4}
      mb={6}
      boxShadow="sm"
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <VStack align="stretch" spacing={2}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Time Range
          </Text>
          <ButtonGroup isAttached size="md" width="100%">
            {dayOptions.map(({ label, value }) => (
              <Button
                key={value}
                onClick={() => onDaysChange(value)}
                colorScheme={daysFilter === value ? 'brand' : 'gray'}
                variant={daysFilter === value ? 'solid' : 'outline'}
                flex="1"
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </VStack>

        <VStack align="stretch" spacing={2}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Sentiment
          </Text>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              width="100%"
              textAlign="left"
              fontWeight="normal"
            >
              {getSentimentLabel()}
            </MenuButton>
            <MenuList>
              {sentimentOptions.map(({ value, label, emoji }) => (
                <MenuItem
                  key={value}
                  onClick={() => onSentimentChange(value)}
                  bg={sentimentFilter === value ? 'brand.50' : 'transparent'}
                  fontWeight={sentimentFilter === value ? 'semibold' : 'normal'}
                  _hover={{ bg: sentimentFilter === value ? 'brand.100' : 'gray.100' }}
                >
                  {emoji} {label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </VStack>

        <VStack align="stretch" spacing={2}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Repository
          </Text>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              width="100%"
              textAlign="left"
              fontWeight="normal"
            >
              {getRepoLabel()}
            </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
              <MenuItem
                onClick={() => onRepoChange('all')}
                bg={repoFilter === 'all' ? 'brand.50' : 'transparent'}
                fontWeight={repoFilter === 'all' ? 'semibold' : 'normal'}
                _hover={{ bg: repoFilter === 'all' ? 'brand.100' : 'gray.100' }}
              >
                📁 All Repositories
              </MenuItem>
              {repos.map((repo) => (
                <MenuItem
                  key={repo.repo_name}
                  onClick={() => onRepoChange(repo.repo_name)}
                  bg={repoFilter === repo.repo_name ? 'brand.50' : 'transparent'}
                  fontWeight={repoFilter === repo.repo_name ? 'semibold' : 'normal'}
                  _hover={{ bg: repoFilter === repo.repo_name ? 'brand.100' : 'gray.100' }}
                >
                  📁 {repo.repo_name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </VStack>
      </SimpleGrid>
    </Box>
  )
}
