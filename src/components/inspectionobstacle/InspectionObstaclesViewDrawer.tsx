/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Drawer, Descriptions, Tag, Typography, Button, Image, Empty, Space, Modal, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { DeleteOutlined, ShareAltOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import { useAppNotification } from "../../utils/notificationManager";
import {
  useUpdateInspectionObstacleMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../../components/common/ArcGISMap"; // ⭐ Make sure this path is correct

// Static area coordinates (same as your Add Modal)
const AREA_COORDINATES = [
  { area: "Bur dubai", lat: 25.2146, lng: 55.3033 },
  { area: "Business Bay", lat: 25.184242, lng: 55.27243 },
  { area: "Sheikh Zayed Road", lat: 25.216278, lng: 55.278774 },
  { area: "Al Quoz", lat: 25.1595803, lng: 55.2540203 },
  { area: "Al Jaddaf", lat: 25.2218696, lng: 55.3359246 },
  { area: "Emirates area", lat: 25.1021, lng: 55.2314 },
  { area: "Dubai Metro", lat: 25.1783, lng: 55.3567 },
  { area: "MBZ CITY", lat: 25.0458, lng: 55.2912 },
  { area: "City Centre Hyper Market", lat: 25.2674, lng: 55.4129 },
  { area: "Jumeirah Park", lat: 25.0423, lng: 55.1669 },
  { area: "Jabel Ali", lat: 24.986503, lng: 55.09052 },
  { area: "Emaar South", lat: 24.9577, lng: 55.1299 },
  { area: "Emaar North", lat: 25.2891, lng: 55.3433 },
  { area: "Deira", lat: 25.266666, lng: 55.316666 },
  { area: "Naakhil", lat: 25.1734, lng: 55.4032 },
];

interface InspectionObstaclesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  onStatusChange: () => void;

  // Mapping props
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
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();
  const [updateObstacle] = useUpdateInspectionObstacleMutation();
  const [modal, contextHolder] = Modal.useModal();

  const isRtl = i18n.dir() === "rtl";

  // Get static area coordinates
  const getAreaStaticLocation = (areaName: string) => {
    if (!areaName) return null;

    const found = AREA_COORDINATES.find((x) => x.area.toLowerCase() === areaName.toLowerCase());

    return found ? { lat: found.lat, lng: found.lng } : null;
  };

  const staticLocation = getAreaStaticLocation(areaIdToNameMap.get(record.area) || "");

  // Load attachments safely
  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record
      ? {
          inspectionGUID: record.inspectionGUID,
          entityCode: "parking-Obstacle",
        }
      : skipToken,
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
        extra={
          <Button icon={<ShareAltOutlined />} onClick={onShare}>
            {t("common.share")}
          </Button>
        }
        placement={isRtl ? "left" : "right"}
      >
        {/* ===== Static Map (NO API lat/lng) ===== */}
        {/* =================== MAP DISPLAY =================== */}
        {staticLocation && (
          <div style={{ marginBottom: 15 }}>
            <Typography.Title level={5} style={{ marginBottom: 8, marginTop: 0 }}>
              {t("form.locationOnMap")}
            </Typography.Title>

            <div
              style={{
                width: "100%",
                height: 260,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e9e9e9",
              }}
            >
              <ArcGISMap
                inspectors={[]}
                center={[staticLocation.lng, staticLocation.lat]}
                zoom={16}
                height="260px"
                clickable={false}
                pickedLat={staticLocation.lat}
                pickedLng={staticLocation.lng}
                showPath={false}
                showFineLocations={false}
              />
            </div>
          </div>
        )}

        {/* =================== DETAILS =================== */}
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
              if (rawValue === undefined || rawValue === null) return t("common.noData");

              if (field.key === "zone") {
                const found = zoneOptions.find((z) => z.value === rawValue);
                return found ? found.label : rawValue;
              }

              if (field.key === "area") {
                return areaIdToNameMap.get(rawValue) || rawValue;
              }

              if (field.key === "sourceOfObstacle") {
                const found = sourceOptions.find((s) => s.value === rawValue);
                return found ? found.label : rawValue;
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

        {/* =================== ATTACHMENTS =================== */}
        <Typography.Title level={5} style={{ marginBottom: 16 }}>
          {t("form.AttachedPhotos")}
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
