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
    dateRangeKey: "pledgeDate",
  },

  statsConfig: [
    {
      title: "stats.TotalPledges",
      icon: <AuditOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalCount || 0}`,
    },
    {
      title: "stats.CorporatePledges",
      icon: <SnippetsOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.pledgeType === 9001).length} / ${metadata?.corporate || 0}`,
    },
    {
      title: "stats.IndividualPledges",
      icon: <SnippetsOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.pledgeType === 9002).length} / ${metadata?.individual || 0}`,
    },
  ],
  tableConfig: {
    columns: [
      { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "string", sortable: true },
      { key: "businessName", title: "form.businessName", type: "string", sortable: true },
      { key: "pledgeType", title: "form.pledgeType", type: "string", filterable: true },
      { key: "pledgeDate", title: "form.pledgestartDate", type: "date", sortable: true },
      { key: "pledgeEndDate", title: "form.pledgeEndDate", type: "date", sortable: true },
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
