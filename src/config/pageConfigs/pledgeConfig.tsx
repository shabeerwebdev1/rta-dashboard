import type { PageConfig } from "../../types/config";
import { AuditOutlined, SnippetsOutlined } from "@ant-design/icons";

export const pledgeConfig: PageConfig = {
  key: "pledges",
  title: "page.title.pledges",
  name: { singular: "Pledge", plural: "Pledges" },
  api: {
    get: "/api/Pledge",
    post: "/api/Pledge",
    put: "/api/Pledge/:id",
    delete: "/api/Pledge/:id",
  },
  searchConfig: {
    globalSearchKeys: ["tradeLicenseNumber", "businessName"],
    columnFilterKeys: ["pledgeType"],
    dateRangeKey: "submittedAt",
  },
  statsConfig: [
    { title: "Total Pledges", icon: <AuditOutlined />, value: (data) => data.length },
    {
      title: "Corporate Pledges",
      icon: <SnippetsOutlined />,
      value: (data) => data.filter((d) => d.pledgeType === "Corporate").length,
    },
  ],
  tableConfig: {
    columns: [
      { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "string", sortable: true },
      { key: "businessName", title: "form.businessName", type: "string", sortable: true },
      { key: "pledgeType", title: "form.pledgeType", type: "string", filterable: true, lookupCategory: 900 },
      { key: "submittedAt", title: "form.fromDate", type: "date", sortable: true },
    ],
    viewRecord: true,
    showEdit: false,
    drawerConfig: {
      sections: [
        {
          type: "descriptions",
          fields: ["pledgeType", "tradeLicenseNumber", "businessName", "remarks", "submittedAt"],
        },
        {
          type: "images",
          title: "form.document",
          imageSourceKey: "documentPath",
        },
      ],
    },
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      { name: "pledgeType", label: "form.pledgeType", type: "select", required: true, span: 12, lookupCategory: 900 },
      { name: "tradeLicenseNumber", label: "form.tradeLicenseNumber", type: "text", required: true, span: 12 },
      { name: "businessName", label: "form.businessName", type: "text", required: true, span: 12 },
      {
        name: "document",
        label: "form.document",
        type: "file",
        required: true,
        span: 24,
        fileCategory: "PledgeDocuments",
        responseKey: "documentPath",
      },
      { name: "remarks", label: "form.remarks", type: "textarea", required: false, span: 24 },
    ],
  },
};
