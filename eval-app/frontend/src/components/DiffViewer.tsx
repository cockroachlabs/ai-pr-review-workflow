import { Card } from 'antd'

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
        <div
          key={index}
          style={{
            backgroundColor,
            padding: '2px 12px',
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '12px',
            lineHeight: '20px',
            whiteSpace: 'pre',
            color,
          }}
        >
          {lineContent || ' '}
        </div>
      )
    })
  }

  return (
    <Card
      style={{
        marginTop: '16px',
        borderRadius: '8px',
        background: '#0d1117',
        border: '1px solid #30363d',
      }}
      styles={{
        body: { padding: '0' }
      }}
    >
      {filePath && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #30363d',
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '12px',
            color: '#8b949e',
            background: '#161b22',
          }}
        >
          {filePath}
        </div>
      )}
      <div style={{ overflow: 'auto' }}>
        {renderDiffLines()}
      </div>
    </Card>
  )
}
