import React, { useEffect, useMemo, useState } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Form, theme, Select } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/ar";

import {
  useLazyGetEntityHistoryQuery,
  useLazyGetReviewHistoryQuery,
  useLazyGetReviewOptionsQuery,
  useUpdateLeaveStatusMutation,
  useLazyGetLookupsQuery,
} from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import ReviewTimeline from "../ReviewTimeline";
import { LeaveStatus } from "../../config/pageConfigs/leaveManagementConfig";

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
  const [form] = Form.useForm();

  const [updateLeaveStatus, { isLoading: isSubmitting }] = useUpdateLeaveStatusMutation();
  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();
  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();
  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();
  const [getLookups, { data: lookupData, isLoading: lookupsLoading }] = useLazyGetLookupsQuery();

  useEffect(() => {
    if (open && !getLeaveTypeName) {
      getLookups([1900]);
    }
  }, [open, getLeaveTypeName, getLookups]);

  const internalGetLeaveTypeName = (code: number | string | undefined) => {
    if (getLeaveTypeName) return getLeaveTypeName(code);

    if (code === undefined || code === null) return "N/A";
    const numericCode = typeof code === "string" ? parseInt(code, 10) : code;
    if (isNaN(numericCode as number)) return String(code);

    if (lookupData && Array.isArray(lookupData)) {
      const match = lookupData.find((item: any) => item.categoryId === 1900 && Number(item.value) === numericCode);
      if (match) {
        return i18n.language.startsWith("ar") ? match.labelAr : match.labelEn;
      }
    }
    return `Leave Type ${numericCode}`;
  };

  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<number>(record?.status ?? LeaveStatus.Pending);

  const isRTL = i18n.dir() === "rtl";
  const leaveId = record?.EntityGUID || record?.entityGUID || record?.leaveId || record?.id;

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

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

  const getLeaveStatusFromAction = (action: any): LeaveStatus => {
    const reviewStatusCode = String(action?.ReviewStatusCode ?? action?.reviewStatusCode ?? "").toLowerCase();
    const reviewStatus = String(action?.ReviewStatus ?? action?.reviewStatus ?? "").toLowerCase();
    const explicitStatus = action?.StatusCode ?? action?.LeaveStatusCode;

    if (
      reviewStatusCode.includes("approve") ||
      reviewStatusCode.includes("accept") ||
      reviewStatus.includes("approve") ||
      reviewStatus.includes("accept")
    ) {
      return LeaveStatus.Approved;
    }

    if (
      reviewStatusCode.includes("reject") ||
      reviewStatusCode.includes("send-back") ||
      reviewStatus.includes("reject")
    ) {
      return LeaveStatus.Rejected;
    }

    if (
      explicitStatus === LeaveStatus.Approved ||
      explicitStatus === LeaveStatus.Rejected ||
      explicitStatus === LeaveStatus.Pending ||
      explicitStatus === LeaveStatus.Cancelled
    ) {
      return explicitStatus;
    }

    return record?.status ?? LeaveStatus.Pending;
  };

  useEffect(() => {
    if (!open || !record) return;

    setStatus(record.status ?? LeaveStatus.Pending);
    setComments("");

    const entityId = record?.EntityGUID || record?.entityGUID || record?.leaveId || record?.id;
    const entityCode = record?.EntityCode || record?.entityCode || "parking-user-leave-request";

    if (record?.$SKWorkItemData) {
      getReviewOptions(record.$SKWorkItemData);
    }

    if (!entityId || !entityCode) return;

    if (record?.$SKWorkItemData) {
      getReviewHistory({ entityCode, entityId });
    } else {
      getEntityHistory({ entityCode, entityId });
    }
  }, [open, record]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAction(null);
      setComments("");
    }
  }, [open, form]);

  const formatDate = (value: string) => {
    if (!value) return "—";

    return dayjs(value)
      .locale(isRTL ? "ar" : "en")
      .format(isRTL ? "DD MMMM YYYY" : "DD MMM YYYY");
  };

  const hideFooterActions =
    status === LeaveStatus.Approved || status === LeaveStatus.Rejected || !record?.$SKWorkItemData;

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((item: any) => item.ActivityOptionGUID === value);
    setSelectedAction(opt);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!leaveId) {
        notification.error({ data: { en_Msg: "Missing leave id", ar_Msg: "معرف الإجازة مفقود" } }, "");
        return;
      }

      if (!selectedAction) {
        notification.error({ data: { en_Msg: "Please select an action", ar_Msg: "الرجاء تحديد إجراء" } }, "");
        return;
      }

      if (selectedAction.IsCommentMandatory && !comments.trim()) {
        notification.error(
          { data: { en_Msg: "Comments are required for this action", ar_Msg: "التعليقات مطلوبة لهذا الإجراء" } },
          "",
        );
        return;
      }

      const payload = {
        id: leaveId,
        status: getLeaveStatusFromAction(selectedAction),
        comments: comments || "",
        review: {
          reviewStatusCode: selectedAction.ReviewStatusCode,
          activityCode: record?.ActivityCode ?? record?.nvarchar3 ?? "",
          entityCode: record?.EntityCode ?? record?.entityCode ?? record?.nvarchar12 ?? "parking-user-leave-request",
          entityGUID: record?.EntityGUID ?? record?.entityGUID ?? record?.leaveId ?? record?.id ?? "",
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments: comments || "",
          rcwuri: record?.$SKWorkItemData || "",
        },
      };

      const res = await updateLeaveStatus(payload).unwrap();
      notification.success(res, "");
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      notification.error(err, "");
    }
  };

  return (
    <Modal open={open} onCancel={onClose} width={1400} footer={null} title={null} closable={false}>
      <Spin spinning={isSubmitting || loadingOptions || historyLoading || entityHistoryLoading || lookupsLoading}>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
          <div
            style={{
              padding: 10,
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: token.colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Row align="middle" style={{ marginBottom: 0, direction: isRTL ? "rtl" : "ltr" }}>
              <Col>
                <Space size="middle" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {t("form.leaveDetails")}
                    {/* <Text type="danger">#{leaveId || "—"}</Text> */}
                  </Title>
                  <Tag color={getStatusColor(status)}>{statusLabels[status]}</Tag>
                </Space>
              </Col>

              <Col flex="auto" />

              <Col>
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
              </Col>
            </Row>
          </div>

          <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
            {!record ? (
              <Empty description="No Data" />
            ) : (
              <Row gutter={24} dir={isRTL ? "rtl" : "ltr"}>
                <Col span={18}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Card
                        size="small"
                        headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
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
                          <Col span={16}>{internalGetLeaveTypeName(record.leaveType)}</Col>

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
                    </Col>

                    {!hideFooterActions && (
                      <Col span={24}>
                        <Card
                          size="small"
                          headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
                          style={{ marginTop: 16 }}
                        >
                          <Form form={form} layout="vertical">
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
                                onChange={handleActionChange}
                                loading={loadingOptions}
                              >
                                {reviewOptions.map((opt: any) => (
                                  <Select.Option key={opt.ActivityOptionGUID} value={opt.ActivityOptionGUID}>
                                    {opt.ReviewStatus}
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>

                            <Form.Item name="comments" label={<Text strong>{t("form.comments")}</Text>}>
                              <TextArea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
                            </Form.Item>

                            <Space>
                              <Button onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
                              <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
                                {isRTL ? "إرسال" : "Submit"}
                              </Button>
                            </Space>
                          </Form>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </Col>

                <Col span={6}>
                  <ReviewTimeline data={record?.$SKWorkItemData ? reviewHistory : entityHistory} />
                </Col>
              </Row>
            )}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default LeaveViewDrawer;
