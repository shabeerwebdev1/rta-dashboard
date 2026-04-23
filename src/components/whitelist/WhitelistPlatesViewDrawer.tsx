import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Button, Spin, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import type { PageConfig } from "../../types/config";
import { useLazyGetLookupsQuery } from "../../services/rtkApiFactory";

interface WhitelistPlatesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  config: PageConfig;
  onShare: () => void;
}

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return value;

  // Use Arabic label if language is Arabic, otherwise English
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
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

// Hardcoded violation categories (to be replaced with API call later)
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

// Helper function to get status tag with appropriate color
const getStatusTag = (value: number, label: string) => {
  if (value === 5001) {
    return <Tag color="green">{label}</Tag>;
  }
  if (value === 5002) {
    return <Tag color="default">{label}</Tag>;
  }
  if (value === 5003) {
    return <Tag color="red">{label}</Tag>;
  }
  return <Tag>{label}</Tag>;
};

const WhitelistPlatesViewDrawer: React.FC<WhitelistPlatesViewDrawerProps> = ({
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

  // Fetch lookup data when drawer opens
  useEffect(() => {
    if (open) fetchLookupData();
  }, [open, i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([100, 200, 300, 400, 500]).unwrap();
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
    const plateSourceOptions = filterOptionsByCategory(lookups, 200);
    const plateTypeOptions = filterOptionsByCategory(lookups, 300);
    const plateColorOptions = filterOptionsByCategory(lookups, 400);
    const plateStatusOptions = filterOptionsByCategory(lookups, 500);

    // Get violation category label
    const violationCat = violationCategoryOptions(i18n).find((opt) => opt.value === record.violationCategory);

    // Get status label and value
    const statusValue = record.plateStatus_Id as number;
    const statusLabel = getLabelFromValue(statusValue, plateStatusOptions, i18n);

    const mapped = {
      ...record,
      plateSource: getLabelFromValue(record.plateSource_Id as number, plateSourceOptions, i18n),
      plateType: getLabelFromValue(record.plateType_Id as number, plateTypeOptions, i18n),
      plateColor: getLabelFromValue(record.plateColor_Id as number, plateColorOptions, i18n),
      plateStatus: {
        value: statusValue,
        label: statusLabel,
      },
      exemptionReason: getLabelFromValue(record.exemptionReason_ID as number, exemptionReasons, i18n),
      isByLawLabel: record.isByLaw ? t("common.yes") : t("common.no"),
      fromDateFormatted: formatDate(record.fromDate as string),
      toDateFormatted: formatDate(record.toDate as string),
      violationCategoryLabel: violationCat?.label || record.violationCategory || "",
    };

    setMappedRecord(mapped);
  };

  if (!record) return null;

  // Define the specific fields we want to show for whitelist plates
  const displayFields = [
    { key: "plateNumber", title: "form.Number", type: "text" },
    { key: "plateSource", title: "form.Source", type: "text" },
    { key: "plateType", title: "form.Type", type: "text" },
    { key: "plateColor", title: "form.Color", type: "text" },
    { key: "exemptionReason", title: "form.exemptionReason", type: "text" },
    { key: "plateStatus", title: "form.status", type: "status" },
    { key: "isByLawLabel", title: "form.isByLaw", type: "text" },
    { key: "fromDateFormatted", title: "placeholders.startDate", type: "date" },
    { key: "toDateFormatted", title: "placeholders.endDate", type: "date" },
    { key: "violationCategoryLabel", title: "form.violationCategory", type: "text" },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      className="whitelist-plates-drawer"
      extra={
        <Button icon={<ShareAltOutlined />} onClick={onShare}>
          {t("common.share")}
        </Button>
      }
      placement={isRtl ? "left" : "right"}
    >
      <Spin spinning={isLoadingLookups}>
        {mappedRecord && (
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
            {displayFields.map((field) => {
              const value = mappedRecord[field.key];

              return (
                <Descriptions.Item label={t(field.title)} key={field.key}>
                  {(() => {
                    if (value === null || value === undefined || value === "") return t("common.noData");

                    switch (field.type) {
                      case "date":
                        return value; // Value is already formatted by formatDate function

                      case "status":
                        return getStatusTag(value.value, value.label);

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

export default WhitelistPlatesViewDrawer;
