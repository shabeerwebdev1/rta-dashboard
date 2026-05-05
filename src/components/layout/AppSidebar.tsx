/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState } from "react";
import { Image, Layout, Menu, MenuProps } from "antd";
import {
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
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
  CarFilled,
  WarningOutlined,
  IdcardOutlined,
  BookOutlined,
  SolutionOutlined,
  ControlOutlined,
  ApartmentOutlined,
  FileProtectOutlined,
  FileDoneOutlined,
  UserSwitchOutlined,
  SafetyCertificateOutlined,
  NotificationOutlined,
  TruckOutlined,
  ScheduleOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FULL_PATHS } from "../../constants/paths";
import { useAuth } from "../../contexts/AuthContext";
import { reports } from "../../config/pageConfigs/reportsConfig";
import { useSearchParams } from "react-router-dom";
import { useGetInboxSummaryQuery } from "../../services/rtkApiFactory";
import { useGetInboxSummaryMenuQuery } from "../../services/rtkApiFactory";

import { InboxOutlined } from "@ant-design/icons";

const { Sider } = Layout;

type RawItem = {
  key: string;
  icon?: React.ReactNode;
  labelText: React.ReactNode;
  permission?: string;
  children?: RawItem[];
};

const AppSidebar: React.FC<{ currentTheme?: string }> = ({ currentTheme = "corporateIndigo" }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { canAccessAny, hasRead } = useAuth();
  const [searchParams] = useSearchParams();

  // Helper function to get translated description
  const getTranslatedDescription = (report: any) => {
    if (report.descriptionKey) {
      return t(report.descriptionKey);
    }
    return report.description;
  };

  // Determine current language
  const currentLanguage = i18n.language === "ar" || i18n.language === "ar-SA" ? "Arabic" : "English";

  const { data: inboxSummary, isLoading } = useGetInboxSummaryQuery();
  const { data: inboxMenus = [], isLoading: inboxLoading } = useGetInboxSummaryMenuQuery();

  const inboxCount = inboxSummary?.data ?? 0;
  const totalInboxCount = inboxMenus.reduce((sum: number, item: any) => sum + (item.AW || 0), 0);

  // const sanitizeInboxTitle = (title?: string) => {
  //   if (!title) return "";

  //   let text = title.replace(/^Parking\s*-\s*/i, "").trim();

  //   if (/Parkonic\s*Fine\s*-\s*Dispute/i.test(text)) {
  //     text = "Parkonic Disputes";
  //   }

  //   return text;
  // };

  // Filter reports based on current language
  const filteredReports = useMemo(() => {
    return reports.filter((report) => report.language === currentLanguage);
  }, [currentLanguage]);

  const rawMenu: RawItem[] = [
    {
      key: FULL_PATHS.INBOX,
      icon: <InboxOutlined />,
      labelText: (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0 }}>{t("sidebar.inbox")}</span>
          <span style={{ color: "#ff4d4f", fontWeight: 600 }}>{inboxLoading ? 0 : totalInboxCount}</span>
        </div>
      ),

      children: [
        // DYNAMIC NOTIFICATION ITEMS
        ...inboxMenus.map((item: any) => ({
          key: `${FULL_PATHS.INBOX}?code=${item.NotificationCode}`,
          labelText: (
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 8 }}
            >
              {/* <span>{sanitizeInboxTitle(item.NotificationName)}</span> */}
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: "normal",
                  lineHeight: 1.3,
                  wordBreak: "break-word",
                }}
              >
                {item.NotificationName}
              </span>
              <span style={{ color: "#ff4d4f", fontWeight: 600 }}>{item.AW ?? 0}</span>
            </div>
          ),
        })),
      ],
    },

    {
      key: FULL_PATHS.DASHBOARD,
      icon: <DashboardOutlined />,
      labelText: t("sidebar.dashboard"),
      permission: "WebDashboard",
    },
    {
      key: FULL_PATHS.HRMS,
      icon: <IdcardOutlined />,
      labelText: t("sidebar.hrms"),
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
          key: "whitelist",
          icon: <FileProtectOutlined />,
          labelText: t("sidebar.whitelists"),
          permission: "WhiteListPlate",
          children: [
            {
              key: FULL_PATHS.WHITELIST_PLATES,
              icon: <CarOutlined />,
              labelText: t("sidebar.whitelistPlates"),
              permission: "WhiteListPlate",
            },
            {
              key: FULL_PATHS.WHITELIST_TRADELICENSES,
              icon: <SolutionOutlined />,
              labelText: t("sidebar.whitelistTradeLicenses"),
              permission: "WhitelistTradeLicense",
            },
          ],
        },
        {
          key: FULL_PATHS.INSPECTIONS_OBSTACLES,
          icon: <WarningOutlined />,
          labelText: t("sidebar.inspectionsObstacles"),
          permission: "InspectionObstacle",
        },
        {
          key: FULL_PATHS.PLEDGES,
          icon: <FileDoneOutlined />,
          labelText: t("sidebar.pledges"),
          permission: "Pledge",
        },
        {
          key: FULL_PATHS.LEAVE_MANGEMENT,
          icon: <UserSwitchOutlined />,
          labelText: t("sidebar.leaves"),
          permission: "Leave",
        },
        {
          key: FULL_PATHS.ROLE_MANAGEMENT,
          icon: <SafetyCertificateOutlined />,
          labelText: t("sidebar.roles"),
          permission: "RolePermission",
        },
        {
          key: FULL_PATHS.PARKONIC_LOCATION,
          icon: <EnvironmentOutlined />,
          labelText: t("sidebar.parkonicLocations"),
          permission: "ParkonicsLocation",
        },
      ],
    },
    {
      key: "inspections",
      icon: <SearchOutlined />,
      labelText: t("sidebar.inspections"),
      children: [
        {
          key: FULL_PATHS.FINES,
          icon: <CarFilled />,
          labelText: t("sidebar.Vehicle"),
          permission: "Inspection",
        },
        {
          key: FULL_PATHS.TRADE_LICENSE_INSPECTIONS,
          icon: <EnvironmentOutlined />,
          labelText: t("sidebar.Parkings"),
          permission: "Inspection",
        },
        {
          key: FULL_PATHS.PROACTIVECAMPAIGN,
          icon: <NotificationOutlined />,
          labelText: t("sidebar.proactivecampaigns"),
          permission: "Inspection",
        },
      ],
    },
    {
      key: FULL_PATHS.FINES,
      icon: <WarningOutlined />,
      labelText: t("sidebar.fines"),
      children: [
        {
          key: FULL_PATHS.PARKONIC,
          icon: <PushpinOutlined />,
          labelText: t("sidebar.parkonic"),
          permission: "Parkonic",
        },
        {
          key: FULL_PATHS.FINES_VEHICLES,
          icon: <CarFilled />,
          labelText: t("sidebar.Vehicle"),
          permission: "Inspection",
        },
        {
          key: FULL_PATHS.FINES_PARKINGS,
          icon: <EnvironmentOutlined />,
          labelText: t("sidebar.Parkings"),
          permission: "Inspection",
        },
      ],
    },
    {
      key: "Diputes",
      icon: <ExclamationCircleOutlined />,
      labelText: t("sidebar.dispute"),
      children: [
        {
          key: FULL_PATHS.DISPUTE,
          icon: <CarFilled />,
          labelText: t("sidebar.Vehicle"),
          permission: "Dispute",
        },
        {
          key: FULL_PATHS.PARKING_DISPUTE,
          icon: <EnvironmentOutlined />,
          labelText: t("sidebar.Parkings"),
          permission: "Dispute",
        },
      ],
    },
    // {
    //   key: FULL_PATHS.DISPUTE,
    //   icon: <ExclamationCircleOutlined />,
    //   labelText: t("sidebar.dispute"),
    //   permission: "Dispute",
    // },
    {
      key: FULL_PATHS.TOWING,
      icon: <TruckOutlined />,
      labelText: t("sidebar.towing"),
      permission: "Towing",
    },
    {
      key: "team-assessment-group",
      icon: <TeamOutlined />,
      labelText: t("sidebar.teamEvaluation"),
      children: [
        {
          key: FULL_PATHS.CRITERIA,
          icon: <ControlOutlined />,
          labelText: t("sidebar.Criteria&Weights"),
          permission: "CallIntegration",
        },
        {
          key: FULL_PATHS.CRITERIA_GROUP,
          icon: <ApartmentOutlined />,
          labelText: t("sidebar.criteriaGroup"),
          permission: "CallIntegration",
        },
        {
          key: FULL_PATHS.TEAM_EVALUATION,
          icon: <AuditOutlined />,
          labelText: t("sidebar.evaluate"),
          permission: "CallIntegration",
        },
        // {
        //   key: FULL_PATHS.TEAM_TRAINING,
        //   icon: <UsergroupAddOutlined />,
        //   labelText: t("sidebar.training"),
        //   permission: "CallIntegration",
        // },
      ],
    },
    // Reports as parent with filtered reports based on languagep
    {
      key: "reports",
      icon: <BarChartOutlined />,
      labelText: t("sidebar.reports"),
      permission: "WebDashboard",
      children: filteredReports.map((report) => ({
        key: `${FULL_PATHS.REPORTS}?report=${report.key}`,
        icon: <FileTextOutlined />,
        labelText: getTranslatedDescription(report),
        permission: "WebDashboard",
      })),
    },
    {
      key: "shiftplanning",
      icon: <ScheduleOutlined />,
      labelText: t("sidebar.shiftplanning"),
      children: [
        {
          key: FULL_PATHS.CREATESHIFTPLAN,
          icon: <PlusCircleOutlined />,
          labelText: t("sidebar.createshiftplan"),
          permission: "CreateShift",
        },
        {
          key: FULL_PATHS.ADHOCSHIFTPLAN,
          icon: <ClockCircleOutlined />,
          labelText: t("sidebar.adhocshiftplan"),
          permission: "AdhocShift",
        },
        {
          key: FULL_PATHS.SHIFT_MANAGEMENT,
          icon: <ControlOutlined />,
          labelText: t("sidebar.shiftmanagement"),
          permission: "ShiftManagement",
        },
        {
          key: FULL_PATHS.INSPECTION_MANAGEMENT,
          icon: <AuditOutlined />,
          labelText: t("sidebar.inspectionmanagement"),
          permission: "ShiftManagement",
        },
        // {
        //   key: FULL_PATHS.SHIFT_PLAN,
        //   icon: <AuditOutlined />,
        //   labelText: t("sidebar.shiftplan"),
        //   permission: "ShiftManagement",
        // },
      ],
    },
  ];

  // Apply permission logic
  const applyPermissions = (items: RawItem[]): RawItem[] =>
    items
      .map((it) => {
        if (it.children && it.children.length > 0) {
          const visibleChildren = applyPermissions(it.children);

          // Parent with no permission → allow if children exist
          if (!it.permission) {
            if (visibleChildren.length > 0) return { ...it, children: visibleChildren };
            return it;
          }

          const parentAllowed = hasRead ? hasRead(it.permission) : false;

          if (parentAllowed) return { ...it, children: visibleChildren };
          if (visibleChildren.length > 0) return { ...it, children: visibleChildren };

          return null;
        }

        // Leaf items
        if (!it.permission) return it;

        const allowed = canAccessAny ? canAccessAny(it.permission) : false;
        return allowed ? it : null;
      })
      .filter(Boolean) as RawItem[];

  const permApplied = useMemo(
    () => applyPermissions(rawMenu),
    [rawMenu, canAccessAny, hasRead, filteredReports, inboxCount, isLoading],
  );

  // Transform to Antd Menu items (disable visually without changing color)
  const transformToAntd = (items: RawItem[]): MenuProps["items"] =>
    items.map((i) => ({
      key: i.key,
      icon: i.icon,
      label: i.children || !i.key.startsWith("/") ? i.labelText : <Link to={i.key}>{i.labelText}</Link>,
      children: i.children ? transformToAntd(i.children) : undefined,
    }));

  const menuItems = useMemo(() => transformToAntd(permApplied), [permApplied]);

  const getSelectedKeys = () => {
    const path = location.pathname;
    const search = location.search;
    const fullPath = path + search;

    const currentReportParam = searchParams.get("report");
    const currentCodeParam = searchParams.get("code");
    const lang = i18n.language === "ar" ? "arb" : "eng";

    const flatten = (items: any[]): any[] => items.flatMap((item) => (item.children ? flatten(item.children) : [item]));
    const flatItems = flatten(menuItems as any[]);

    // Inbox: always return parent key (with or without ?code=)
    if (path === FULL_PATHS.INBOX) {
      if (currentCodeParam) {
        const targetKey = `${FULL_PATHS.INBOX}?code=${currentCodeParam}`;
        const match = flatItems.find((item) => item.key === targetKey);
        if (match) return [match.key]; // highlight the child
      }
      return [FULL_PATHS.INBOX]; // highlight the parent
    }

    // Reports match
    if (path === FULL_PATHS.REPORTS && currentReportParam) {
      const base = currentReportParam.replace(/(_eng|_arb)$/, "");
      const targetKey = `${FULL_PATHS.REPORTS}?report=${base}_${lang}`;
      const match = flatItems.find((item) => item.key === targetKey);
      if (match) return [match.key];
    }

    // Normal exact match
    const exactMatch = flatItems.find((item) => String(item.key) === fullPath);
    if (exactMatch) return [exactMatch.key];

    // Fallback by path-only
    let bestMatch = "";
    for (const item of flatItems) {
      const itemKey = String(item.key);
      const itemPath = itemKey.split("?")[0];
      if (path.startsWith(itemPath) && itemPath.length > bestMatch.length) {
        bestMatch = itemKey;
      }
    }

    return [bestMatch || FULL_PATHS.DASHBOARD];
  };
  const getDefaultOpenKeys = () => {
    const path = location.pathname;
    const search = location.search;
    const fullPath = path + search;

    const openKeys: string[] = [];
    const findParents = (items: any[], currentPath: string, currentFullPath: string) => {
      for (const item of items) {
        if (item.children) {
          // Check if any child matches the current full path (for reports with query params)
          const hasMatchingChild = item.children.some((c: any) => {
            const childKey = String(c.key);
            return childKey === currentFullPath || currentPath.startsWith(childKey.split("?")[0]);
          });

          if (hasMatchingChild) {
            openKeys.push(item.key);
            findParents(item.children, currentPath, currentFullPath);
          }
        }
      }
    };
    findParents(menuItems as any[], path, fullPath);
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
