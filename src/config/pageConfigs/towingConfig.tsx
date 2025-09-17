import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { PageConfig } from "../../types/config";

export enum TowingStatus {
  Pending = 0,
  Approved = 1,
  Cancelled = 2,
  Rejected = 3,
}

export const towingConfig: PageConfig = {
  key: "towing",
  title: "page.title.towing",
  name: { singular: "Towing", plural: "Towings" },
  api: { 
    get: "/api/Towing", 
    post: "", 
    put: "", 
    delete: "" 
  }, // ✅ comment out later when needed

  searchConfig: {
    globalSearchKeys: [ "Employee Id"],
    columnFilterKeys: ["leaveType", "status"],
    dateRangeKey: "leaveDate",
  },

  // ✅ Commented out stats for now
  statsConfig: [
    { title: "Total Towings", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.status === TowingStatus.Approved).length,
      color: "#52c41a",
    },
    {
      title: "Rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.status === TowingStatus.Rejected).length,
      color: "#ff4d4f",
    },
    {
      title: "Pending",
      icon: <ClockCircleOutlined />,
      value: (data) => data.filter((d) => d.status === TowingStatus.Pending).length,
      color: "#1890ff",
    },
  ],

  tableConfig: {
    rowKey: "towingId",
    columns: [
      { key: "vehicleName", title: "form.vehicleName", type: "string" },
      { key: "vehiclePlateNumber", title: "form.vehiclePlateNumber", type: "string" },
      { key: "towingDriverName", title: "form.towingDriverName", type: "string" },
      { key: "addedBy", title: "form.addedBy", type: "string" },
      { key: "status", title: "form.status", type: "string" },
    ],
    viewRecord: true,
  },

  formConfig: { modalWidth: "0", fields: [] },
};
