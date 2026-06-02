/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Empty,
  Spin,
  Tag,
  Space,
  Image,
  theme,
  Form,
  Select,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import {
  useUpdateTowingStatusMutation,
  useGetInspectionAttachmentsQuery,
  useGetTowingEvidenceQuery,
  useLazyGetReviewOptionsQuery,
  useLazyGetReviewHistoryQuery,
  useLazyGetEntityHistoryQuery,
  getMobileFileUrl,
  getFileUrl,
} from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { useAppNotification } from "../../utils/notificationManager";
import { TowingStatus } from "../../config/pageConfigs/towingConfig";
import { formatDateDisplay } from "../../utils/dateFormatter";
import ReviewTimeline from "../ReviewTimeline";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TowingViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const TowingViewDrawer: React.FC<TowingViewDrawerProps> = ({ open, onClose, record }) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();
  const notification = useAppNotification();
  const [form] = Form.useForm();
  const isRTL = i18n.dir() === "rtl";
  const L = (en: string, ar: string) => (isRTL ? ar : en);

  const [updateTowingStatus, { isLoading }] = useUpdateTowingStatusMutation();
  const [comments, setComments] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();
  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();
  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();

  const [currentStatus, setCurrentStatus] = useState<TowingStatus>(TowingStatus.Pending);
  const [resolvedInspectionGUID, setResolvedInspectionGUID] = useState<string>("");

  useEffect(() => {
    if (record) {
      const status = String(record.towing_Status || record.towing_status || record.status || "").toUpperCase();
      setCurrentStatus(
        Object.values(TowingStatus).includes(status as TowingStatus) ? (status as TowingStatus) : TowingStatus.Pending,
      );
      setResolvedInspectionGUID(record?.EntityGUID || record?.entityGUID || record?.inspectionGUID || "");
      setComments("");
      setSelectedAction(null);
      if (record?.$SKWorkItemData) {
        getReviewOptions(record.$SKWorkItemData);
      }
    }
  }, [record, getReviewOptions]);

  useEffect(() => {
    if (!open || !record) return;
    const entityId = record?.EntityGUID || record?.entityGUID || record?.inspectionGUID || "";
    const entityCode = record?.EntityCode || record?.entityCode || "parking-towing";
    if (!entityId || !entityCode) return;
    if (record?.$SKWorkItemData) {
      getReviewHistory({ entityCode, entityId });
    } else {
      getEntityHistory({ entityCode, entityId });
    }
  }, [open, record, getReviewHistory, getEntityHistory]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
      setComments("");
      form.resetFields();
    }
  }, [open, form]);

  const isCompleted = currentStatus === TowingStatus.Completed;
  const isPending = currentStatus === TowingStatus.Pending;
  const hasInboxWorkflow = !!record?.$SKWorkItemData;
  const hideFooterActions = !hasInboxWorkflow || !isPending;

  const { data: attachments = [], isLoading: loadingAttachments } = useGetInspectionAttachmentsQuery(
    resolvedInspectionGUID ? { inspectionGUID: resolvedInspectionGUID, entityCode: "parking-towing" } : skipToken,
  );

  const { data: evidenceData, isLoading: loadingEvidence } = useGetTowingEvidenceQuery(
    isCompleted && resolvedInspectionGUID ? { towingId: resolvedInspectionGUID } : skipToken,
  );

  const towingStart = evidenceData?.data?.startLat
    ? { lat: evidenceData.data.startLat, lng: evidenceData.data.startLng }
    : null;
  const towingEnd = evidenceData?.data?.endLat
    ? { lat: evidenceData.data.endLat, lng: evidenceData.data.endLng }
    : null;
  const mapCenter = towingStart
    ? [towingStart.lng, towingStart.lat]
    : record?.longitude && record?.latitude
      ? [record.longitude, record.latitude]
      : [55.2743, 25.1972];

  const getStatusColor = (status: TowingStatus): string => {
    switch (status) {
      case TowingStatus.Approved:
        return "green";
      case TowingStatus.Rejected:
        return "red";
      case TowingStatus.Cancelled:
        return "default";
      case TowingStatus.InProgress:
        return "blue";
      case TowingStatus.Completed:
        return "cyan";
      default:
        return "blue";
    }
  };

  const getStatusLabel = (status: TowingStatus): string => {
    switch (status) {
      case TowingStatus.Approved:
        return t("status.approved");
      case TowingStatus.Rejected:
        return t("status.rejected");
      case TowingStatus.Cancelled:
        return t("status.cancelled");
      case TowingStatus.InProgress:
        return t("status.inProgress");
      case TowingStatus.Completed:
        return t("status.completed");
      default:
        return t("status.pending");
    }
  };

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

  const getTowingStatusFromAction = (action: any): number => {
    const code = String(action?.ReviewStatusCode ?? action?.reviewStatusCode ?? "").toLowerCase();
    const label = String(action?.ReviewStatus ?? action?.reviewStatus ?? "").toLowerCase();
    const explicit = action?.StatusCode ?? action?.TowingStatusCode;
    if (code.includes("approve") || code.includes("accept") || label.includes("approve") || label.includes("accept"))
      return 1;
    if (code.includes("reject") || code.includes("send-back") || label.includes("reject")) return 3;
    if (explicit === 1 || explicit === 3) return explicit;
    return 0;
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (!resolvedInspectionGUID) {
        notification.error({ data: { en_Msg: "Missing inspection GUID", ar_Msg: "معرف الفحص مفقود" } }, "");
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
        inspectionGUID: resolvedInspectionGUID,
        towing_status: getTowingStatusFromAction(selectedAction),
        review: {
          reviewStatusCode: selectedAction.ReviewStatusCode,
          activityCode: record?.ActivityCode || record?.nvarchar3 || "",
          entityCode: record?.EntityCode || record?.entityCode || record?.nvarchar12 || "parking-towing",
          entityGUID: resolvedInspectionGUID,
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments: comments || "",
          rcwuri: record?.$SKWorkItemData || "",
        },
      };
      const res = await updateTowingStatus(payload).unwrap();
      notification.success(res, "");
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      notification.error(err, "");
    }
  };

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((item: any) => item.ActivityOptionGUID === value);
    setSelectedAction(opt || null);
  };

  const towingDocuments = useMemo(() => {
    const docs = evidenceData?.data?.towingDocuments;
    return docs ? docs.split("; ").filter((p: string) => p.trim()) : [];
  }, [evidenceData]);

  const getDocumentTitle = (filePath: string): string => {
    const file = filePath.toLowerCase();
    const isAr = i18n.language === "ar";
    if (file.includes("driverphoto")) return isAr ? "صورة السائق" : "Driver Photo";
    if (file.includes("signature")) return isAr ? "توقيع السائق" : "Driver Signature";
    if (file.includes("emiratesid")) return isAr ? "صورة بطاقة الهوية الإماراتية للسائق" : "Driver Emirates ID";
    return isAr ? "مستند" : "Document";
  };

  const shouldShowVideo = isCompleted || !!record?.evidenceFileName;
  const tempVideoUrl =
    "https://media.istockphoto.com/id/1421938947/video/tow-truck-transportation-4k-resolution.mp4?s=mp4-640x640-is&k=20&c=ii_HinNEKIvDOaPHA8bb8a5Nojmb09HVOp3JDLyPDvI=";
  const videoUrl = record?.evidenceFileName ? getMobileFileUrl(record.evidenceFileName) : tempVideoUrl;

  // ─── shared card head style ───────────────────────────────────────────────
  const cardHeadStyle = {
    background: token.colorBgContainer,
    fontWeight: 600 as const,
    textAlign: (isRTL ? "right" : "left") as "right" | "left",
  };

  // ─── label/value row helpers ──────────────────────────────────────────────
  const LabelCol = ({ label }: { label: string }) => (
    <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
      <Text strong>{label}:</Text>
    </Col>
  );
  const ValueCol = ({ children }: { children: React.ReactNode }) => (
    <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
      {children}
    </Col>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1600}
      footer={null}
      title={null}
      closable={false}
      style={{ top: 40 }}
      bodyStyle={{ padding: 0 }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Spin
        spinning={
          isLoading || loadingOptions || historyLoading || entityHistoryLoading || loadingAttachments || loadingEvidence
        }
      >
        {/* Outer flex column — fills the modal body */}
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
          {/* ── Fixed Header ─────────────────────────────────────────────── */}
          <div
            style={{
              padding: 10,
              flexShrink: 0,
              background: token.colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Row align="middle" style={{ direction: isRTL ? "rtl" : "ltr" }}>
              <Col>
                <Space size="middle" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {t("form.towingDetails")} <Text type="danger">#{record?.plateNumber || "—"}</Text>
                  </Title>
                  <Tag color={getStatusColor(currentStatus)}>{getStatusLabel(currentStatus)}</Tag>
                </Space>
              </Col>
              <Col flex="auto" />
              <Col>
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
              </Col>
            </Row>
          </div>

          {/* ── Scrollable Body ───────────────────────────────────────────── */}
          <div style={{ padding: 24, overflowY: "auto", flex: 1, minHeight: 0 }}>
            {!record ? (
              <Empty description={t("common.noData")} />
            ) : (
              <Row gutter={24} dir={isRTL ? "rtl" : "ltr"}>
                {/* ── Left 18 cols – main content ───────────────────────── */}
                <Col span={18}>
                  {/* ① TOP ROW: Vehicle Details  |  Towing Details */}
                  <Row gutter={16}>
                    {/* Vehicle Details card */}
                    <Col span={12}>
                      <Card
                        title={
                          <Text strong style={{ fontSize: "16px" }}>
                            {L("Vehicle Details", "تفاصيل المركبة")}
                          </Text>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                        headStyle={cardHeadStyle}
                      >
                        <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                          <LabelCol label={t("form.plateNumber")} />
                          <ValueCol>{record.plateNumber || "—"}</ValueCol>

                          <LabelCol label={t("form.vehicleName")} />
                          <ValueCol>{record.vehicleBrand || "—"}</ValueCol>

                          <LabelCol label={t("form.vehicleColor")} />
                          <ValueCol>{record.vehicleColor || "—"}</ValueCol>

                          <LabelCol label={t("form.vehicleOwnerName")} />
                          <ValueCol>{record.vehicleOwnerName || "—"}</ValueCol>

                          <LabelCol label={t("form.vehicleOwnerMobile")} />
                          <ValueCol>{record.vehicleOwnerMobile || "—"}</ValueCol>
                        </Row>
                      </Card>
                    </Col>

                    {/* Towing Details card */}
                    <Col span={12}>
                      <Card
                        title={
                          <Text strong style={{ fontSize: "16px" }}>
                            {t("form.towingDetails")}
                          </Text>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                        headStyle={cardHeadStyle}
                      >
                        <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                          <LabelCol label={t("form.towingDate")} />
                          <ValueCol>
                            {formatDateDisplay(
                              record.entityDateTime || record.datetime1 || record.createdDateTime,
                              i18n.language,
                            )}
                          </ValueCol>

                          <LabelCol label={t("form.status")} />
                          <ValueCol>
                            <Tag color={getStatusColor(currentStatus)}>{getStatusLabel(currentStatus)}</Tag>
                          </ValueCol>

                          {record.lastReviewComments && (
                            <>
                              <LabelCol label={t("form.lastReviewComments")} />
                              <ValueCol>{record.lastReviewComments}</ValueCol>
                            </>
                          )}
                        </Row>
                      </Card>
                    </Col>
                  </Row>

                  {/* ② Map card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.location")}
                      </Text>
                    }
                    size="small"
                    style={{ marginBottom: 16 }}
                    headStyle={cardHeadStyle}
                  >
                    <ArcGISMap
                      inspectors={
                        !isCompleted
                          ? [
                              {
                                id: 1,
                                name: "Towing Location",
                                lat: record.latitude,
                                lng: record.longitude,
                                status: "Towing",
                              },
                            ]
                          : []
                      }
                      center={mapCenter}
                      height="340px"
                      zoom={isCompleted ? 13 : 16}
                      showTowingRoute={isCompleted && towingStart && towingEnd}
                      towingStartPoint={towingStart || undefined}
                      towingEndPoint={towingEnd || undefined}
                      legendEnabled={false}
                    />
                  </Card>

                  {/* ③ Attached Photos card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.AttachedPhotos")}
                      </Text>
                    }
                    size="small"
                    style={{ marginBottom: 16 }}
                    headStyle={cardHeadStyle}
                  >
                    <Spin spinning={loadingAttachments}>
                      {attachments.length > 0 ? (
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <Image.PreviewGroup>
                            {attachments.map((file: any) => (
                              <Image
                                key={file.attachmentGUID}
                                width={120}
                                height={120}
                                src={getMobileFileUrl(file.filePath)}
                                style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0" }}
                                preview={{ mask: null }}
                              />
                            ))}
                          </Image.PreviewGroup>
                        </div>
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={t("common.noData")}
                          style={{ padding: "20px 0" }}
                        />
                      )}
                    </Spin>
                  </Card>

                  {/* ④ Towing Video card (completed / evidenceFileName only) */}
                  {shouldShowVideo && (
                    <Card
                      title={
                        <Text strong style={{ fontSize: "16px" }}>
                          {t("form.towingVideo")}
                        </Text>
                      }
                      size="small"
                      style={{ marginBottom: 16 }}
                      headStyle={cardHeadStyle}
                    >
                      <video
                        width="100%"
                        height={320}
                        controls
                        style={{ border: "1px solid #ccc", borderRadius: 8, background: "#000", display: "block" }}
                      >
                        <source src={videoUrl} type="video/mp4" />
                      </video>
                    </Card>
                  )}

                  {/* ⑤ Evidence Documents card (completed only) */}
                  {isCompleted && towingDocuments.length > 0 && (
                    <Card
                      title={
                        <Text strong style={{ fontSize: "16px" }}>
                          {t("form.towingDocuments")}
                        </Text>
                      }
                      size="small"
                      style={{ marginBottom: 16 }}
                      headStyle={cardHeadStyle}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                        {towingDocuments.map((p: string, i: number) => (
                          <div key={i} style={{ width: 120, textAlign: "center" }}>
                            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{getDocumentTitle(p)}</div>
                            <Image
                              width={120}
                              height={120}
                              src={getFileUrl(p)}
                              style={{
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "1px solid #ddd",
                                padding: 4,
                                background: "#fff",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </Col>

                {/* ── Right 6 cols – Review Timeline ────────────────────── */}
                <Col span={6}>
                  <ReviewTimeline data={record?.$SKWorkItemData ? reviewHistory : entityHistory} />
                </Col>
              </Row>
            )}
          </div>

          {/* ── Fixed Footer — sibling to scroll div, never scrolls away ── */}
          {!hideFooterActions && (
            <div
              style={{
                padding: "16px 24px",
                flexShrink: 0,
                background: token.colorBgContainer,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Form form={form} layout="vertical" dir={isRTL ? "rtl" : "ltr"}>
                <Row gutter={[16, 16]} align="middle">
                  <Col span={6}>
                    <Form.Item
                      name="action"
                      label={<Text strong>{L("Action", "الإجراء")}</Text>}
                      rules={[
                        {
                          required: true,
                          message: L("Please select action", "الرجاء اختيار إجراء"),
                        },
                      ]}
                    >
                      <Select
                        placeholder={L("Select action", "اختر إجراء")}
                        onChange={handleActionChange}
                        allowClear
                        loading={loadingOptions}
                        value={selectedAction?.ActivityOptionGUID}
                      >
                        {reviewOptions.map((opt: any) => (
                          <Select.Option key={opt.ActivityOptionGUID} value={opt.ActivityOptionGUID}>
                            {opt.ReviewStatus}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name="review_comments"
                      label={<Text strong>{L("Comments", "التعليقات")}</Text>}
                      style={{ marginBottom: 0 }}
                    >
                      <TextArea rows={2} value={comments} onChange={(e) => setComments(e.target.value)} />
                    </Form.Item>
                  </Col>

                  <Col
                    span={6}
                    style={{
                      textAlign: isRTL ? "left" : "right",
                      paddingTop: 30,
                    }}
                  >
                    <Space>
                      <Button onClick={onClose}>{L("Cancel", "إلغاء")}</Button>
                      <Button type="primary" loading={isLoading} onClick={handleSubmit} disabled={!selectedAction}>
                        {L("Submit", "إرسال")}
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default TowingViewDrawer;
