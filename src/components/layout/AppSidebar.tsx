import { useState } from "react";
import { Layout, Menu, theme } from "antd";
import {
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  IdcardOutlined,
  PushpinOutlined,
  DashboardOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const { Sider } = Layout;
const { useToken } = theme;

type MenuItem = {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  children?: MenuItem[];
};

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { token } = useToken();

  const menuItems: MenuItem[] = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">{t("sidebar.dashboard")}</Link>,
    },
    {
      key: "whitelist",
      icon: <FileTextOutlined />,
      label: t("sidebar.whitelist"),
      children: [
        {
          key: "/whitelist/plates",
          label: (
            <Link to="/whitelist/plates">{t("whitelist.plate.title")}</Link>
          ),
        },
        {
          key: "/whitelist/tradelicenses",
          label: (
            <Link to="/whitelist/tradelicenses">
              {t("whitelist.trade.title")}
            </Link>
          ),
        },
      ],
    },
    {
      key: "/parking",
      icon: <PushpinOutlined />,
      label: <Link to="/parking">{t("sidebar.parking")}</Link>,
    },
    {
      key: "/inspectionobstacle",
      icon: <SearchOutlined />,
      label: <Link to="/inspectionobstacle">{t("sidebar.inspections")}</Link>,
    },
    {
      key: "/pledges",
      icon: <AuditOutlined />,
      label: <Link to="/pledges">{t("sidebar.pledgesManagement")}</Link>,
    },
    {
      key: "/fines",
      icon: <DollarOutlined />,
      label: <Link to="/fines">{t("sidebar.fines")}</Link>,
    },
    {
      key: "/permits",
      icon: <IdcardOutlined />,
      label: <Link to="/permits">{t("sidebar.permits")}</Link>,
    },
    {
      key: "/hrms",
      icon: <TeamOutlined />,
      label: <Link to="/hrms">{t("sidebar.hrms")}</Link>,
    },
    {
      key: "/dispute",
      icon: <ExclamationCircleOutlined />,
      label: <Link to="/dispute">{t("sidebar.dispute")}</Link>,
    },
    {
      key: "/towing",
      icon: <CarOutlined />,
      label: <Link to="/towing">{t("sidebar.towing")}</Link>,
    },
    {
      key: "/team",
      icon: <UsergroupAddOutlined />,
      label: <Link to="/team">{t("sidebar.team")}</Link>,
    },
    {
      key: "/analytics",
      icon: <BarChartOutlined />,
      label: <Link to="/analytics">{t("sidebar.analytics")}</Link>,
    },
  ];

  const selectedKey =
    menuItems
      .flatMap((item) => (item && "children" in item ? item.children : item))
      .find((item) => item && location.pathname.startsWith(item.key as string))
      ?.key ||
    menuItems.find((item) => location.pathname.startsWith(item?.key as string))
      ?.key ||
    "/dashboard";

  const defaultOpenKeys = menuItems
    .filter(
      (item) =>
        item &&
        "children" in item &&
        item.children?.some((child) =>
          location.pathname.startsWith(child?.key as string)
        )
    )
    .map((item) => item?.key as string);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: collapsed ? "8px" : "2px",
          backgroundColor: "white",
        }}
      >
        <img
          src={
            collapsed
              ? "https://images.seeklogo.com/logo-png/4/2/dubai-roads-transport-authority-logo-png_seeklogo-44110.png"
              : "https://upload.wikimedia.org/wikipedia/en/d/dd/RTA_Dubai_logo.png"
          }
          alt="RTA Logo"
          style={{
            width: collapsed ? "80px" : "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>
      <Menu
        style={{ height: "calc(100% - 64px)", marginTop: 20, borderRight: 0 }}
        defaultOpenKeys={defaultOpenKeys}
        selectedKeys={[selectedKey as string]}
        mode="inline"
        items={menuItems}
      />
    </Sider>
  );
};

export default AppSidebar;
