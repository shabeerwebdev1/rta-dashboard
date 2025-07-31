import { useEffect } from "react";
import { Card, Col, Row, Statistic, Skeleton } from "antd";
import {
  CarOutlined,
  FileDoneOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const loading = usePageLoader();

  useEffect(() => {
    setPageTitle(t("sidebar.dashboard"));
  }, [setPageTitle, t]);

  const stats = [
    {
      title: t("dashboard.totalVehicles"),
      value: 112893,
      icon: <CarOutlined />,
      color: "#171B7D",
    },
    {
      title: t("dashboard.activePledges"),
      value: 3245,
      icon: <FileDoneOutlined />,
      color: "#5A7D9A",
    },
    {
      title: t("dashboard.finesIssued"),
      value: 987,
      icon: <DollarCircleOutlined />,
      color: "#EB2630",
    },
    {
      title: t("dashboard.openDisputes"),
      value: 52,
      icon: <ExclamationCircleOutlined />,
      color: "#fadb14",
    },
  ];

  return (
    <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
      <Row gutter={[24, 24]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} md={6} key={stat.title}>
            <Card variant="borderless">
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color, fontWeight: 500 }}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
        <Col span={24}>
          <Card title={t("dashboard.activityTitle")}>
            <p>{t("dashboard.activityPlaceholder")}</p>
            <Skeleton active />
          </Card>
        </Col>
      </Row>
    </Skeleton>
  );
};

export default DashboardPage;
