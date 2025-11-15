import { Card, Typography, Avatar, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { GitHubComment } from '../utils/github'
import { ColorCoreNeutral1 } from '../tokens'

const { Text } = Typography

interface CommentViewerProps {
  comment: GitHubComment
}

export const CommentViewer = ({ comment }: CommentViewerProps) => {
  return (
    <Card
      style={{
        marginTop: '16px',
        borderRadius: '8px',
        background: ColorCoreNeutral1,
      }}
      styles={{
        body: { padding: '16px' }
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={32}
            src={comment.user.avatar_url}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px' }}>
              {comment.user.login}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {new Date(comment.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
        </div>

        {comment.path && (
          <Text type="secondary" style={{ fontSize: '12px', fontFamily: '"Roboto Mono", monospace' }}>
            📄 {comment.path}
            {comment.line && ` (Line ${comment.line})`}
          </Text>
        )}

        <div
          style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #d6dbe7',
          }}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>{children}</p>
              ),
              code: ({ children, className }) => {
                const isInline = !className
                return isInline ? (
                  <code
                    style={{
                      background: '#f5f7fa',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '13px',
                    }}
                  >
                    {children}
                  </code>
                ) : (
                  <pre
                    style={{
                      background: '#f5f7fa',
                      padding: '12px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '13px',
                    }}
                  >
                    <code>{children}</code>
                  </pre>
                )
              },
            }}
          >
            {comment.body}
          </ReactMarkdown>
        </div>
      </Space>
    </Card>
  )
}
