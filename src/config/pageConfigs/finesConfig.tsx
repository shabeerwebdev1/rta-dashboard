import { CheckCircleOutlined, CloseCircleOutlined, DollarCircleOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";

export const finesConfig: PageConfig = {
  key: "fines",
  title: "page.title.inspectionmanagement",
  name: { singular: "Fine", plural: "Fines" },
  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },
  searchConfig: {
    globalSearchKeys: ["plateNumber", "vehicleBrand", "tradeLicense"],
    columnFilterKeys: ["inspectionStatus", "vehicleColor", "fineType", "inspectionType"],
    dateRangeKey: "entityDateTime",
  },

  statsConfig: [
    {
      title: "Total Fines",
      icon: <DollarCircleOutlined />,
      value: (data) => data.length,
    },
    {
      title: "Paid Fines",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.isPaid).length,
      color: "#52c41a", // green
    },
    {
      title: "Unpaid Fines",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => !d.isPaid).length,
      color: "#ff4d4f", // red
    },
  ],
  tableConfig: {
    rowKey: "inspectionGUID",
    columns: [
      { key: "fineAmount", title: "form.fineAmount", type: "number" },
      { key: "plateNumber", title: "form.carPlate", type: "string" },
      { key: "tradeLicense", title: "form.tradeLicense", type: "string" },
      { key: "inspectionType", title: "form.inspectionType", type: "string", filterable: true },
      { key: "fineType", title: "form.fineType", type: "string", filterable: true },
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
