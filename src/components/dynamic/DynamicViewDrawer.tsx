import React from "react";
import { Drawer, Descriptions, Tag, Typography, Badge, Image, Empty, Space, Button } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import { getFileUrl } from "../../services/fileApi";
import dayjs from "dayjs";
import MapComponent from "./MapComponent";
import { STATUS_COLORS } from "../../constants/ui";

interface DynamicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  config: PageConfig;
  onShare: () => void;
}

const DynamicViewDrawer: React.FC<DynamicViewDrawerProps> = ({ open, onClose, record, config, onShare }) => {
  const { t } = useTranslation();
  if (!record) return null;

  const tableKeysLower = new Set(config.tableConfig.columns.map((c) => c.key.toLowerCase()));

  const additionalFormFields = config.formConfig.fields
    .filter((ff) => !tableKeysLower.has(ff.name.toLowerCase()) && ff.type !== "hidden")
    .map((ff) => ({
      key: ff.name.charAt(0).toLowerCase() + ff.name.slice(1),
      title: ff.label,
      type: ff.type,
    }));

  const displayFields = [...config.tableConfig.columns, ...additionalFormFields];

  const fileField = config.formConfig.fields.find((f) => f.type === "file");
  const fileDataKey = fileField
    ? fileField.responseKey || fileField.name.charAt(0).toLowerCase() + fileField.name.slice(1)
    : null;
  const imageNames = fileDataKey && record[fileDataKey] ? String(record[fileDataKey]).split(";").filter(Boolean) : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      className="dynamic-drawer"
      extra={
        <Button icon={<ShareAltOutlined />} onClick={onShare}>
          {t("common.share")}
        </Button>
      }
    >
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
        {displayFields.map((field) => {
          if (field.type === "file") return null;
          const text = record[field.key];

          return (
            <Descriptions.Item label={t(field.title)} key={field.key}>
              {(() => {
                if (text === null || text === undefined || text === "") return t("common.noData");
                const statusKey = typeof text === "string" ? text.toLowerCase() : "";
                const tagColor = STATUS_COLORS[statusKey as keyof typeof STATUS_COLORS] || "default";
                switch (field.type) {
                  case "date":
                    return dayjs(text as string).isValid()
                      ? dayjs(text as string).format("DD MMM YYYY, h:mm A")
                      : String(text);

                  case "tag":
                    return <Tag color={tagColor}>{t(`status.${statusKey}`, statusKey)}</Tag>;

                  case "badge":
                    return <Badge color={String(text).toLowerCase()} text={String(text)} />;

                  default:
                    //  If field is a select, show label instead of value
                    if (field.type === "select") {
                      const formFieldConfig = config.formConfig.fields.find(
                        (f) => f.name.toLowerCase() === field.key.toLowerCase(),
                      );
                      if (formFieldConfig?.options) {
                        const selectedOption = formFieldConfig.options.find(
                          (opt: any) => (typeof opt === "object" ? opt.value : opt) === text,
                        );
                        if (selectedOption) {
                          return typeof selectedOption === "object" ? selectedOption.label : selectedOption;
                        }
                      }
                    }
                    return String(text);
                }
              })()}
            </Descriptions.Item>
          );
        })}
      </Descriptions>

      {fileField && (
        <>
          <Typography.Title level={5}>{t(fileField.label)}</Typography.Title>
          {imageNames.length > 0 ? (
            <Image.PreviewGroup>
              <Space wrap>
                {imageNames.map((name: string, index: number) => (
                  <Image
                    key={index}
                    width={100}
                    height={100}
                    src={getFileUrl(name)}
                    alt={name}
                    style={{ objectFit: "cover", borderRadius: "4px" }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
          )}
        </>
      )}

      {(record.location || (record.lat && record.lng)) && (
        <div style={{ marginTop: 24 }}>
          <Typography.Title level={5}>{t("common.location")}</Typography.Title>
          <MapComponent
            lat={(record.location as { lat: number })?.lat || (record.lat as number)}
            lng={(record.location as { lng: number })?.lng || (record.lng as number)}
          />
        </div>
      )}
    </Drawer>
  );
};

export default DynamicViewDrawer;
