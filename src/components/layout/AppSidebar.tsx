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
import { FULL_PATHS } from "../../constants/paths";

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems: Array<{
    key: string;
    icon: React.ReactNode;
    label: React.ReactNode;
    children?: Array<{ key: string; label: React.ReactNode }>;
  }> = [
    {
      key: FULL_PATHS.DASHBOARD,
      icon: <DashboardOutlined />,
      label: <Link to={FULL_PATHS.DASHBOARD}>{t("sidebar.dashboard")}</Link>,
    },
    {
      key: "whitelist",
      icon: <FileTextOutlined />,
      label: t("sidebar.whitelist"),
      children: [
        {
          key: FULL_PATHS.WHITELIST_PLATES,
          label: <Link to={FULL_PATHS.WHITELIST_PLATES}>{t("sidebar.plates")}</Link>,
        },
        {
          key: FULL_PATHS.WHITELIST_TRADELICENSES,
          label: <Link to={FULL_PATHS.WHITELIST_TRADELICENSES}>{t("sidebar.tradelicenses")}</Link>,
        },
      ],
    },
    {
      key: FULL_PATHS.INSPECTIONS,
      icon: <SearchOutlined />,
      label: <Link to={FULL_PATHS.INSPECTIONS}>{t("sidebar.inspections")}</Link>,
    },
    {
      key: FULL_PATHS.PLEDGES,
      icon: <AuditOutlined />,
      label: <Link to={FULL_PATHS.PLEDGES}>{t("sidebar.pledges")}</Link>,
    },
    {
      key: FULL_PATHS.PERMITS,
      icon: <IdcardOutlined />,
      label: <Link to={FULL_PATHS.PERMITS}>{t("sidebar.permits")}</Link>,
    },
    {
      key: FULL_PATHS.PARKONIC,
      icon: <PushpinOutlined />,
      label: t("sidebar.parkonic"),
    },
    { key: FULL_PATHS.FINES, icon: <DollarOutlined />, label: t("sidebar.fines") },
    { key: FULL_PATHS.HRMS, icon: <TeamOutlined />, label: t("sidebar.hrms") },
    {
      key: FULL_PATHS.DISPUTE,
      icon: <ExclamationCircleOutlined />,
      label: t("sidebar.dispute"),
    },
    { key: FULL_PATHS.TOWING, icon: <CarOutlined />, label: t("sidebar.towing") },
    { key: FULL_PATHS.TEAM, icon: <UsergroupAddOutlined />, label: t("sidebar.team") },
    {
      key: FULL_PATHS.ANALYTICS,
      icon: <BarChartOutlined />,
      label: t("sidebar.analytics"),
    },
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    // find the most specific match
    let bestMatch = FULL_PATHS.DASHBOARD;
    for (const item of menuItems.flatMap((i) => i.children || i)) {
      if (path.startsWith(item.key) && item.key.length > bestMatch.length) {
        bestMatch = item.key;
      }
    }
    return [bestMatch];
  };

  const getDefaultOpenKeys = () => {
    const path = location.pathname;
    const parent = menuItems.find((item) =>
      item.children?.some((child) => path.startsWith(child.key)),
    );
    return parent ? [parent.key] : [];
  };

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={250} className="app-sidebar">
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
