import { Box, VStack, HStack, Text, Avatar, useColorModeValue } from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'
import { GitHubComment } from '../utils/github'

interface CommentViewerProps {
  comment: GitHubComment
}

export const CommentViewer = ({ comment }: CommentViewerProps) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const codeBgColor = useColorModeValue('gray.100', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      p={4}
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={3}>
        <HStack spacing={3}>
          <Avatar
            size="sm"
            src={comment.user.avatar_url}
            name={comment.user.login}
          />
          <Box>
            <Text fontWeight="semibold" fontSize="sm">
              {comment.user.login}
            </Text>
            <Text color="gray.600" fontSize="xs">
              {new Date(comment.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Box>
        </HStack>

        {comment.path && (
          <Text color="gray.600" fontSize="sm" fontFamily="mono">
            📄 {comment.path}
            {comment.line && ` (Line ${comment.line})`}
          </Text>
        )}

        <Box
          bg="white"
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <Text mb={3} lineHeight="1.6">{children}</Text>
              ),
              code: ({ children, className }) => {
                const isInline = !className
                return isInline ? (
                  <Box
                    as="code"
                    bg={codeBgColor}
                    px={2}
                    py={0.5}
                    borderRadius="sm"
                    fontFamily="mono"
                    fontSize="sm"
                  >
                    {children}
                  </Box>
                ) : (
                  <Box
                    as="pre"
                    bg={codeBgColor}
                    p={3}
                    borderRadius="md"
                    overflowX="auto"
                    fontFamily="mono"
                    fontSize="sm"
                  >
                    <code>{children}</code>
                  </Box>
                )
              },
            }}
          >
            {comment.body}
          </ReactMarkdown>
        </Box>
      </VStack>
    </Box>
  )
}
