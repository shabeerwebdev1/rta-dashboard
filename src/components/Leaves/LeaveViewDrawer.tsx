/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Form, theme, Select } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { LeaveStatus } from "../../config/pageConfigs/leaveManagementConfig";
import { useUpdateLeaveStatusMutation } from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../../utils/notificationManager";
import ReviewTimeline from "../ReviewTimeline";
import dayjs from "dayjs";
import "dayjs/locale/ar";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface LeaveViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  onShare?: () => void;
  getLeaveTypeName?: (code: number | string | undefined) => string;
}

const LeaveViewDrawer: React.FC<LeaveViewDrawerProps> = ({ open, onClose, record, getLeaveTypeName }) => {
  const { token } = theme.useToken();
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();

  const [updateLeaveStatus, { isLoading }] = useUpdateLeaveStatusMutation();
  const [form] = Form.useForm();

  const isRTL = i18n.dir() === "rtl";

  const [status, setStatus] = useState<number>(record?.status ?? LeaveStatus.Pending);

  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setStatus(record.status ?? LeaveStatus.Pending);
      form.setFieldsValue({
        rejectionReason: record.rejectionReason || "",
      });
    }
  }, [record, form]);

  const leaveId = record?.leaveId || record?.id;

  const formatDate = (value: string) => {
    if (!value) return "—";

    return dayjs(value)
      .locale(isRTL ? "ar" : "en")
      .format(isRTL ? "DD MMMM YYYY" : "DD MMM YYYY");
  };

  const statusLabels = useMemo(
    () => ({
      [LeaveStatus.Pending]: t("status.pending"),
      [LeaveStatus.Approved]: t("status.approved"),
      [LeaveStatus.Rejected]: t("status.rejected"),
      [LeaveStatus.Cancelled]: t("status.cancelled"),
    }),
    [t],
  );

  const getStatusColor = (s: LeaveStatus) => {
    if (s === LeaveStatus.Approved) return "green";
    if (s === LeaveStatus.Rejected) return "red";
    if (s === LeaveStatus.Cancelled) return "default";
    return "orange";
  };

  const handleUpdateStatus = async (newStatus: LeaveStatus) => {
    if (!leaveId) return;

    if (newStatus === LeaveStatus.Rejected) {
      const reason = form.getFieldValue("rejectionReason");

      if (!reason) {
        form.setFields([
          {
            name: "rejectionReason",
            errors: [
              t("validation.required", {
                field: t("form.rejectionReason"),
              }),
            ],
          },
        ]);
        return;
      }
    }

    try {
      const payload: any = {
        id: leaveId,
        status: newStatus,
      };

      if (newStatus === LeaveStatus.Rejected) {
        payload.rejectionReason = form.getFieldValue("rejectionReason");
      }

      const res = await updateLeaveStatus(payload).unwrap();

      setStatus(newStatus);

      notification.success(res, t("messages.leaveUpdated"));

      onClose();
    } catch (err: any) {
      notification.error(err, t("messages.failedToUpdateLeave"));
    }
  };

  return (
    <Modal open={open} onCancel={onClose} width={1400} footer={null} title={null} closable={false}>
      <Spin spinning={isLoading}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t("form.leaveDetails")}
            </Title>
          </Col>

          <Col>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </Col>
        </Row>

        {!record ? (
          <Empty description="No Data" />
        ) : (
          <Row gutter={24}>
            {/* LEFT SIDE */}
            <Col span={18}>
              <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {/* Leave Details */}
                <Card
                  size="small"
                  headStyle={{
                    background: token.colorBgContainer,
                    fontWeight: 600,
                  }}
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={[0, 12]}>
                    <Col span={8}>
                      <Text strong>{t("form.employeeName")}:</Text>
                    </Col>
                    <Col span={16}>{record.userName || record.employeeName || "—"}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.fromDate")}:</Text>
                    </Col>
                    <Col span={16}>{formatDate(record.fromDate)}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.toDate")}:</Text>
                    </Col>
                    <Col span={16}>{formatDate(record.toDate)}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.totalLeaveDays")}:</Text>
                    </Col>
                    <Col span={16}>{record.totalLeaveDays ?? "—"}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.leaveType")}:</Text>
                    </Col>
                    <Col span={16}>{getLeaveTypeName ? getLeaveTypeName(record.leaveType) : record.leaveType}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.comments")}:</Text>
                    </Col>
                    <Col span={16}>{record.leaveReason || "—"}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.status")}:</Text>
                    </Col>
                    <Col span={16}>
                      <Tag color={getStatusColor(status)}>{statusLabels[status]}</Tag>
                    </Col>
                  </Row>
                </Card>

                {/* Actions */}
                <Card
                  size="small"
                  headStyle={{
                    background: token.colorBgContainer,
                    fontWeight: 600,
                  }}
                >
                  {status !== LeaveStatus.Approved && status !== LeaveStatus.Rejected && (
                    <Form form={form} layout="vertical">
                      {/* Action Dropdown */}
                      <Form.Item
                        name="action"
                        label={<Text strong>{isRTL ? "الإجراء" : "Action"}</Text>}
                        rules={[
                          {
                            required: true,
                            message: isRTL ? "يرجى اختيار إجراء" : "Please select an action",
                          },
                        ]}
                      >
                        <Select
                          placeholder={isRTL ? "اختر الإجراء" : "Select action"}
                          onChange={(value) => setSelectedAction(value)}
                        >
                          <Select.Option value="approve">{t("form.approve")}</Select.Option>

                          <Select.Option value="reject">{t("form.reject")}</Select.Option>
                        </Select>
                      </Form.Item>

                      {/* Comments */}
                      <Form.Item name="rejectionReason" label={<Text strong>{t("form.comments")}</Text>}>
                        <TextArea
                          rows={3}
                          placeholder={t("placeholders.rejectionReason")}
                          disabled={selectedAction !== "reject"}
                        />
                      </Form.Item>

                      {/* Footer Buttons */}
                      <Space>
                        <Button
                          type="primary"
                          loading={isLoading}
                          onClick={() => {
                            if (selectedAction === "approve") {
                              handleUpdateStatus(LeaveStatus.Approved);
                            }

                            if (selectedAction === "reject") {
                              handleUpdateStatus(LeaveStatus.Rejected);
                            }
                          }}
                        >
                          {isRTL ? "إرسال" : "Submit"}
                        </Button>

                        <Button danger onClick={onClose}>
                          {isRTL ? "إلغاء" : "Cancel"}
                        </Button>
                      </Space>
                    </Form>
                  )}
                </Card>
              </div>
            </Col>

            {/* RIGHT SIDE TIMELINE */}
            <Col span={6}>
              <ReviewTimeline data={record?.timeline || []} />
            </Col>
          </Row>
        )}
      </Spin>
    </Modal>
  );
};

export default LeaveViewDrawer;
