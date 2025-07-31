import { Skeleton, Card, Space } from "antd";

const PageLoader = () => (
  <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <Card variant="borderless">
      <Skeleton.Input active style={{ width: 600, height: 32 }} />
    </Card>
    <Card variant="borderless">
      <Skeleton active paragraph={{ rows: 6 }} />
    </Card>
  </Space>
);

export default PageLoader;
