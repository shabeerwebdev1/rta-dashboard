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

export const statusColorMap: Record<string, string> = {
  [TowingStatus.Pending]: "orange",
  [TowingStatus.Approved]: "green",
  [TowingStatus.Cancelled]: "default",
  [TowingStatus.Rejected]: "red",
  [TowingStatus.InProgress]: "blue",
  [TowingStatus.Completed]: "cyan",
};

const statusTranslationKeyMap: Record<string, string> = {
  [TowingStatus.Pending]: "status.pending",
  [TowingStatus.Approved]: "status.approved",
  [TowingStatus.Cancelled]: "status.cancelled",
  [TowingStatus.Rejected]: "status.rejected",
  [TowingStatus.InProgress]: "status.inProgress",
  [TowingStatus.Completed]: "status.completed",
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
        align: "center",
        render: (status: string) => {
          const statusEnum = mapTowingStatus(status);
          const color = statusColorMap[statusEnum] || "default";
          const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");
          const isArabic = lang.startsWith("ar");
          const labelMap: Record<string, { en: string; ar: string }> = {
            [TowingStatus.Pending]: { en: "Pending", ar: "قيد الانتظار" },
            [TowingStatus.Approved]: { en: "Approved", ar: "موافق عليه" },
            [TowingStatus.Cancelled]: { en: "Cancelled", ar: "ملغى" },
            [TowingStatus.Rejected]: { en: "Rejected", ar: "مرفوض" },
            [TowingStatus.InProgress]: { en: "In Progress", ar: "قيد التنفيذ" },
            [TowingStatus.Completed]: { en: "Completed", ar: "مكتمل" },
          };
          const label = labelMap[statusEnum] ? (isArabic ? labelMap[statusEnum].ar : labelMap[statusEnum].en) : status;
          return <Tag color={color}>{label}</Tag>;
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
