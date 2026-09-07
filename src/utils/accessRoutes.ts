import { FULL_PATHS } from "../constants/paths";
import { canAccessAnyPermission, type MenuPermission, type PermissionRecordLike } from "./permissionUtils";

type RouteAccessConfig = {
  path: string;
  permission?: MenuPermission;
  landingEligible?: boolean;
};

const routeAccessConfigs: RouteAccessConfig[] = [
  { path: FULL_PATHS.DASHBOARD, permission: ["Dashboard", "WebDashboard"], landingEligible: true },
  { path: FULL_PATHS.HRMS, permission: "HRMS", landingEligible: true },
  { path: FULL_PATHS.LEAVE_MANGEMENT, permission: "Leave", landingEligible: true },
  { path: FULL_PATHS.GENERAL, permission: "GeneralSearch", landingEligible: true },
  { path: FULL_PATHS.WHITELIST_PLATES, permission: "WhiteListPlate", landingEligible: true },
  { path: FULL_PATHS.WHITELIST_TRADELICENSES, permission: ["WhitelistTradeLicense", "WhiteListTrade"], landingEligible: true },
  { path: FULL_PATHS.INSPECTIONS_OBSTACLES, permission: "InspectionObstacle", landingEligible: true },
  { path: FULL_PATHS.PLEDGES, permission: "Pledge", landingEligible: true },
  { path: FULL_PATHS.ROLE_MANAGEMENT, permission: "RolePermission", landingEligible: true },
  { path: FULL_PATHS.PARKONIC_LOCATION, permission: ["ParkonicsLocation", "ParkonicLocation"], landingEligible: true },
  { path: FULL_PATHS.FINES_VEHICLES, permission: "Inspection", landingEligible: true },
  { path: FULL_PATHS.FINES_PARKINGS, permission: "Inspection", landingEligible: true },
  { path: FULL_PATHS.FINES, permission: "Inspection", landingEligible: true },
  { path: FULL_PATHS.TRADE_LICENSE_INSPECTIONS, permission: "Inspection", landingEligible: true },
  { path: FULL_PATHS.PROACTIVECAMPAIGN, permission: "ProactiveCampaign", landingEligible: true },
  { path: FULL_PATHS.PARKONIC, permission: ["Parkonic", "trParkonics"], landingEligible: true },
  { path: FULL_PATHS.DISPUTE, permission: "Dispute", landingEligible: true },
  { path: FULL_PATHS.PARKING_DISPUTE, permission: "Dispute", landingEligible: true },
  { path: FULL_PATHS.TOWING, permission: "Towing", landingEligible: true },
  { path: FULL_PATHS.CRITERIA, permission: "CriteriaWeight", landingEligible: true },
  { path: FULL_PATHS.CRITERIA_GROUP, permission: "CriteriaGroup", landingEligible: true },
  { path: FULL_PATHS.TEAM_EVALUATION, permission: "TeamEvaluation", landingEligible: true },
  { path: FULL_PATHS.REPORTS, permission: ["Reports", "Report"], landingEligible: true },
  { path: FULL_PATHS.CREATESHIFTPLAN, permission: "CreateShift", landingEligible: true },
  { path: FULL_PATHS.ADHOCSHIFTPLAN, permission: "AdhocShift", landingEligible: true },
  { path: FULL_PATHS.SHIFT_MANAGEMENT, permission: "ShiftManagement", landingEligible: true },
  { path: FULL_PATHS.INSPECTION_MANAGEMENT, permission: "ShiftManagement", landingEligible: true },
  { path: FULL_PATHS.SHIFT_PLAN, permission: "ShiftPlanMaster", landingEligible: true },
  { path: FULL_PATHS.INBOX, landingEligible: true },
];

const normalizePath = (path: string): string => {
  if (!path) return FULL_PATHS.ROOT;
  if (path === FULL_PATHS.ROOT) return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

export const getRequiredPermissionForPath = (pathname: string): MenuPermission | undefined => {
  const normalizedPath = normalizePath(pathname);

  return routeAccessConfigs
    .filter((route) => route.permission && (normalizedPath === route.path || normalizedPath.startsWith(`${route.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0]?.permission;
};

export const getDefaultAuthorizedPath = (rolePermissions: PermissionRecordLike[] = []): string =>
  routeAccessConfigs.find((route) => {
    if (!route.landingEligible) return false;
    if (!route.permission) return true;
    return canAccessAnyPermission(rolePermissions, route.permission);
  })?.path ?? FULL_PATHS.FORBIDDEN;

export const canAccessPath = (rolePermissions: PermissionRecordLike[] = [], pathname: string): boolean => {
  const permission = getRequiredPermissionForPath(pathname);
  if (!permission) return true;
  return canAccessAnyPermission(rolePermissions, permission);
};
