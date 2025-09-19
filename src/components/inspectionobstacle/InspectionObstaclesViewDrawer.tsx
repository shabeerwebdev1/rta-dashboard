import React from "react";
import { Drawer, Descriptions, Tag, Typography, Button, Image, Empty, Space, Modal, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { DeleteOutlined, ShareAltOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import { useAppNotification } from "../../utils/notificationManager";
import { useUpdateInspectionObstacleMutation } from "../../services/rtkApiFactory";
import { useGetInspectionAttachmentsQuery, getMobileFileUrl } from "../../services/inspectionFileApi";
import { skipToken } from "@reduxjs/toolkit/query";

interface InspectionObstaclesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  onStatusChange: () => void;
  // New props for data mapping
  zoneOptions: any[];
  sourceOptions: any[];
  areaIdToNameMap: Map<number, string>;
  statusLabels: Record<number, string>;
}

const InspectionObstaclesViewDrawer: React.FC<InspectionObstaclesViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
  onStatusChange,
  zoneOptions,
  sourceOptions,
  areaIdToNameMap,
  statusLabels,
}) => {
  const { t } = useTranslation();
  const notification = useAppNotification();
  const [updateObstacle] = useUpdateInspectionObstacleMutation();
  const [modal, contextHolder] = Modal.useModal();

  // ✅ Always call hook; skip with skipToken if record is null
  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record ? { inspectionGUID: record.inspectionGUID, entityCode: "parking-Obstacle" } : skipToken,
  );

  if (!record) return null;

  const isRemoved = Number(record.status) === 1;

  const displayFields = [
    { key: "zone", title: "form.zone", type: "text" },
    { key: "area", title: "form.area", type: "text" },
    { key: "sourceOfObstacle", title: "form.sourceOfObstacle", type: "text" },
    { key: "closestPaymentDevice", title: "form.closestPD", type: "text" },
    { key: "comments", title: "form.comments", type: "text" },
    { key: "removeAction", title: "common.remove obstacle", type: "action" },
  ];

  const handleRemoveObstacle = (obstacleCode: string) => {
    modal.confirm({
      title: t("messages.deleteConfirmTitle"),
      content: t("messages.deleteConfirmContent", {
        entity: t(config.name.singular),
      }),
      okText: t("common.confirm"),
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          const response = await updateObstacle(obstacleCode).unwrap();
          notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
          onStatusChange();
          onClose();
        } catch (err: any) {
          if (err?.data?.errors?.obstacleCode) {
            notification.error({
              message: "Validation Error",
              description: err.data.errors.obstacleCode[0],
            });
          } else {
            notification.error(err as any, "Operation Failed");
          }
        }
      },
    });
  };

  return (
    <>
      {contextHolder}
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
              if (isRemoved) return null;
              return (
                <Descriptions.Item label={t(field.title)} key={field.key}>
                  <Button icon={<DeleteOutlined />} onClick={() => handleRemoveObstacle(record.inspectionGUID)} danger>
                    {t("common.remove")}
                  </Button>
                </Descriptions.Item>
              );
            }

            const rawValue = record[field.key];
            const displayValue = (() => {
              if (rawValue === undefined || rawValue === null) {
                return t("common.noData");
              }

              if (field.key === "zone") {
                const zoneOption = zoneOptions.find((opt) => opt.value === rawValue);
                return zoneOption ? zoneOption.label : rawValue;
              }
              if (field.key === "area") {
                return areaIdToNameMap.get(rawValue) || rawValue;
              }
              if (field.key === "sourceOfObstacle") {
                const sourceOption = sourceOptions.find((opt) => opt.value === rawValue);
                return sourceOption ? sourceOption.label : rawValue;
              }

              return String(rawValue);
            })();

            return (
              <Descriptions.Item label={t(field.title)} key={field.key}>
                {displayValue}
              </Descriptions.Item>
            );
          })}
        </Descriptions>

        <Typography.Title level={5} style={{ marginBottom: 16 }}>
          {t("form.photo")}
        </Typography.Title>

        <Spin spinning={isLoadingAttachments}>
          {attachments.length > 0 ? (
            <Image.PreviewGroup>
              <Space wrap>
                {attachments.map((file) => (
                  <Image
                    key={file.attachmentGUID}
                    width={100}
                    height={100}
                    src={getMobileFileUrl(file.filePath)}
                    alt={file.fileName}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
          )}
        </Spin>
      </Drawer>
    </>
  );
};

export default InspectionObstaclesViewDrawer;
