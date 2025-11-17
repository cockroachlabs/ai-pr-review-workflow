import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Link,
  Badge,
  Button,
  Collapse,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { FaGithub, FaClock, FaCodeBranch } from 'react-icons/fa'
import { fetchComment, GitHubComment } from '../utils/github'
import { DiffViewer } from './DiffViewer'
import { CommentViewer } from './CommentViewer'

interface ReviewCardProps {
  review: {
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
  }
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState<GitHubComment | null>(null)

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'green'
      case 'negative':
        return 'red'
      case 'neutral':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getSentimentLabel = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'Positive'
      case 'negative':
        return 'Negative'
      case 'neutral':
        return 'Neutral'
      default:
        return 'Unknown'
    }
  }

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }

    // Only fetch if we haven't fetched before
    if (!comment) {
      setLoading(true)
      setError(null)

      try {
        const commentData = await fetchComment(review.repo_name, review.review_comment_id)
        setComment(commentData)
        setExpanded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Failed to fetch GitHub data:', err)
      } finally {
        setLoading(false)
      }
    } else {
      setExpanded(true)
    }
  }

  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const sentimentColor = getSentimentColor(review.sentiment)
  const sentimentBorderColor = `${sentimentColor}.400`

  return (
    <Box
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      borderLeftWidth="4px"
      borderLeftColor={sentimentBorderColor}
      p={4}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
    >
      <VStack align="stretch" spacing={3}>
        {/* Header: Title + Sentiment Badge */}
        <HStack justify="space-between" align="start">
          <VStack align="stretch" spacing={1} flex="1">
            <Link
              href={review.pr_url}
              isExternal
              fontSize="md"
              fontWeight="semibold"
              color="brand.600"
              _hover={{ color: 'brand.700', textDecoration: 'underline' }}
            >
              {review.pr_title || `PR #${review.pr_number}`}
            </Link>
            <HStack spacing={2} fontSize="sm" color="gray.600">
              <HStack spacing={1}>
                <FaCodeBranch />
                <Text>{review.repo_name}</Text>
              </HStack>
              <Text>•</Text>
              <Text>#{review.pr_number}</Text>
            </HStack>
          </VStack>
          <Badge
            colorScheme={sentimentColor}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            textTransform="uppercase"
          >
            {getSentimentLabel(review.sentiment)}
          </Badge>
        </HStack>

        {/* Metadata Row */}
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <HStack spacing={2} fontSize="xs" color="gray.600">
            <FaClock />
            <Text>
              {new Date(review.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Button
              as="a"
              href={review.review_comment_web_url}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              leftIcon={<FaGithub />}
              rightIcon={<ExternalLinkIcon />}
              variant="outline"
              colorScheme="gray"
            >
              View on GitHub
            </Button>
            <Button
              size="sm"
              onClick={handleExpand}
              isLoading={loading}
              rightIcon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              variant="ghost"
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
          </HStack>
        </HStack>

        {/* Error */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Failed to load details</AlertTitle>
              <AlertDescription fontSize="sm">{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Expanded Content */}
        <Collapse in={expanded} animateOpacity>
          {loading && (
            <Box textAlign="center" py={8}>
              <Spinner size="md" color="brand.500" />
              <Text mt={2} fontSize="sm" color="gray.600">
                Loading comment...
              </Text>
            </Box>
          )}

          {!loading && comment && (
            <VStack align="stretch" spacing={4} mt={2}>
              {comment.diff_hunk && (
                <DiffViewer diffHunk={comment.diff_hunk} filePath={comment.path} />
              )}
              <CommentViewer comment={comment} />
            </VStack>
          )}
        </Collapse>
      </VStack>
    </Box>
  )
}
