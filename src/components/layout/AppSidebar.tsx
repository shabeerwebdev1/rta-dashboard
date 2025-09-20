import { useMemo, useState } from "react";
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
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FULL_PATHS } from "../../constants/paths";
import { useAuth } from "../../contexts/AuthContext";

const { Sider } = Layout;

type RawItem = {
  key: string;
  icon?: React.ReactNode;
  labelText: string;
  permission?: string;
  children?: RawItem[];
};

const AppSidebar: React.FC<{ currentTheme?: string }> = ({ currentTheme = "corporateIndigo" }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { canAccessAny, hasRead } = useAuth();

  const rawMenu: RawItem[] = [
    {
      key: FULL_PATHS.DASHBOARD,
      icon: <DashboardOutlined />,
      labelText: t("sidebar.dashboard"),
      permission: "WebDashboard",
    },
    {
      key: FULL_PATHS.GENERAL,
      icon: <SearchOutlined />,
      labelText: t("sidebar.general"),
      permission: "Vlookups",
    },
    {
      key: "configuration",
      icon: <SettingOutlined />,
      labelText: t("sidebar.management"),
      children: [
        {
          key: FULL_PATHS.WHITELIST_PLATES,
          icon: <FileTextOutlined />,
          labelText: t("sidebar.whitelists"),
          permission: "WhiteListPlate",
        },
        {
          key: FULL_PATHS.INSPECTIONS_OBSTACLES,
          icon: <SearchOutlined />,
          labelText: t("sidebar.inspectionsObstacles"),
          permission: "InspectionObstacle",
        },
        {
          key: FULL_PATHS.PLEDGES,
          icon: <AuditOutlined />,
          labelText: t("sidebar.pledges"),
          permission: "Pledge",
        },
        {
          key: FULL_PATHS.LEAVE_MANGEMENT,
          icon: <TeamOutlined />,
          labelText: t("sidebar.leaves"),
          permission: "Leave",
        },
        {
          key: FULL_PATHS.ROLE_MANAGEMENT,
          icon: <LinkOutlined />,
          labelText: t("sidebar.roles"),
          permission: "RolePermission",
        },
        {
          key: FULL_PATHS.PARKONIC_LOCATION,
          icon: <EnvironmentOutlined />,
          labelText: t("sidebar.parkonicLocation"),
          permission: "RolePermission",
        },
      ],
    },
    {
      key: "inspections",
      icon: <SearchOutlined />,
      labelText: t("sidebar.inspections"),
      children: [
        {
          key: FULL_PATHS.PARKONIC,
          icon: <PushpinOutlined />,
          labelText: t("sidebar.parkonic"),
          permission: "Parkonic",
        },
        {
          key: FULL_PATHS.FINES,
          icon: <DollarOutlined />,
          labelText: t("sidebar.carplate"),
          permission: "Inspection",
        },
        {
          key: FULL_PATHS.TRADE_LICENSE_INSPECTIONS,
          icon: <FileTextOutlined />,
          labelText: t("sidebar.tradeLicense"),
          permission: "Inspection",
        },
      ],
    },
    {
      key: FULL_PATHS.DISPUTE,
      icon: <ExclamationCircleOutlined />,
      labelText: t("sidebar.dispute"),
      permission: "Dispute",
    },
    {
      key: FULL_PATHS.TOWING,
      icon: <CarOutlined />,
      labelText: t("sidebar.towing"),
      permission: "AdhocShift",
    },
    {
      key: "team-assessment-group",
      icon: <UsergroupAddOutlined />,
      labelText: t("sidebar.traningAndEvaluation"),
      children: [
        {
          key: FULL_PATHS.TEAM_EVALUATION,
          icon: <UsergroupAddOutlined />,
          labelText: t("sidebar.teamEvaluation"),
          permission: "CallIntegration",
        },
        {
          key: FULL_PATHS.TEAM_TRAINING,
          icon: <UsergroupAddOutlined />,
          labelText: t("sidebar.training"),
          permission: "CallIntegration",
        },
      ],
    },
    {
      key: FULL_PATHS.ANALYTICS,
      icon: <BarChartOutlined />,
      labelText: t("sidebar.analytics"),
      permission: "WebDashboard",
    },
    {
      key: "shiftplanning",
      icon: <AuditOutlined />,
      labelText: t("sidebar.shiftplanning"),
      children: [
        {
          key: FULL_PATHS.CREATESHIFTPLAN,
          icon: <AuditOutlined />,
          labelText: t("sidebar.createshiftplan"),
          permission: "CreateShift",
        },
        {
          key: FULL_PATHS.ADHOCSHIFTPLAN,
          icon: <AuditOutlined />,
          labelText: t("sidebar.adhocshiftplan"),
          permission: "AdhocShift",
        },
        {
          key: FULL_PATHS.SHIFT_MANAGEMENT,
          icon: <AuditOutlined />,
          labelText: t("sidebar.shiftmanagement"),
          permission: "ShiftManagement",
        },
      ],
    },
  ];

  // Apply permission logic
  const applyPermissions = (items: RawItem[]): any[] =>
    items.map((it) => {
      if (it.children && it.children.length > 0) {
        const processedChildren = applyPermissions(it.children);
        const parentHasRead = it.permission ? hasRead(it.permission) : false;
        const someChildEnabled = processedChildren.some((c: any) => !c.disabled);

        if (parentHasRead) {
          const forcedChildren = processedChildren.map((c: any) => ({ ...c, disabled: false }));
          return { ...it, children: forcedChildren, disabled: false };
        }

        return { ...it, children: processedChildren, disabled: !someChildEnabled };
      }

      const allowed = it.permission ? canAccessAny(it.permission) : false;
      return { ...it, disabled: !allowed };
    });

  const permApplied = useMemo(() => applyPermissions(rawMenu), [rawMenu, canAccessAny, hasRead]);

  // Transform to Antd Menu items (disable visually without changing color)
  const transformToAntd = (items: any[]): MenuProps["items"] =>
    items.map((i) => {
      const labelNode = i.children ? (
        i.labelText
      ) : (
        <Link
          to={i.disabled ? "#" : i.key}
          onClick={(e) => i.disabled && e.preventDefault()}
          style={{
            cursor: i.disabled ? "not-allowed" : "pointer",
            color: "inherit",
          }}
        >
          {i.labelText}
        </Link>
      );

      return {
        key: i.key,
        icon: i.icon,
        label: labelNode,
        disabled: false,
        children: i.children ? transformToAntd(i.children) : undefined,
      };
    });

  const menuItems = useMemo(() => transformToAntd(permApplied), [permApplied]);

  const getSelectedKeys = () => {
    const path = location.pathname;
    let bestMatch = "";
    const flatten = (items: any[]): any[] => items.flatMap((item) => (item.children ? flatten(item.children) : [item]));
    for (const item of flatten(menuItems as any[])) {
      if (path.startsWith(String(item.key)) && String(item.key).length > bestMatch.length) {
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
          if (item.children.some((c: any) => currentPath.startsWith(String(c.key)))) {
            openKeys.push(item.key);
            findParents(item.children, currentPath);
          }
        }
      }
    };
    findParents(menuItems as any[], path);
    return openKeys;
  };

  const getLogoPaths = (theme: string) => {
    switch (theme) {
      case "corporateRed":
        return { full: "/images/redlogo.png", mini: "/images/rta_logo_mini.png" };
      default:
        return { full: "/images/rta_logo_full.png", mini: "/images/rta_logo_mini.png" };
    }
  };
  const logosPaths = getLogoPaths(currentTheme);

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={250} className="app-sidebar">
      <div className="sidebar-logo-container">
        <div className={`logo-wrapper ${collapsed ? "hidden" : "visible"}`}>
          <Image src={logosPaths.full} alt="Full Logo" preview={false} style={{ height: 58, width: "auto" }} />
        </div>
        <div className={`logo-wrapper ${collapsed ? "visible" : "hidden"}`}>
          <Image src={logosPaths.mini} alt="Mini Logo" preview={false} style={{ height: 72, width: "auto" }} />
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
