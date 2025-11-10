import React from "react";
import { FileTextOutlined } from "@ant-design/icons";
import { PageConfig } from "../../types/config";

export type ReportFormat =
  | "HTML4.0"
  | "PDF"
  | "EXCEL"
  | "EXCELOPENXML"
  | "WORD"
  | "WORDOPENXML"
  | "CSV"
  | "XML"
  | "MHTML";

export interface ReportParameters {
  FromDate?: string;
  ToDate?: string;
  LeaveStatus?: string;
  UserId?: string;
  [key: string]: string | undefined;
}

export interface GetHtmlReportPayload {
  reportPath: string;
  format: ReportFormat;
  parameters: ReportParameters;
}

export interface ParametersConfig {
  requiresDateRange: boolean;
  requiresLeaveStatus: boolean;
  requiresUserId: boolean;
}

export interface ReportConfig {
  key: string;
  name: string;
  path: string;
  description: string;
  descriptionKey?: string; // Translation key for description
  language?: "Arabic" | "English" | null;
  parameters: ParametersConfig;
}

export const reportsConfig: PageConfig = {
  key: "reports",
  title: "page.title.reports",
  name: { singular: "Report", plural: "Reports" },
  api: {
    get: "",
    post: "/api/reports/download",
    put: "",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["name", "description"],
    columnFilterKeys: ["language"],
    dateRangeKey: "",
  },
  tableConfig: { columns: [{}] },

  statsConfig: [
    {
      title: "stats.TotalReports",
      icon: React.createElement(FileTextOutlined),
      value: () => reports.length,
    },
    {
      title: "stats.ArabicReports",
      icon: React.createElement(FileTextOutlined),
      value: () => reports.filter((r) => r.language === "Arabic").length,
      color: "#52c41a",
    },
    {
      title: "stats.EnglishReports",
      icon: React.createElement(FileTextOutlined),
      value: () => reports.filter((r) => r.language === "English").length,
      color: "#1890ff",
    },
    {
      title: "stats.ParameterizedReports",
      icon: React.createElement(FileTextOutlined),
      value: () =>
        reports.filter(
          (r) => r.parameters.requiresDateRange || r.parameters.requiresLeaveStatus || r.parameters.requiresUserId,
        ).length,
      color: "#faad14",
    },
  ],

  formConfig: { modalWidth: "0", fields: [] },
};

// Reports data array with translation keys
export const reports: ReportConfig[] = [
  {
    key: "parking_inspectors_eval_arb",
    name: "D-16_ParkingInspectorsEvaluationSummary_arb",
    path: "D-16_ParkingInspectorsEvaluationSummary_arb",
    description: "Parking Inspectors Evaluation Summary",
    descriptionKey: "reports.parkingInspectorsEvaluation", // Translation key
    language: "Arabic",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "parking_inspectors_eval_eng",
    name: "D-16_ParkingInspectorsEvaluationSummary_eng",
    path: "D-16_ParkingInspectorsEvaluationSummary_eng",
    description: "Parking Inspectors Evaluation Summary",
    descriptionKey: "reports.parkingInspectorsEvaluation",
    language: "English",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "qatar_vehicle_arb",
    name: "D1-10 - Qatar vehicle - TBD_arb",
    path: "D1-10 - Qatar vehicle - TBD_arb",
    description: "Qatar Vehicle - TBD",
    descriptionKey: "reports.qatarVehicle",
    language: "Arabic",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "qatar_vehicle_eng",
    name: "D1-10 - Qatar vehicle - TBD_eng",
    path: "D1-10 - Qatar vehicle - TBD_eng",
    description: "Qatar Vehicle - TBD",
    descriptionKey: "reports.qatarVehicle",
    language: "English",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "vehicle_violations_arb",
    name: "D1-3 - Vehicle Violations_arb",
    path: "D1-3 - Vehicle Violations_arb",
    description: "Vehicle Violations",
    descriptionKey: "reports.vehicleViolations",
    language: "Arabic",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "vehicle_violations_eng",
    name: "D1-3 - Vehicle Violations_eng",
    path: "D1-3 - Vehicle Violations_eng",
    description: "Vehicle Violations",
    descriptionKey: "reports.vehicleViolations",
    language: "English",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "violation_latlng_arb",
    name: "D1-6 -Violation with LATLng_arb",
    path: "D1-6 -Violation with LATLng_arb",
    description: "Violation with Location",
    descriptionKey: "reports.violationWithLocation",
    language: "Arabic",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "violation_latlng_eng",
    name: "D1-6 -Violation with LATLng_eng",
    path: "D1-6 -Violation with LATLng_eng",
    description: "Violation with Location",
    descriptionKey: "reports.violationWithLocation",
    language: "English",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "inspector_performance_arb",
    name: "D1-9_Inspector Performance_arb",
    path: "D1-9_Inspector Performance_arb",
    description: "Inspector Performance",
    descriptionKey: "reports.inspectorPerformance",
    language: "Arabic",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "inspector_performance_eng",
    name: "D1-9_Inspector Performance_eng",
    path: "D1-9_Inspector Performance_eng",
    description: "Inspector Performance",
    descriptionKey: "reports.inspectorPerformance",
    language: "English",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "proactive_inspection_arb",
    name: "d1_15_ProactiveInspectionAndCampaignReport_arb",
    path: "d1_15_ProactiveInspectionAndCampaignReport_arb",
    description: "Proactive Inspection and Campaign Report",
    descriptionKey: "reports.proactiveInspection",
    language: "Arabic",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "proactive_inspection_eng",
    name: "d1_15_ProactiveInspectionAndCampaignReport_eng",
    path: "d1_15_ProactiveInspectionAndCampaignReport_eng",
    description: "Proactive Inspection and Campaign Report",
    descriptionKey: "reports.proactiveInspection",
    language: "English",
    parameters: {
      requiresDateRange: false,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "disputes_arb",
    name: "D1_1_disputes_arb",
    path: "D1_1_disputes_arb",
    description: "Disputes Report",
    descriptionKey: "reports.disputes",
    language: "Arabic",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "disputes_eng",
    name: "D1_1_disputes_eng",
    path: "D1_1_disputes_eng",
    description: "Disputes Report",
    descriptionKey: "reports.disputes",
    language: "English",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: false,
      requiresUserId: false,
    },
  },
  {
    key: "monthly_leave_arb",
    name: "D1_4_MonthlyLeave_arb",
    path: "D1_4_MonthlyLeave_arb",
    description: "Monthly Leave Report",
    descriptionKey: "reports.monthlyLeave",
    language: "Arabic",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: true,
      requiresUserId: false,
    },
  },
  {
    key: "monthly_leave_eng",
    name: "D1_4_MonthlyLeave_eng",
    path: "D1_4_MonthlyLeave_eng",
    description: "Monthly Leave Report",
    descriptionKey: "reports.monthlyLeave",
    language: "English",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: true,
      requiresUserId: false,
    },
  },
  {
    key: "leave_request_arb",
    name: "D1_7_Leavereq_arb",
    path: "D1_7_Leavereq_arb",
    description: "Leave Request Report",
    descriptionKey: "reports.leaveRequest",
    language: "Arabic",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: true,
      requiresUserId: true,
    },
  },
  {
    key: "leave_request_eng",
    name: "D1_7_Leavereq_eng",
    path: "D1_7_Leavereq_eng",
    description: "Leave Request Report",
    descriptionKey: "reports.leaveRequest",
    language: "English",
    parameters: {
      requiresDateRange: true,
      requiresLeaveStatus: true,
      requiresUserId: true,
    },
  },
];