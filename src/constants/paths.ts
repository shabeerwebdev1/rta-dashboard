export const PATHS = {
  LOGIN: "login",
  DASHBOARD: "dashboard",
  SPLASH: "splash",
  PERMITS: "permits",

  // --- Whitelist section ---
  WHITELIST: "whitelist",
  PLATES: "plates",
  TRADELICENSES: "tradelicenses",
  INSPECTIONS_OBSTACLES: "inspections-obstacles", // ✅ nested under whitelist

  PLEDGES: "pledges",
  INSPECTIONS: "inspections",
  FINES: "fines",
  PARKONIC: "parkonic",
  DISPUTE: "dispute",
  GENERAL: "general",

  INSPECTOR_MANAGEMENT: "inspector-management",
  SUPERVISROR_MANGEMENT: "supervisor-management",
  LEAVE_MANGEMENT: "leave-management",
  SHIFTPLANNING: "shiftplanning", // ✅ lowercase
  ANALYTICS: "analytics",
  TOWING: "towing",

  TEAM_EVALUATION: "team-assessment",
  TEAM_TRAINING: "team-assessment",
};

export const FULL_PATHS = {
  ROOT: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SPLASH: "/splash",
  PERMITS: "/permits",
  GENERAL: "/general",

  // --- Whitelist section ---
  WHITELIST: "/whitelist",
  WHITELIST_PLATES: "/whitelist/plates",
  WHITELIST_TRADELICENSES: "/whitelist/tradelicenses",
  INSPECTIONS_OBSTACLES: "/whitelist/inspections-obstacles", // ✅ fixed nesting

  PLEDGES: "/pledges",
  INSPECTIONS: "/inspections",
  PARKONIC: "/parkonic",
  FINES: "/fines",
  DISPUTE: "/dispute",

  SUPERVISROR_MANGEMENT: "/supervisor-management",
  LEAVE_MANGEMENT: "/leave-management",
  TOWING: "/towing",

  // --- Team Assessment section (children only, no parent path) ---
  TEAM_EVALUATION: "/team-assessment/evaluation",
  TEAM_TRAINING: "/team-assessment/training",

  ANALYTICS: "/analytics",
  INSPECTOR_MANAGEMENT: "/inspector-management",
  SHIFTPLANNING: "/shiftplanning", // ✅ lowercase
};
