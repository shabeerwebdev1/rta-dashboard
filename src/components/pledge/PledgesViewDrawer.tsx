/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Typography, Button, Space, Image, Empty, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { useSearchParams } from "react-router-dom";
import type { PageConfig } from "../../types/config";
import { getFileUrl } from "../../services/rtkApiFactory";
import { useLazyGetLookupsQuery, useLazyGetPledgeByIdQuery } from "../../services/rtkApiFactory";

// ---------- Helper Functions ----------
const getLabelFromValue = (value: number, options: any[], language: string): string => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return String(value);
  return language === "ar" ? option.labelAr : option.labelEn;
};

const filterOptionsByCategory = (options: any[], categoryId: number): any[] => {
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

// ---------- Component ----------
interface PledgesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  config: PageConfig;
  onShare: () => void;
  isLoading?: boolean;
}

const PledgesViewDrawer: React.FC<PledgesViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [mappedRecord, setMappedRecord] = useState<any>(null);

  const isRtl = i18n.dir() === "rtl";

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetPledge, { data: singleRecordData, isSuccess: isSingleRecordSuccess, isLoading: isPledgeLoading }] =
    useLazyGetPledgeByIdQuery();

  const recordId = searchParams.get("viewRecord");

  // Fetch record when drawer opens
  useEffect(() => {
    if (open) {
      if (record && record.id) {
        fetchLookupData();
      } else if (recordId) {
        triggerGetPledge(recordId);
      }
    }
  }, [open, record, recordId]);

  // Handle fetched record
  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      fetchLookupData();
    }
  }, [isSingleRecordSuccess, singleRecordData]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([900]).unwrap();
      setLookupOptions(result);

      const recordToMap = singleRecordData?.data || record;
      if (recordToMap) {
        mapRecordToLabels(result, recordToMap);
      }
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const mapRecordToLabels = (lookups: any[], recordData: any) => {
    const pledgeTypeOptions = filterOptionsByCategory(lookups, 900);

    const mapped = {
      ...recordData,
      pledgeTypeLabel: getLabelFromValue(recordData.pledgeType as number, pledgeTypeOptions, i18n.language),
      pledgeDateFormatted: formatDate(recordData.pledgeDate as string),
      pledgeEndDateFormatted: formatDate(recordData.pledgeEndDate as string),
    };

    setMappedRecord(mapped);
  };

  // Fields to show in Drawer
  const displayFields = [
    { key: "pledgeTypeLabel", title: "form.pledgeType", type: "text" },
    { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "text" },
    { key: "businessName", title: "form.businessName", type: "text" },
    { key: "remarks", title: "form.remarks", type: "text" },
    { key: "pledgeDateFormatted", title: "form.pledgestartDate", type: "date" },
    { key: "pledgeEndDateFormatted", title: "form.pledgeEndDate", type: "date" },
    { key: "businessEmail", title: "form.businessEmail", type: "text" },
    { key: "sendToEmail", title: "form.toSendEmail", type: "text" },
  ];

  const imageNames = mappedRecord?.documentPath ? String(mappedRecord.documentPath).split(";").filter(Boolean) : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      className="pledges-drawer"
      extra={
        <Space>
          <Button icon={<ShareAltOutlined />} onClick={onShare}>
            {t("common.share")}
          </Button>
        </Space>
      }
      placement={isRtl ? "left" : "right"}
    >
      <Spin spinning={isLoadingLookups || isPledgeLoading || isLoading}>
        {mappedRecord ? (
          <>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
              {displayFields.map((field) => {
                const text = mappedRecord[field.key];
                return (
                  <Descriptions.Item label={t(field.title)} key={field.key}>
                    {(() => {
                      if (!text) return t("common.noData");

                      if (field.type === "date") {
                        return text; // Value is already formatted by formatDate function
                      }

                      return String(text);
                    })()}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>

            {imageNames.length > 0 ? (
              <>
                <Typography.Title level={5} style={{ marginBottom: 16 }}>
                  {t("form.AttachedPhotos")}
                </Typography.Title>
                <Image.PreviewGroup>
                  <Space wrap>
                    {imageNames.map((name, index) => (
                      <Image key={index} width={100} height={100} src={getFileUrl(name)} alt={name} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </>
            ) : (
              <>
                <Typography.Title level={5} style={{ marginBottom: 16 }}>
                  {t("form.AttachedPhotos")}
                </Typography.Title>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
              </>
            )}
          </>
        ) : (
          <Empty description={t("common.noData")} />
        )}
      </Spin>
    </Drawer>
  );
};

export default PledgesViewDrawer;