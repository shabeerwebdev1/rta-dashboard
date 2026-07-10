import type { PageConfig } from "../../types/config";
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

export const proactiveLookupData = {
  violationTypes: [
    { value: "parking", labelEn: "Illegal Parking", labelAr: "وقوف غير قانوني" },
    { value: "littering", labelEn: "Littering", labelAr: "إلقاء نفايات" },
    { value: "noise", labelEn: "Noise Complaint", labelAr: "شكاوى الضوضاء" },
    { value: "construction", labelEn: "Unauthorized Construction", labelAr: "بناء غير مرخّص" },
    { value: "signage", labelEn: "Improper Signage", labelAr: "لافتات غير مناسبة" },
  ],
  statuses: [
    { value: "active", labelEn: "Active", labelAr: "نشط" },
    { value: "completed", labelEn: "Completed", labelAr: "مكتمل" },
    { value: "cancelled", labelEn: "Cancelled", labelAr: "ملغى" },
  ],
};

/* -------------------------
   PageConfig
   ------------------------- */

export const proactiveCampaignsConfig: PageConfig = {
  key: "proactive-campaigns",
  title: "page.title.proactive-campaigns",
  name: { singular: "entity.proactiveCampaign", plural: "Proactive Campaigns" },

  api: {
    get: "/api/ProactiveCampaign",
    post: "/api/ProactiveCampaign",
    put: "/api/ProactiveCampaign",
    // delete intentionally omitted (NO DELETE)
  },

  searchConfig: {
    globalSearchKeys: ["title"],
    columnFilterKeys: ["status", "violationTypes"],
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
      value: (data: any[]) => data.filter((c) => String(c.status ?? "").toLowerCase() === "active").length,
      color: "#52c41a",
    },
    {
      title: "stats.DraftCampaigns",
      icon: <ClockCircleOutlined />,
      value: (data: any[]) =>
        data.filter((c) => {
          const status = String(c.status ?? "").toLowerCase();
          return !status || status === "draft";
        }).length,
      color: "#faad14",
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "title",
        title: "form.title",
        dataIndex: "title",
        type: "string",
        sortable: true,
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
        name: "title",
        label: "form.title",
        type: "input",
        required: true,
        span: 24,
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
        name: "campaignMessage",
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
