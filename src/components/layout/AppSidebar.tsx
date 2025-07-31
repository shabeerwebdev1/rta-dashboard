import { useState } from "react";
import { Layout, Menu, theme, type MenuProps } from "antd";
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
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const { Sider } = Layout;
const { useToken } = theme;

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { token } = useToken();

  const menuItems: MenuProps["items"] = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">{t("sidebar.dashboard")}</Link>,
    },
    {
      key: "/pledges",
      icon: <FileTextOutlined />,
      label: <Link to="/pledges">{t("sidebar.pledges")}</Link>,
    },
    { key: "/parking", icon: <PushpinOutlined />, label: t("sidebar.parking") },
    { key: "/fleet", icon: <CarOutlined />, label: t("sidebar.fleet") },
    { key: "/permits", icon: <IdcardOutlined />, label: t("sidebar.permits") },
    { key: "/hrms", icon: <TeamOutlined />, label: t("sidebar.hrms") },
    {
      key: "/inspections",
      icon: <SearchOutlined />,
      label: t("sidebar.inspections"),
    },
    { key: "/fines", icon: <DollarOutlined />, label: t("sidebar.fines") },
    {
      key: "/dispute",
      icon: <ExclamationCircleOutlined />,
      label: t("sidebar.dispute"),
    },
    { key: "/towing", icon: <CarOutlined />, label: t("sidebar.towing") },
    { key: "/team", icon: <UsergroupAddOutlined />, label: t("sidebar.team") },
    {
      key: "/analytics",
      icon: <BarChartOutlined />,
      label: t("sidebar.analytics"),
    },
  ];

  const selectedKey =
    menuItems.find((item) => location.pathname.startsWith(item?.key as string))
      ?.key || "/dashboard";

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      style={{
        position: "sticky",
        top: "0",
        left: "0",
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
          // backgroundColor: token.components.Layout.siderBg,
        }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/en/d/dd/RTA_Dubai_logo.png"
          alt="RTA Logo"
          style={{
            height: "32px",
            transition: "all 0.2s",
            backgroundColor: "white",
            padding: "2px",
            borderRadius: "4px",
          }}
        />
      </div>
      <Menu
        style={{ height: "calc(100% - 64px)", borderRight: 0 }}
        selectedKeys={[selectedKey as string]}
        mode="inline"
        items={menuItems}
      />
    </Sider>
  );
};

export default AppSidebar;
