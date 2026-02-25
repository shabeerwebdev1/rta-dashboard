import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Button, Spin, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import type { PageConfig } from "../../types/config";
import { useLazyGetLookupsQuery } from "../../services/rtkApiFactory";

interface WhitelistTradeViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
}

const filterOptionsByCategory = (options: any[], categoryId: number) =>
  options.filter((option) => option.categoryId === categoryId);

const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return value;
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to format date based on language
const formatDate = (date: string) => {
  if (!date) return "";
  
  const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");
  const isArabic = lang.startsWith("ar");

  return dayjs(date)
    .locale(isArabic ? "ar" : "en")
    .format(isArabic ? "DD MMMM YYYY" : "DD MMM YYYY");
};

// Helper function to get status tag with appropriate color
const getStatusTag = (value: number, label: string) => {
  if (value === 5001) {
    return <Tag color="green">{label}</Tag>;
  }
  if (value === 5002) {
    return <Tag color="orange">{label}</Tag>;
  }
  if (value === 5003) {
    return <Tag color="red">{label}</Tag>;
  }
  return <Tag>{label}</Tag>;
};

// Hardcoded violation categories (to match the main page)
const violationCategoryOptions = (i18n: any) => [
  {
    value: "Parking Violation",
    labelEn: "Parking Violation",
    labelAr: "مخالفة وقوف",
    label: i18n.language === "ar" ? "مخالفة وقوف" : "Parking Violation",
  },
  {
    value: "Speed Violation",
    labelEn: "Speed Violation",
    labelAr: "مخالفة سرعة",
    label: i18n.language === "ar" ? "مخالفة سرعة" : "Speed Violation",
  },
  {
    value: "Traffic Light Violation",
    labelEn: "Traffic Light Violation",
    labelAr: "مخالفة إشارة مرور",
    label: i18n.language === "ar" ? "مخالفة إشارة مرور" : "Traffic Light Violation",
  },
  {
    value: "Lane Violation",
    labelEn: "Lane Violation",
    labelAr: "مخالفة مسار",
    label: i18n.language === "ar" ? "مخالفة مسار" : "Lane Violation",
  },
  {
    value: "No Entry Violation",
    labelEn: "No Entry Violation",
    labelAr: "مخالفة دخول ممنوع",
    label: i18n.language === "ar" ? "مخالفة دخول ممنوع" : "No Entry Violation",
  },
];

const WhitelistTradeViewDrawer: React.FC<WhitelistTradeViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
}) => {
  const { t, i18n } = useTranslation();
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [mappedRecord, setMappedRecord] = useState<any>(null);
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  const isRtl = i18n.dir() === "rtl";

  useEffect(() => {
    if (open) fetchLookupData();
  }, [open, i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([100, 500]).unwrap();
      setLookupOptions(result);
      mapRecordToLabels(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const mapRecordToLabels = (lookups: any[]) => {
    if (!record) return;

    const exemptionReasons = filterOptionsByCategory(lookups, 100);
    const statusOptions = filterOptionsByCategory(lookups, 500);

    // Get violation category label
    const violationCat = violationCategoryOptions(i18n).find((opt) => opt.value === record.violationCategory);

    // Get status value and label
    const statusValue = record.plateStatus_Id;
    const statusLabel = getLabelFromValue(statusValue, statusOptions, i18n);

    const mapped = {
      ...record,
      plateStatus: {
        value: statusValue,
        label: statusLabel,
      },
      exemptionReason: getLabelFromValue(record.exemptionReason_ID, exemptionReasons, i18n),
      violationCategoryLabel: violationCat?.label || record.violationCategory || "",
      isByLawLabel: record.isByLaw ? t("common.yes") : t("common.no"),
      fromDateFormatted: formatDate(record.fromDate),
      toDateFormatted: formatDate(record.toDate),
    };

    setMappedRecord(mapped);
  };

  if (!record) return null;

  const displayFields = [
    { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "text" },
    { key: "tradeLicense_EN_Name", title: "form.tradeLicense_EN_Name", type: "text" },
    { key: "tradeLicense_AR_Name", title: "form.tradeLicense_AR_Name", type: "text" },
    { key: "plotNumber", title: "form.plotNumber", type: "text" },
    { key: "violationCategoryLabel", title: "form.violationCategory", type: "text" },
    { key: "exemptionReason", title: "form.exemptionReason", type: "text" },
    { key: "plateStatus", title: "form.status", type: "status" },
    { key: "isByLawLabel", title: "form.isByLaw", type: "text" },
    { key: "fromDateFormatted", title: "placeholders.startDate", type: "date" },
    { key: "toDateFormatted", title: "placeholders.endDate", type: "date" },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      placement={isRtl ? "left" : "right"}
      extra={
        <Button icon={<ShareAltOutlined />} onClick={onShare}>
          {t("common.share")}
        </Button>
      }
    >
      <Spin spinning={isLoadingLookups}>
        {mappedRecord && (
          <Descriptions bordered column={1} size="small">
            {displayFields.map((field) => {
              const value = mappedRecord[field.key];

              return (
                <Descriptions.Item key={field.key} label={t(field.title)}>
                  {(() => {
                    if (value === null || value === undefined || value === "") return t("common.noData");

                    switch (field.type) {
                      case "status":
                        return getStatusTag(value.value, value.label);

                      case "date":
                        return value; // Value is already formatted by formatDate function

                      default:
                        return String(value);
                    }
                  })()}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        )}
      </Spin>
    </Drawer>
  );
};

export default WhitelistTradeViewDrawer;