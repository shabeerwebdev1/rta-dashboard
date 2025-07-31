import { useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Skeleton,
  List,
  Avatar,
  Button,
  Space,
  Typography,
  Tag,
  Timeline,
  theme,
} from "antd";
import {
  CarOutlined,
  FileDoneOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Line, Pie } from "@ant-design/plots";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";

const { Title, Text } = Typography;
const { useToken } = theme;

const finesData = Array.from({ length: 30 }, (_, i) => ({
  date: `2024-05-${String(i + 1).padStart(2, "0")}`,
  count: Math.floor(Math.random() * 50) + 10,
}));

const whitelistStatusData = [
  { type: "Active", value: 3245 },
  { type: "Expired", value: 412 },
  { type: "Pending", value: 85 },
];

const pendingApprovals = [
  { name: "Global Exports LLC", date: "2024-05-28", type: "Trade" },
  { name: "DXB A 12345", date: "2024-05-27", type: "Plate" },
  { name: "Innovate Tech FZCO", date: "2024-05-27", type: "Trade" },
];

const recentActivity = [
  {
    user: "Ali Ahmed",
    action: "fineIssued",
    target: "AUH B 54321",
    time: "2 mins ago",
    status: "critical",
  },
  {
    user: "Ahsan MS",
    action: "fineIssued",
    target: "MIU B 54243",
    time: "2 mins ago",
    status: "warning",
  },
  {
    user: "Fatima Khan",
    action: "whitelistApproved",
    target: "EFG Corp",
    time: "15 mins ago",
    status: "success",
  },
  {
    user: "John Doe",
    action: "disputeOpened",
    target: "Fine #84321",
    time: "1 hour ago",
    status: "warning",
  },
  {
    user: "Jane Smith",
    action: "vehicleInspected",
    target: "SHJ C 9876",
    time: "3 hours ago",
    status: "info",
  },
];

const DashboardPage = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { token } = useToken();
  const loading = usePageLoader(800);

  useEffect(() => {
    setPageTitle(t("sidebar.dashboard"));
  }, [setPageTitle, t]);

  const stats = [
    {
      title: t("dashboard.totalVehicles"),
      value: 112893,
      trend: 1.2,
      icon: <CarOutlined />,
      color: token.colorPrimary,
    },
    {
      title: t("dashboard.activePledges"),
      value: 3245,
      trend: 5,
      icon: <FileDoneOutlined />,
      color: token.colorSuccess,
    },
    {
      title: t("dashboard.finesIssued"),
      value: 987,
      trend: -3.1,
      icon: <DollarCircleOutlined />,
      color: token.colorError,
    },
    {
      title: t("dashboard.openDisputes"),
      value: 52,
      trend: 8,
      icon: <ExclamationCircleOutlined />,
      color: token.colorWarning,
    },
  ];

  const lineConfig = {
    data: finesData,
    xField: "date",
    yField: "count",
    smooth: true,
    height: 250,
    area: { style: { fill: `l(270) 0:#ffffff 1:${token.colorPrimary}1A` } },
    line: { style: { stroke: token.colorPrimary, strokeWidth: 2 } },
    tooltip: {
      title: "Date",
      formatter: (datum: any) => ({ name: "Fines", value: datum.count }),
    },
  };

  const pieConfig = {
    data: whitelistStatusData,
    angleField: "value",
    colorField: "type",
    height: 250,
    innerRadius: 0.6,
    label: { text: "value", style: { fontWeight: "bold" } },
    legend: { color: { title: false, position: "right", rowPadding: 5 } },
  };

  return (
    <Skeleton loading={loading} active paragraph={{ rows: 12 }}>
      <Row gutter={[24, 24]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card bordered={false}>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
              />
              <Space
                className="no-margin"
                style={{
                  marginTop: 8,
                  color: stat.trend > 0 ? token.colorSuccess : token.colorError,
                }}
              >
                {stat.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <Text style={{ color: "inherit", fontSize: "12px" }}>
                  {stat.trend}% {t("dashboard.last30days")}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={<Title level={5}>{t("dashboard.finesOverTime")}</Title>}
          >
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            title={<Title level={5}>{t("dashboard.whitelistStatus")}</Title>}
          >
            <Pie {...pieConfig} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={<Title level={5}>{t("dashboard.pendingApprovals")}</Title>}
          >
            <List
              itemLayout="horizontal"
              dataSource={pendingApprovals}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="primary" size="small">
                      {t("dashboard.approve")}
                    </Button>,
                    <Button size="small">{t("dashboard.reject")}</Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.type === "Trade" ? (
                            <FileDoneOutlined />
                          ) : (
                            <CarOutlined />
                          )
                        }
                      />
                    }
                    title={<a href="#">{item.name}</a>}
                    description={item.date}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={<Title level={5}>{t("dashboard.recentActivity")}</Title>}
          >
            <Timeline
              items={recentActivity.map((item) => ({
                color:
                  item.status === "critical"
                    ? "red"
                    : item.status === "success"
                      ? "green"
                      : item.status === "warning"
                        ? "gold"
                        : "blue",
                dot: item.status === "info" ? <SearchOutlined /> : undefined,
                children: (
                  <Space>
                    <Text strong>{item.user}</Text>
                    <Text type="secondary">
                      {t(`dashboard.activity.${item.action}`)}
                    </Text>
                    <Text strong>{item.target}</Text>
                    <Text type="secondary">({item.time})</Text>
                  </Space>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </Skeleton>
  );
};

export default DashboardPage;
