import { useState } from "react";
import { Layout, Menu } from "antd";
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

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems: any[] = [
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
          label: <Link to="/whitelist/plates">{t("sidebar.plates")}</Link>,
        },
        {
          key: "/whitelist/tradelicenses",
          label: (
            <Link to="/whitelist/tradelicenses">
              {t("sidebar.tradelicenses")}
            </Link>
          ),
        },
      ],
    },
    {
      key: "/inspections",
      icon: <SearchOutlined />,
      label: <Link to="/inspections">{t("sidebar.inspections")}</Link>,
    },
    {
      key: "/pledges",
      icon: <AuditOutlined />,
      label: <Link to="/pledges">{t("sidebar.pledges")}</Link>,
    },
    {
      key: "/permits",
      icon: <IdcardOutlined />,
      label: <Link to="/permits">{t("sidebar.permits")}</Link>,
    },
    {
      key: "/parkonic",
      icon: <PushpinOutlined />,
      label: t("sidebar.parkonic"),
    },
    { key: "/fines", icon: <DollarOutlined />, label: t("sidebar.fines") },
    { key: "/hrms", icon: <TeamOutlined />, label: t("sidebar.hrms") },
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

  const getSelectedKeys = () => {
    const path = location.pathname;
    for (const item of menuItems.flatMap((i) => i.children || i)) {
      if (path.startsWith(item.key)) {
        return [item.key];
      }
    }
    return ["/dashboard"];
  };

  const getDefaultOpenKeys = () => {
    const path = location.pathname;
    const parent = menuItems.find((item) =>
      item.children?.some((child: any) => path.startsWith(child.key)),
    );
    return parent ? [parent.key] : [];
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={250}
      className="app-sidebar"
    >
      <div className="sidebar-logo-container">
        <img
          src={
            collapsed
              ? "https://images.seeklogo.com/logo-png/4/2/dubai-roads-transport-authority-logo-png_seeklogo-44110.png"
              : "https://upload.wikimedia.org/wikipedia/en/d/dd/RTA_Dubai_logo.png"
          }
          alt="RTA Logo"
          className={`sidebar-logo ${collapsed ? "collapsed" : ""}`}
        />
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getDefaultOpenKeys()}
        items={menuItems}
        style={{ height: "calc(100% - 64px)", borderRight: 0 }}
      />
    </Sider>
  );
};

export default AppSidebar;
