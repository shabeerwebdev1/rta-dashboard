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

const DynamicViewDrawer: React.FC<DynamicViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
}) => {
  const { t } = useTranslation();
  if (!record) return null;

  const allFields = [
    ...config.tableConfig.columns,
    ...config.formConfig.fields
      .filter(
        (ff) => !config.tableConfig.columns.some((tc) => tc.key === ff.name),
      )
      .map((ff) => ({ key: ff.name, title: ff.label, type: "string" })),
  ];
  const uniqueFields = Array.from(
    new Map(allFields.map((item) => [item.key, item])).values(),
  );

  const fileField = config.formConfig.fields.find((f) => f.type === "file");
  const imageNames =
    fileField && record[fileField.responseKey]
      ? String(record[fileField.responseKey]).split(";").filter(Boolean)
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
        {uniqueFields.map((field) => {
          if (field.type === "file") return null;
          const text = record[field.key];

          return (
            <Descriptions.Item label={t(field.title)} key={field.key}>
              {(() => {
                if (text === null || text === undefined || text === "")
                  return t("common.noData");
                switch (field.type) {
                  case "date":
                    return dayjs(text).isValid()
                      ? dayjs(text).format("DD MMM YYYY, h:mm A")
                      : text;
                  case "tag":
                    return (
                      <Tag
                        color={
                          field.options?.[text]?.toLowerCase() || "default"
                        }
                      >
                        {t(`status.${text?.toLowerCase()}`)}
                      </Tag>
                    );
                  case "badge":
                    return <Badge color={text?.toLowerCase()} text={text} />;
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
