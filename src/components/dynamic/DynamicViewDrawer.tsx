import React from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Typography,
  Badge,
  Image,
  Empty,
  Space,
} from "antd";
import { useTranslation } from "react-i18next";
import type { PageConfig } from "../../types/config";
import { getFileUrl } from "../../services/fileApi";
import dayjs from "dayjs";
import MapComponent from "./MapComponent";

interface DynamicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  config: PageConfig;
}

const statusColors = {
  active: "green",
  inactive: "default",
  expired: "red",
  pending: "orange",
  removed: "volcano",
  reported: "green",
};

const DynamicViewDrawer: React.FC<DynamicViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
}) => {
  const { t } = useTranslation();
  if (!record) return null;

  // Logic to merge table and form fields, handling case-insensitivity to prevent duplicates.
  const tableKeysLower = new Set(
    config.tableConfig.columns.map((c) => c.key.toLowerCase()),
  );

  const additionalFormFields = config.formConfig.fields
    .filter((ff) => !tableKeysLower.has(ff.name.toLowerCase()))
    .map((ff) => ({
      // The record from GET has camelCase keys. The form config may have PascalCase names.
      // Convert the form field name to camelCase to access the data correctly.
      key: ff.name.charAt(0).toLowerCase() + ff.name.slice(1),
      title: ff.label,
      type: ff.type,
    }));

  const displayFields = [
    ...config.tableConfig.columns,
    ...additionalFormFields,
  ];

  const fileField = config.formConfig.fields.find((f) => f.type === "file");
  // Use responseKey if available, otherwise default to the field's name, then convert to camelCase for data access.
  const fileDataKey = fileField
    ? fileField.responseKey ||
      fileField.name.charAt(0).toLowerCase() + fileField.name.slice(1)
    : null;
  const imageNames =
    fileDataKey && record[fileDataKey]
      ? String(record[fileDataKey]).split(";").filter(Boolean)
      : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      className="dynamic-drawer"
    >
      <Descriptions
        bordered
        column={1}
        size="small"
        style={{ marginBottom: 24 }}
      >
        {displayFields.map((field) => {
          if (field.type === "file") return null;
          const text = record[field.key];

          return (
            <Descriptions.Item label={t(field.title)} key={field.key}>
              {(() => {
                if (text === null || text === undefined || text === "")
                  return t("common.noData");
                const statusKey = typeof text === "string" && text?.toLowerCase();
                const tagColor =
                  statusColors[statusKey as keyof typeof statusColors] ||
                  "default";
                switch (field.type) {
                  case "date":
                    return dayjs(text).isValid()
                      ? dayjs(text).format("DD MMM YYYY, h:mm A")
                      : text;

                  case "tag":
                    return (
                      <Tag color={tagColor}>
                        {t(`status.${statusKey}`, statusKey)}
                      </Tag>
                    );
                  case "badge":
                    return (
                      <Badge color={String(text).toLowerCase()} text={text} />
                    );
                  default:
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
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("common.noData")}
            />
          )}
        </>
      )}

      {(record.location || (record.lat && record.lng)) && (
        <div style={{ marginTop: 24 }}>
          <Typography.Title level={5}>{t("common.location")}</Typography.Title>
          <MapComponent
            lat={record.location?.lat || record.lat}
            lng={record.location?.lng || record.lng}
          />
        </div>
      )}
    </Drawer>
  );
};

export default DynamicViewDrawer;
