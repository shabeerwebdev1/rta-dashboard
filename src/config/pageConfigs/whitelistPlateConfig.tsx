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
  searchConfig: {
    globalSearchKeys: ["plateNumber"],
    columnFilterKeys: ["plateSource_Id", "plateType_Id", "plateColor_Id", "plateStatus_Id", "exemptionReason_ID"],
    dateRangeKey: "fromDate",
  },
  statsConfig: [
    { title: "Total Plates", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Active Plates",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.plateStatus_Id === 5001).length,
      color: "#52c41a",
    },
    {
      title: "Inactive Plates",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.plateStatus_Id === 5002).length,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    columns: [
      { key: "plateNumber", title: "form.plateNumber", type: "string", sortable: true },
      { key: "plateSource_Id", title: "form.plateSource", type: "string", sortable: true, filterable: true },
      { key: "plateType_Id", title: "form.plateType", type: "string", filterable: true },
      { key: "plateColor_Id", title: "form.plateColor", type: "badge", filterable: true },
      { key: "fromDate", title: "form.fromDate", type: "date", sortable: true },
      { key: "toDate", title: "form.toDate", type: "date", sortable: true },
      { key: "plateStatus_Id", title: "form.status", type: "tag", filterable: true },
      { key: "exemptionReason_ID", title: "form.exemptionReason", type: "string", filterable: true },
      { key: "isByLaw", title: "form.isByLaw", type: "string" },
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
        name: "plateSource_Id",
        label: "form.plateSource",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "plateType_Id",
        label: "form.plateType",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "plateColor_Id",
        label: "form.plateColor",
        type: "select",
        required: true,
        span: 12,
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
        label: "form.exemptionReason",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "plateStatus_Id",
        label: "form.status",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "isByLaw",
        label: "form.isByLaw",
        type: "select",
        required: false,
        span: 12,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
};
