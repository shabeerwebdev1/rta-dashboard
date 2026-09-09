import React, { useState, useEffect, useMemo } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Form, Select } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { theme } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/ar";

import {
  useLazyGetReviewOptionsQuery,
  useUpdateParkonicsLocationMutation,
  useLazyGetReviewHistoryQuery,
  useLazyGetEntityHistoryQuery,
} from "../../services/rtkApiFactory";

import { useAppNotification } from "../../utils/notificationManager";
import ReviewTimeline from "../ReviewTimeline";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ParkonicLocationViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  locationGuid?: string;
  config: any;
  isLoading?: boolean;
}

const ParkonicLocationViewDrawer: React.FC<ParkonicLocationViewDrawerProps> = ({
  open,
  onClose,
  record,
  locationGuid,
  config,
  isLoading = false,
}) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const notification = useAppNotification();
  const [form] = Form.useForm();

  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [comments, setComments] = useState("");

  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();

  const [updateLocation, { isLoading: isSubmitting }] = useUpdateParkonicsLocationMutation();

  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();

  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();

  const resolvedLocationGuid =
    locationGuid || record?.locationGUID || record?.LocationGuid || record?.locationGuid || record?.EntityGUID || "";

  const resolvedEntityCode = record?.EntityCode || record?.entityCode || "parking-parkonic-location";

  useEffect(() => {
    if (!open || !record) return;

    if (record?.$SKWorkItemData) {
      getReviewOptions(record.$SKWorkItemData);
    }

    if (!resolvedLocationGuid || !resolvedEntityCode) return;

    if (record?.$SKWorkItemData) {
      getReviewHistory({ entityCode: resolvedEntityCode, entityId: resolvedLocationGuid });
    } else {
      getEntityHistory({ entityCode: resolvedEntityCode, entityId: resolvedLocationGuid });
    }
  }, [open, record, resolvedLocationGuid, resolvedEntityCode]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAction(null);
      setComments("");
    }
  }, [open]);

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    return dayjs(value)
      .locale(i18n.language)
      .format(i18n.language === "ar" ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

  const renderStatus = (status: boolean) => {
    return status ? <Tag color="green">{t("status.approved")}</Tag> : <Tag color="orange">{t("status.pending")}</Tag>;
  };

  const hideFooterActions = !record?.$SKWorkItemData;

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((o: any) => o.ActivityOptionGUID === value);
    setSelectedAction(opt);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

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
        locationGUID: resolvedLocationGuid,
        review: {
          reviewStatusCode: selectedAction.ReviewStatusCode,
          activityCode: record.ActivityCode || "",
          entityCode: resolvedEntityCode,
          entityGUID: resolvedLocationGuid,
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments: comments || "",
          rcwuri: record.$SKWorkItemData,
        },
      };

      const response = await updateLocation(payload).unwrap();
      notification.success(response, "");
      onClose();
    } catch (err: any) {
      if (err.errorFields) return;
      notification.error(err, "");
    }
  };

  return (
    <Modal open={open} onCancel={onClose} width={1400} footer={null} title={null} closable={false}>
      <Spin spinning={isLoading || loadingOptions || isSubmitting || historyLoading || entityHistoryLoading}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t("page.viewTitle", { entity: t(config.name.singular) })}
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
                {/* Location Details */}
                <Card
                  size="small"
                  headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={[0, 12]}>
                    <Col span={8}>
                      <Text strong>{t("form.parkonicsLocationId")}:</Text>
                    </Col>
                    <Col span={16}>{record.parkonics_Location_Id || "—"}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.parkingNameEn")}:</Text>
                    </Col>
                    <Col span={16}>{record.parking_Name_En || "—"}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.parkingNameAr")}:</Text>
                    </Col>
                    <Col span={16}>{record.parking_Name_Ar || "—"}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.addedOn")}:</Text>
                    </Col>
                    <Col span={16}>{formatDate(record.created_At)}</Col>

                    <Col span={8}>
                      <Text strong>{t("form.status")}:</Text>
                    </Col>
                    <Col span={16}>{renderStatus(record.isUpdatedBack)}</Col>
                  </Row>
                </Card>

                {!hideFooterActions && (
                  <Card size="small" headStyle={{ background: colorBgContainer, fontWeight: 600 }}>
                    <Form form={form} layout="vertical">
                      <Form.Item
                        name="action"
                        label={<Text strong>{isRTL ? "الإجراء" : "Action"}</Text>}
                        rules={[{ required: true, message: "Please select an action" }]}
                      >
                        <Select
                          placeholder="Select action"
                          onChange={handleActionChange}
                          value={selectedAction?.ActivityOptionGUID}
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
                )}
              </div>
            </Col>

            {/* RIGHT SIDE TIMELINE */}
            <Col span={6}>
              <ReviewTimeline data={record?.$SKWorkItemData ? reviewHistory : entityHistory} />
            </Col>
          </Row>
        )}
      </Spin>
    </Modal>
  );
};

export default ParkonicLocationViewDrawer;
