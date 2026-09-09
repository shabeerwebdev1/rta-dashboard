export interface PermissionRecordLike {
  menuName: string;
  canCreate: number;
  canRead: number;
  canUpdate: number;
  canDelete: number;
}

export type MenuPermission = string | string[];
export type PermissionAction = "create" | "read" | "update" | "delete";

const permissionAliases: Record<string, string[]> = {
  dashboard: ["Dashboard", "WebDashboard"],
  webdashboard: ["WebDashboard", "Dashboard"],
  report: ["Report"],
  reports: ["Reports"],
  vlookups: ["Vlookups", "GeneralSearch"],
  generalsearch: ["GeneralSearch"],
  whitelisttrade: ["WhiteListTrade", "WhitelistTradeLicense"],
  whitelisttradelicense: ["WhitelistTradeLicense", "WhiteListTrade"],
  parkonic: ["Parkonic", "trParkonics"],
  trparkonics: ["trParkonics", "Parkonic"],
  parkoniclocation: ["ParkonicLocation", "ParkonicsLocation"],
  parkonicslocation: ["ParkonicsLocation", "ParkonicLocation"],
  proactivecampaign: ["ProactiveCampaign"],
  permit: ["Permit", "Permits", "PermitSearch"],
  permits: ["Permit", "Permits", "PermitSearch"],
  permitsearch: ["PermitSearch", "Permit", "Permits"],
};

export const resolvePermissionNames = (menuName: MenuPermission): string[] => {
  const names = Array.isArray(menuName) ? menuName : [menuName];

  return Array.from(
    new Set(
      names.flatMap((name) => {
        const aliases = permissionAliases[name.toLowerCase()];
        return aliases ?? [name];
      }),
    ),
  );
};

export const getMatchingPermissions = (
  rolePermissions: PermissionRecordLike[] = [],
  menuName: MenuPermission,
): PermissionRecordLike[] => {
  const allowedNames = new Set(resolvePermissionNames(menuName).map((name) => name.toLowerCase()));
  return rolePermissions.filter((perm) => allowedNames.has(perm.menuName.toLowerCase()));
};

export const hasPermissionAccess = (
  rolePermissions: PermissionRecordLike[] = [],
  menuName: MenuPermission,
  permission: PermissionAction,
): boolean => {
  const permissionEntries = getMatchingPermissions(rolePermissions, menuName);

  switch (permission) {
    case "create":
      return permissionEntries.some((perm) => perm.canCreate === 1);
    case "read":
      return permissionEntries.some((perm) => perm.canRead === 1);
    case "update":
      return permissionEntries.some((perm) => perm.canUpdate === 1);
    case "delete":
      return permissionEntries.some((perm) => perm.canDelete === 1);
    default:
      return false;
  }
};

export const canAccessAnyPermission = (
  rolePermissions: PermissionRecordLike[] = [],
  menuName: MenuPermission,
): boolean =>
  getMatchingPermissions(rolePermissions, menuName).some(
    (perm) => perm.canCreate === 1 || perm.canRead === 1 || perm.canUpdate === 1 || perm.canDelete === 1,
  );
