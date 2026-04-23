import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, IdcardOutlined } from "@ant-design/icons";
import { PageConfig } from "../../types/config";
import { Tag } from "antd";
import dayjs from "dayjs";

export enum TowingStatus {
  Pending = "PENDING",
  Approved = "APPROVED",
  Rejected = "REJECTED",
  Cancelled = "CANCELLED",
  InProgress = "IN_TOWING",
  Completed = "COMPLETED",
}

const formatDate = (value: string) => {
  if (!value) return "";

  const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");
  const isArabic = lang.startsWith("ar");

  return dayjs(value)
    .locale(isArabic ? "ar" : "en")
    .format(isArabic ? "DD MMMM YYYY" : "DD MMM YYYY");
};

// Helper function to map string status to enum
export const mapTowingStatus = (statusString: string): TowingStatus => {
  switch (statusString?.toUpperCase()) {
    case "APPROVED":
      return TowingStatus.Approved;
    case "REJECTED":
      return TowingStatus.Rejected;
    case "CANCELLED":
      return TowingStatus.Cancelled;
    case "IN_TOWING":
      return TowingStatus.InProgress;
    case "COMPLETED":
      return TowingStatus.Completed;
    case "PENDING":
    default:
      return TowingStatus.Pending;
  }
};

const statusMap: Record<string, { text: string; color: string }> = {
  [TowingStatus.Pending]: { text: "Pending", color: "orange" },
  [TowingStatus.Approved]: { text: "Approved", color: "green" },
  [TowingStatus.Cancelled]: { text: "Cancelled", color: "default" },
  [TowingStatus.Rejected]: { text: "Rejected", color: "red" },
  [TowingStatus.InProgress]: { text: "In Progress", color: "blue" },
  [TowingStatus.Completed]: { text: "Completed", color: "cyan" },
};

export const towingConfig: PageConfig = {
  key: "towing",
  title: "page.title.towing",
  name: { singular: "Towing", plural: "Towings" },
  api: {
    get: "/api/Towing",
    post: "",
    put: "/api/Towing/approval",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["plateNumber", "vehicleOwnerName"],
    columnFilterKeys: ["towing_Status"],
    dateRangeKey: "createdDateTime",
  },

  statsConfig: [
    {
      title: "stats.TotalTowings",
      icon: <IdcardOutlined />,
      value: (data) => data.length,
    },
    {
      title: "status.approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "APPROVED").length,
      color: "#52c41a",
    },
    {
      title: "status.rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "REJECTED").length,
      color: "#ff4d4f",
    },
    {
      title: "status.pending",
      icon: <ClockCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "PENDING").length,
      color: "#1890ff",
    },
    {
      title: "status.inProgress",
      icon: <ClockCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "IN_TOWING").length,
      color: "cyan",
    },
    {
      title: "status.completed",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "COMPLETED").length,
      color: "purple",
    },
  ],

  tableConfig: {
    rowKey: "inspectionGUID",
    columns: [
      {
        key: "plateNumber",
        title: "form.plateNumber",
        type: "string",
        dataIndex: "plateNumber",
        sortable: false,
      },
      {
        key: "vehicleBrand",
        title: "form.vehicleName",
        type: "string",
        dataIndex: "vehicleBrand",
        sortable: false,
      },
      {
        key: "vehicleColor",
        title: "form.vehicleColor",
        type: "string",
        dataIndex: "vehicleColor",
        sortable: false,
      },
      {
        key: "vehicleOwnerName",
        title: "form.vehicleOwnerName",
        type: "string",
        dataIndex: "vehicleOwnerName",
        sortable: false,
      },
      {
        key: "vehicleOwnerMobile",
        title: "form.vehicleOwnerMobile",
        type: "string",
        dataIndex: "vehicleOwnerMobile",
        sortable: false,
      },
      {
        key: "towing_Status",
        title: "form.status",
        type: "custom",
        dataIndex: "towing_Status",
        sortable: false,
        filterable: true,
        render: (status: string) => {
          const statusEnum = mapTowingStatus(status);

          const { text, color } = statusMap[statusEnum] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        key: "entityDateTime",
        title: "form.towingDate",
        type: "custom",
        dataIndex: "entityDateTime",
        sortable: false,
        render: (value) => formatDate(value),
      },
    ],
    viewRecord: true,
  },

  formConfig: { modalWidth: "0", fields: [] },
};
