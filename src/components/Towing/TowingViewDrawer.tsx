/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Input,
  Typography,
  Image,
  Empty,
  Spin,
  Modal,
  Row,
  Col,
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
  const { t, i18n } = useTranslation(); // 👈 Includes i18n
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
      setCurrentStatus((Object.values(TowingStatus).includes(status as TowingStatus) ? (status as TowingStatus) : TowingStatus.Pending));
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

  const isCompleted = currentStatus === TowingStatus.Completed;
  const isPending = currentStatus === TowingStatus.Pending;
  const hasInboxWorkflow = !!record?.$SKWorkItemData;

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

  const getStatusColor = (status: TowingStatus) => {
    switch (status) {
      case TowingStatus.Approved:
        return "green";
      case TowingStatus.Rejected:
        return "red";
      case TowingStatus.Cancelled:
        return "orange";
      case TowingStatus.InProgress:
        return "cyan";
      case TowingStatus.Completed:
        return "purple";
      default:
        return "blue";
    }
  };

  const getStatusLabel = (status: TowingStatus) => {
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

  const getTowingStatusFromAction = (action: any) => {
    const reviewStatusCode = String(action?.ReviewStatusCode ?? action?.reviewStatusCode ?? "").toLowerCase();
    const reviewStatus = String(action?.ReviewStatus ?? action?.reviewStatus ?? "").toLowerCase();
    const explicitStatus = action?.StatusCode ?? action?.TowingStatusCode;

    if (
      reviewStatusCode.includes("approve") ||
      reviewStatusCode.includes("accept") ||
      reviewStatus.includes("approve") ||
      reviewStatus.includes("accept")
    ) {
      return 1;
    }

    if (reviewStatusCode.includes("reject") || reviewStatusCode.includes("send-back") || reviewStatus.includes("reject")) {
      return 3;
    }

    if (explicitStatus === 1 || explicitStatus === 3) {
      return explicitStatus;
    }

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
    setSelectedAction(opt);
  };

  const hideFooterActions = !hasInboxWorkflow || !isPending;

  const handleCancel = () => {
    onClose();
  };

  const towingDocuments = useMemo(() => {
    const docs = evidenceData?.data?.towingDocuments;
    return docs ? docs.split("; ").filter((p: string) => p.trim()) : [];
  }, [evidenceData]);

  // --------- TITLE DETECTION (EN + AR AUTO SWITCH) ----------
  const getDocumentTitle = (filePath: string) => {
    const file = filePath.toLowerCase();
    const lang = i18n.language;
    const isAr = lang === "ar";

    if (file.includes("driverphoto")) return isAr ? "صورة السائق" : "Driver Photo";

    if (file.includes("signature")) return isAr ? "توقيع السائق" : "Driver Signature";

    if (file.includes("emiratesid")) return isAr ? "صورة بطاقة الهوية الإماراتية للسائق" : "Driver Emirates ID";

    return isAr ? "مستند" : "Document";
  };

  const shouldShowVideo = isCompleted || !!record?.evidenceFileName;

  const tempVideoUrl =
    "https://media.istockphoto.com/id/1421938947/video/tow-truck-transportation-4k-resolution.mp4?s=mp4-640x640-is&k=20&c=ii_HinNEKIvDOaPHA8bb8a5Nojmb09HVOp3JDLyPDvI=";

  const realVideoUrl = record?.evidenceFileName ? getMobileFileUrl(record.evidenceFileName) : null;

  const videoUrl = realVideoUrl || tempVideoUrl;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1600}
      centered
      title={null}
      footer={null}
      closable={false}
      style={{ top: 40 }}
      bodyStyle={{ padding: 0 }}
      dir={i18n.dir()}
    >
      {!record ? (
        <Empty description={t("common.noData")} />
      ) : (
        <Spin spinning={isLoading || loadingOptions || historyLoading || entityHistoryLoading || loadingAttachments || loadingEvidence}>
          <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #f0f0f0",
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                {t("form.towingDetails")}
              </Title>

              <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 18 }} />
            </div>

            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              <Row gutter={28} align="top">
                <Col span={16}>
                  <Title level={5} style={{ marginTop: 10 }}>
                    {t("form.location")}
                  </Title>

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
                height="400px"
                zoom={isCompleted ? 13 : 16}
                showTowingRoute={isCompleted && towingStart && towingEnd}
                towingStartPoint={towingStart || undefined}
                towingEndPoint={towingEnd || undefined}
              />

              <Descriptions bordered column={1} size="small" style={{ marginTop: 20 }}>
                <Descriptions.Item label={t("form.plateNumber")}>{record.plateNumber}</Descriptions.Item>
                <Descriptions.Item label={t("form.vehicleName")}>{record.vehicleBrand}</Descriptions.Item>
                <Descriptions.Item label={t("form.vehicleColor")}>{record.vehicleColor}</Descriptions.Item>
                <Descriptions.Item label={t("form.vehicleOwnerName")}>{record.vehicleOwnerName}</Descriptions.Item>
                <Descriptions.Item label={t("form.vehicleOwnerMobile")}>{record.vehicleOwnerMobile}</Descriptions.Item>

                <Descriptions.Item label={t("form.towingDate")}>
                  {formatDateDisplay(record.entityDateTime || record.datetime1 || record.createdDateTime, i18n.language)}
                </Descriptions.Item>

                <Descriptions.Item label={t("form.status")}>
                  <Tag color={getStatusColor(currentStatus)}>{getStatusLabel(currentStatus)}</Tag>
                </Descriptions.Item>

                {record.lastReviewComments && (
                  <Descriptions.Item label={t("form.lastReviewComments")}>{record.lastReviewComments}</Descriptions.Item>
                )}
              </Descriptions>

              <Title level={5} style={{ marginTop: 20 }}>
                {t("form.AttachedPhotos")}
              </Title>

              <Spin spinning={loadingAttachments}>
                {attachments.length ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {attachments.map((file) => (
                        <Image
                          key={file.attachmentGUID}
                          width={100}
                          height={100}
                          src={getMobileFileUrl(file.filePath)}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Empty />
                )}
              </Spin>

              {/* ----------- VIDEO SECTION ----------- */}
              {shouldShowVideo && (
                <>
                  <Title level={5} style={{ marginTop: 25 }}>
                    {t("form.towingVideo")}
                  </Title>

                  <video
                    width="100%"
                    height="360"
                    controls
                    autoPlay={false}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: 8,
                      background: "#000",
                      marginBottom: 10,
                    }}
                  >
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                </>
              )}

              {/* ----------- EVIDENCE DOCUMENTS ----------- */}
              {isCompleted && towingDocuments.length > 0 && (
                <>
                  <Title level={5} style={{ marginTop: 20 }}>
                    {t("form.towingDocuments")}
                  </Title>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                    {towingDocuments.map((p, i) => {
                      const title = getDocumentTitle(p);

                      return (
                        <div key={i} style={{ width: 120, textAlign: "center" }}>
                          <div
                            style={{
                              marginBottom: 6,
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {title}
                          </div>

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
                      );
                    })}
                  </div>
                </>
              )}

                  {!hideFooterActions && (
                    <>
                      <Title level={5} style={{ marginTop: 20 }}>
                        {L("Approval Actions", "إجراءات الاعتماد")}
                  </Title>

                  <Form form={form} layout="vertical">
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          name="action"
                          label={<Text strong>{L("Action", "الإجراء")}</Text>}
                          rules={[{ required: true, message: L("Please select an action", "الرجاء اختيار إجراء") }]}
                        >
                          <Select
                            placeholder={L("Select action", "اختر إجراء")}
                            onChange={handleActionChange}
                            allowClear
                            loading={loadingOptions}
                          >
                            {reviewOptions.map((opt: any) => (
                              <Select.Option key={opt.ActivityOptionGUID} value={opt.ActivityOptionGUID}>
                                {opt.ReviewStatus}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item
                          name="review_comments"
                          label={<Text strong>{L("Comments", "التعليقات")}</Text>}
                          rules={[
                            {
                              required: selectedAction?.IsCommentMandatory || false,
                              message: L("Please enter comments", "الرجاء إدخال التعليقات"),
                            },
                          ]}
                        >
                          <TextArea
                            rows={3}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder={L("Enter comments", "أدخل التعليقات")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Space style={{ marginTop: 10 }}>
                      <Button type="primary" loading={isLoading} onClick={handleSubmit}>
                        {L("Submit", "إرسال")}
                      </Button>

                      <Button onClick={handleCancel}>{L("Cancel", "إلغاء")}</Button>
                    </Space>
                  </Form>
                </>
                  )}
                </Col>

                <Col span={8}>
                  <div style={{ position: "sticky", top: 16 }}>
                    {(reviewHistory.length > 0 || entityHistory.length > 0) && (
                      <ReviewTimeline data={record?.$SKWorkItemData ? reviewHistory : entityHistory} />
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Spin>
      )}
    </Modal>
  );
};

export default TowingViewDrawer;
