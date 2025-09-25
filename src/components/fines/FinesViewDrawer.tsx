// components/FinesViewDrawer.tsx
import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Empty, Spin, Image, Space, Button, Input, Typography, Form, message } from "antd";
import { useTranslation } from "react-i18next";
import UAEPlate from "../UAEPlate";
import { useLazyGetLookupsQuery } from "../../services/rtkApiFactory";
import { ShareAltOutlined } from "@ant-design/icons";
import TradeLicenseCard from "../TradeLicenseCard";
import { useUpdateFineCancelStatusMutation } from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import { useGetInspectionAttachmentsQuery, getMobileFileUrl } from "../../services/inspectionFileApi";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { PLATE_COLOR, PLATE_TYPE_SHORT } from "../../config/pageConfigs/finesConfig";

const plateSources: Record<number, string> = {
  1: "Dubai",
  2: "Abu Dhabi",
  3: "Ajman",
  4: "Sharjah",
  5: "Umm Al Quwain",
  6: "Fujairah",
  7: "Ras Al Khaimah",
  8: "Al Ain",
  9: "Other",
};

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
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
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
}) => {
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

  const getStatusColor = (isPaid: boolean, inspectionStatus: number) => {
    if (isPaid) return "green";
    if (inspectionStatus === 2) return "red";
    if (inspectionStatus === 15003) return "orange";
    return "orange";
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

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("form.finedetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
      extra={
        <Space>
          {onShare && (
            <Button icon={<ShareAltOutlined />} onClick={onShare}>
              {t("common.share")}
            </Button>
          )}
        </Space>
      }
    >
      <Spin spinning={isLoading || isLoadingLookups || isProcessing}>
        {!mappedFine ? (
          <Empty description="No Data" />
        ) : (
          <>
            {/* Fine details */}
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.fineType")}>{mappedFine.inspectionCategoryLabel}</Descriptions.Item>
              <Descriptions.Item label={t("form.fineNumber")}>{mappedFine.entityNo}</Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionType")}>{mappedFine.inspectionTypeLabel}</Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionDate")}>
                {mappedFine.inspectionDateFormatted}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.amount")}>{mappedFine.fineAmountFormatted}</Descriptions.Item>
              <Descriptions.Item label={t("form.paymentType")}>{mappedFine.paymentTypeLabel}</Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionStatus")}>
                <Tag color={mappedFine.statusColor}>{mappedFine.inspectionStatusLabel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.blackPoints")}>{mappedFine.blackPointsFormatted}</Descriptions.Item>
            </Descriptions>

            {/* Plate / Trade License */}
            {(mappedFine?.plateNumber || mappedFine?.tradeLicenseNumber) && (
              <>
                <h4 style={{ marginTop: 16 }}>
                  {mappedFine?.plateNumber ? t("form.plateDetails") : t("form.tradeLicenseDetails")}
                </h4>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  {mappedFine?.plateNumber ? (
                    <UAEPlate
                      code={PLATE_TYPE_SHORT[mappedFine?.plateCategoryValue] ?? "---"}
                      number={mappedFine?.plateNumber ?? "---"}
                      emirateEn={plateSources[mappedFine?.plateSourceValue] ?? "Unknown"}
                      emirateAr={PLATE_COLOR[mappedFine?.plateCodeValue] ?? "---"}
                    />
                  ) : (
                    <TradeLicenseCard
                      code={mappedFine?.tradeLicenseNumber ?? ""}
                      number={mappedFine?.tradeLicenseNameEn || mappedFine?.tradeLicenseNameAr || "---"}
                      emirateAr={mappedFine?.tradeLicenseNameAr ?? ""}
                    />
                  )}
                </div>
              </>
            )}

            {/* Approval actions */}
            {isStatus15003 && (
              <>
                <h4 style={{ marginTop: 16 }}>{t("form.approvalActions")}</h4>
                <Form form={form} onFinish={handleFormSubmit} layout="vertical" disabled={isProcessing}>
                  <Form.Item
                    name="comment"
                    rules={[
                      {
                        required: true,
                        message: "Please enter comments before approving or rejecting",
                      },
                    ]}
                  >
                    <TextArea rows={3} placeholder={t("placeholders.comments")} style={{ marginBottom: 10 }} />
                  </Form.Item>
                  <Space>
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
                </Form>
              </>
            )}

            {/* Vehicle details */}
            {mappedFine?.plateNumber && (
              <>
                <h4 style={{ marginTop: 16 }}>{t("form.vehicleDetails")}</h4>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t("form.vehicleColor")}>
                    {mappedFine.vehicleColor || "No Data"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.vehicleType")}>
                    {mappedFine.vehicleType || "No Data"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.vehicleBrand")}>
                    {mappedFine.vehicleBrand || "No Data"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.manufacturerYear")}>
                    {mappedFine.manufacturerYear || "No Data"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.vehicleOwnerName")}>
                    {mappedFine.vehicleOwnerName || "No Data"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.vehicleOwnerEmail")}>
                    {mappedFine.vehicleOwnerEmail || "No Data"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.vehicleOwnerMobile")}>
                    {mappedFine.vehicleOwnerMobile || "No Data"}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {/* Fine Location */}
            <h4 style={{ marginTop: 16 }}>{t("form.FineLocation")}</h4>
            {mappedFine.latitude && mappedFine.longitude ? (
              <ArcGISMap
                inspectors={[
                  {
                    id: 1,
                    name: "Fine Location",
                    nameAr: "Fine Location",
                    lat: mappedFine.latitude,
                    lng: mappedFine.longitude,
                    status: "Fine",
                    statusAr: "Fine",
                    details: { zone: "", lastCheckIn: "" },
                    markerType: "google-pin",
                  },
                ]}
                center={[mappedFine.longitude, mappedFine.latitude]}
                zoom={16}
                height="300px"
              />
            ) : (
              <Empty description="No Location Data Available" />
            )}

            {/* Attached Photos */}
            <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
              {t("form.AttachedPhotos")}
            </Title>
            <Spin spinning={isLoadingAttachments}>
              {attachments.length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {attachments.map((file) => (
                      <Image
                        key={file.attachmentGUID}
                        width={100}
                        height={100}
                        src={getMobileFileUrl(file.filePath)}
                        alt={file.fileName}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
              )}
            </Spin>
          </>
        )}
      </Spin>
    </Drawer>
  );
};

export default FinesViewDrawer;
