/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Form, Space, Select, Image } from "antd";
import {
  CarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { theme } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useLazyGetReviewOptionsQuery,
  useLazyGetReviewHistoryQuery,
  useLazyGetEntityHistoryQuery,
  useUpdateFineCancelStatusMutation,
  useGetInspectionAttachmentsQuery,
  useGetViolationDetailsQuery,
  getMobileFileUrl,
  useLazyGetLookupsQuery,
} from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import { PLATE_COLOR, PLATE_TYPE_SHORT, plateSources } from "../../config/pageConfigs/finesConfig";
import ReviewTimeline from "../ReviewTimeline";
import UAEPlate from "../UAEPlate";
import ArcGISMap from "../../components/common/ArcGISMap";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FineCancelRequestViewModalProps {
  open: boolean;
  onClose: () => void;
  record?: any;
  isLoading?: boolean;
}

const EMPTY_OBJECT: any = {};

const FineCancelRequestViewModal: React.FC<FineCancelRequestViewModalProps> = ({
  open,
  onClose,
  record,
  isLoading = false,
}) => {
  const {
    token: { borderRadius, colorBgContainer },
  } = theme.useToken();

  const { t, i18n } = useTranslation();
  const notification = useAppNotification();
  const [form] = Form.useForm();

  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [comments, setComments] = useState("");

  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();
  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();
  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();
  const [updateFineCancelStatus, { isLoading: isUpdating }] = useUpdateFineCancelStatusMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  const base = record ?? EMPTY_OBJECT;
  const data = base.data ?? base;
  const vehicle = data.vehicle ?? EMPTY_OBJECT;
  const fineDetails = data.fineDetails ?? EMPTY_OBJECT;
  const inspection = data.carData ?? data.tlData ?? EMPTY_OBJECT;

  const isRTL = i18n.language === "ar";
  const isRTLText = isRTL;

  const entityId = base.EntityGUID || base.entityGUID || data.EntityGUID || data.entityGUID || data.disputeCode || "";
  const entityCode =
    base.EntityCode || base.entityCode || data.EntityCode || data.entityCode || "parking-fine-cancel-request";
  const showInboxReviewWorkflow = !!base.$SKWorkItemData || !!data.$SKWorkItemData;

  const inspectionGUID = useMemo(
    () =>
      inspection.inspectionGUID ||
      base.inspectionGUID ||
      data.inspectionGUID ||
      fineDetails.inspectionId ||
      entityId ||
      "",
    [inspection.inspectionGUID, base.inspectionGUID, data.inspectionGUID, fineDetails.inspectionId, entityId],
  );

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return t("common.noData");
    return dayjs(value)
      .locale(isRTL ? "ar" : "en")
      .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

  const getDisplay = (value: any) => {
    if (value === null || value === undefined || value === "") return t("common.noData");
    return String(value);
  };

  const getPaymentTypeLabel = (paymentType: any) => {
    const map: Record<string, string> = {
      "0": t("form.notPaid"),
      "1": t("paymentTypes.cash"),
      "2": t("paymentTypes.creditCard"),
      "3": t("paymentTypes.online"),
    };
    return map[String(paymentType)] || String(paymentType || t("common.noData"));
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

  const getStatusColor = (isPaid: boolean, inspectionStatus: number) => {
    if (isPaid) return "green";
    const colors: Record<number, string> = {
      15001: "green",
      15002: "blue",
      15003: "orange",
      15004: "green",
      15005: "red",
      15006: "green",
    };
    return colors[inspectionStatus] || "green";
  };

  const mappedFine = useMemo(() => {
    if (!record) return null;

    const effectiveInspectionStatus = Number(base.inspectionStatus ?? inspection.inspectionStatus ?? 15003);
    const effectivePaymentType = base.paymentType ?? base.payment_Type ?? data.paymentType ?? data.payment_Type ?? 0;

    return {
      ...base,
      ...data,
      ...inspection,
      ...vehicle,
      entityNo:
        fineDetails.fineNo || base.fineId || data.fineId || inspection.entityNo || base.entityNo || data.entityNo || "",
      fineId:
        fineDetails.fineNo || base.fineId || data.fineId || inspection.entityNo || base.entityNo || data.entityNo || "",
      fineNo: fineDetails.fineNo || data.fineNo || base.fineNo || "",
      inspectionGUID,
      entityCode,
      EntityCode: entityCode,
      EntityGUID: entityId || inspectionGUID,
      ActivityCode: base.ActivityCode || base.nvarchar3 || data.ActivityCode || data.nvarchar3 || "",
      nvarchar3: base.nvarchar3 || base.ActivityCode || data.nvarchar3 || data.ActivityCode || "",
      $SKWorkItemData: base.$SKWorkItemData || data.$SKWorkItemData,
      actualDateTime:
        inspection.actualDateTime ||
        base.actualDisputeDate ||
        data.actualDisputeDate ||
        base.created_At ||
        data.created_At,
      latitude: inspection.latitude || inspection.lat || base.lat || data.lat || "0.0",
      longitude: inspection.longitude || inspection.lng || base.lng || data.lng || "0.0",
      fineAmount: inspection.fineAmount ?? fineDetails.fineAmount ?? base.fineAmount ?? data.fineAmount,
      totalFineAmount: inspection.totalFineAmount ?? fineDetails.fineAmount ?? base.totalFineAmount ?? data.fineAmount,
      paymentType: effectivePaymentType,
      isPaid: inspection.isPaid ?? false,
      inspectionType: inspection.inspectionType ?? base.inspectionType ?? data.inspectionType,
      inspectionCategory: inspection.inspectionCategory ?? base.inspectionCategory ?? data.inspectionCategory,
      inspectionStatus: effectiveInspectionStatus,
      fineType: data.fineType ?? base.fineType ?? "",
      fineStatus: fineDetails.fineStatus ?? inspection.inspectionStatus ?? effectiveInspectionStatus,
      inspectionTypeLabel: getDisplay(inspection.inspectionType),
      inspectionCategoryLabel: getDisplay(inspection.inspectionCategory),
      inspectionStatusLabel: getStatusLabel(Boolean(inspection.isPaid), effectiveInspectionStatus),
      paymentTypeLabel: getPaymentTypeLabel(effectivePaymentType),
      statusLabel: getStatusLabel(Boolean(inspection.isPaid), effectiveInspectionStatus),
      statusColor: getStatusColor(Boolean(inspection.isPaid), effectiveInspectionStatus),
      fineAmountFormatted:
        inspection.fineAmount !== null && inspection.fineAmount !== undefined
          ? ` AED ${inspection.fineAmount} `
          : fineDetails.fineAmount !== null && fineDetails.fineAmount !== undefined
            ? ` AED ${fineDetails.fineAmount}`
            : t("common.noData"),
      totalAmountFormatted:
        inspection.totalFineAmount !== null && inspection.totalFineAmount !== undefined
          ? ` AED ${inspection.totalFineAmount} `
          : t("common.noData"),
      inspectionDateFormatted: formatDateTime(inspection.actualDateTime),
      inspectorName: isRTL
        ? inspection.inspectorNameAr || inspection.inspectorNameEn || t("common.noData")
        : inspection.inspectorNameEn || inspection.inspectorNameAr || t("common.noData"),
      supervisorName: isRTL
        ? inspection.supervisorNameAr || inspection.supervisorNameEn || t("common.noData")
        : inspection.supervisorNameEn || inspection.supervisorNameAr || t("common.noData"),
      plateNumber: vehicle.plateNumber || inspection.plateNumber || "",
      plateSourceValue: vehicle.plateSource || inspection.plateSource || "",
      plateCategoryValue: vehicle.plateType || inspection.plateType || "",
      plateCodeValue: vehicle.plateColor || inspection.plateColor || "",
      vehicleColor: vehicle.vehicleColor || inspection.vehicleColor || "",
      vehicleType: vehicle.vehicleType || inspection.vehicleType || "",
      vehicleBrand: vehicle.vehicleBrand || inspection.vehicleBrand || "",
      manufacturerYear: vehicle.manufacturerYear || inspection.manufacturerYear || "",
      vehicleOwnerName: vehicle.ownerName || inspection.vehicleOwnerName || "",
      vehicleOwnerEmail: vehicle.ownerDetails || inspection.vehicleOwnerEmail || "",
      vehicleOwnerMobile: vehicle.ownerMobile || inspection.vehicleOwnerMobile || "",
      inspectorNameEn: inspection.inspectorNameEn || "",
      inspectorNameAr: inspection.inspectorNameAr || "",
      supervisorNameEn: inspection.supervisorNameEn || "",
      supervisorNameAr: inspection.supervisorNameAr || "",
      tradeLicenseNumber: inspection.tradeLicenseNumber || base.tradeLicenseNumber || data.tradeLicenseNumber || "",
      tradeLicenseNameEn: inspection.tradeLicenseNameEn || base.tradeLicenseNameEn || data.tradeLicenseNameEn || "",
      tradeLicenseNameAr: inspection.tradeLicenseNameAr || base.tradeLicenseNameAr || data.tradeLicenseNameAr || "",
      comments: base.comments || data.comments || "",
      source: base.source || data.source || "",
      crm_Ref: base.crm_Ref || data.crm_Ref || "",
      department: base.department ?? data.department ?? 0,
      departmentLabel: getDisplay(base.department ?? data.department ?? 0),
      payment_Type: base.payment_Type ?? data.payment_Type ?? effectivePaymentType,
      reviews: base.reviews || data.reviews || [],
      disputeCode: base.disputeCode || data.disputeCode || "",
      dispute_Id: base.dispute_Id || data.dispute_Id || "",
      disputeMainReason: base.disputeMainReason ?? data.disputeMainReason ?? 0,
      disputeSubReason: base.disputeSubReason ?? data.disputeSubReason ?? 0,
      dispute_Status: base.dispute_Status ?? data.dispute_Status ?? 0,
      documents: base.documents || data.documents || null,
      name: base.name || data.name || "",
      email: base.email || data.email || "",
      phone: base.phone || data.phone || "",
      address: base.address || data.address || "",
    };
  }, [record, base, data, vehicle, fineDetails, inspection, inspectionGUID, entityId, entityCode, i18n.language]);

  const attachmentQueryArg = mappedFine
    ? { inspectionGUID: mappedFine.inspectionGUID, entityCode: inspection.entityCode || mappedFine.entityCode }
    : skipToken;

  const violationQueryArg = mappedFine
    ? { inspectionGUID: mappedFine.inspectionGUID, entityCode: inspection.entityCode || mappedFine.entityCode }
    : skipToken;

  const { data: attachments = [], isLoading: isLoadingAttachments } =
    useGetInspectionAttachmentsQuery(attachmentQueryArg);

  const { data: violationDetails, isLoading: isLoadingViolation } = useGetViolationDetailsQuery(violationQueryArg);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setSelectedAction(null);
    setComments("");
  }, [open, form]);

  useEffect(() => {
    if (!open || !showInboxReviewWorkflow || !base.$SKWorkItemData) return;
    getReviewOptions(base.$SKWorkItemData);
  }, [open, showInboxReviewWorkflow, base.$SKWorkItemData, getReviewOptions]);

  useEffect(() => {
    if (!open || !mappedFine?.EntityGUID || !mappedFine?.EntityCode) return;
    if (showInboxReviewWorkflow) {
      getReviewHistory({ entityCode: mappedFine.EntityCode, entityId: mappedFine.EntityGUID });
    } else {
      getEntityHistory({ entityCode: mappedFine.EntityCode, entityId: mappedFine.EntityGUID });
    }
  }, [
    open,
    mappedFine?.EntityGUID,
    mappedFine?.EntityCode,
    showInboxReviewWorkflow,
    getReviewHistory,
    getEntityHistory,
  ]);

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((item: any) => item.ActivityOptionGUID === value);
    setSelectedAction(opt ?? null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const reviewComments = values?.review_Comments?.trim?.() || "";

      if (!selectedAction) {
        notification.error({ data: { en_Msg: "Please select an action", ar_Msg: "الرجاء تحديد إجراء" } }, "");
        return;
      }

      if (selectedAction.IsCommentMandatory && !reviewComments) {
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
        entityNo: mappedFine?.entityNo || mappedFine?.fineId || "",
        fineCancelStatus,
        review: {
          reviewStatusCode: selectedAction?.ReviewStatusCode ?? selectedAction?.reviewStatusCode ?? "",
          activityCode: mappedFine?.ActivityCode ?? mappedFine?.nvarchar3 ?? "",
          entityCode: mappedFine?.EntityCode ?? mappedFine?.entityCode ?? "parking-fine-cancel-request",
          entityGUID: mappedFine?.EntityGUID ?? mappedFine?.inspectionGUID ?? "",
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments,
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

  const hasMissingVehicleOwnerName = (() => {
    const ownerName = mappedFine?.vehicleOwnerName;
    if (ownerName === null || ownerName === undefined) return true;
    const normalized = String(ownerName).trim().toLowerCase();
    return normalized === "" || normalized === "no data" || normalized === "---" || normalized === "—";
  })();

  const getCompleteFilePath = (file: any) => {
    if (!file) return "";
    if (file.filePath?.includes(file.fileName)) return file.filePath;
    const separator = file.filePath?.endsWith("\\") ? "" : "\\";
    return `${file.filePath}${separator}${file.fileName}`;
  };

  const timelineData = showInboxReviewWorkflow ? reviewHistory : entityHistory;

  const cardHeadStyle = {
    background: colorBgContainer,
    fontWeight: 600 as const,
    textAlign: (isRTLText ? "right" : "left") as "right" | "left",
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={"96vw"}
      footer={null}
      title={null}
      closable={false}
      style={{ top: 20 }}
      bodyStyle={{ padding: 0 }}
      dir={isRTLText ? "rtl" : "ltr"}
    >
      <Spin spinning={isLoading || isUpdating || loadingOptions || historyLoading || entityHistoryLoading}>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 80px)" }}>
          {/* ── Sticky Header ── */}
          <div
            style={{
              padding: "10px 16px",
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
              flexShrink: 0,
            }}
          >
            <Row align="middle" style={{ direction: isRTLText ? "rtl" : "ltr" }}>
              <Col>
                <Space size="middle" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {t("form.finedetails", { defaultValue: "Fine Details" })}{" "}
                    <Text type="danger">#{mappedFine?.entityNo || mappedFine?.fineId || "---"}</Text>
                  </Title>
                </Space>
              </Col>
              <Col flex="auto" />
              <Col>
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
              </Col>
            </Row>
          </div>

          {/* ── Scrollable Body ── */}
          <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
            {!mappedFine ? (
              <Empty description={t("common.noData")} />
            ) : (
              <div dir={isRTLText ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                  {/* ── LEFT COLUMN ── */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Row A — Fine Details  +  Vehicle Details */}
                    <Row gutter={12}>
                      <Col span={mappedFine?.plateNumber ? 12 : 24}>
                        <Card
                          title={t("form.finedetails", { defaultValue: "Fine Details" })}
                          size="small"
                          headStyle={cardHeadStyle}
                          style={{ borderRadius: 12, height: "100%" }}
                        >
                          <Row gutter={[0, 10]} dir={isRTLText ? "rtl" : "ltr"}>
                            {mappedFine?.tradeLicenseNumber && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.tradeLicenseNumber")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {mappedFine.tradeLicenseNumber || "---"}
                                </Col>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.tradeLicenseName")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {isRTLText
                                    ? mappedFine.tradeLicenseNameAr || mappedFine.tradeLicenseNameEn || "---"
                                    : mappedFine.tradeLicenseNameEn || mappedFine.tradeLicenseNameAr || "---"}
                                </Col>
                              </>
                            )}
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.fineType", { defaultValue: "Fine Type" })}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              {mappedFine.inspectionCategoryLabel}
                            </Col>
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.fineNumber")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              {mappedFine.entityNo || t("common.notAvailable")}
                            </Col>
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.inspectionType", { defaultValue: "Inspection Type" })}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              {mappedFine.inspectionTypeLabel}
                            </Col>
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.inspectionDate", { defaultValue: "Inspection Date" })}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              {mappedFine.inspectionDateFormatted || t("common.noData")}
                            </Col>
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.amount", { defaultValue: "Amount" })}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text type="danger" strong>
                                {mappedFine.fineAmountFormatted}
                              </Text>
                            </Col>
                            {/* <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.paymentType")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              {mappedFine.paymentTypeLabel}
                            </Col> */}
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.inspectionStatus", { defaultValue: "Status" })}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Tag color={mappedFine.statusColor}>{mappedFine.inspectionStatusLabel}</Tag>
                            </Col>
                            <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              <Text strong>{t("form.inspectorName", { defaultValue: "Inspector Name" })}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                              {mappedFine.inspectorName}
                            </Col>
                            {mappedFine.supervisorName && mappedFine.supervisorName !== t("common.noData") && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.supervisorName", { defaultValue: "Supervisor Name" })}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {mappedFine.supervisorName}
                                </Col>
                              </>
                            )}
                            {mappedFine.department !== 0 && mappedFine.department !== null && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.department")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {mappedFine.departmentLabel}
                                </Col>
                              </>
                            )}
                            {(data.email || mappedFine.vehicleOwnerEmail) && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.email")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {getDisplay(data.email || mappedFine.vehicleOwnerEmail)}
                                </Col>
                              </>
                            )}
                            {(data.phone || mappedFine.vehicleOwnerMobile) && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.phoneNumber")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {getDisplay(data.phone || mappedFine.vehicleOwnerMobile)}
                                </Col>
                              </>
                            )}
                            {mappedFine.crm_Ref && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.crmReference")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {getDisplay(mappedFine.crm_Ref)}
                                </Col>
                              </>
                            )}
                            {data.address && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.address")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {getDisplay(data.address)}
                                </Col>
                              </>
                            )}
                            {mappedFine.source && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.source")}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {getDisplay(mappedFine.source)}
                                </Col>
                              </>
                            )}
                            {mappedFine.comments && (
                              <>
                                <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  <Text strong>{t("form.notes", { defaultValue: "Notes" })}:</Text>
                                </Col>
                                <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                  {getDisplay(mappedFine.comments)}
                                </Col>
                              </>
                            )}
                          </Row>
                        </Card>
                      </Col>

                      {mappedFine?.plateNumber && (
                        <Col span={12}>
                          <Card
                            title={
                              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                  {t("form.vehicleDetails")}
                                </span>
                                <span style={{ paddingTop: 10, paddingBottom: 10 }}>
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
                            headStyle={cardHeadStyle}
                            style={{ borderRadius: 12, height: "100%" }}
                          >
                            <Row gutter={[0, 10]} dir={isRTLText ? "rtl" : "ltr"}>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.plateNumber")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.plateNumber)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.plateSource")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {mappedFine?.plateSourceValue
                                  ? isRTLText
                                    ? plateSources[mappedFine.plateSourceValue]?.ar || mappedFine.plateSourceValue
                                    : plateSources[mappedFine.plateSourceValue]?.en || mappedFine.plateSourceValue
                                  : t("common.noData")}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.plateCategory")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {mappedFine?.plateCategoryValue
                                  ? PLATE_TYPE_SHORT[mappedFine.plateCategoryValue] || mappedFine.plateCategoryValue
                                  : t("common.noData")}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.plateCode")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {mappedFine?.plateCodeValue
                                  ? PLATE_COLOR[mappedFine.plateCodeValue] || mappedFine.plateCodeValue
                                  : t("common.noData")}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.vehicleColor")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.vehicleColor)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.vehicleType")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.vehicleType)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.vehicleBrand")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.vehicleBrand)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.manufacturerYear")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.manufacturerYear)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.vehicleOwnerName")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.vehicleOwnerName)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{t("form.vehicleOwnerEmail")}:</Text>
                              </Col>
                              <Col span={14} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                {getDisplay(mappedFine.vehicleOwnerEmail)}
                              </Col>
                              <Col span={10} style={{ textAlign: isRTLText ? "right" : "left" }}>
                                <Text strong>{isRTLText ? "تفاصيل المرور الإلكتروني:" : "E-Traffic Details:"}</Text>
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

                    {/* Row B — Violation Details */}
                    <Card
                      title={t("form.violationDetails", { defaultValue: "Violation Details" })}
                      size="small"
                      style={{ borderRadius: 12 }}
                      headStyle={cardHeadStyle}
                    >
                      {isLoadingViolation ? (
                        <Spin />
                      ) : !violationDetails?.length ? (
                        <Empty
                          description={t("form.Noviolationdetailsavailable", {
                            defaultValue: "No violation details available",
                          })}
                        />
                      ) : (
                        <Spin spinning={isLoadingViolation}>
                          {violationDetails?.map((value: any, index: number) => (
                            <Row
                              key={index}
                              gutter={[0, 0]}
                              style={{
                                alignItems: "center",
                                border: "1px solid #e8e8e8",
                                padding: "8px 12px",
                                background: colorBgContainer,
                                marginBottom: 5,
                                borderRadius: borderRadius,
                              }}
                            >
                              <Col flex="1">
                                <Text strong>{isRTLText ? value?.violationNameAr : value?.violationNameEn}</Text>
                              </Col>
                              <Col>
                                <Text strong>{t("form.amount", { defaultValue: "Amount" })}:</Text>
                              </Col>
                              <Col style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <Text strong>{t("form.amount")} :</Text>
                                <Text type="danger" strong>
                                  AED {value?.totalFineAmount}
                                </Text>
                              </Col>
                            </Row>
                          ))}
                        </Spin>
                      )}
                    </Card>

                    {/* Row C — Location Map  +  Attached Photos */}
                    <Row gutter={12}>
                      <Col span={12}>
                        <Card
                          title={t("form.FineLocation", { defaultValue: "Fine Location" })}
                          size="small"
                          style={{ borderRadius: 12 }}
                          headStyle={cardHeadStyle}
                        >
                          {mappedFine.latitude &&
                          mappedFine.longitude &&
                          mappedFine.latitude !== "0.0" &&
                          mappedFine.longitude !== "0.0" ? (
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
                            />
                          ) : (
                            <Empty description={t("common.noData", { defaultValue: "No Location Data Available" })} />
                          )}
                        </Card>
                      </Col>

                      <Col span={12}>
                        <Card
                          title={t("form.AttachedPhotos", { defaultValue: "Attached Photos" })}
                          size="small"
                          style={{ borderRadius: 12 }}
                          headStyle={cardHeadStyle}
                        >
                          <Spin spinning={isLoadingAttachments}>
                            {attachments.length > 0 ? (
                              <Image.PreviewGroup>
                                <Space wrap>
                                  {attachments.slice(0, 3).map((file: any) => (
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
                  </div>
                  {/* ── END LEFT COLUMN ── */}

                  {/* ── RIGHT COLUMN — Review Timeline spanning full height of top section ── */}
                  <div style={{ width: 320, flexShrink: 0 }}>
                    <ReviewTimeline data={timelineData} />
                  </div>
                  {/* ── END RIGHT COLUMN ── */}
                </div>
                {/* ── END TOP TWO-COLUMN SECTION ── */}

                {/* ══════════════════════════════════════════════════════════
                    BOTTOM — Approval Actions: full width across both columns
                    ══════════════════════════════════════════════════════════ */}
                {showInboxReviewWorkflow && (
                  <Card
                    title={t("form.approvalActions", { defaultValue: "Approval Actions" })}
                    size="small"
                    style={{ borderRadius: 12 }}
                    headStyle={cardHeadStyle}
                  >
                    <Form form={form} layout="vertical" dir={isRTL ? "rtl" : "ltr"}>
                      <Row gutter={16} align="middle">
                        {/* Action Dropdown */}
                        <Col span={6}>
                          <Form.Item
                            name="action"
                            label={<Text strong>{isRTL ? "الإجراء" : "Action"}</Text>}
                            rules={[
                              {
                                required: true,
                                message: isRTL ? "الرجاء اختيار إجراء" : "Please select an action",
                              },
                            ]}
                          >
                            <Select
                              placeholder={isRTL ? "اختر إجراء" : "Select action"}
                              onChange={handleActionChange}
                              allowClear
                            >
                              {reviewOptions.map((opt: any) => (
                                <Select.Option key={opt.ActivityOptionGUID} value={opt.ActivityOptionGUID}>
                                  {opt.ReviewStatus}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        {/* Comments */}
                        <Col span={12}>
                          <Form.Item
                            name="review_Comments"
                            label={<Text strong>{t("form.comments")}</Text>}
                            rules={[
                              {
                                required: !!selectedAction?.IsCommentMandatory,
                                message: isRTL ? "الرجاء إدخال التعليقات" : "Please enter comments",
                              },
                            ]}
                          >
                            <TextArea
                              rows={2}
                              placeholder={isRTL ? "أدخل التعليقات" : "Enter comments"}
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                            />
                          </Form.Item>
                        </Col>

                        {/* Buttons */}
                        <Col
                          span={6}
                          style={{
                            textAlign: isRTL ? "left" : "right",
                            paddingTop: 30,
                          }}
                        >
                          <Space>
                            <Button onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
                            <Button
                              type="primary"
                              loading={isUpdating}
                              onClick={handleSubmit}
                              disabled={!selectedAction}
                            >
                              {isRTL ? "إرسال" : "Submit"}
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default FineCancelRequestViewModal;
