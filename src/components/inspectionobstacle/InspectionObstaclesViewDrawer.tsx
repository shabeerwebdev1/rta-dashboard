import React from "react";
import { Drawer, Descriptions, Tag, Typography, Button, Image, Empty, Space, Badge } from "antd";
import { useTranslation } from "react-i18next";
import { DeleteOutlined, ShareAltOutlined } from "@ant-design/icons";
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
      // Check if obstacleCode exists and is valid
      const obstacleCode = record.obstacleCode as string;
      
      if (!obstacleCode || typeof obstacleCode !== 'string') {
        notification.error("Invalid obstacle code", "Please check the obstacle data");
        return;
      }
  
      console.log("Sending obstacle code:", obstacleCode); // For debugging
      
      // Pass obstacle code as parameter to the mutation (not in request body)
      const response = await updateObstacle(obstacleCode).unwrap();
      
      notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      onStatusChange();
      onClose();
    } catch (err: any) {
      console.error("Remove obstacle error:", err); // For debugging
      
      // Check if it's a validation error
      if (err?.data?.errors?.obstacleCode) {
        notification.error("Validation Error", err.data.errors.obstacleCode[0]);
      } else {
        notification.error(err as any, "Operation Failed");
      }
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
      {/* Add obstacle code to display for debugging */}
      <Descriptions.Item label="Obstacle Code (Debug)">
        {record.obstacleCode ? String(record.obstacleCode) : "N/A"}
      </Descriptions.Item>

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
                    return (
                      <Badge 
                        status={statusKey === "removed" ? "success" : "warning"} 
                        text={
                          <Tag color={statusKey === "removed" ? "green" : "orange"}>
                            {t(`status.${statusKey}`)}
                          </Tag>
                        } 
                      />
                    );
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