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
  TRADE_LICENSE_INSPECTIONS: "trade-license-inspections", // ✅ renamed

  
  PARKONIC: "parkonic",
  DISPUTE: "dispute",
  GENERAL: "general",

  INSPECTOR_MANAGEMENT: "inspector-management",
  SUPERVISROR_MANGEMENT: "supervisor-management",
  LEAVE_MANGEMENT: "leave-management",
  CREATESHIFTPLAN:"createshiftplan",
  ANALYTICS: "analytics",
  TOWING: "towing",
  ADHOCSHIFTPLAN:"adhocshiftplan",
  SHIFT_MANAGEMENT: "shift-management",

  TEAM_EVALUATION: "team-assessment",
  TEAM_TRAINING: "team-assessment",
  ROLE_MANAGEMENT: "role-management",
  LEAVE_MANAGEMENT: "leave-management",
  PARKONIC_LOCATION: "parkonic-location",
  FINES_INSPECTIONS: "fines-inspections"
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
  FINES_INSPECTIONS: "/fines-inspections",
  TRADE_LICENSE_INSPECTIONS: "/trade-license-inspections", // ✅ renamed



  LEAVE_MANGEMENT: "/leave-management",
  TOWING: "/towing",

  // --- Team Assessment section (children only, no parent path) ---
  TEAM_EVALUATION: "/team-assessment/evaluation",
  TEAM_TRAINING: "/team-assessment/training",
  SHIFT_MANAGEMENT: "/shift-management",

  ANALYTICS: "/analytics",
  CREATESHIFTPLAN: "/createshiftplan",
  ADHOCSHIFTPLAN:"/adhocshiftplan",
  ROLE_MANAGEMENT: "/role-management",
  PARKONIC_LOCATION: "/parkonic-location"
};