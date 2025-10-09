import React from "react";
import { Card, Col, Row, Skeleton, Statistic } from "antd";
import { useTranslation } from "react-i18next";
import type { StatConfig } from "../../types/config";

interface StatsDisplayProps {
  statsConfig?: StatConfig[];
  data: any[];
  response?: any;
  loading?: boolean;
  metadata?: any;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ 
  statsConfig, 
  data, 
  loading, 
  metadata = {} 
}) => {
  const { t } = useTranslation();

  if (!statsConfig || statsConfig.length === 0) return null;

  return (
    <div>
      <Row gutter={[24, 24]}>
        {statsConfig.map((stat, index) => {
          // Translate the title if it's a translation key (starts with common pattern)
          const title = typeof stat.title === 'string' && 
                       (stat.title.includes('.') || stat.title.includes('stats.'))
            ? t(stat.title)
            : stat.title;

          return (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card size="small" bordered={false}>
                <Skeleton loading={loading} active paragraph={{ rows: 1 }} title={false}>
                  <Statistic
                    title={title}
                    value={stat.value(data, metadata)}
                    valueStyle={{ color: stat.color }}
                    prefix={stat.icon}
                    formatter={(val) => <span>{val}</span>}
                  />
                </Skeleton>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default StatsDisplay;