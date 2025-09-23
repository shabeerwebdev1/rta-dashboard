import type { PageConfig } from "../../types/config";
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Tag } from "antd";

export const parkonicPageConfig: PageConfig = {
  key: "parkonic",
  title: "page.title.parkonic",
  name: { singular: "Parkonic Record", plural: "Parkonic Records" },
  api: { get: "/api/Parkonic", post: "", put: "/api/Parkonic/Review", delete: "" },
  searchConfig: {
    globalSearchKeys: ["fineId", "plateNumber"],
    columnFilterKeys: ["reviewStatus"],
    dateRangeKey: "Entry_DateTime",
  },
  statsConfig: [
    { title: "Total Records", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.reviewStatus === 1).length,
      color: "#52c41a",
    },
    {
      title: "Rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.reviewStatus === 0).length,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    rowKey: "fineId",
    columns: [
      { key: "fineId", title: "form.fineNumber", type: "string", sortable: true },
      { key: "plateNumber", title: "form.vehicleNumber", type: "string", sortable: true },
      {
        key: "reviewStatus",
        title: "form.reviewStatus",
        type: "custom",
        sortable: true,
        filterable: true,
        render: (status: number) => {
          const statusMap: Record<number, { text: string; color: string }> = {
            0: { text: "Rejected", color: "red" },
            1: { text: "Approved", color: "green" },
            2: { text: "Pending", color: "blue" },
          };
          const { text, color } = statusMap[status] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
      { key: "entryDateTime", title: "form.entryDateTime", type: "date", sortable: true },
      { key: "exitDateTime", title: "form.exitDateTime", type: "date", sortable: true },
    ],
    viewRecord: true,
  },
  formConfig: { modalWidth: "0", fields: [] },
};
