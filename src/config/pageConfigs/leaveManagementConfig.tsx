import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { PageConfig } from "../../types/config";
import { Tag } from "antd";

export enum LeaveStatus {
  Pending = 0,
  Approved = 1,
  Cancelled = 2,
  Rejected = 3,
}

const statusMap: Record<LeaveStatus, { text: string; color: string }> = {
  [LeaveStatus.Pending]: { text: "Pending", color: "blue" },
  [LeaveStatus.Approved]: { text: "Approved", color: "green" },
  [LeaveStatus.Cancelled]: { text: "Cancelled", color: "orange" },
  [LeaveStatus.Rejected]: { text: "Rejected", color: "red" },
};

export const leaveManagementPageConfig: PageConfig = {
  key: "LeaveManagement",
  title: "page.title.leaveManagement",
  name: { singular: "Leave Management", plural: "Leave Managements" },
  api: { get: "/api/LeaveManagement", post: "", put: "", delete: "" },
  searchConfig: {
    globalSearchKeys: ["employeeName", "employeeId"],
    columnFilterKeys: ["leaveType", "status"],
    dateRangeKey: "leaveDate",
  },
  statsConfig: [
    { title: "Total Leaves", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.status === LeaveStatus.Approved).length,
      color: "#52c41a",
    },
    {
      title: "Rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.status === LeaveStatus.Rejected).length,
      color: "#ff4d4f",
    },
    {
      title: "Pending",
      icon: <ClockCircleOutlined />,
      value: (data) => data.filter((d) => d.status === LeaveStatus.Pending).length,
      color: "#1890ff",
    },
  ],
  tableConfig: {
    rowKey: "leaveId",
    columns: [
      { key: "employeeId", title: "form.employeeId", type: "string", sortable: false },
      { key: "leaveType", title: "form.leaveType", type: "string", sortable: false, filterable: false },
      { key: "fromDate", title: "form.fromDate", type: "date", sortable: false },
      { key: "toDate", title: "form.toDate", type: "date", sortable: false },
      { key: "totalLeaveDays", title: "form.totalLeaveDays", type: "number", sortable: false },
      {
        key: "status",
        title: "form.status",
        type: "custom",
        sortable: false,
        filterable: true,
        render: (status: LeaveStatus) => {
          const { text, color } = statusMap[status] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
    ],
    viewRecord: true,
  },
  formConfig: { modalWidth: "0", fields: [] },
};
