import type { PageConfig } from "../../types/config";

export const whitelistTradeLicenseConfig: PageConfig = {
  key: "whitelist-tradelicenses",
  title: "page.title.whitelist-tradelicenses",
  name: {
    singular: "Trade License",
    plural: "Trade Licenses",
  },
  api: {
    get: "/api/WhitelistTradeLicense",
    post: "/api/WhitelistTradeLicense",
    put: "/api/WhitelistTradeLicense/update",
    delete: "/api/WhitelistTradeLicense/:id",
  },
  tableConfig: {
    columns: [
      {
        key: "tradeLicenseNumber",
        title: "form.tradeLicenseNumber",
        type: "string",
      },
      {
        key: "tradeLicense_EN_Name",
        title: "form.tradeLicense_EN_Name",
        type: "string",
      },
      { key: "plotNumber", title: "form.plotNumber", type: "string" },
      { key: "fromDate", title: "form.fromDate", type: "date" },
      { key: "toDate", title: "form.toDate", type: "date" },
      { key: "plateStatus", title: "form.status", type: "tag" },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "tradeLicenseNumber",
        label: "form.tradeLicenseNumber",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "tradeLicense_EN_Name",
        label: "form.tradeLicense_EN_Name",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "tradeLicense_AR_Name",
        label: "form.tradeLicense_AR_Name",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "plotNumber",
        label: "form.plotNumber",
        type: "text",
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
      },
      {
        name: "exemptionReason_ID",
        label: "form.exemptionReason_ID",
        type: "select",
        required: true,
        span: 12,
        options: [
          { label: "Govt Entity", value: 1 },
          { label: "Diplomatic Entity", value: 2 },
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
