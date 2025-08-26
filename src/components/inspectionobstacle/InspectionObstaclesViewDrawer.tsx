import React from "react";
import { Drawer, Descriptions, Tag, Typography, Button, Image, Empty, Space } from "antd";
import { useTranslation } from "react-i18next";
import { DeleteOutlined, ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { PageConfig } from "../../types/config";
import { useAppNotification } from "../../utils/notificationManager";
import { useUpdateInspectionObstacleMutation } from "../../services/rtkApiFactory";
import { getFileUrl } from "../../services/fileApi";

interface InspectionObstaclesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  config: PageConfig;
  onShare: () => void;
  onStatusChange: () => void;
}

const InspectionObstaclesViewDrawer: React.FC<InspectionObstaclesViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
  onStatusChange,
}) => {
  const { t } = useTranslation();
  const notification = useAppNotification();
  const [updateObstacle, { isLoading: isUpdating }] = useUpdateInspectionObstacleMutation();

  if (!record) return null;

  const isRemoved = record.status === 1 || record.status === "removed";

  const displayFields = [
    { key: "zone", title: "form.zone", type: "text" },
    { key: "area", title: "form.area", type: "text" },
    { key: "sourceOfObstacle", title: "form.sourceOfObstacle", type: "text" },
    { key: "closestPaymentDevice", title: "form.closestPaymentDevice", type: "text" },
    { key: "comments", title: "form.comments", type: "text" },
    { key: "status", title: "form.status", type: "status" },
    { key: "removeAction", title: "common.remove obstacle", type: "action" },
  ];

  const handleRemoveObstacle = async () => {
    try {
      const response = await updateObstacle({ id: record.id as number, status: 1 }).unwrap();
      notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      onStatusChange();
      onClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const imageNames = record.photoPath ? String(record.photoPath).split(";").filter(Boolean) : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      className="inspection-obstacles-drawer"
      extra={
        <Button icon={<ShareAltOutlined />} onClick={onShare}>
          {t("common.share")}
        </Button>
      }
    >
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
        {displayFields.map((field) => {
          if (field.type === "action") {
            return (
              <Descriptions.Item label={t(field.title)} key={field.key}>
                {!isRemoved && (
                  <Button icon={<DeleteOutlined />} onClick={handleRemoveObstacle} loading={isUpdating} danger>
                    {t("common.remove")}
                  </Button>
                )}
              </Descriptions.Item>
            );
          }

          const text = record[field.key];

          return (
            <Descriptions.Item label={t(field.title)} key={field.key}>
              {(() => {
                if (!text) return t("common.noData");
                switch (field.type) {
                  case "status":
                    const statusKey =
                      typeof text === "string" ? text.toLowerCase() : text === 1 ? "removed" : "reported";
                    return <Tag color={statusKey === "removed" ? "green" : "orange"}>{t(`status.${statusKey}`)}</Tag>;
                  default:
                    return String(text);
                }
              })()}
            </Descriptions.Item>
          );
        })}
      </Descriptions>

      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        {t("form.photo")}
      </Typography.Title>

      {imageNames.length > 0 ? (
        <Image.PreviewGroup>
          <Space wrap>
            {imageNames.map((name, index) => (
              <Image key={index} width={100} height={100} src={getFileUrl(name)} alt={name} />
            ))}
          </Space>
        </Image.PreviewGroup>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
      )}
    </Drawer>
  );
};

export default InspectionObstaclesViewDrawer;
