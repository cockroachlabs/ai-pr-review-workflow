import { Box, Text } from '@chakra-ui/react'

interface DiffViewerProps {
  diffHunk: string
  filePath?: string
}

export const DiffViewer = ({ diffHunk, filePath }: DiffViewerProps) => {
  // Parse diff hunk to get line info and render nicely
  const renderDiffLines = () => {
    const lines = diffHunk.split('\n')

    return lines.map((line, index) => {
      let backgroundColor = 'transparent'
      let color = '#e1e4e8'
      let lineContent = line

      if (line.startsWith('+')) {
        backgroundColor = 'rgba(46, 160, 67, 0.15)'
        color = '#8ae99c'
        lineContent = line.substring(1)
      } else if (line.startsWith('-')) {
        backgroundColor = 'rgba(248, 81, 73, 0.15)'
        color = '#f97583'
        lineContent = line.substring(1)
      } else if (line.startsWith('@@')) {
        backgroundColor = 'rgba(88, 166, 255, 0.15)'
        color = '#79b8ff'
      } else if (line.startsWith(' ')) {
        lineContent = line.substring(1)
      }

      return (
        <Box
          key={index}
          bg={backgroundColor}
          px={3}
          py="2px"
          fontFamily="mono"
          fontSize="xs"
          lineHeight="tall"
          whiteSpace="pre"
          color={color}
        >
          {lineContent || ' '}
        </Box>
      )
    })
  }

  return (
    <Box
      bg="#0d1117"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="#30363d"
      overflow="hidden"
    >
      {filePath && (
        <Box
          px={3}
          py={2}
          borderBottomWidth="1px"
          borderColor="#30363d"
          fontFamily="mono"
          fontSize="xs"
          color="#8b949e"
          bg="#161b22"
        >
          {filePath}
        </Box>
      )}
      <Box overflowX="auto">
        {renderDiffLines()}
      </Box>
    </Box>
  )
}
