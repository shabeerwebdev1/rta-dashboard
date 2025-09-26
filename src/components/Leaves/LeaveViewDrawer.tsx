import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space } from "antd";
import { LeaveStatus } from "../../config/pageConfigs/leaveManagementConfig";
import { useUpdateLeaveStatusMutation } from "../../services/rtkApiFactory";
import dayjs from "dayjs";
import { t } from "i18next";
import { useAppNotification } from "../../utils/notificationManager";
import { ShareAltOutlined } from "@ant-design/icons";

interface ParkonicLocationViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  config: any;
  onShare?: () => void;
}
const LeaveViewDrawer: React.FC<LeaveViewDrawerProps> = ({ open, onClose, record, onShare }) => {
  const notification = useAppNotification();
  const [updateLeaveStatus, { isLoading }] = useUpdateLeaveStatusMutation();

  const [status, setStatus] = useState<number>(record?.status ?? LeaveStatus.Pending);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
    }
  }, [record]);

  const handleUpdateStatus = async (newStatus: LeaveStatus) => {
    const leaveId = record?.leaveId || record?.id; // ✅ Support both

    if (!leaveId) {
      notification.error(null, t("messages.missingLeaveId") || "Missing leave ID");
      return;
    }

    try {
      const result = await updateLeaveStatus({
        id: leaveId, // ✅ always sends correct id
        status: newStatus,
      }).unwrap();

      setStatus(newStatus);
      notification.success(result, t("messages.leaveUpdated"));
      onClose();
    } catch (err: any) {
      notification.error(err, t("messages.failedToUpdateLeave"));
    }
  };

  return (
    <Drawer
      open={open}
      width={500}
      onClose={onClose}
      title={t("form.leaveDetails")}
       extra={
          <Button icon={<ShareAltOutlined />} onClick={onShare}>
            {t("common.share")}
          </Button>
        }
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
            {status !== LeaveStatus.Approved && Rejected && (
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
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default LeaveViewDrawer;
