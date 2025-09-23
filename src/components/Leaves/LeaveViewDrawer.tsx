import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space, App } from "antd";
import { LeaveStatus } from "../../config/pageConfigs/leaveManagementConfig";
import { useUpdateLeaveStatusMutation } from "../../services/rtkApiFactory";
import dayjs from "dayjs";
import { t } from "i18next";

interface LeaveViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const LeaveViewDrawer: React.FC<LeaveViewDrawerProps> = ({ open, onClose, record }) => {
  const { notification } = App.useApp();
  const [updateLeaveStatus, { isLoading }] = useUpdateLeaveStatusMutation();

  const [status, setStatus] = useState<number>(record?.status ?? LeaveStatus.Pending);

  // ✅ Sync status when record changes
  useEffect(() => {
    if (record) {
      setStatus(record.status);
    }
  }, [record]);

  const handleUpdateStatus = async (newStatus: LeaveStatus) => {
    const leaveId = record?.leaveId || record?.id; // ✅ Support both

    if (!leaveId) {
      notification.error({ message: "Missing leave ID" });
      return;
    }

    try {
      await updateLeaveStatus({
        id: leaveId, // ✅ now always sends correct id
        status: newStatus,
      }).unwrap();

      setStatus(newStatus);
      notification.success({
        message: `Leave updated to ${LeaveStatus[newStatus]}`,
      });
      onClose();
    } catch (err: any) {
      notification.error({
        message: err?.data?.message || "Failed to update leave",
      });
    }
  };

  return (
    <Drawer
      open={open}
      width={500}
      onClose={onClose}
      title="Leave Details"
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {record ? (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("form.employeeId")}>{record.employeeId}</Descriptions.Item>
            <Descriptions.Item label={t("form.fromDate")}>
              {dayjs(record.fromDate).format("DD MMM YYYY, hh:mm A")}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.toDate")}>
              {dayjs(record.toDate).format("DD MMM YYYY, hh:mm A")}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.totalLeaveDays")}>{record.totalLeaveDays}</Descriptions.Item>
            <Descriptions.Item label={t("form.leaveType")}>{record.leaveType}</Descriptions.Item>
            <Descriptions.Item label={t("form.leaveReason")}>{record.leaveReason}</Descriptions.Item>
            <Descriptions.Item label={t("form.status")}>
              <Tag
                color={
                  status === LeaveStatus.Approved
                    ? "green"
                    : status === LeaveStatus.Pending
                      ? "blue"
                      : status === LeaveStatus.Cancelled
                        ? "orange"
                        : "red"
                }
              >
                {LeaveStatus[status]}
              </Tag>
            </Descriptions.Item>

            {/* ✅ Show actions only if NOT approved */}
            {status !== LeaveStatus.Approved && (
              <Descriptions.Item label={t("form.actions")}>
                <Space>
                  <Button type="primary" loading={isLoading} onClick={() => handleUpdateStatus(LeaveStatus.Approved)}>
                    {t("form.approve")}
                  </Button>
                  <Button danger loading={isLoading} onClick={() => handleUpdateStatus(LeaveStatus.Rejected)}>
                    {t("form.reject")}
                  </Button>
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      ) : (
        <p>No Data</p>
      )}
    </Drawer>
  );
};

export default LeaveViewDrawer;
