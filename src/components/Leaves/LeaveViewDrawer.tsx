/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import { LeaveStatus } from "../../config/pageConfigs/leaveManagementConfig";
import { useUpdateLeaveStatusMutation } from "../../services/rtkApiFactory";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../../utils/notificationManager";

interface LeaveViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  onShare?: () => void;
  getLeaveTypeName?: (code: number | string | undefined) => string; // ✅ added
}

const LeaveViewDrawer: React.FC<LeaveViewDrawerProps> = ({ open, onClose, record, onShare, getLeaveTypeName }) => {
  const notification = useAppNotification();
  const [updateLeaveStatus, { isLoading }] = useUpdateLeaveStatusMutation();
  const { i18n, t } = useTranslation();

  const [status, setStatus] = useState<number>(record?.status ?? LeaveStatus.Pending);
  const isRtl = i18n.dir() === "rtl";

  useEffect(() => {
    if (record) {
      setStatus(record.status);
    }
  }, [record]);

  const handleUpdateStatus = async (newStatus: LeaveStatus) => {
    const leaveId = record?.leaveId || record?.id; // ✅ handle both id types

    if (!leaveId) {
      notification.error(null, t("messages.missingLeaveId") || "Missing leave ID");
      return;
    }

    try {
      const result = await updateLeaveStatus({
        id: leaveId,
        status: newStatus,
      }).unwrap();

      setStatus(newStatus);
      notification.success(result, t("messages.leaveUpdated"));
      onClose();
    } catch (err: any) {
      notification.error(err, t("messages.failedToUpdateLeave"));
    }
  };

  // ✅ Helper: Localized status text
  const getLocalizedStatus = (status: LeaveStatus) => {
    const statusMap: Record<number, string> = {
      [LeaveStatus.Pending]: t("status.pending"),
      [LeaveStatus.Approved]: t("status.approved"),
      [LeaveStatus.Rejected]: t("status.rejected"),
      [LeaveStatus.Cancelled]: t("status.cancelled"),
    };
    return statusMap[status] || "-";
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
      placement={isRtl ? "left" : "right"}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {record ? (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label={t("form.employeeName")}>{record.userName}</Descriptions.Item>

          <Descriptions.Item label={t("form.fromDate")}>
            {dayjs(record.fromDate).format("DD MMM YYYY")}
          </Descriptions.Item>

          <Descriptions.Item label={t("form.toDate")}>{dayjs(record.toDate).format("DD MMM YYYY")}</Descriptions.Item>

          <Descriptions.Item label={t("form.totalLeaveDays")}>{record.totalLeaveDays}</Descriptions.Item>

          {/* ✅ Localized leave type name */}
          <Descriptions.Item label={t("form.leaveType")}>
            {getLeaveTypeName ? getLeaveTypeName(record.leaveType) : record.leaveType}
          </Descriptions.Item>

          <Descriptions.Item label={t("form.leaveReason")}>{record.leaveReason || "-"}</Descriptions.Item>

          <Descriptions.Item label={t("form.status")}>
            <Tag
              color={
                status === LeaveStatus.Approved
                  ? "green"
                  : status === LeaveStatus.Pending
                    ? "orange"
                    : status === LeaveStatus.Cancelled
                      ? "orange"
                      : "red"
              }
            >
              {getLocalizedStatus(status)}
            </Tag>
          </Descriptions.Item>

          {/* ✅ Only show action buttons for Pending or Cancelled leaves */}
          {status !== LeaveStatus.Approved && status !== LeaveStatus.Rejected && (
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
      ) : (
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default LeaveViewDrawer;
