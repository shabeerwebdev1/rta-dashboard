import { useState } from "react";
import { Image, Layout, Menu, MenuProps } from "antd";
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
  SettingOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FULL_PATHS } from "../../constants/paths";

const { Sider } = Layout;

interface AppSidebarProps {
  currentTheme?: string; // Add theme prop
}

const AppSidebar: React.FC<AppSidebarProps> = ({ currentTheme = "corporateIndigo" }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  // Function to get logo paths based on theme
  const getLogoPaths = (theme: string) => {
    switch (theme) {
      case "corporateRed":
        return {
          full: "/images/redlogo.png",
          mini: "/images/rta_logo_mini.png",
        };
      default:
        return {
          full: "/images/rta_logo_full.png",
          mini: "/images/rta_logo_mini.png",
        };
    }
  };

  const logosPaths = getLogoPaths(currentTheme);

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
      label: t("sidebar.configuration"),
      children: [
        {
          key: FULL_PATHS.WHITELIST_PLATES,
          icon: <FileTextOutlined />,
          label: <Link to={FULL_PATHS.WHITELIST_PLATES}>{t("sidebar.whitelist")}</Link>,
        },
        {
          key: FULL_PATHS.INSPECTIONS_OBSTACLES,
          icon: <SearchOutlined />,
          label: <Link to={FULL_PATHS.INSPECTIONS_OBSTACLES}>{t("sidebar.inspectionsObstacles")}</Link>,
        },
        {
          key: FULL_PATHS.PLEDGES,
          icon: <AuditOutlined />,
          label: <Link to={FULL_PATHS.PLEDGES}>{t("sidebar.pledges")}</Link>,
        },
        {
          key: FULL_PATHS.LEAVE_MANGEMENT,
          icon: <TeamOutlined />,
          label: <Link to={FULL_PATHS.LEAVE_MANGEMENT}>{t("sidebar.leaveManagement")}</Link>,
        },
      ],
    },
    {
      key: "inspections",
      icon: <SearchOutlined />,
      label: t("sidebar.inspections"),
      children: [
        {
          key: FULL_PATHS.PARKONIC,
          icon: <PushpinOutlined />,
          label: <Link to={FULL_PATHS.PARKONIC}>{t("sidebar.parkonic")}</Link>,
        },
        {
          key: FULL_PATHS.FINES,
          icon: <DollarOutlined />,
          label: <Link to={FULL_PATHS.FINES}>{t("sidebar.inspectionmanagement")}</Link>,
        },
      ],
    },
    {
      key: FULL_PATHS.DISPUTE,
      icon: <ExclamationCircleOutlined />,
      label: <Link to={FULL_PATHS.DISPUTE}>{t("sidebar.dispute")}</Link>,
    },
    { key: FULL_PATHS.TOWING, icon: <CarOutlined />, label: <Link to={FULL_PATHS.TOWING}>{t("sidebar.towing")}</Link> },
    {
      key: "team-assessment-group", // group only, not a path
      icon: <UsergroupAddOutlined />,
      label: t("sidebar.traningAndEvaluation"),
      children: [
        {
          key: FULL_PATHS.TEAM_EVALUATION,
          icon: <UsergroupAddOutlined />,
          label: <Link to={FULL_PATHS.TEAM_EVALUATION}>{t("sidebar.teamEvaluation")}</Link>,
        },
        {
          key: FULL_PATHS.TEAM_TRAINING,
          icon: <UsergroupAddOutlined />,
          label: <Link to={FULL_PATHS.TEAM_TRAINING}>{t("sidebar.training")}</Link>,
        },
      ],
    },

    {
      key: FULL_PATHS.ANALYTICS,
      icon: <BarChartOutlined />,
      label: <Link to={FULL_PATHS.ANALYTICS}>{t("sidebar.analytics")}</Link>,
    },

    {
      key: "shiftplanning",
      icon: <AuditOutlined />,
      label: t("sidebar.shiftplanning"),
      children: [
        {
          key: FULL_PATHS.CREATESHIFTPLAN,
          icon: <AuditOutlined />,
          label: <Link to={FULL_PATHS.CREATESHIFTPLAN}>{t("sidebar.createshiftplan")}</Link>,
        },
        {
          key: FULL_PATHS.ADHOCSHIFTPLAN,
          icon: <AuditOutlined />,
          label: <Link to={FULL_PATHS.ADHOCSHIFTPLAN}>{t("sidebar.adhocshiftplan")}</Link>,
        },
        {
          key: FULL_PATHS.SHIFT_MANAGEMENT,
          icon: <AuditOutlined />,
          label: <Link to={FULL_PATHS.SHIFT_MANAGEMENT}>{t("sidebar.shiftmanagement")}</Link>,
        },
      ],
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
        <div className={`logo-wrapper ${collapsed ? "hidden" : "visible"}`}>
          <Image
            src={logosPaths.full}
            alt="Full Logo"
            preview={false}
            style={{ height: 58, width: "auto", objectFit: "contain" }}
          />
        </div>
        <div className={`logo-wrapper ${collapsed ? "visible" : "hidden"}`}>
          <Image
            src={logosPaths.mini}
            alt="Mini Logo"
            preview={false}
            style={{ height: 72, width: "auto", objectFit: "contain" }}
          />
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getDefaultOpenKeys()}
        items={menuItems}
        style={{ height: "calc(100% - 80px)", overflowY: "auto", borderRight: 0 }}
      />
    </Sider>
  );
};

export default AppSidebar;
