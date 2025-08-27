import React, { useState, useEffect, useMemo } from "react";
import { Drawer, Descriptions, Tag, Typography, Button, Space, Image, Empty, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { PageConfig } from "../types/config";
import { getFileUrl } from "../services/fileApi";
import { useLazyGetLookupsQuery } from "../services/rtkApiFactory";
import { STATUS_COLORS } from "../constants/ui";

interface DynamicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  config: PageConfig;
  onShare: () => void;
  refetch?: () => void;
}

const DynamicViewDrawer: React.FC<DynamicViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
  refetch = () => {},
}) => {
  const { t, i18n } = useTranslation();
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  const allFields = useMemo(() => {
    const tableColsMap = new Map(config.tableConfig.columns.map((col) => [col.key, col]));
    config.formConfig.fields.forEach((field) => {
      if (!tableColsMap.has(field.name)) {
        tableColsMap.set(field.name, {
          key: field.name,
          title: field.label,
          type: "custom",
          lookupCategory: field.lookupCategory,
        });
      }
    });
    return Array.from(tableColsMap.values());
  }, [config]);

  useEffect(() => {
    if (open && record) {
      const lookupCategories = [...new Set(allFields.map((f) => f.lookupCategory).filter(Boolean))];
      if (lookupCategories.length > 0) {
        fetchLookupData(lookupCategories as number[]);
      }
    }
  }, [open, record, allFields]);

  const fetchLookupData = async (categoryIds: number[]) => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups(categoryIds).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const getDisplayValue = (fieldKey: string, value: any) => {
    if (value === null || value === undefined || value === "") return t("common.noData");

    const field = allFields.find((f) => f.key === fieldKey);
    if (!field) return String(value);

    if (field.lookupCategory && lookupOptions.length > 0) {
      const options = lookupOptions.filter((opt) => opt.categoryId === field.lookupCategory);
      const option = options.find((opt) => opt.value === value);
      if (option) return i18n.language === "ar" ? option.labelAr : option.labelEn;
    }

    if (typeof value === "boolean") return value ? t("common.true") : t("common.false");

    switch (field.type) {
      case "date":
        return dayjs(value as string).isValid() ? dayjs(value as string).format("DD MMM YYYY, h:mm A") : String(value);
      case "tag":
        const statusKey = String(value).toLowerCase();
        return (
          <Tag color={STATUS_COLORS[statusKey] || "default"}>
            {t(`status.${statusKey}`, { defaultValue: String(value) })}
          </Tag>
        );
      default:
        return String(value);
    }
  };

  const drawerSections = config.tableConfig.drawerConfig?.sections || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      className="dynamic-drawer"
      extra={
        <Button icon={<ShareAltOutlined />} onClick={onShare}>
          {t("common.share")}
        </Button>
      }
    >
      <Spin spinning={isLoadingLookups}>
        {!record ? (
          <Empty />
        ) : (
          drawerSections.map((section, index) => {
            switch (section.type) {
              case "descriptions":
                return (
                  <div key={index} style={{ marginBottom: 24 }}>
                    {section.title && <Typography.Title level={5}>{t(section.title)}</Typography.Title>}
                    <Descriptions bordered column={1} size="small">
                      {section.fields?.map((fieldKey) => {
                        const field = allFields.find((f) => f.key === fieldKey);
                        return (
                          <Descriptions.Item label={t(field?.title || fieldKey)} key={fieldKey}>
                            {getDisplayValue(fieldKey, record[fieldKey])}
                          </Descriptions.Item>
                        );
                      })}
                    </Descriptions>
                  </div>
                );

              case "images":
                const imageNames =
                  section.imageSourceKey && record[section.imageSourceKey]
                    ? String(record[section.imageSourceKey]).split(";").filter(Boolean)
                    : [];
                return (
                  <div key={index} style={{ marginBottom: 24 }}>
                    {section.title && <Typography.Title level={5}>{t(section.title)}</Typography.Title>}
                    {imageNames.length > 0 ? (
                      <Image.PreviewGroup>
                        <Space wrap>
                          {imageNames.map((name, idx) => (
                            <Image key={idx} width={100} height={100} src={getFileUrl(name)} alt={name} />
                          ))}
                        </Space>
                      </Image.PreviewGroup>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
                    )}
                  </div>
                );

              case "custom":
                return <div key={index}>{section.render && section.render(record, onClose, refetch)}</div>;

              default:
                return null;
            }
          })
        )}
      </Spin>
    </Drawer>
  );
};

export default DynamicViewDrawer;
