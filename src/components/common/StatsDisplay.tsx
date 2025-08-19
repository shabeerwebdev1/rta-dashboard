import React from "react";
import { Card, Col, Row, Skeleton, Statistic } from "antd";
import type { StatConfig } from "../../types/config";

interface StatsDisplayProps {
  statsConfig?: StatConfig[];
  data: any[];
  loading?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ statsConfig, data, loading }) => {
  if (!statsConfig || statsConfig.length === 0) return null;

  return (
    <div>
      <Row gutter={[24, 24]}>
        {statsConfig.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Card size="small" bordered={false}>
              <Skeleton loading={loading} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={stat.title}
                  value={stat.value(data)}
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