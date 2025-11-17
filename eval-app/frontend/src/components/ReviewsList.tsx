import { useState, useMemo } from 'react'
import {
  Box,
  VStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  SimpleGrid,
  Text,
  Spinner,
  Center
} from '@chakra-ui/react'
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { FaSortAmountDown } from 'react-icons/fa'
import { ReviewCard } from './ReviewCard'

interface Review {
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
  last_updated: string
}

interface ReviewsListProps {
  reviews: Review[]
  loading: boolean
}

type SortOption = 'newest' | 'oldest' | 'repo-asc' | 'repo-desc'

export const ReviewsList = ({ reviews, loading }: ReviewsListProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: '🕐' },
    { value: 'oldest', label: 'Oldest First', icon: '🕑' },
    { value: 'repo-asc', label: 'Repository (A-Z)', icon: '⬆️' },
    { value: 'repo-desc', label: 'Repository (Z-A)', icon: '⬇️' },
  ]

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.value === sortBy)
    return option ? `${option.icon} ${option.label}` : 'Sort by'
  }

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(review =>
        review.pr_title?.toLowerCase().includes(query) ||
        review.repo_name.toLowerCase().includes(query) ||
        review.pr_number.toString().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'repo-asc':
          return a.repo_name.localeCompare(b.repo_name)
        case 'repo-desc':
          return b.repo_name.localeCompare(a.repo_name)
        default:
          return 0
      }
    })

    return result
  }, [reviews, searchQuery, sortBy])

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Review Activity
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            leftIcon={<FaSortAmountDown />}
            width="100%"
            textAlign="left"
            fontWeight="normal"
          >
            {getSortLabel()}
          </MenuButton>
          <MenuList>
            {sortOptions.map(({ value, label, icon }) => (
              <MenuItem
                key={value}
                onClick={() => setSortBy(value as SortOption)}
                bg={sortBy === value ? 'brand.50' : 'transparent'}
                fontWeight={sortBy === value ? 'semibold' : 'normal'}
                _hover={{ bg: sortBy === value ? 'brand.100' : 'gray.100' }}
              >
                {icon} {label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </SimpleGrid>

      {!loading && filteredAndSortedReviews.length !== reviews.length && (
        <Text color="gray.600" fontSize="sm" mb={3}>
          Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
        </Text>
      )}

      {loading ? (
        <Center bg="white" borderRadius="xl" p={20} boxShadow="sm">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.600">Loading reviews...</Text>
          </VStack>
        </Center>
      ) : filteredAndSortedReviews.length === 0 ? (
        <Center bg="white" borderRadius="xl" p={20} boxShadow="sm">
          <Text color="gray.500">
            {searchQuery ? 'No reviews match your search' : 'No reviews found'}
          </Text>
        </Center>
      ) : (
        <VStack spacing={3} align="stretch">
          {filteredAndSortedReviews.map((review) => (
            <ReviewCard key={review.ai_review_id} review={review} />
          ))}
        </VStack>
      )}
    </Box>
  )
}
