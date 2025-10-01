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
    globalSearchKeys: ["userName"],
    columnFilterKeys: ["leaveType", "status"],
    dateRangeKey: "LeaveFromDate",
  },
  statsConfig: [
    {
      title: "Total Leaves",
      icon: <IdcardOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalRecords || 0}`,
    },

    {
      title: "Approved",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) =>
        `${data.filter((d) => d.status === LeaveStatus.Approved).length} / ${metadata?.approvedRecords || 0}`,
    },
    {
      title: "Rejected",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) =>
        `${data.filter((d) => d.status === LeaveStatus.Rejected).length} / ${metadata?.rejectedRecords || 0}`,
    },
    {
      title: "Pending",
      icon: <ClockCircleOutlined />,
      value: (data, metadata) =>
        `${data.filter((d) => d.status === LeaveStatus.Pending).length} / ${metadata?.pendingRecords || 0}`,
    },
  ],
  tableConfig: {
    rowKey: "leaveId",
    columns: [
      { key: "userName", title: "form.employeeName", type: "string", sortable: false },
      { key: "leaveType", title: "form.leaveType", type: "string", sortable: false, filterable: false },
      { key: "fromDate", title: "form.fromDate", type: "date", sortable: false },
      { key: "toDate", title: "form.toDate", type: "date", sortable: false },
      {
        key: "totalLeaveDays",
        title: "form.totalLeaveDays",
        type: "custom",
        sortable: false,
        render: (value: number) => (
          <Tag color="default" style={{ borderRadius: "10px", padding: "4px 8px" }}>
            {value} {value === 1 ? "Day" : "Days"}
          </Tag>
        ),
      },
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
