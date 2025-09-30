import { CheckCircleOutlined, CloseCircleOutlined, FileSearchOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import TradeLicenseCard from "../../components/TradeLicenseCard";

export const tradeLicenseConfig: PageConfig = {
  key: "tradeLicenseInspections",
  title: "page.title.tradeLicenseInspections",
  name: { singular: "Trade License Inspection", plural: "Trade License Inspections" },

  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["entityNo", "tradeLicenseNumber"],
    columnFilterKeys: ["inspectionStatus", "inspectionType", "inspectionCategory"],
    dateRangeKey: "entityDateTime",
  },

  statsConfig: [
    {
      title: "Total Inspections",
      icon: <FileSearchOutlined />,
      value: (data) => data.length,
    },
    {
      title: "Approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.inspectionStatus === "Approved").length,
      color: "#52c41a",
    },
    {
      title: "Rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.inspectionStatus === "Rejected").length,
      color: "#ff4d4f",
    },
  ],

  tableConfig: {
    rowKey: "inspectionGUID",
    columns: [
      { key: "entityNo", title: "form.fineNumber", type: "string" },
      {
        key: "tradeLicenseNumber",
        title: "form.tradeLicense",
        type: "string",
      },
      { key: "inspectionType", title: "form.inspectionType", type: "number", filterable: true },
      { key: "inspectionCategory", title: "form.fineType", type: "string", filterable: true },
      { key: "fineAmount", title: "form.fineAmount", type: "number" },

      { key: "entityDateTime", title: "form.finedDate", type: "date" },
      { key: "inspectionStatus", title: "form.inspectionStatus", type: "string", filterable: true },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [],
  },
};
