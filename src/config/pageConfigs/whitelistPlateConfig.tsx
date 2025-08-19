import type { PageConfig } from "../../types/config";
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export const whitelistPlateConfig: PageConfig = {
  key: "whitelist-plates",
  title: "page.title.whitelist-plates",
  name: { singular: "Plate", plural: "Plates" },
  api: {
    get: "/api/WhitelistPlate",
    post: "/api/WhitelistPlate",
    put: "/api/WhitelistPlate",
    delete: "/api/WhitelistPlate/:id",
  },
  statsConfig: [
    { title: "Total Plates", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Active Plates",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.plateStatus?.toLowerCase() === "active").length,
      color: "#52c41a",
    },
    {
      title: "Inactive Plates",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.plateStatus?.toLowerCase() === "inactive").length,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    columns: [
      { key: "plateNumber", title: "form.plateNumber", type: "string" },
      { key: "plateSource", title: "form.plateSource", type: "string", filterable: true },
      { key: "plateType", title: "form.plateType", type: "string", filterable: true },
      { key: "plateColor", title: "form.plateColor", type: "badge" },
      { key: "fromDate", title: "form.fromDate", type: "date" },
      { key: "toDate", title: "form.toDate", type: "date" },
      { key: "plateStatus", title: "form.status", type: "tag", filterable: true },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "plateNumber",
        label: "form.plateNumber",
        type: "text",
        required: true,
        span: 12,
        validationType: "plateNumber",
      },
      {
        name: "plateSource",
        label: "form.plateSource",
        type: "select",
        required: true,
        span: 12,
        options: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
      },
      {
        name: "plateType",
        label: "form.plateType",
        type: "select",
        required: true,
        span: 12,
        options: ["Private", "Commercial", "Motorcycle", "Taxi"],
      },
      {
        name: "plateColor",
        label: "form.plateColor",
        type: "select",
        required: true,
        span: 12,
        options: ["White", "Red", "Blue", "Green", "Black", "Yellow", "Orange", "Purple"],
      },
      {
        name: "dateRange",
        label: "form.dateRange",
        type: "dateRange",
        required: true,
        span: 24,
        fieldMapping: { from: "fromDate", to: "toDate" },
        disablePastDates: true,
      },
      {
        name: "exemptionReason_ID",
        label: "form.exemptionReason_ID",
        type: "select",
        required: true,
        span: 12,
        options: [
          { label: "Government Vehicle", value: 1 },
          { label: "Diplomatic Vehicle", value: 2 },
          { label: "Emergency Vehicle", value: 3 },
        ],
      },
      {
        name: "plateStatus",
        label: "form.status",
        type: "select",
        required: true,
        span: 12,
        options: ["Active", "Inactive"],
      },
    ],
  },
};
