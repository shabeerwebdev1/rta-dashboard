import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Typography, Button, Space, Image, Empty, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import type { PageConfig } from "../../types/config";
import { getFileUrl } from "../../services/fileApi";
import { useLazyGetLookupsQuery, useLazyGetPledgeByIdQuery } from "../../services/rtkApiFactory";

interface PledgesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  config: PageConfig;
  onShare: () => void;
}

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number, options: any[], language: string): string => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return String(value);
  return language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number): any[] => {
  return options.filter((option) => option.categoryId === categoryId);
};

const PledgesViewDrawer: React.FC<PledgesViewDrawerProps> = ({ open, onClose, record, config, onShare }) => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [mappedRecord, setMappedRecord] = useState<any>(null);
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetPledge, { data: singleRecordData, isSuccess: isSingleRecordSuccess, isLoading: isPledgeLoading }] =
    useLazyGetPledgeByIdQuery();

  // Check if we need to fetch the record by ID (for shared links)
  useEffect(() => {
    if (open) {
      const recordId = searchParams.get("viewRecord");

      // If we have a record object with data, use it directly
      if (record && record.id) {
        fetchLookupData();
      }
      // If we have a record ID from URL but no data, fetch the record
      else if (recordId) {
        triggerGetPledge(recordId);
      }
    }
  }, [open, record, searchParams]);

  // Handle the fetched record data
  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      fetchLookupData();
    }
  }, [isSingleRecordSuccess, singleRecordData]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      // Use category ID 900 for pledge types
      const result = await triggerGetLookups([900]).unwrap();
      setLookupOptions(result);

      // Determine which record to use for mapping
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
    if (!recordData) return;

    const pledgeTypeOptions = filterOptionsByCategory(lookups, 900);

    const mapped = {
      ...recordData,
      pledgeTypeLabel: getLabelFromValue(recordData.pledgeType as number, pledgeTypeOptions, i18n.language),
      addOnFormatted: recordData.addOn ? dayjs(recordData.addOn as string).format("DD MMM YYYY, h:mm A") : "",
    };

    setMappedRecord(mapped);
  };

  const displayFields = [
    { key: "pledgeTypeLabel", title: "form.pledgeType", type: "text" },
    { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "text" },
    { key: "businessName", title: "form.businessName", type: "text" },
    { key: "remarks", title: "form.remarks", type: "text" },
    { key: "addOnFormatted", title: "form.addedOn", type: "text" },
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
    >
      <Spin spinning={isLoadingLookups || isPledgeLoading}>
        {mappedRecord ? (
          <>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
              {displayFields.map((field) => {
                const text = mappedRecord[field.key];
                return (
                  <Descriptions.Item label={t(field.title)} key={field.key}>
                    {text || t("common.noData")}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>

            {imageNames.length > 0 ? (
              <>
                <Typography.Title level={5} style={{ marginBottom: 16 }}>
                  {t("form.document")}
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
                  {t("form.document")}
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
