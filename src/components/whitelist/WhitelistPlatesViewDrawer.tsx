import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Button, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
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
    fetchLookupData();
  }, []);

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

    const mapped = {
      ...record,
      plateSource: getLabelFromValue(record.plateSource_Id as number, plateSourceOptions, i18n),
      plateType: getLabelFromValue(record.plateType_Id as number, plateTypeOptions, i18n),
      plateColor: getLabelFromValue(record.plateColor_Id as number, plateColorOptions, i18n),
      plateStatus: getLabelFromValue(record.plateStatus_Id as number, plateStatusOptions, i18n),
      exemptionReason: getLabelFromValue(record.exemptionReason_ID as number, exemptionReasons, i18n),
      isByLawLabel: record.isByLaw ? t("common.yes") : t("common.no"),
      fromDateFormatted: record.fromDate ? dayjs(record.fromDate as string).format("YYYY-MM-DD") : "",
      toDateFormatted: record.toDate ? dayjs(record.toDate as string).format("YYYY-MM-DD") : "",
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
    { key: "plateStatus", title: "form.status", type: "text" },
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
              const text = mappedRecord[field.key];

              return (
                <Descriptions.Item label={t(field.title)} key={field.key}>
                  {(() => {
                    if (text === null || text === undefined || text === "") return t("common.noData");

                    switch (field.type) {
                      case "date":
                        return dayjs(text as string).isValid()
                          ? dayjs(text as string).format("DD MMM YYYY")
                          : String(text);

                      default:
                        return String(text);
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
