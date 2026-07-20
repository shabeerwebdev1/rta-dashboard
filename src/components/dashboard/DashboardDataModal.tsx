import React, { useMemo, useState, useEffect } from "react";
import { Modal, Table, Input, Tag, Empty } from "antd";
import { SearchOutlined, UserOutlined, MobileOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface DashboardDataModalProps {
  open: boolean;
  onClose: () => void;
  type: "onLeave" | "pendingCheckIn";
  data: any[];
  supervisors?: any[];
}

const DashboardDataModal: React.FC<DashboardDataModalProps> = ({ open, onClose, type, data, supervisors = [] }) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchText("");
    }
  }, [open]);

  const getSupervisorName = (supervisorId: string) => {
    if (!supervisorId) return "—";
    const supervisor = supervisors.find((s: any) => s.employeeId === supervisorId || s.inspectorGUID === supervisorId);
    return supervisor?.employeeName || supervisor?.inspectorName || "—";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return dayjs(dateStr).format("DD MMM YYYY");
  };

  const getLeaveStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="green">{t("leave.approved", "Approved")}</Tag>;
      case 0:
        return <Tag color="orange">{t("leave.pending", "Pending")}</Tag>;
      case 2:
        return <Tag color="red">{t("leave.rejected", "Rejected")}</Tag>;
      default:
        return <Tag color="blue">{t("leave.submitted", "Submitted")}</Tag>;
    }
  };

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return data || [];
    const search = searchText.toLowerCase();
    return (data || []).filter((item: any) => {
      if (type === "onLeave") {
        return (
          item.userName?.toLowerCase()?.includes(search) ||
          item.leaveReason?.toLowerCase()?.includes(search) ||
          getSupervisorName(item.supervisor_ID)?.toLowerCase()?.includes(search)
        );
      }
      return (
        item.inspectorName?.toLowerCase()?.includes(search) ||
        String(item.devices_id || "")
          ?.toLowerCase()
          ?.includes(search)
      );
    });
  }, [data, searchText, type]);

  const onLeaveColumns = [
    {
      title: t("dashboard.modal.sNo", "Sl.No"),
      key: "sNo",
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: t("dashboard.modal.userName", "Inspector Name"),
      dataIndex: "userName",
      key: "userName",
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>
          <UserOutlined style={{ marginRight: 6, color: "#1890ff" }} />
          {text || "—"}
        </span>
      ),
    },
    {
      title: t("dashboard.modal.leaveReason", "Leave Reason"),
      dataIndex: "leaveReason",
      key: "leaveReason",
      render: (text: string) => text || "—",
    },
    {
      title: t("dashboard.modal.fromDate", "From Date"),
      dataIndex: "fromDate",
      key: "fromDate",
      render: (text: string) => formatDate(text),
    },
    {
      title: t("dashboard.modal.toDate", "To Date"),
      dataIndex: "toDate",
      key: "toDate",
      render: (text: string) => formatDate(text),
    },
    {
      title: t("dashboard.modal.totalDays", "Total Days"),
      dataIndex: "totalLeaveDays",
      key: "totalLeaveDays",
      width: 100,
      align: "center" as const,
      render: (val: number) => <Tag color="blue">{val ?? "—"}</Tag>,
    },
    {
      title: t("dashboard.modal.status", "Status"),
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: number) => getLeaveStatusTag(status),
    },
  ];

  const pendingCheckInColumns = [
    {
      title: t("dashboard.modal.sNo", "Sl.No"),
      key: "sNo",
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: t("dashboard.modal.inspectorName", "Inspector Name"),
      dataIndex: "inspectorName",
      key: "inspectorName",
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>
          <UserOutlined style={{ marginRight: 6, color: "#1890ff" }} />
          {text || "—"}
        </span>
      ),
    },
    {
      title: t("dashboard.modal.empNumber", "Employee Number"),
      dataIndex: "empNumber",
      key: "empNumber",
      render: (val: any) => (val ? <span>{val}</span> : <Tag color="default">N/A</Tag>),
    },
  ];

  const isOnLeave = type === "onLeave";
  const columns = isOnLeave ? onLeaveColumns : pendingCheckInColumns;

  const title = isOnLeave
    ? t("dashboard.modal.onLeaveTitle", "On Leave Inspectors")
    : t("dashboard.modal.pendingCheckInTitle", "Pending Check-In Inspectors");

  const titleColor = isOnLeave ? "#ff4d4f" : "#faad14";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={isOnLeave ? 950 : 600}
      centered
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 4,
              height: 22,
              borderRadius: 2,
              backgroundColor: titleColor,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
          <Tag color={isOnLeave ? "red" : "orange"} style={{ marginLeft: 8, fontSize: 13 }}>
            {filteredData.length}
          </Tag>
        </div>
      }
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder={t("dashboard.modal.searchPlaceholder", "Search...")}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ borderRadius: 8 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey={(record: any, index?: number) => record.id || record.inspectorGUID || record.userId || `row-${index}`}
        pagination={
          filteredData.length > 10
            ? { pageSize: 10, showSizeChanger: false, showTotal: (total) => `${t("common.total", "Total")}: ${total}` }
            : false
        }
        size="small"
        bordered
        locale={{
          emptyText: (
            <Empty
              description={t("dashboard.modal.noData", "No data available")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        scroll={{ x: isOnLeave ? 850 : undefined, y: "55vh" }}
      />
    </Modal>
  );
};

export default DashboardDataModal;
