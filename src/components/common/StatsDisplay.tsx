import React from "react";
import { Card, Col, Row, Skeleton, Statistic } from "antd";

interface Stat {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
}

interface StatsDisplayProps {
  stats: Stat[];
  loading?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, loading }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div style={{ marginBottom: 0 }}>
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Card  size="small" bordered={false}>
              <Skeleton loading={loading} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  valueStyle={{ color: stat.color }}
                  prefix={stat.icon}
                />
              </Skeleton>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StatsDisplay;