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
  SwapOutlined,
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
          key: "/whitelist/plate",
          icon: <CarOutlined />,
          label: <Link to="/whitelist/plate">{t("sidebar.addPlate")}</Link>,
        },
        {
          key: "/whitelist/trade",
          icon: <SwapOutlined />,
          label: <Link to="/whitelist/trade">{t("sidebar.addtrade")}</Link>,
        },
      ],
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
      key: "/parking",
      icon: <PushpinOutlined />,
      label: <Link to="/parking">{t("sidebar.parking")}</Link>,
    },
    {
      key: "/fleet",
      icon: <CarOutlined />,
      label: <Link to="/fleet">{t("sidebar.fleet")}</Link>,
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
      key: "/fines",
      icon: <DollarOutlined />,
      label: <Link to="/fines">{t("sidebar.fines")}</Link>,
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

  // Recursively find the selected key for active menu item
  const findSelectedKey = (
    items: MenuItem[],
    path: string
  ): string | undefined => {
    for (const item of items) {
      if (item.children) {
        const childKey = findSelectedKey(item.children, path);
        if (childKey) return childKey;
      } else if (path.startsWith(item.key)) {
        return item.key;
      }
    }
    return undefined;
  };

  // Find the parent open key if a child is active
  const getOpenKey = (items: MenuItem[], path: string): string | undefined => {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          if (path.startsWith(child.key)) {
            return item.key;
          }
        }
      }
    }
    return undefined;
  };

  const selectedKey =
    findSelectedKey(menuItems, location.pathname) || "/dashboard";
  const openKey = getOpenKey(menuItems, location.pathname);

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
        }}
      >
        {collapsed ? (
          <img
            src="https://images.seeklogo.com/logo-png/4/2/dubai-roads-transport-authority-logo-png_seeklogo-44110.png"
            alt="RTA Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transition: "all 0.2s",
            }}
          />
        ) : (
          <img
            src="https://upload.wikimedia.org/wikipedia/en/archive/d/dd/20230611035551%21RTA_Dubai_logo.png"
            alt="RTA Logo"
            style={{
              width: "100%",
              transition: "all 0.2s",
              backgroundColor: "white",
              padding: "2px",
              objectFit: "cover",
            }}
          />
        )}
      </div>
      <Menu
        style={{ height: "calc(100% - 64px)", marginTop: 20, borderRight: 0 }}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKey ? [openKey] : []}
        mode="inline"
        items={menuItems}
      />
    </Sider>
  );
};

export default AppSidebar;
