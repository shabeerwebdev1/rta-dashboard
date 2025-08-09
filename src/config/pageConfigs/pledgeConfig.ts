import type { PageConfig } from "../../types/config";

export const pledgeConfig: PageConfig = {
  key: "pledges",
  title: "page.title.pledges",
  name: {
    singular: "Pledge",
    plural: "Pledges",
  },
  api: {
    get: "/api/Pledge",
    post: "/api/Pledge",
    put: "/api/Pledge/:id",
    delete: "/api/Pledge/:id",
  },
  tableConfig: {
    columns: [
      { key: "pledgeNumber", title: "form.pledgeNumber", type: "string" },
      {
        key: "tradeLicenseNumber",
        title: "form.tradeLicenseNumber",
        type: "string",
      },
      { key: "businessName", title: "form.businessName", type: "string" },
      { key: "pledgeType", title: "form.pledgeType", type: "string" },
      { key: "submittedAt", title: "form.date", type: "date" },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "pledgeNumber",
        label: "form.pledgeNumber",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "pledgeType",
        label: "form.pledgeType",
        type: "select",
        required: true,
        span: 12,
        options: ["Corporate", "Individual"],
      },
      {
        name: "tradeLicenseNumber",
        label: "form.tradeLicenseNumber",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "businessName",
        label: "form.businessName",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "documentPath",
        label: "form.document",
        type: "file",
        required: true,
        span: 24,
        fileCategory: "PledgeDocuments",
        responseKey: "documentPath",
      },
      {
        name: "remarks",
        label: "form.remarks",
        type: "textarea",
        required: false,
        span: 24,
      },
      { name: "documentUploaded", label: "", type: "hidden", span: 0 },
      { name: "submittedBy", label: "", type: "hidden", span: 0 },
    ],
  },
};
