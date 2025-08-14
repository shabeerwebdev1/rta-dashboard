import React from "react";
import { Card, Col, Row, Skeleton, Statistic, Tooltip } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface StatsGroupProps {
  config: {
    title: string;
    value: (data: any) => number | string;
    icon?: React.ReactNode;
    color?: string;
    trend?: "up" | "down";
    tooltip?: string;
  }[];
  data: any;
  loading?: boolean;
}

const StatsGroup: React.FC<StatsGroupProps> = ({ config, data, loading }) => {
  if (!config || config.length === 0) return null;

  const statCards = config.map((stat, index) => (
    <Col xs={24} sm={12} md={6} lg={4} key={index}>
      <Card className="stat-card" bordered={false} bodyStyle={{ padding: "10px 0 10px 20px" }} hoverable>
        <Skeleton loading={loading} active paragraph={{ rows: 0 }} title={false}>
          <div className="stat-header">
            {stat.tooltip && (
              <Tooltip title={stat.tooltip}>
                <span className="info-icon">ℹ️</span>
              </Tooltip>
            )}
          </div>
          <Statistic
            title={<span className="stat-title">{stat.title}</span>}
            value={stat.value(data)}
            valueStyle={{
              color: stat.color,
              fontSize: "1.6rem",
              fontWeight: 600,
            }}
            prefix={
              stat.trend === "up" ? (
                <ArrowUpOutlined style={{ color: "#52c41a" }} />
              ) : stat.trend === "down" ? (
                <ArrowDownOutlined style={{ color: "#ff4d4f" }} />
              ) : (
                stat.icon
              )
            }
          />
        </Skeleton>
      </Card>
    </Col>
  ));

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>{statCards}</Row>
    </div>
  );
};

export default StatsGroup;
