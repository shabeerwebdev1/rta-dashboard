import React, { useState, useEffect, useMemo } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Form, Space, Image, Select } from "antd";
import {
  CloseOutlined,
  ShareAltOutlined,
  ExclamationCircleOutlined,
  CloseCircleFilled,
  CheckCircleFilled,
  CarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { theme } from "antd";
import dayjs from "dayjs";

import {
  useLazyGetLookupsQuery,
  useGetViolationDetailsQuery,
  useLazyGetReviewOptionsQuery,
  useLazyGetReviewHistoryQuery,
  useLazyGetEntityHistoryQuery,
} from "../../services/rtkApiFactory";
import {
  useUpdateFineCancelStatusMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../../components/common/ArcGISMap";
import { plateSources, PLATE_COLOR, PLATE_TYPE_SHORT } from "../../config/pageConfigs/finesConfig";
import ReviewTimeline from "../ReviewTimeline";
import UAEPlate from "../UAEPlate";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FinesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  fine: any;
  isLoading?: boolean;
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
  onShare?: () => void;
  onViewLocation?: (fine: any) => void;
  onViewAttachments?: (fine: any) => void;
  readOnly?: boolean;
  hideLocation?: boolean;
}

const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value || opt.id === value);
  if (!option) return String(value);
  return i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label;
};

const filterOptionsByCategory = (options: any[], categoryId: number) =>
  options.filter((option) => option.categoryId === categoryId);

const FinesViewDrawer: React.FC<FinesViewDrawerProps> = ({
  open,
  onClose,
  fine,
  isLoading = false,
  lookupOptions: externalLookupOptions,
  getLabelFromValue: externalGetLabelFromValue,
  onShare,
  onViewLocation,
  onViewAttachments,
  readOnly = false,
  hideLocation = false,
}) => {
  const {
    token: { borderRadius, colorBgContainer },
  } = theme.useToken();

  const { t, i18n } = useTranslation();
  const notification = useAppNotification();
  const [form] = Form.useForm();
  const [internalLookupOptions, setInternalLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [mappedFine, setMappedFine] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<"approve" | "reject" | null>(null);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();
  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();
  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();
  const [updateFineCancelStatus] = useUpdateFineCancelStatusMutation();

  const hasExternalLookupOptions = Array.isArray(externalLookupOptions) && externalLookupOptions.length > 0;
  const lookupOptionsToUse = hasExternalLookupOptions ? externalLookupOptions : internalLookupOptions;
  const getLabelFunction = externalGetLabelFromValue || getLabelFromValue;
  const isFineCancelRequest = fine?.entityCode === "parking-fine-cancel-request";
  const showInboxReviewWorkflow = isFineCancelRequest && !!fine?.$SKWorkItemData;
  const isStatus15003 = !readOnly && mappedFine?.inspectionStatus === 15003;
  const entityIdForReview = fine?.EntityGUID || fine?.entityGUID || fine?.inspectionGUID || fine?.id || "";
  const entityCodeForReview = fine?.EntityCode || fine?.entityCode || "parking-fine-cancel-request";

  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    fine ? { inspectionGUID: fine.inspectionGUID, entityCode: fine.entityCode } : skipToken,
  );

  const { data: violationDetails, isLoading: isLoadingViolation } = useGetViolationDetailsQuery(
    fine ? { inspectionGUID: fine.inspectionGUID, entityCode: fine.entityCode } : skipToken,
  );

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!hasExternalLookupOptions && open && internalLookupOptions.length === 0) {
      fetchLookupData();
    }
  }, [open, hasExternalLookupOptions, internalLookupOptions.length]);

  useEffect(() => {
    if (fine && lookupOptionsToUse.length > 0) mapFineToLabels();
  }, [fine, lookupOptionsToUse, i18n.language]);

  useEffect(() => {
    if (!open || !fine) return;

    if (showInboxReviewWorkflow) {
      getReviewOptions(fine.$SKWorkItemData);
    }

    if (!entityIdForReview || !entityCodeForReview) return;

    if (showInboxReviewWorkflow) {
      getReviewHistory({ entityCode: entityCodeForReview, entityId: entityIdForReview });
    } else {
      getEntityHistory({ entityCode: entityCodeForReview, entityId: entityIdForReview });
    }
  }, [open, fine, showInboxReviewWorkflow, entityIdForReview, entityCodeForReview]);

  useEffect(() => {
    if (open) {
      if (!readOnly) {
        form.resetFields();
      }
      setLastAction(null);
      setSelectedAction(null);
      setComments("");
    }
  }, [open, fine, form, readOnly]);

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([1400, 1300, 1500, 1100]).unwrap();
      setInternalLookupOptions(result);
    } catch (error) {
      notification.error({ data: error });
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const mapFineToLabels = () => {
    if (!fine) return;

    const effectiveInspectionStatus = isFineCancelRequest ? 15003 : fine.inspectionStatus;
    const inspectionTypeOptions = filterOptionsByCategory(lookupOptionsToUse, 1400);
    const inspectionCategoryOptions = filterOptionsByCategory(lookupOptionsToUse, 1300);
    const inspectionStatusOptions = filterOptionsByCategory(lookupOptionsToUse, 1500);
    const paymentTypeOptions = filterOptionsByCategory(lookupOptionsToUse, 1100);

    setMappedFine({
      ...fine,
      inspectionTypeLabel: fine.inspectionType
        ? getLabelFunction(fine.inspectionType, inspectionTypeOptions, i18n)
        : fine.inspectionType || "No Data",
      inspectionCategoryLabel: fine.inspectionCategory
        ? getLabelFunction(fine.inspectionCategory, inspectionCategoryOptions, i18n)
        : fine.inspectionCategory || "No Data",
      inspectionStatus: effectiveInspectionStatus,
      inspectionStatusLabel: effectiveInspectionStatus
        ? getLabelFunction(effectiveInspectionStatus, inspectionStatusOptions, i18n)
        : effectiveInspectionStatus || "No Data",
      inspectionDateFormatted: formatDate(fine.actualDateTime),
      fineAmountFormatted: (fine.fineAmount ?? fine.fineAmount === 0) ? ` AED ${fine.fineAmount} ` : "No Data",
      totalAmountFormatted:
        (fine.totalFineAmount ?? fine.totalFineAmount === 0) ? ` AED ${fine.totalFineAmount} ` : "No Data",
      paymentTypeLabel: getPaymentTypeLabel(fine.paymentType),
      statusLabel: getStatusLabel(fine.isPaid, effectiveInspectionStatus),
      statusColor: getStatusColor(fine.isPaid, effectiveInspectionStatus),
      blackPointsFormatted: (fine.blackPoint ?? fine.blackPoint === 0) ? fine.blackPoint : "0",
      inspectorName:
        i18n.language === "ar"
          ? fine.inspectorNameAr || fine.inspectorNameEn || "No Data"
          : fine.inspectorNameEn || fine.inspectorNameAr || "No Data",
      supervisorName:
        i18n.language === "ar"
          ? fine.supervisorNameAr || fine.supervisorNameEn || "No Data"
          : fine.supervisorNameEn || fine.supervisorNameAr || "No Data",
    });
  };

  const formatDate = (value: number) => {
    if (!value) return "";

    const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");

    const isArabic = lang.startsWith("ar");

    return dayjs(value)
      .locale(isArabic ? "ar" : "en")
      .format(isArabic ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    const map: Record<string, string> = {
      "0": t("form.notPaid"), // already exists
      "1": t("status.paid"), // reuse existing translation
    };

    return map[paymentType] || t("common.noData");
  };

  const getStatusLabel = (isPaid: boolean, inspectionStatus: number) => {
    const map: Record<number, string> = {
      0: t("status.pending"),
      1: t("status.completed"),
      2: t("status.cancelled"),
      15003: t("status.pendingApproval"),
    };
    if (isPaid) return t("status.paid");
    return map[inspectionStatus || 0] || t("status.unknown");
  };

  const fineStatusColorMap: Record<number, string> = {
    15001: "green",
    15002: "blue",
    15003: "orange",
    15004: "green",
    15005: "red",
    15006: "green",
  };

  const getStatusColor = (isPaid: boolean, inspectionStatus: number) => {
    if (isPaid) return "green";
    return fineStatusColorMap[inspectionStatus] || "orange";
  };

  const hasMissingVehicleOwnerName = (() => {
    const ownerName = mappedFine?.vehicleOwnerName;
    if (ownerName === null || ownerName === undefined) return true;
    const normalized = String(ownerName).trim().toLowerCase();
    return normalized === "" || normalized === "no data" || normalized === "---" || normalized === "—";
  })();

  const handleFormSubmit = async (values: { comment: string }) => {
    if (!mappedFine || !lastAction) return;

    setIsProcessing(true);

    try {
      const fineCancelStatus = lastAction === "approve" ? 1 : 2;

      const response = await updateFineCancelStatus({
        entityNo: mappedFine.entityNo,
        fineCancelStatus: fineCancelStatus,
        action_cancel_comment: values.comment || "",
      }).unwrap();

      const successMessage =
        lastAction === "approve"
          ? t("messages.approved") || "Approved successfully"
          : t("messages.rejected") || "Rejected successfully";

      notification.success(response, successMessage);

      form.resetFields();
      setLastAction(null);
      onClose();
    } catch (error: any) {
      notification.error(error, t("messages.error") || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveClick = () => {
    setLastAction("approve");
    form
      .validateFields(["comment"])
      .then(() => {
        form.submit();
      })
      .catch(() => {});
  };

  const handleRejectClick = () => {
    setLastAction("reject");
    form
      .validateFields(["comment"])
      .then(() => {
        form.submit();
      })
      .catch(() => {});
  };

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((item: any) => item.ActivityOptionGUID === value);
    setSelectedAction(opt);
  };

  const handleInboxReviewSubmit = async () => {
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

      const normalizedStatus = String(selectedAction?.ReviewStatusCode ?? selectedAction?.reviewStatusCode ?? "")
        .toLowerCase()
        .trim();
      const fineCancelStatus =
        selectedAction?.StatusCode ??
        (normalizedStatus.includes("approve") || normalizedStatus.includes("accept") ? 1 : 2);

      const payload = {
        entityNo: mappedFine?.entityNo,
        fineCancelStatus,
        review: {
          reviewStatusCode: selectedAction.ReviewStatusCode,
          activityCode: mappedFine?.ActivityCode ?? mappedFine?.nvarchar3 ?? "",
          entityCode: mappedFine?.EntityCode ?? mappedFine?.entityCode ?? "parking-fine-cancel-request",
          entityGUID: mappedFine?.EntityGUID ?? mappedFine?.inspectionGUID ?? "",
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments: comments || "",
          rcwuri: mappedFine?.$SKWorkItemData || "",
        },
      };

      const response = await updateFineCancelStatus(payload).unwrap();
      notification.success(response, "");
      form.resetFields();
      setSelectedAction(null);
      setComments("");
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;
      notification.error(error, "");
    }
  };

  const handleViewLocation = () => {
    if (onViewLocation && mappedFine) {
      onViewLocation(mappedFine);
    }
  };

  const handleViewAttachments = () => {
    if (onViewAttachments && mappedFine) {
      onViewAttachments(mappedFine);
    }
  };

  const getCompleteFilePath = (file: any) => {
    if (!file) return "";
    if (file.filePath?.includes(file.fileName)) return file.filePath;
    const separator = file.filePath?.endsWith("\\") ? "" : "\\";
    return `${file.filePath}${separator}${file.fileName}`;
  };

  return (
    <Modal open={open} onCancel={onClose} width={1000} footer={null} title={null} closable={false}>
      <Spin
        spinning={
          isLoading || isLoadingLookups || isProcessing || loadingOptions || historyLoading || entityHistoryLoading
        }
      >
        <Form form={form} component={false} />
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space size="middle" align="center">
              <Title level={4} style={{ margin: 0 }}>
                {t("form.finedetails")} <Text type="danger">#{mappedFine?.entityNo || "---"}</Text>
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              {onShare && (
                <Button icon={<ShareAltOutlined />} onClick={onShare}>
                  {t("common.share")}
                </Button>
              )}
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
            </Space>
          </Col>
        </Row>

        {!mappedFine ? (
          <Empty description="No Data" />
        ) : (
          <div style={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}>
            <Row gutter={16}>
              <Col span={24}>
                <Row gutter={16}>
                  {/* Fine Details with Trade License */}
                  <Col span={mappedFine?.plateNumber ? 12 : 24}>
                    <Card
                      title={t("form.finedetails")}
                      size="small"
                      headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                      style={{ marginBottom: 16, borderRadius: 12 }}
                    >
                      <Row gutter={[0, 12]}>
                        {/* Trade License Number */}
                        {mappedFine?.tradeLicenseNumber && (
                          <>
                            <Col span={10}>
                              <Text strong>{t("form.tradeLicenseNumber")}:</Text>
                            </Col>
                            <Col span={14}>{mappedFine.tradeLicenseNumber || "---"}</Col>

                            <Col span={10}>
                              <Text strong>{t("form.tradeLicenseName")}:</Text>
                            </Col>
                            <Col span={14}>
                              {mappedFine.tradeLicenseNameEn || mappedFine.tradeLicenseNameAr || "---"}
                            </Col>
                          </>
                        )}

                        {/* Fine Details */}
                        {/* <Col span={10}>
                          <Text strong>{t("form.fineType")}:</Text>
                        </Col>
                        <Col span={14}>{mappedFine.inspectionCategoryLabel}</Col> */}

                        <Col span={10}>
                          <Text strong>{t("form.fineNumber")}:</Text>
                        </Col>
                        <Col span={14}>{mappedFine.entityNo}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.inspectionType")}:</Text>
                        </Col>
                        <Col span={14}>{mappedFine.inspectionTypeLabel}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.inspectionDate")}:</Text>
                        </Col>
                        <Col span={14}>{mappedFine.inspectionDateFormatted}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.amount")}:</Text>
                        </Col>
                        <Col span={14}>
                          <Text strong type="danger">
                            {mappedFine.fineAmountFormatted}
                          </Text>
                        </Col>

                        <Col span={10}>
                          <Text strong>{t("form.paymentType")}:</Text>
                        </Col>
                        <Col span={14}>{mappedFine.paymentTypeLabel}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.finestatus")}:</Text>
                        </Col>
                        <Col span={14}>
                          <Tag color={mappedFine.statusColor}>{mappedFine.inspectionStatusLabel}</Tag>
                        </Col>

                        <Col span={10}>
                          <Text strong>{t("form.inspectorName")}:</Text>
                        </Col>
                        <Col span={14}>{mappedFine.inspectorName}</Col>

                        {mappedFine.supervisorName && mappedFine.supervisorName !== "No Data" && (
                          <>
                            <Col span={10}>
                              <Text strong>{t("form.supervisorName")}:</Text>
                            </Col>
                            <Col span={14}>{mappedFine.supervisorName}</Col>
                          </>
                        )}
                      </Row>
                    </Card>
                  </Col>

                  {/* Vehicle Details with Plate */}
                  {mappedFine?.plateNumber && (
                    <Col span={12}>
                      <Card
                        title={
                          <span
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              {t("form.vehicleDetails")}
                            </span>
                            <span style={{ paddingTop: "10px", paddingBottom: "10px" }}>
                              <UAEPlate
                                code={PLATE_COLOR[mappedFine?.plateCodeValue] ?? "---"}
                                number={mappedFine?.plateNumber ?? "---"}
                                emirateEn={plateSources[mappedFine?.plateSourceValue]?.en || ""}
                                emirateAr={plateSources[mappedFine?.plateSourceValue]?.ar || ""}
                              />
                            </span>
                          </span>
                        }
                        size="small"
                        headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                        style={{ marginBottom: 16, borderRadius: 12 }}
                      >
                        <div style={{ display: "flex", justifyContent: "left", marginBottom: 16 }}></div>

                        <Row gutter={[0, 12]}>
                          <Col span={10}>
                            <Text strong>{t("form.plateNumber")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.plateNumber || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.plateSource")}:</Text>
                          </Col>
                          <Col span={14}>
                            {mappedFine?.plateSourceValue
                              ? i18n.language === "ar"
                                ? plateSources[mappedFine.plateSourceValue]?.ar || mappedFine.plateSourceValue
                                : plateSources[mappedFine.plateSourceValue]?.en || mappedFine.plateSourceValue
                              : "No Data"}
                          </Col>
                          <Col span={10}>
                            <Text strong>{t("form.plateCategory")}:</Text>
                          </Col>
                          <Col span={14}>
                            {mappedFine?.plateCategoryValue
                              ? PLATE_TYPE_SHORT[mappedFine.plateCategoryValue] || mappedFine.plateCategoryValue
                              : "No Data"}
                          </Col>
                          <Col span={10}>
                            <Text strong>{t("form.plateCode")}:</Text>
                          </Col>
                          <Col span={14}>
                            {mappedFine?.plateCodeValue
                              ? PLATE_COLOR[mappedFine.plateCodeValue] || mappedFine.plateCodeValue
                              : "No Data"}
                          </Col>
                          <Col span={10}>
                            <Text strong>{t("form.vehicleColor")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.vehicleColor || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.vehicleType")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.vehicleType || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.vehicleBrand")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.vehicleBrand || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.manufacturerYear")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.manufacturerYear || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.vehicleOwnerName")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.vehicleOwnerName || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.vehicleOwnerEmail")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.vehicleOwnerEmail || "No Data"}</Col>
                          <Col span={10}>
                            <Text strong>{t("form.vehicleOwnerMobile")}:</Text>
                          </Col>
                          <Col span={14}>{mappedFine.vehicleOwnerMobile || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>
                              {i18n.language.startsWith("ar") ? "تفاصيل المرور الإلكتروني:" : "E-Traffic Details:"}
                            </Text>
                          </Col>

                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                borderRadius: 999,
                                background: hasMissingVehicleOwnerName ? "#fff0f1" : "#f0f7eb",
                              }}
                            >
                              {/* Car icon in circle */}
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 30,
                                  height: 30,
                                  borderRadius: "50%",
                                  border: `1px solid ${hasMissingVehicleOwnerName ? "#eb2630" : "#389e0d"}`,
                                  flexShrink: 0,
                                }}
                              >
                                <CarOutlined
                                  style={{
                                    fontSize: 12,
                                    color: hasMissingVehicleOwnerName ? "#eb2630" : "#389e0d",
                                  }}
                                />
                              </span>

                              {/* Label */}
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: hasMissingVehicleOwnerName ? "#eb2630" : "#389e0d",
                                }}
                              >
                                {isRTL ? "المرور الإلكتروني" : "E-traffic"}
                              </span>

                              {/* Divider */}
                              <span
                                style={{
                                  width: 1,
                                  height: 15,
                                  background: hasMissingVehicleOwnerName ? "#eb2630" : "#389e0d",
                                  opacity: 0.35,
                                  display: "inline-block",
                                }}
                              />

                              {/* Check / X icon */}
                              {hasMissingVehicleOwnerName ? (
                                <CloseCircleFilled style={{ fontSize: 14, color: "#eb2630" }} />
                              ) : (
                                <CheckCircleFilled style={{ fontSize: 14, color: "#389e0d" }} />
                              )}
                            </span>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  )}
                </Row>

                {/* Violation Details */}
                <Card
                  title={t("form.violationDetails")}
                  size="small"
                  style={{ marginBottom: 16, borderRadius: 12 }}
                  headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                >
                  {violationDetails?.length === 0 ? (
                    <Empty description={t("form.Noviolationdetailsavailable")} />
                  ) : (
                    <Spin spinning={isLoadingViolation}>
                      {violationDetails?.map((value, index) => {
                        return (
                          <Row
                            key={index}
                            gutter={[0, 0]}
                            style={{
                              alignItems: "center",
                              border: "1px solid #e8e8e8",
                              padding: "8px 12px",
                              background: colorBgContainer,
                              marginBottom: "5px",
                              borderRadius: borderRadius,
                            }}
                          >
                            <Col flex="1">
                              <Text strong>
                                {i18n.language === "ar" ? value?.violationNameAr : value?.violationNameEn}
                              </Text>
                            </Col>
                            <Col style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                              <Text strong>{t("form.amount")} :</Text>
                              <Text type="danger" strong>
                                AED {value?.totalFineAmount}
                              </Text>
                            </Col>
                          </Row>
                        );
                      })}
                    </Spin>
                  )}
                </Card>

                {/* Inbox Review Workflow */}
                {showInboxReviewWorkflow ? (
                  <>
                    <Card
                      title={t("form.reviewTimeline")}
                      size="small"
                      style={{ marginBottom: 16, borderRadius: 12 }}
                      headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                    >
                      <ReviewTimeline data={fine?.$SKWorkItemData ? reviewHistory : entityHistory} />
                    </Card>

                    <Card
                      title={t("form.approvalActions")}
                      size="small"
                      style={{ marginBottom: 16, borderRadius: 12 }}
                      headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                    >
                      <Form form={form} layout="vertical" disabled={isProcessing} style={{ marginBottom: 0 }}>
                        <Form.Item
                          name="action"
                          label={<Text strong>{t("form.action")}</Text>}
                          rules={[{ required: true, message: t("placeholders.selectAction") }]}
                          style={{ marginBottom: 8 }}
                        >
                          <Select
                            placeholder={t("placeholders.selectAction")}
                            onChange={(value) => {
                              if (value) {
                                handleActionChange(value);
                              } else {
                                setSelectedAction(null);
                              }
                            }}
                            loading={loadingOptions}
                            allowClear
                          >
                            {reviewOptions.map((opt: any) => (
                              <Select.Option key={opt.ActivityOptionGUID} value={opt.ActivityOptionGUID}>
                                {opt.ReviewStatus}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="reviewComments"
                          label={<Text strong>{t("form.comments")}</Text>}
                          rules={[
                            {
                              required: selectedAction?.IsCommentMandatory || false,
                              message: t("placeholders.enterComments"),
                            },
                          ]}
                          style={{ marginBottom: 8 }}
                        >
                          <TextArea
                            rows={3}
                            placeholder={
                              selectedAction?.IsCommentMandatory
                                ? t("placeholders.enterComments")
                                : t("placeholders.comments")
                            }
                            onChange={(e) => setComments(e.target.value)}
                          />
                        </Form.Item>

                        <Row justify={"end"}>
                          <Space style={{ marginTop: 0, marginBottom: 0 }}>
                            <Button type="primary" onClick={handleInboxReviewSubmit} disabled={isProcessing}>
                              {t("form.submit")}
                            </Button>
                            <Button
                              onClick={() => {
                                form.resetFields();
                                setSelectedAction(null);
                                setComments("");
                              }}
                            >
                              {t("common.cancel")}
                            </Button>
                          </Space>
                        </Row>
                      </Form>
                    </Card>
                  </>
                ) : null}

                <Row gutter={16}>
                  {!hideLocation && (
                    <Col span={12}>
                      <Card
                        title={t("form.FineLocation")}
                        size="small"
                        style={{ borderRadius: 12, marginBottom: 16 }}
                        headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                      >
                        {mappedFine.latitude && mappedFine.longitude ? (
                          <ArcGISMap
                            inspectors={[
                              {
                                id: 1,
                                name: "Fine Location",
                                nameAr: "موقع المخالفة",
                                lat: mappedFine.latitude,
                                lng: mappedFine.longitude,
                                status: "Fine",
                                statusAr: "مخالفة",
                                details: { zone: "", lastCheckIn: "" },
                                markerType: "google-pin",
                              },
                            ]}
                            center={[mappedFine.longitude, mappedFine.latitude]}
                            zoom={16}
                            height="180px"
                            disablePopup={true}
                            legendEnabled={false}
                          />
                        ) : (
                          <Empty description="No Location Data Available" />
                        )}
                      </Card>
                    </Col>
                  )}

                  <Col span={hideLocation ? 24 : 12}>
                    <Card
                      title={t("form.AttachedPhotos")}
                      size="small"
                      style={{ borderRadius: 12, marginBottom: 16 }}
                      headStyle={{ background: colorBgContainer, fontWeight: 600 }}
                    >
                      <Spin spinning={isLoadingAttachments}>
                        {attachments.length > 0 ? (
                          <Image.PreviewGroup>
                            <Space wrap>
                              {attachments.slice(0, 3).map((file) => (
                                <Image
                                  key={file.attachmentGUID}
                                  width={100}
                                  height={100}
                                  src={getMobileFileUrl(getCompleteFilePath(file))}
                                  alt={file.fileName}
                                  style={{ objectFit: "cover", borderRadius: 8 }}
                                />
                              ))}
                              {attachments.length > 3 && (
                                <div
                                  style={{
                                    width: 100,
                                    height: 100,
                                    background: "#f5f5f5",
                                    borderRadius: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text type="secondary">+{attachments.length - 3} more</Text>
                                </div>
                              )}
                            </Space>
                          </Image.PreviewGroup>
                        ) : (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
                        )}
                      </Spin>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default FinesViewDrawer;
