/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Form, Space, Image } from "antd";
import { CloseOutlined, ShareAltOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { theme } from "antd";

import { useLazyGetLookupsQuery, useGetViolationDetailsQuery } from "../../services/rtkApiFactory";
import {
  useUpdateFineCancelStatusMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../../components/common/ArcGISMap";
import { plateSources, PLATE_COLOR } from "../../config/pageConfigs/finesConfig";
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
  lookupOptions: externalLookupOptions = [],
  getLabelFromValue: externalGetLabelFromValue,
  onShare,
  onViewLocation,
  onViewAttachments,
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
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [updateFineCancelStatus] = useUpdateFineCancelStatusMutation();

  const lookupOptionsToUse = externalLookupOptions.length > 0 ? externalLookupOptions : internalLookupOptions;
  const getLabelFunction = externalGetLabelFromValue || getLabelFromValue;
  const isStatus15003 = mappedFine?.inspectionStatus === 15003;

  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    fine ? { inspectionGUID: fine.inspectionGUID, entityCode: fine.entityCode } : skipToken,
  );

  const { data: violationDetails, isLoading: isLoadingViolation } = useGetViolationDetailsQuery(
    fine ? { inspectionGUID: fine.inspectionGUID, entityCode: fine.entityCode } : skipToken,
  );

  useEffect(() => {
    if (externalLookupOptions.length === 0 && open) fetchLookupData();
  }, [open, externalLookupOptions]);

  useEffect(() => {
    if (fine && lookupOptionsToUse.length > 0) mapFineToLabels();
  }, [fine, lookupOptionsToUse, i18n.language]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setLastAction(null);
    }
  }, [open, fine, form]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([1400, 1300, 1500]).unwrap();
      setInternalLookupOptions(result);
    } catch (error) {
      notification.error({ data: error });
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const mapFineToLabels = () => {
    if (!fine) return;

    const inspectionTypeOptions = filterOptionsByCategory(lookupOptionsToUse, 1400);
    const inspectionCategoryOptions = filterOptionsByCategory(lookupOptionsToUse, 1300);
    const inspectionStatusOptions = filterOptionsByCategory(lookupOptionsToUse, 1500);

    setMappedFine({
      ...fine,
      inspectionTypeLabel: fine.inspectionType
        ? getLabelFunction(fine.inspectionType, inspectionTypeOptions, i18n)
        : fine.inspectionType || "No Data",
      inspectionCategoryLabel: fine.inspectionCategory
        ? getLabelFunction(fine.inspectionCategory, inspectionCategoryOptions, i18n)
        : fine.inspectionCategory || "No Data",
      inspectionStatusLabel: fine.inspectionStatus
        ? getLabelFunction(fine.inspectionStatus, inspectionStatusOptions, i18n)
        : fine.inspectionStatus || "No Data",
      inspectionDateFormatted: formatDate(fine.actualDateTime),
      fineAmountFormatted: (fine.fineAmount ?? fine.fineAmount === 0) ? `${fine.fineAmount} AED` : "No Data",
      totalAmountFormatted:
        (fine.totalFineAmount ?? fine.totalFineAmount === 0) ? `${fine.totalFineAmount} AED` : "No Data",
      paymentTypeLabel: getPaymentTypeLabel(fine.paymentType),
      statusLabel: getStatusLabel(fine.isPaid, fine.inspectionStatus),
      statusColor: getStatusColor(fine.isPaid, fine.inspectionStatus),
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "No Data";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "Invalid Date";
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    const map: Record<string, string> = {
      "0": t("form.notPaid"),
      "1": t("paymentTypes.cash"),
      "2": t("paymentTypes.creditCard"),
      "3": t("paymentTypes.online"),
    };
    return map[paymentType] || paymentType || "No Data";
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
    15001: "orange",
    15002: "green",
    15003: "red",
    15004: "blue",
    15005: "purple",
    15006: "indigo",
  };

  const getStatusColor = (isPaid: boolean, inspectionStatus: number) => {
    if (isPaid) return "green";
    return fineStatusColorMap[inspectionStatus] || "orange";
  };

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

  return (
    <Modal open={open} onCancel={onClose} width={1000} footer={null} title={null} closable={false}>
      <Spin spinning={isLoading || isLoadingLookups || isProcessing}>
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
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
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
                        <Col span={14}>{mappedFine.tradeLicenseNameEn || mappedFine.tradeLicenseNameAr || "---"}</Col>
                      </>
                    )}

                    {/* Fine Details */}
                    <Col span={10}>
                      <Text strong>{t("form.fineType")}:</Text>
                    </Col>
                    <Col span={14}>{mappedFine.inspectionCategoryLabel}</Col>

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
                    <Col span={14}>{mappedFine.fineAmountFormatted}</Col>

                    <Col span={10}>
                      <Text strong>{t("form.paymentType")}:</Text>
                    </Col>
                    <Col span={14}>{mappedFine.paymentTypeLabel}</Col>

                    <Col span={10}>
                      <Text strong>{t("form.inspectionStatus")}:</Text>
                    </Col>
                    <Col span={14}>
                      <Tag color={mappedFine.statusColor}>{mappedFine.inspectionStatusLabel}</Tag>
                    </Col>

                    {/* <Col span={10}>
                      <Text strong>{t("form.blackPoints")}:</Text>
                    </Col>
                    <Col span={14}>{mappedFine.blackPointsFormatted}</Col> */}

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
                        {t("form.vehicleDetails")}
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
                    headStyle={{ background:colorBgContainer, fontWeight: 600 }}
                    style={{ marginBottom: 16, borderRadius: 12 }}
                  >
                    {/* Vehicle Plate at the top of Vehicle Details */}
                    <div style={{ display: "flex", justifyContent: "left", marginBottom: 16 }}></div>

                    <Row gutter={[0, 12]}>
                      <Col span={10}>
                        <Text strong>{t("form.plateNumber")}:</Text>
                      </Col>
                      <Col span={14}>{mappedFine.plateNumber || "No Data"}</Col>
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
                          <Text strong>{i18n.language === "ar" ? value?.violationNameAr : value?.violationNameEn}</Text>
                        </Col>
                        <Col>
                          <Text strong>{t("form.amount")}:</Text>
                        </Col>
                        <Col style={{ textAlign: "right" }}>
                          <Text strong> {value?.totalFineAmount} AED </Text>
                        </Col>
                      </Row>
                    );
                  })}
                </Spin>
              )}
            </Card>

            {/* Approval Actions */}
            {isStatus15003 && (
              <Card
                title={t("form.approvalActions")}
                size="small"
                style={{ marginBottom: 16, borderRadius: 12 }}
                headStyle={{ background: colorBgContainer, fontWeight: 600 }}
              >
                <Form
                  form={form}
                  onFinish={handleFormSubmit}
                  layout="vertical"
                  disabled={isProcessing}
                  style={{ marginBottom: 0 }}
                >
                  <Form.Item
                    name="comment"
                    rules={[{ required: true, message: t("placeholders.enterComments") }]}
                    style={{ marginBottom: 8 }}
                  >
                    <TextArea rows={3} placeholder={t("placeholders.comments")} />
                  </Form.Item>

                  {/* Actions */}
                  <Row justify={"end"}>
                    <Space style={{ marginTop: 0, marginBottom: 0 }}>
                      <Button
                        type="primary"
                        onClick={handleApproveClick}
                        disabled={isProcessing}
                        loading={isProcessing && lastAction === "approve"}
                      >
                        {t("form.approve")}
                      </Button>
                      <Button
                        danger
                        onClick={handleRejectClick}
                        disabled={isProcessing}
                        loading={isProcessing && lastAction === "reject"}
                      >
                        {t("form.reject")}
                      </Button>
                    </Space>
                  </Row>
                </Form>
              </Card>
            )}

            <Row gutter={16}>
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
                    />
                  ) : (
                    <Empty description="No Location Data Available" />
                  )}
                </Card>
              </Col>

              <Col span={12}>
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
                              src={getMobileFileUrl(file.filePath)}
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
        )}
      </Spin>
    </Modal>
  );
};

export default FinesViewDrawer;
