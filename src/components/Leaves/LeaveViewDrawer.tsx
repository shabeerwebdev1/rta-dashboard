/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space, Input, Form } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import { LeaveStatus } from "../../config/pageConfigs/leaveManagementConfig";
import { useUpdateLeaveStatusMutation } from "../../services/rtkApiFactory";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../../utils/notificationManager";

interface LeaveViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  onShare?: () => void;
  getLeaveTypeName?: (code: number | string | undefined) => string;
}

// Helper function to format date based on language
const formatDate = (date: string) => {
  if (!date) return "";

  const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");
  const isArabic = lang.startsWith("ar");

  return dayjs(date)
    .locale(isArabic ? "ar" : "en")
    .format(isArabic ? "DD MMMM YYYY" : "DD MMM YYYY");
};

const LeaveViewDrawer: React.FC<LeaveViewDrawerProps> = ({ open, onClose, record, onShare, getLeaveTypeName }) => {
  const notification = useAppNotification();
  const [updateLeaveStatus, { isLoading }] = useUpdateLeaveStatusMutation();
  const { i18n, t } = useTranslation();
  const [form] = Form.useForm();

  const [status, setStatus] = useState<number>(record?.status ?? LeaveStatus.Pending);
  const [rejectionReason, setRejectionReason] = useState("");
  const isRtl = i18n.dir() === "rtl";

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setRejectionReason(record.rejectionReason || "");
      form.setFieldsValue({
        rejectionReason: record.rejectionReason || "",
      });
    }
  }, [record, form]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setRejectionReason("");
      form.resetFields();
    }
  }, [open, form]);

  const handleUpdateStatus = async (newStatus: LeaveStatus) => {
    const leaveId = record?.leaveId || record?.id;

    if (!leaveId) {
      notification.error(null, t("messages.missingLeaveId") || "Missing leave ID");
      return;
    }

    // If rejecting, validate the rejection reason first
    if (newStatus === LeaveStatus.Rejected) {
      try {
        await form.validateFields(["rejectionReason"]);
      } catch {
        // Validation failed, don't proceed
        return;
      }
    }

    try {
      const payload: any = {
        id: leaveId,
        status: newStatus,
      };

      // Add rejection reason if rejecting
      if (newStatus === LeaveStatus.Rejected) {
        const reason = form.getFieldValue("rejectionReason");
        payload.rejectionReason = reason;
      }

      const result = await updateLeaveStatus(payload).unwrap();

      setStatus(newStatus);
      notification.success(result, t("messages.leaveUpdated"));
      form.resetFields();
      onClose();
    } catch (err: any) {
      notification.error(err, t("messages.failedToUpdateLeave"));
    }
  };

  // Helper: Localized status text
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
        <Form form={form} layout="vertical">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("form.employeeName")}>{record.userName}</Descriptions.Item>

            <Descriptions.Item label={t("form.fromDate")}>{formatDate(record.fromDate)}</Descriptions.Item>

            <Descriptions.Item label={t("form.toDate")}>{formatDate(record.toDate)}</Descriptions.Item>

            <Descriptions.Item label={t("form.totalLeaveDays")}>{record.totalLeaveDays}</Descriptions.Item>

            {/* Localized leave type name */}
            <Descriptions.Item label={t("form.leaveType")}>
              {getLeaveTypeName ? getLeaveTypeName(record.leaveType) : record.leaveType}
            </Descriptions.Item>

            {/* Renamed from Leave Reason to Comments */}
            <Descriptions.Item label={t("form.comments") || "Comments"}>{record.leaveReason || "-"}</Descriptions.Item>

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

            {/* Show rejection reason input for Pending/Cancelled or display it for Rejected */}
            {status !== LeaveStatus.Approved && (
              <Descriptions.Item label={t("form.rejectionReason") || "Rejection Reason"}>
                {status === LeaveStatus.Rejected ? (
                  // Display rejection reason for rejected leaves
                  <div>{record.rejectionReason || "-"}</div>
                ) : (
                  // Show input field for pending/cancelled leaves
                  <Form.Item
                    name="rejectionReason"
                    style={{ marginBottom: 0 }}
                    rules={[
                      {
                        required: false, // Not required until they click reject
                        message: t("validation.required", { field: t("form.rejectionReason") || "Rejection Reason" }),
                      },
                      {
                        min: 10,
                        message:
                          t("validation.minLength", { field: t("form.rejectionReason"), min: 10 }) ||
                          "Please enter at least 10 characters",
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder={
                        t("placeholders.rejectionReason") || "Enter reason for rejection (required when rejecting)"
                      }
                      maxLength={500}
                      // Removed showCount prop to hide 0/500 counter
                    />
                  </Form.Item>
                )}
              </Descriptions.Item>
            )}

            {/* Only show action buttons for Pending or Cancelled leaves */}
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
        </Form>
      ) : (
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default LeaveViewDrawer;
