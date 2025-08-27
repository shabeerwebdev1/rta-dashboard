import { useState } from "react";
import { Layout, Menu, MenuProps } from "antd";
import {
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  PushpinOutlined,
  DashboardOutlined,
  AuditOutlined,
  LinkOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FULL_PATHS } from "../../constants/paths";

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems: MenuProps["items"] = [
    {
      key: FULL_PATHS.DASHBOARD,
      icon: <DashboardOutlined />,
      label: <Link to={FULL_PATHS.DASHBOARD}>{t("sidebar.dashboard")}</Link>,
    },
    {
      key: FULL_PATHS.GENERAL,
      icon: <SearchOutlined />,
      label: <Link to={FULL_PATHS.GENERAL}>{t("sidebar.general")}</Link>,
    },
    {
      key: "configuration",
      icon: <SettingOutlined />,
      label: "Configuration",
      children: [
        {
          key: FULL_PATHS.WHITELIST,
          icon: <FileTextOutlined />,
          label: <Link to={FULL_PATHS.WHITELIST_PLATES}>{t("sidebar.whitelist")}</Link>,
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
          key: FULL_PATHS.PARKONIC,
          icon: <PushpinOutlined />,
          label: <Link to={FULL_PATHS.PARKONIC}>{t("sidebar.parkonic")}</Link>,
        },
        {
          key: FULL_PATHS.FINES,
          icon: <DollarOutlined />,
          label: <Link to={FULL_PATHS.FINES}>{t("sidebar.fines")}</Link>,
        },
        {
          key: FULL_PATHS.DISPUTE,
          icon: <ExclamationCircleOutlined />,
          label: <Link to={FULL_PATHS.DISPUTE}>{t("sidebar.dispute")}</Link>,
        },
      ],
    },
    { key: FULL_PATHS.HRMS, icon: <TeamOutlined />, label: t("sidebar.hrms") },
    { key: FULL_PATHS.TOWING, icon: <CarOutlined />, label: t("sidebar.towing") },
    { key: FULL_PATHS.TEAM, icon: <UsergroupAddOutlined />, label: t("sidebar.team") },
    {
      key: FULL_PATHS.ANALYTICS,
      icon: <BarChartOutlined />,
      label: <Link to={FULL_PATHS.ANALYTICS}>{t("sidebar.analytics")}</Link>,
    },
    { 
      key: FULL_PATHS.ZONELINKING, 
      icon: <LinkOutlined />, 
      label: <Link to={FULL_PATHS.ZONELINKING}>{t("sidebar.zonelinking")}</Link>,
    },
    { 
      key: FULL_PATHS.SHIFTPLANNING, 
      icon: <AuditOutlined />,
      label: <Link to={FULL_PATHS.SHIFTPLANNING}>{t("sidebar.shiftplanning")}</Link>,
    },
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    let bestMatch = "";
    const flattenItems = (items: any[]): any[] => {
      let flat: any[] = [];
      items.forEach((item) => {
        if (item.children) {
          flat = flat.concat(flattenItems(item.children));
        } else {
          flat.push(item);
        }
      });
      return flat;
    };
    for (const item of flattenItems(menuItems as any[])) {
      if (path.startsWith(item.key) && item.key.length > bestMatch.length) {
        bestMatch = item.key;
      }
    }
    return [bestMatch || FULL_PATHS.DASHBOARD];
  };

  const getDefaultOpenKeys = () => {
    const path = location.pathname;
    const openKeys: string[] = [];

    const findParents = (items: any[], currentPath: string) => {
      for (const item of items) {
        if (item.children) {
          if (item.children.some((child: any) => currentPath.startsWith(child.key))) {
            openKeys.push(item.key);
            findParents(item.children, currentPath);
          }
        }
      }
    };

    findParents(menuItems as any[], path);
    return openKeys;
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