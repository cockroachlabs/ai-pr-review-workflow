import { Typography, Card, Space, Row, Col } from 'antd'
import { BrandDarkBlue, BrandElectricPurple, BrandIridescentBlue } from '../tokens'

const { Title, Text } = Typography

interface HeaderProps {
  totalReviews: number
}

export const Header = ({ totalReviews }: HeaderProps) => {
  return (
    <Card
      style={{
        marginBottom: '24px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${BrandDarkBlue} 0%, ${BrandElectricPurple} 50%, ${BrandIridescentBlue} 100%)`,
        border: 'none',
        boxShadow: '0 4px 12px rgba(105, 51, 255, 0.2)',
      }}
      styles={{
        body: { padding: '16px 18px' }
      }}
    >
      <Row align="middle" justify="space-between">
        <Col flex="auto">
          <Space direction="vertical" size={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>🤖</span>
              <Title
                level={1}
                style={{
                  marginBottom: '0',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.5px',
                }}
              >
                AI Review Health Dashboard
              </Title>
            </div>
            <Text style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', paddingLeft: '36px' }}>
              Monitor the quality and sentiment of AI-generated PR reviews
            </Text>
          </Space>
        </Col>
        <Col>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <Text style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Total Reviews
            </Text>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: '1' }}>
              {totalReviews.toLocaleString()}
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}
