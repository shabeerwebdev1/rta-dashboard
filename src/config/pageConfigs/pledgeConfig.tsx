import type { PageConfig } from "../../types/config";
import dayjs from "dayjs";
import {
  AuditOutlined,
  CheckCircleOutlined,
  SnippetsOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

export const pledgeConfig: PageConfig = {
  key: "pledges",
  title: "page.title.pledges",
  name: { singular: "entity.pledge", plural: "entity.Pledges" },
  api: {
    get: "/api/Pledge",
    post: "/api/Pledge",
    put: "/api/Pledge/:id",
    delete: "/api/Pledge/:id",
  },
  searchConfig: {
    globalSearchKeys: ["tradeLicenseNumber", "businessName"],
    columnFilterKeys: ["pledgeType", "pledgeStatus"],
    dateRangeKey: "pledgeDate",
  },

  statsConfig: [
    {
      title: "stats.TotalPledges",
      icon: <AuditOutlined />,
      value: (data, metadata) => `${data?.length || 0} / ${metadata?.totalRecords || 0}`,
    },

    {
      title: "stats.CorporatePledges",
      icon: <SnippetsOutlined />,
      value: (data, metadata) =>
        `${data?.filter((d) => d.pledgeType === 9001).length || 0} / ${metadata?.corporate || 0}`,
    },

    {
      title: "stats.IndividualPledges",
      icon: <SnippetsOutlined />,
      value: (data, metadata) =>
        `${data?.filter((d) => d.pledgeType === 9002).length || 0} / ${metadata?.individual || 0}`,
    },

    {
      title: "stats.activePledges",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) => {
        const activeCount = data?.filter((d) => d.pledgeStatus === 5001).length || 0;
        return `${activeCount} / ${metadata?.active || 0}`;
      },
      color: "#52c41a",
    },

    {
      title: "stats.inactivePledges",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) => {
        const inactiveCount = data?.filter((d) => d.pledgeStatus === 5002).length || 0;
        return `${inactiveCount} / ${metadata?.inActive || 0}`;
      },
      color: "#faad14",
    },

    {
      title: "stats.expiredPledges",
      icon: <ExclamationCircleOutlined />,
      value: (data, metadata) => {
        const expiredCount = data?.filter((d) => d.pledgeStatus === 5003).length || 0;
        return `${expiredCount} / ${metadata?.expired || 0}`;
      },
      color: "#ff4d4f",
    },
  ],

  tableConfig: {
    columns: [
      { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "string", sortable: true },
      { key: "businessName", title: "form.businessName", type: "string", sortable: true },
      { key: "pledgeType", title: "form.pledgeType", type: "string", filterable: true },
      { key: "pledgeDate", title: "form.pledgestartDate", type: "date", sortable: true },
      { key: "pledgeEndDate", title: "form.pledgeEndDate", type: "date", sortable: true },
      { key: "pledgeStatus", title: "form.status", type: "string", sortable: true, filterable: true },
    ],
  },

  formConfig: {
    modalWidth: "720px",
    fields: [
      { name: "pledgeNumber", label: "form.pledgeNumber", type: "text", required: true, span: 12 },
      {
        name: "pledgeType",
        label: "form.pledgeType",
        type: "select",
        required: true,
        span: 12,
        options: ["Corporate", "Individual"],
      },
      { name: "tradeLicenseNumber", label: "form.tradeLicenseNumber", type: "text", required: true, span: 12 },
      { name: "businessName", label: "form.businessName", type: "text", required: true, span: 12 },
      {
        name: "documentPath",
        label: "form.document",
        type: "file",
        required: true,
        span: 24,
        fileCategory: "PledgeDocuments",
        responseKey: "documentPath",
      },
      { name: "remarks", label: "form.remarks", type: "textarea", required: false, span: 24 },
      { name: "documentUploaded", label: "", type: "hidden", span: 0 },
      { name: "submittedBy", label: "", type: "hidden", span: 0 },
    ],
  },
};
