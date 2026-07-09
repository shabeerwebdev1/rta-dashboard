import type { PageConfig } from "../../types/config";
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

/**
 * proactiveCampaignsConfig.tsx
 *
 * - PageConfig for Proactive Campaigns (static data only)
 * - NO DELETE (per requirement)
 * - Includes static lookups, sample campaigns, and PageConfig matching your architecture
 * - Uses a dummy map concept (coordinates stored as polygon array)
 */

/* -------------------------
   Static lookups & seed data
   ------------------------- */

export const proactiveLookupData = {
  locations: [
    { value: "downtown", labelEn: "Downtown", labelAr: "وسط المدينة" },
    { value: "business-bay", labelEn: "Business Bay", labelAr: "الخليج التجاري" },
    { value: "jumeirah", labelEn: "Jumeirah", labelAr: "جميرا" },
    { value: "deira", labelEn: "Deira", labelAr: "ديرة" },
    { value: "bur-dubai", labelEn: "Bur Dubai", labelAr: "بر دبي" },
  ],
  violationTypes: [
    { value: "parking", labelEn: "Illegal Parking", labelAr: "وقوف غير قانوني" },
    { value: "littering", labelEn: "Littering", labelAr: "إلقاء نفايات" },
    { value: "noise", labelEn: "Noise Complaint", labelAr: "شكاوى الضوضاء" },
    { value: "construction", labelEn: "Unauthorized Construction", labelAr: "بناء غير مرخّص" },
    { value: "signage", labelEn: "Improper Signage", labelAr: "لافتات غير مناسبة" },
  ],
  inspectors: [
    { value: 101, labelEn: "Ahmed Mohammed", labelAr: "أحمد محمد" },
    { value: 102, labelEn: "Fatima Al Rashid", labelAr: "فاطمة الرشيد" },
    { value: 103, labelEn: "Khalid Hassan", labelAr: "خالد حسن" },
    { value: 104, labelEn: "Mariam Al Qasimi", labelAr: "مريم القاسمي" },
    { value: 105, labelEn: "Omar Abdullah", labelAr: "عمر عبدالله" },
  ],
  statuses: [
    { value: "active", labelEn: "Active", labelAr: "نشط" },
    { value: "completed", labelEn: "Completed", labelAr: "مكتمل" },
    { value: "cancelled", labelEn: "Cancelled", labelAr: "ملغى" },
  ],
};

/**
 * polygon is stored as array of [lat, lng] pairs
 * This is dummy seed data — drawing on the map will populate similar arrays.
 */
export const staticProactiveCampaigns = [
  {
    id: 1,
    titleEn: "Downtown Parking Sweep",
    titleAr: "حملة مواقف وسط المدينة",
    location: "downtown",
    startTime: "2025-11-20T08:00:00Z",
    endTime: "2025-11-20T18:00:00Z",
    violationTypes: ["parking"],
    assignedInspectors: [101, 103],
    polygon: [
      [25.204849, 55.270783],
      [25.2055, 55.272],
      [25.2039, 55.273],
      [25.203, 55.2715],
    ],
    notificationMessageEn:
      "Proactive campaign: Downtown Parking Sweep. Please prioritize illegal parking checks in your patrols.",
    notificationMessageAr: "حملة استباقية: حملة مواقف وسط المدينة. الرجاء التركيز على مخالفات المواقف خلال الدوريات.",
    status: "draft",
    createdBy: "Yousef Al Mansoori",
    createdAt: "2025-11-10T08:00:00Z",
  },
  {
    id: 2,
    titleEn: "Business Bay Anti-Littering",
    titleAr: "حملة مكافحة رمي النفايات الخليج التجاري",
    location: "business-bay",
    startTime: "2025-11-22T06:00:00Z",
    endTime: "2025-11-22T20:00:00Z",
    violationTypes: ["littering"],
    assignedInspectors: [102, 104, 105],
    polygon: [
      [25.191, 55.276],
      [25.192, 55.278],
      [25.19, 55.279],
      [25.189, 55.2775],
    ],
    notificationMessageEn: "Business Bay anti-littering campaign active. Include in daily patrols.",
    notificationMessageAr: "حملة مكافحة رمي النفايات في الخليج التجاري نشطة. أدرجها ضمن الدوريات اليومية.",
    status: "active",
    createdBy: "Layla Al Shamsi",
    createdAt: "2025-11-12T09:00:00Z",
  },
];

/* -------------------------
   PageConfig
   ------------------------- */

export const proactiveCampaignsConfig: PageConfig = {
  key: "proactive-campaigns",
  title: "page.title.proactive-campaigns",
  name: { singular: "entity.proactiveCampaign", plural: "Proactive Campaigns" },

  api: {
    get: "/api/ProactiveCampaigns",
    post: "/api/ProactiveCampaigns",
    put: "/api/ProactiveCampaigns",
    // delete intentionally omitted (NO DELETE)
  },

  searchConfig: {
    globalSearchKeys: ["titleEn", "titleAr", "notificationMessageEn", "notificationMessageAr"],
    columnFilterKeys: ["location", "status", "violationTypes"],
    dateRangeKey: "startTime",
  },

  statsConfig: [
    {
      title: "stats.TotalCampaigns",
      icon: <FileTextOutlined />,
      value: (data: any[]) => `${data.length}`,
    },
    {
      title: "stats.ActiveCampaigns",
      icon: <CheckCircleOutlined />,
      value: (data: any[]) => data.filter((c) => c.status === "active").length,
      color: "#52c41a",
    },
    {
      title: "stats.DraftCampaigns",
      icon: <ClockCircleOutlined />,
      value: (data: any[]) => data.filter((c) => c.status === "draft").length,
      color: "#faad14",
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "titleEn",
        title: "form.title",
        dataIndex: "titleEn",
        type: "string",
        sortable: true,
        filterable: true,
      },
      {
        key: "location",
        title: "form.location",
        dataIndex: "location",
        type: "tag",
        filterable: true,
      },
      {
        key: "startTime",
        title: "form.startTime",
        dataIndex: "startTime",
        type: "dateTime",
        sortable: true,
      },
      {
        key: "endTime",
        title: "form.endTime",
        dataIndex: "endTime",
        type: "dateTime",
        sortable: true,
      },
      {
        key: "violationTypes",
        title: "form.violationTypes",
        dataIndex: "violationTypes",
        type: "tagList",
        filterable: true,
      },
      {
        key: "assignedInspectors",
        title: "form.assignedInspectors",
        dataIndex: "assignedInspectors",
        type: "list",
      },
      {
        key: "status",
        title: "form.status",
        dataIndex: "status",
        type: "tag",
        filterable: true,
      },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "900px",
    fields: [
      {
        name: "titleEn",
        label: "form.title",
        type: "input",
        required: true,
        span: 24,
      },
      {
        name: "location",
        label: "form.location",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "timeInterval",
        label: "form.timeInterval",
        type: "dateTimeRange",
        required: true,
        span: 24,
        fieldMapping: { from: "startTime", to: "endTime" },
      },
      {
        name: "violationTypes",
        label: "form.violationTypes",
        type: "select",
        required: true,
        span: 24,
        mode: "multiple",
      },
      {
        name: "assignedInspectors",
        label: "form.assignedInspectors",
        type: "select",
        required: true,
        span: 24,
        mode: "multiple",
        description: "Inspectors auto-assigned based on polygon, editable by supervisor.",
      },
      {
        name: "status",
        label: "form.status",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "notificationMessageEn",
        label: "form.campaignMessage",
        type: "textarea",
        required: true,
        span: 24,
      },
      {
        name: "createdBy",
        label: "form.createdBy",
        type: "input",
        required: false,
        span: 12,
      },
    ],
  },

  // attach lookups to config so pages can easily reference them
  lookups: proactiveLookupData,
};

export default proactiveCampaignsConfig;
