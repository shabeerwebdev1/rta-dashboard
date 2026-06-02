/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Image, theme } from "antd";
import { CarOutlined, CheckCircleFilled, CloseCircleFilled, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useUpdateParkonicMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
  useLazyGetReviewHistoryQuery,
  useLazyGetEntityHistoryQuery,
} from "../../services/rtkApiFactory";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppNotification } from "../../utils/notificationManager";
import dayjs from "dayjs";
import { plateSources, PLATE_TYPE_SHORT, PLATE_COLOR } from "../../config/pageConfigs/finesConfig";
import UAEPlate from "../UAEPlate";
import "dayjs/locale/ar";
import { Select, Form } from "antd";
import { useLazyGetReviewOptionsQuery } from "../../services/rtkApiFactory";
import ReviewTimeline from "../ReviewTimeline";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ParkonicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
  isLoading?: boolean;
}

const ParkonicViewDrawer: React.FC<ParkonicViewDrawerProps> = ({ open, onClose, record, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();

  const isRTL = i18n.language === "ar";
  const { success, error } = useAppNotification();
  const [form] = Form.useForm();

  const [reviewParkonic, { isLoading: isSubmitting }] = useUpdateParkonicMutation();

  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();

  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();

  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();

  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record
      ? {
          inspectionGUID: record.inspectionGUID,
          entityCode: record.entityCode,
        }
      : skipToken,
  );

  useEffect(() => {
    if (open && record) {
      const entityId = record.EntityGUID || record.inspectionGUID;
      const entityCode = record.EntityCode || record.entityCode;

      if (record?.$SKWorkItemData) {
        getReviewOptions(record.$SKWorkItemData);
        getReviewHistory({ entityCode, entityId });
      } else if (entityId && entityCode) {
        getEntityHistory({ entityCode, entityId });
      }
    }
  }, [open, record]);

  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (open && record) {
      if (record.$SKWorkItemData) {
        getReviewOptions(record.$SKWorkItemData);
      }

      const entityId = record.EntityGUID || record.inspectionGUID;
      const entityCode = record.EntityCode || record.entityCode;

      if (entityId && entityCode) {
        getReviewHistory({
          entityCode,
          entityId,
        });
      }
    }
  }, [open, record]);

  // Reset form when closing
  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
      setComments("");
      form.resetFields();
    }
  }, [open, form]);

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

  const mappedRecord = useMemo(() => {
    return record
      ? {
          fineId: record.entityNo,
          plateNumber: record.plateNumber,
          reviewStatus: record.reviewStatus ?? 2,
          rejectionReason: record.rejectionReason || "",
          entryDateTime: record.startDateTime,
          exitDateTime: record.endDateTime,
        }
      : null;
  }, [record]);

  const violationDetails = useMemo(() => {
    if (!record) return [];
    return [
      {
        violationCategoryId: record.categoryId,
        violationNameEn: record.violationNameEn,
        violationNameAr: record.violationNameAr,
        violationAmount: record.violationAmount,
      },
    ];
  }, [record]);

  const hideFooterActions =
    mappedRecord?.reviewStatus === 2 || mappedRecord?.reviewStatus === 3 || !record?.$SKWorkItemData; // hide footer when opened from page

  const submitReview = async () => {
    try {
      await form.validateFields();

      if (!selectedAction) {
        error(
          {
            data: {
              en_Msg: "Please select an action",
              ar_Msg: "الرجاء تحديد إجراء",
            },
          },
          "",
        );
        return;
      }

      if (selectedAction.IsCommentMandatory && !comments.trim()) {
        error(
          {
            data: {
              en_Msg: "Comments are required for this action",
              ar_Msg: "التعليقات مطلوبة لهذا الإجراء",
            },
          },
          "",
        );
        return;
      }

      const payload = {
        inspectionGUID: record?.EntityGUID || record?.inspectionGUID,
        review: {
          reviewStatusCode: selectedAction.ReviewStatusCode,
          activityCode: record?.ActivityCode ?? record?.nvarchar3, // fix here
          entityCode: record?.EntityCode ?? record?.nvarchar12,
          entityGUID: record?.EntityGUID ?? record?.nvarchar2,
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments: comments || "",
          rcwuri: record?.$SKWorkItemData,
        },
      };

      const response = await reviewParkonic(payload).unwrap();
      success(response, "");
      onClose();
    } catch (err: any) {
      if (err.errorFields) return; // Validation error, don't show notification
      error(err, "");
    }
  };

  const formatDateTime = (value: any) => {
    if (!value) return "—";
    return dayjs(value)
      .locale(isRTL ? "ar" : "en")
      .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

  const getCompleteFilePath = (file: any) => {
    if (!file) return "";
    if (file.filePath?.includes(file.fileName)) return file.filePath;
    const separator = file.filePath?.endsWith("\\") ? "" : "\\";
    return `${file.filePath}${separator}${file.fileName}`;
  };

  const statusLabels: Record<number, { en: string; ar: string }> = {
    1: { en: t("status.approved"), ar: "موافق" },
    2: { en: t("status.rejected"), ar: "مرفوض" },
    0: { en: t("status.pending"), ar: "قيد الانتظار" },
  };

  const getStatusTag = (status: number) => {
    const label = statusLabels[status];
    const color = status === 1 ? "green" : status === 0 ? "orange" : "red";
    return <Tag color={color}>{label?.[i18n.language === "ar" ? "ar" : "en"]}</Tag>;
  };

  const getPlateSourceLabel = (value: any) => {
    if (value === null || value === undefined || value === "") return "---";
    const source = plateSources[value as keyof typeof plateSources];
    if (source) {
      return i18n.language === "ar" ? source.ar : source.en;
    }
    return String(value);
  };

  const getPlateSourceLocalized = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return { en: "", ar: "" };
    }

    const direct = plateSources[value as keyof typeof plateSources];
    if (direct) {
      return { en: direct.en, ar: direct.ar };
    }

    const strValue = String(value).trim().toLowerCase();
    const matched = Object.values(plateSources).find(
      (item) => item.en.toLowerCase() === strValue || item.ar.toLowerCase() === strValue,
    );

    if (matched) {
      return { en: matched.en, ar: matched.ar };
    }

    return { en: String(value), ar: String(value) };
  };

  const getPlateCategoryLabel = (value: any) => {
    if (value === null || value === undefined || value === "") return "---";
    return PLATE_TYPE_SHORT[value as keyof typeof PLATE_TYPE_SHORT] || String(value);
  };

  const getPlateCodeLabel = (value: any) => {
    if (value === null || value === undefined || value === "") return "---";
    return PLATE_COLOR[value as keyof typeof PLATE_COLOR] || String(value);
  };

  const hasMissingVehicleOwnerName = useMemo(() => {
    const ownerName = record?.vehicleOwnerName;
    if (ownerName === null || ownerName === undefined) return true;
    const normalized = String(ownerName).trim().toLowerCase();
    return normalized === "" || normalized === "no data" || normalized === "—" || normalized === "---";
  }, [record?.vehicleOwnerName]);

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((o: any) => o.ActivityOptionGUID === value);
    setSelectedAction(opt);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1600}
      footer={null}
      title={null}
      closable={false}
      style={{ top: 40 }}
      bodyStyle={{
        padding: 0,
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Spin spinning={isLoading || isSubmitting || historyLoading || loadingOptions}>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
          {/* Fixed Header */}
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
            <Row
              align="middle"
              style={{
                marginBottom: 0,
                direction: isRTL ? "rtl" : "ltr",
              }}
            >
              <Col>
                <Space size="middle" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {t("form.parkonicdetails")} <Text type="danger">#{mappedRecord?.fineId || "—"}</Text>
                  </Title>

                  {mappedRecord?.reviewStatus !== undefined && getStatusTag(mappedRecord.reviewStatus)}
                </Space>
              </Col>

              <Col flex="auto" />

              <Col>
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
              </Col>
            </Row>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              padding: 24,
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }}
          >
            {!mappedRecord ? (
              <Empty />
            ) : (
              <Row gutter={24} dir={isRTL ? "rtl" : "ltr"}>
                {/* Left Column - Main Content */}
                <Col span={18}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card
                        title={
                          <Text strong style={{ fontSize: "16px" }}>
                            {t("form.parkonicdetails")}
                          </Text>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                        headStyle={{
                          background: token.colorBgContainer,
                          fontWeight: 600,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.refernecenumber")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{record.transcationId}</Text>
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.fineNumber")}:</Text>
                          </Col>

                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {mappedRecord.reviewStatus === 1
                              ? (mappedRecord.fineId ?? t("common.notAvailable"))
                              : t("common.notAvailable")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.status")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {getStatusTag(mappedRecord.reviewStatus)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.vehicleEntryDateTime")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {formatDateTime(mappedRecord.entryDateTime)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.vehicleExitDateTime")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {formatDateTime(mappedRecord.exitDateTime)}
                          </Col>
                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.reviewedBy")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{record.reviewerName}</Text>
                          </Col>
                        </Row>
                      </Card>

                      <Card
                        title={
                          <Text strong style={{ fontSize: "16px" }}>
                            {t("form.violationDetails")}
                          </Text>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                        headStyle={{
                          background: token.colorBgContainer,
                          fontWeight: 600,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        {violationDetails.length > 0 ? (
                          <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.violationCategoryId")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {violationDetails[0].violationCategoryId ?? "No Data"}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.violationDescription")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {i18n.language === "ar"
                                ? violationDetails[0].violationNameAr
                                : violationDetails[0].violationNameEn}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.amount")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong type="danger" style={{ fontSize: "16px", fontWeight: 600 }}>
                                AED {violationDetails[0].violationAmount}
                              </Text>
                            </Col>
                          </Row>
                        ) : (
                          <Empty description={t("form.Noviolationdetailsavailable")} />
                        )}
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexDirection: isRTL ? "row-reverse" : "row",
                              marginBottom: 8,
                              marginTop: 8,
                            }}
                          >
                            <Text strong style={{ fontSize: "16px" }}>
                              {t("form.vehicleDetails")}
                            </Text>
                            <div style={{ marginTop: "4px" }}>
                              {(() => {
                                const localizedSource = getPlateSourceLocalized(record?.plateSource);
                                return (
                                  <UAEPlate
                                    code={getPlateCodeLabel(record?.plateCode)}
                                    number={record?.plateNumber ?? "---"}
                                    emirateEn={localizedSource.en}
                                    emirateAr={localizedSource.ar}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                        headStyle={{
                          background: token.colorBgContainer,
                          fontWeight: 600,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.plateNumber")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {record?.plateNumber || "No Data"}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.plateSource")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {getPlateSourceLabel(record?.plateSource)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.plateCategory")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {getPlateCategoryLabel(record?.plateCategory)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.plateCode")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {getPlateCodeLabel(record?.plateCode)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.vehicleColor")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {record?.vehicleColor || "No Data"}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.vehicleType")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {record?.vehicleType || "No Data"}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.vehicleBrand")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {record?.vehicleBrand || "No Data"}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.manufacturerYear")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {record?.manufacturerYear || "No Data"}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.vehicleOwnerName")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {record?.vehicleOwnerName || "No Data"}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{isRTL ? "تفاصيل المرور الإلكتروني:" : "E-Traffic Details:"}</Text>
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
                  </Row>

                  {/* Notes Card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.notes")}
                      </Text>
                    }
                    size="small"
                    style={{ marginBottom: 16 }}
                    headStyle={{
                      background: token.colorBgContainer,
                      fontWeight: 600,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {record?.notes ? (
                      <Text style={{ whiteSpace: "pre-wrap" }}>{record.notes}</Text>
                    ) : (
                      <Empty description={t("form.noNotesAvailable")} />
                    )}
                  </Card>

                  {/* Attachments Card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.AttachedPhotos")}
                      </Text>
                    }
                    size="small"
                    style={{ marginBottom: 16 }}
                    headStyle={{
                      background: token.colorBgContainer,
                      fontWeight: 600,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    <Spin spinning={isLoadingAttachments}>
                      {attachments.length > 0 ? (
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          {attachments.map((file) => {
                            const completeFilePath = getCompleteFilePath(file);
                            return (
                              <div key={file.attachmentGUID} style={{ position: "relative" }}>
                                <Image
                                  width={120}
                                  height={120}
                                  src={getMobileFileUrl(completeFilePath)}
                                  alt={file.fileName}
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "1px solid #f0f0f0",
                                  }}
                                  preview={{
                                    mask: null,
                                  }}
                                />
                              </div>
                            );
                          })}
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
                </Col>

                {/* Right Column - Review Timeline */}
                <Col span={6}>
                  <ReviewTimeline data={record?.$SKWorkItemData ? reviewHistory : entityHistory} />
                </Col>
              </Row>
            )}
          </div>

          {!hideFooterActions && (
            <div
              style={{
                padding: "16px 24px 24px",
                background: token.colorBgContainer,
                borderTop: "1px solid #f0f0f0",
                flexShrink: 0,
              }}
            >
              <Form form={form} layout="vertical" dir={isRTL ? "rtl" : "ltr"}>
                <Row gutter={16} align="middle" dir={isRTL ? "rtl" : "ltr"}>
                  <Col span={6}>
                    <Form.Item
                      name="action"
                      label={<Text strong>{isRTL ? "الإجراء" : "Action"}</Text>}
                      rules={[{ required: true, message: isRTL ? "الرجاء اختيار إجراء" : "Please select an action" }]}
                    >
                      <Select
                        placeholder={isRTL ? "اختر إجراء" : "Select action"}
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
                      name="review_Comments"
                      label={<Text strong>{t("form.comments")}</Text>}
                      style={{ marginBottom: 0 }}
                      rules={[
                        {
                          required: selectedAction?.IsCommentMandatory || false,
                          message: isRTL ? "الرجاء إدخال التعليقات" : "Please enter comments",
                        },
                      ]}
                    >
                      <TextArea
                        placeholder={
                          selectedAction?.IsCommentMandatory
                            ? isRTL
                              ? "أدخل التعليقات (مطلوبة)"
                              : "Enter comments (required)"
                            : isRTL
                              ? "أدخل التعليقات (اختياري)"
                              : "Enter comments (optional)"
                        }
                        rows={2}
                        dir={isRTL ? "rtl" : "ltr"}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
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
                      <Button onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
                      <Button type="primary" loading={isSubmitting} onClick={submitReview} disabled={!selectedAction}>
                        {isRTL ? "إرسال" : "Submit"}
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

export default ParkonicViewDrawer;
