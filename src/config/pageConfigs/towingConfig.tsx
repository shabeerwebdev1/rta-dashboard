import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { PageConfig } from "../../types/config";
import { Tag } from "antd";

export enum TowingStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Cancelled = 3,
}

// Helper function to map string status to enum
export const mapTowingStatus = (statusString: string): TowingStatus => {
  switch (statusString?.toLowerCase()) {
    case 'approved': return TowingStatus.Approved;
    case 'rejected': return TowingStatus.Rejected;
    case 'cancelled': return TowingStatus.Cancelled;
    case 'pending': 
    default: return TowingStatus.Pending;
  }
};

const statusMap: Record<number, { text: string; color: string }> = {
  [TowingStatus.Pending]: { text: "Pending", color: "blue" },
  [TowingStatus.Approved]: { text: "Approved", color: "green" },
  [TowingStatus.Cancelled]: { text: "Cancelled", color: "orange" },
  [TowingStatus.Rejected]: { text: "Rejected", color: "red" },
};

export const towingConfig: PageConfig = {
  key: "towing",
  title: "page.title.towing",
  name: { singular: "Towing", plural: "Towings" },
  api: { 
    get: "/api/Towing", 
    post: "", 
    put: "/api/Towing/approval", 
    delete: "" 
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
      value: (data) => data.length 
    },
    {
      title: "status.approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "Approved").length,
      color: "#52c41a",
    },
    {
      title: "status.rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "Rejected").length,
      color: "#ff4d4f",
    },
    {
      title: "status.pending",
      icon: <ClockCircleOutlined />,
      value: (data) => data.filter((d) => d.towing_Status === "pending").length,
      color: "#1890ff",
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
        sortable: false 
      },
      { 
        key: "vehicleBrand", 
        title: "form.vehicleName", 
        type: "string", 
        dataIndex: "vehicleBrand",
        sortable: false 
      },
      { 
        key: "vehicleColor", 
        title: "form.vehicleColor", 
        type: "string", 
        dataIndex: "vehicleColor",
        sortable: false 
      },
      { 
        key: "vehicleOwnerName", 
        title: "form.vehicleOwnerName", 
        type: "string", 
        dataIndex: "vehicleOwnerName",
        sortable: false 
      },
      { 
        key: "vehicleOwnerMobile", 
        title: "form.vehicleOwnerMobile", 
        type: "string", 
        dataIndex: "vehicleOwnerMobile",
        sortable: false 
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
        render: (dateString: string) => {
          if (!dateString) return "-";
          const date = new Date(dateString);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        },
      },
    ],
    viewRecord: true,
  },

  formConfig: { modalWidth: "0", fields: [] },
};