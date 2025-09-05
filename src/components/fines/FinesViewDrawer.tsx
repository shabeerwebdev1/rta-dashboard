// components/FinesViewDrawer.tsx
import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Empty, Spin, Image, Space, Button } from "antd";
import { useTranslation } from "react-i18next";
import UAEPlate from "../UAEPlate";
// import { getFileUrl } from "../../services/fileApi";
import { useLazyGetLookupsQuery } from "../../services/rtkApiFactory";
import { ShareAltOutlined } from "@ant-design/icons";
import TradeLicenseCard from "../TradeLicenseCard";

interface FinesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  fine: any;
  isLoading?: boolean;
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
  onShare?: () => void;
}

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value || opt.id === value);
  if (!option) return String(value);

  return i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
};

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
  const [internalLookupOptions, setInternalLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [mappedFine, setMappedFine] = useState<any>(null);
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  // Use external lookup options if provided, otherwise fetch internally
  const lookupOptionsToUse = externalLookupOptions.length > 0 ? externalLookupOptions : internalLookupOptions;
  const getLabelFunction = externalGetLabelFromValue || getLabelFromValue;

  // Fetch lookup data when drawer opens if no external options provided
  useEffect(() => {
    if (externalLookupOptions.length === 0 && open) {
      fetchLookupData();
    }
  }, [open, externalLookupOptions]);

  // Map fine data when fine or lookup options change
  useEffect(() => {
    if (fine && lookupOptionsToUse.length > 0) {
      mapFineToLabels();
    }
  }, [fine, lookupOptionsToUse, i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      // Fetch inspection types (category 1400) and any other needed categories
      const result = await triggerGetLookups([1400, 1300]).unwrap();
      setInternalLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const mapFineToLabels = () => {
    if (!fine) return;

    const inspectionTypeOptions = filterOptionsByCategory(lookupOptionsToUse, 1400);
    const inspectionCategoryOptions = filterOptionsByCategory(lookupOptionsToUse, 1300);
    const inspectionStatusOptions = filterOptionsByCategory(lookupOptionsToUse, 1500);

    const mapped = {
      ...fine,

      // Map inspection type
      inspectionTypeLabel: fine.inspectionType
        ? getLabelFunction(fine.inspectionType, inspectionTypeOptions, i18n)
        : fine.inspectionType || "No Data",

      // Map fine category
      inspectionCategoryLabel: fine.inspectionCategory
        ? getLabelFunction(fine.inspectionCategory, inspectionCategoryOptions, i18n)
        : fine.inspectionCategory || "No Data",

      // Map inspection status (from lookup instead of hardcoded)
      inspectionStatusLabel: fine.inspectionStatus
        ? getLabelFunction(fine.inspectionStatus, inspectionStatusOptions, i18n)
        : fine.inspectionStatus || "No Data",

      // Dates
      inspectionDateFormatted: formatDate(fine.actualDateTime),

      // Amounts
      fineAmountFormatted: (fine.fineAmount ?? fine.fineAmount === 0) ? `${fine.fineAmount} AED` : "No Data",
      totalAmountFormatted:
        (fine.totalFineAmount ?? fine.totalFineAmount === 0) ? `${fine.totalFineAmount} AED` : "No Data",

      // Payment & status
      paymentTypeLabel: getPaymentTypeLabel(fine.paymentType),
      statusLabel: getStatusLabel(fine.isPaid, fine.inspectionStatus), // keep paid/unpaid mapping
      statusColor: getStatusColor(fine.isPaid, fine.inspectionStatus),

      // Black points
      blackPointsFormatted: (fine.blackPoint ?? fine.blackPoint === 0) ? fine.blackPoint : "0",
    };

    setMappedFine(mapped);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "No Data";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    const paymentTypeMap: Record<string, string> = {
      "0": t("form.notPaid"),
      "1": t("paymentTypes.cash"),
      "2": t("paymentTypes.creditCard"),
      "3": t("paymentTypes.online"),
    };
    return paymentTypeMap[paymentType] || paymentType || "No Data";
  };

  const getStatusLabel = (isPaid: boolean, inspectionStatus: number) => {
    const inspectionStatusMap: Record<number, string> = {
      0: t("status.pending"),
      1: t("status.completed"),
      2: t("status.cancelled"),
    };

    if (isPaid) return t("status.paid");
    return inspectionStatusMap[inspectionStatus || 0] || t("status.unknown");
  };

  const getStatusColor = (isPaid: boolean, inspectionStatus: number) => {
    if (isPaid) return "green";
    if (inspectionStatus === 2) return "red";
    return "orange";
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("form.finedetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
      extra={
        onShare && (
          <Button icon={<ShareAltOutlined />} onClick={onShare}>
            {t("common.share")}
          </Button>
        )
      }
    >
      <Spin spinning={isLoading || isLoadingLookups}>
        {!mappedFine ? (
          <Empty description="No Data" />
        ) : (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.fineType")}>{mappedFine.inspectionCategoryLabel}</Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionType")}>{mappedFine.inspectionTypeLabel}</Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionDate")}>
                {mappedFine.inspectionDateFormatted}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.amount")}>{mappedFine.fineAmountFormatted}</Descriptions.Item>
              <Descriptions.Item label={t("form.paymentType")}>{mappedFine.paymentTypeLabel}</Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionStatus")}>
                {mappedFine.inspectionStatusLabel}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.blackPoints")}>{mappedFine.blackPointsFormatted}</Descriptions.Item>
            </Descriptions>

            {/* Identification Section (Plate or Trade License) */}
            {(mappedFine?.plateNumber || mappedFine?.tradeLicenseNumber) && (
              <>
                <h4 style={{ marginTop: 16 }}>
                  {mappedFine?.plateNumber ? t("form.plateDetails") : t("form.tradeLicenseDetails")}
                </h4>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  {/* Show Plate if available, otherwise Trade License */}
                  {mappedFine?.plateNumber ? (
                    <UAEPlate
                      code={mappedFine?.plateCategoryValue ?? ""}
                      number={mappedFine?.plateNumber ?? "---"}
                      emirateEn={mappedFine?.plateSourceValue ?? ""}
                      emirateAr={mappedFine?.plateCodeValue ?? ""}
                    />
                  ) : mappedFine?.tradeLicenseNumber ? (
                    <TradeLicenseCard
                      code={mappedFine?.tradeLicenseNumber ?? ""}
                      number={mappedFine?.tradeLicenseNameEn || mappedFine?.tradeLicenseNameAr || "---"}
                      emirateAr={mappedFine?.tradeLicenseNameAr ?? ""}
                    />
                  ) : null}
                </div>
              </>
            )}

            {/* Vehicle Details – only if plate exists */}
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

            <h4 style={{ marginTop: 16 }}>{t("form.FineLocation")}</h4>
            {mappedFine.latitude &&
            mappedFine.longitude &&
            mappedFine.latitude !== "string" &&
            mappedFine.longitude !== "string" ? (
              <iframe
                title="Fine Location"
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${mappedFine.latitude},${mappedFine.longitude}&z=15&output=embed`}
              ></iframe>
            ) : (
              <Empty description="No Location Data Available" />
            )}

            {/* <h4 style={{ marginTop: 16 }}>{t("form.AttachedPhotos")}</h4>
            {mappedFine?.photoPath ? (
              (() => {
                const imageNames = String(mappedFine.photoPath).split(";").filter(Boolean);
                return imageNames.length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {imageNames.map((fileName: string, idx: number) => (
                        <Image
                          key={idx}
                          width={100}
                          height={100}
                          src={getFileUrl(fileName)}
                          alt={fileName}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
                );
              })()
            ) : (
              <Empty description={t("common.noData")} />
            )} */}
          </>
        )}
      </Spin>
    </Drawer>
  );
};

export default FinesViewDrawer;
