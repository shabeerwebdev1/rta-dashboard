// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React from "react";
// import { Drawer, Descriptions, Tag, Typography, Button, Image, Empty, Space, Modal, Spin } from "antd";
// import { useTranslation } from "react-i18next";
// import { DeleteOutlined, ShareAltOutlined } from "@ant-design/icons";
// import type { PageConfig } from "../../types/config";
// import { useAppNotification } from "../../utils/notificationManager";
// import {
//   useUpdateInspectionObstacleMutation,
//   useGetInspectionAttachmentsQuery,
//   getMobileFileUrl,
// } from "../../services/rtkApiFactory";
// import { skipToken } from "@reduxjs/toolkit/query";
// import ArcGISMap from "../../components/common/ArcGISMap";
// import { MAP_ICONS } from "../../components/common/mapIconUrls";

// // Static area coordinates (fallback)
// const AREA_COORDINATES = [
//   { area: "Bur dubai", lat: 25.2146, lng: 55.3033 },
//   { area: "Business Bay", lat: 25.184242, lng: 55.27243 },
//   { area: "Sheikh Zayed Road", lat: 25.216278, lng: 55.278774 },
//   { area: "Al Quoz", lat: 25.1595803, lng: 55.2540203 },
//   { area: "Al Jaddaf", lat: 25.2218696, lng: 55.3359246 },
//   { area: "Emirates area", lat: 25.1021, lng: 55.2314 },
//   { area: "Dubai Metro", lat: 25.1783, lng: 55.3567 },
//   { area: "MBZ CITY", lat: 25.0458, lng: 55.2912 },
//   { area: "City Centre Hyper Market", lat: 25.2674, lng: 55.4129 },
//   { area: "Jumeirah Park", lat: 25.0423, lng: 55.1669 },
//   { area: "Jabel Ali", lat: 24.986503, lng: 55.09052 },
//   { area: "Emaar South", lat: 24.9577, lng: 55.1299 },
//   { area: "Emaar North", lat: 25.2891, lng: 55.3433 },
//   { area: "Deira", lat: 25.266666, lng: 55.316666 },
//   { area: "Naakhil", lat: 25.1734, lng: 55.4032 },
// ];

// interface InspectionObstaclesViewDrawerProps {
//   open: boolean;
//   onClose: () => void;
//   record: Record<string, any> | null;
//   config: PageConfig;
//   onShare: () => void;
//   onStatusChange: () => void;
//   zoneOptions: any[];
//   sourceOptions: any[];
//   areaIdToNameMap: Map<number, string>;
//   statusLabels: Record<number, string>;
// }

// const InspectionObstaclesViewDrawer: React.FC<InspectionObstaclesViewDrawerProps> = ({
//   open,
//   onClose,
//   record,
//   config,
//   onShare,
//   onStatusChange,
//   zoneOptions,
//   sourceOptions,
//   areaIdToNameMap,
//   statusLabels,
// }) => {
//   const { t, i18n } = useTranslation();
//   const notification = useAppNotification();
//   const [updateObstacle] = useUpdateInspectionObstacleMutation();
//   const [modal, contextHolder] = Modal.useModal();

//   const isRtl = i18n.dir() === "rtl";

//   // Get static area coordinates (fallback)
//   const getAreaStaticLocation = (areaName: string) => {
//     if (!areaName) return null;
//     const found = AREA_COORDINATES.find((x) => x.area.toLowerCase() === areaName.toLowerCase());
//     return found ? { lat: found.lat, lng: found.lng } : null;
//   };

//   // Get record location - prioritize actual coordinates, fallback to static area
//   const getRecordLocation = () => {
//     if (!record) return null;

//     // Use actual coordinates from API if available
//     if (record.latitude && record.longitude) {
//       const lat = parseFloat(record.latitude);
//       const lng = parseFloat(record.longitude);

//       // Validate coordinates
//       if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
//         return { lat, lng };
//       }
//     }

//     // Fallback to static area coordinates
//     return getAreaStaticLocation(areaIdToNameMap.get(record.area) || "");
//   };

//   const recordLocation = getRecordLocation();

//   // Load attachments safely
//   const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
//     record
//       ? {
//           inspectionGUID: record.inspectionGUID,
//           entityCode: "parking-Obstacle",
//         }
//       : skipToken,
//   );

//   if (!record) return null;

//   const isRemoved = Number(record.status) === 1;

//   const displayFields = [
//     { key: "zone", title: "form.zone", type: "text" },
//     { key: "area", title: "form.area", type: "text" },
//     { key: "sourceOfObstacle", title: "form.sourceOfObstacle", type: "text" },
//     { key: "comments", title: "form.comments", type: "text" },
//     { key: "removeAction", title: "common.resolveObstacle", type: "action" },
//   ];

//   const handleRemoveObstacle = (obstacleCode: string) => {
//     modal.confirm({
//       title: t("messages.deleteConfirmTitle"),
//       content: t("messages.deleteConfirmContent", {
//         entity: t(config.name.singular),
//       }),
//       okText: t("common.confirm"),
//       cancelText: t("common.cancel"),
//       onOk: async () => {
//         try {
//           const response = await updateObstacle(obstacleCode).unwrap();
//           notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
//           onStatusChange();
//           onClose();
//         } catch (err: any) {
//           if (err?.data?.errors?.obstacleCode) {
//             notification.error({
//               message: "Validation Error",
//               description: err.data.errors.obstacleCode[0],
//             });
//           } else {
//             notification.error(err as any, "Operation Failed");
//           }
//         }
//       },
//     });
//   };

//   return (
//     <>
//       {contextHolder}

//       <Drawer
//         open={open}
//         onClose={onClose}
//         width={500}
//         title={t("page.viewTitle", { entity: t(config.name.singular) })}
//         extra={
//           <Button icon={<ShareAltOutlined />} onClick={onShare}>
//             {t("common.share")}
//           </Button>
//         }
//         placement={isRtl ? "left" : "right"}
//         bodyStyle={{ paddingTop: 0 }}
//       >
//         {/* ===== Map with Actual Coordinates ===== */}

//         <Typography.Title level={5} style={{ marginBottom: 16 }}>
//           {t("form.obstacleLocation")}
//         </Typography.Title>

//         {recordLocation && (
//           <div style={{ marginBottom: 15 }}>
//             <div
//               style={{
//                 width: "100%",
//                 height: 260,
//                 borderRadius: 8,
//                 overflow: "hidden",
//                 border: "1px solid #e9e9e9",
//               }}
//             >
//               <ArcGISMap
//                 inspectors={[]}
//                 center={[recordLocation.lng, recordLocation.lat]}
//                 zoom={record.latitude && record.longitude ? 16 : 15}
//                 height="260px"
//                 clickable={false}
//                 pickedLat={recordLocation.lat}
//                 pickedLng={recordLocation.lng}
//                 pickedLocationIconUrl={MAP_ICONS.obstacle}
//                 pickedLocationIconSize={36}
//                 showPath={false}
//                 showFineLocations={false}
//               />
//             </div>
//           </div>
//         )}

//         {/* ===== Details ===== */}
//         <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
//           {displayFields.map((field) => {
//             if (field.type === "action") {
//               if (isRemoved) return null;
//               return (
//                 <Descriptions.Item label={t(field.title)} key={field.key}>
//                   <Button icon={<DeleteOutlined />} onClick={() => handleRemoveObstacle(record.inspectionGUID)} danger>
//                     {t("common.resolve")}
//                   </Button>
//                 </Descriptions.Item>
//               );
//             }

//             const rawValue = record[field.key];
//             const displayValue = (() => {
//               if (rawValue === undefined || rawValue === null) return t("common.noData");

//               if (field.key === "zone") {
//                 const found = zoneOptions.find((z) => z.value === rawValue);
//                 return found ? found.label : rawValue;
//               }

//               if (field.key === "area") {
//                 return areaIdToNameMap.get(rawValue) || rawValue;
//               }

//               if (field.key === "sourceOfObstacle") {
//                 const found = sourceOptions.find((s) => s.value === rawValue);
//                 return found ? found.label : rawValue;
//               }

//               return String(rawValue);
//             })();

//             return (
//               <Descriptions.Item label={t(field.title)} key={field.key}>
//                 {displayValue}
//               </Descriptions.Item>
//             );
//           })}
//         </Descriptions>

//         {/* ===== Attachments ===== */}
//         <Typography.Title level={5} style={{ marginBottom: 16 }}>
//           {t("form.AttachedPhotos")}
//         </Typography.Title>

//         <Spin spinning={isLoadingAttachments}>
//           {attachments.length > 0 ? (
//             <Image.PreviewGroup>
//               <Space wrap>
//                 {attachments.map((file) => (
//                   <Image
//                     key={file.attachmentGUID}
//                     width={100}
//                     height={100}
//                     src={getMobileFileUrl(file.filePath)}
//                     alt={file.fileName}
//                   />
//                 ))}
//               </Space>
//             </Image.PreviewGroup>
//           ) : (
//             <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
//           )}
//         </Spin>
//       </Drawer>
//     </>
//   );
// };

// export default InspectionObstaclesViewDrawer;

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Card, Row, Col, Typography, Button, Image, Empty, Space, Spin, theme } from "antd";
import { DeleteOutlined, ShareAltOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PageConfig } from "../../types/config";
import { useAppNotification } from "../../utils/notificationManager";
import {
  useUpdateInspectionObstacleMutation,
  useGetInspectionAttachmentsQuery,
  useLazyGetLookupsQuery,
  useLazyGetZonesQuery,
  useGetAllAreasQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../../components/common/ArcGISMap";
import { MAP_ICONS } from "../../components/common/mapIconUrls";

const { Title, Text } = Typography;

// Static area coordinates (fallback)
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
  zoneOptions?: any[];
  sourceOptions?: any[];
  areaIdToNameMap?: Map<number, string>;
  statusLabels?: Record<number, string>;
}

const InspectionObstaclesViewDrawer: React.FC<InspectionObstaclesViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
  onStatusChange,
  zoneOptions = [],
  sourceOptions = [],
  areaIdToNameMap,
}) => {
  const { t } = useTranslation();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const notification = useAppNotification();

  const [updateObstacle] = useUpdateInspectionObstacleMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones, { data: zonesData, isLoading: isLoadingZones }] = useLazyGetZonesQuery();
  const { data: allAreasData, isLoading: isLoadingAreas } = useGetAllAreasQuery(
    areaIdToNameMap && areaIdToNameMap.size > 0 ? skipToken : {},
  );
  const [internalLookupOptions, setInternalLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [modal, contextHolder] = Modal.useModal();

  const getAreaStaticLocation = (areaName: string) => {
    if (!areaName) return null;

    const found = AREA_COORDINATES.find((x) => x.area.toLowerCase() === areaName.toLowerCase());

    return found
      ? {
          lat: found.lat,
          lng: found.lng,
        }
      : null;
  };

  const getRecordLocation = () => {
    if (!record) return null;

    if (record.latitude && record.longitude) {
      const lat = parseFloat(record.latitude);
      const lng = parseFloat(record.longitude);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          lat,
          lng,
        };
      }
    }

    const areaKey = record.area !== undefined && record.area !== null ? String(record.area) : "";
    const areaName =
      (areaIdToNameMap && (areaIdToNameMap.get(Number(record.area) as any) || areaIdToNameMap.get(areaKey as any))) ||
      effectiveAreaIdToNameMap.get(areaKey) ||
      (allAreasData || []).find((area: any) =>
        [area.areaId, area.area_Id, area.id, area.areaGUID, area.areaCode, area.area, area.areaName, area.name]
          .filter((value) => value !== undefined && value !== null && value !== "")
          .some((value) => String(value) === areaKey),
      )?.area ||
      "";

    return getAreaStaticLocation(areaName);
  };

  const recordLocation = getRecordLocation();

  const effectiveAreaIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();

    if (areaIdToNameMap && areaIdToNameMap.size > 0) {
      areaIdToNameMap.forEach((value, key) => {
        map.set(String(key), value);
      });
    }

    (allAreasData || []).forEach((area: any) => {
      const name = area.area || area.areaName || area.name || "";
      const keys = [
        area.areaId,
        area.area_Id,
        area.id,
        area.areaGUID,
        area.areaCode,
        area.area,
        area.areaName,
        area.name,
      ]
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map((value) => String(value));

      keys.forEach((key) => {
        if (!map.has(key)) {
          map.set(key, name);
        }
      });
    });

    return map;
  }, [areaIdToNameMap, allAreasData]);

  const effectiveZoneOptions = useMemo(() => {
    if (zoneOptions.length > 0) return zoneOptions;

    return (zonesData || []).map((zone: any) => ({
      value: zone.zone_Id || zone.zoneId,
      label: `${zone.zoneCode}-${zone.zone}`,
      original: zone,
    }));
  }, [zoneOptions, zonesData]);

  const effectiveSourceOptions = useMemo(() => {
    if (sourceOptions.length > 0) return sourceOptions;

    return internalLookupOptions
      .filter((option) => option.categoryId === 800)
      .map((option) => ({
        ...option,
        value: option.value,
        label: option.labelEn,
      }));
  }, [sourceOptions, internalLookupOptions]);

  useEffect(() => {
    if (!open) return;

    if (!zoneOptions.length) {
      triggerGetZones({});
    }

    if (!sourceOptions.length && internalLookupOptions.length === 0) {
      setIsLoadingLookups(true);
      triggerGetLookups([600, 700, 800])
        .unwrap()
        .then((result) => {
          setInternalLookupOptions(result);
        })
        .catch(() => {
          setInternalLookupOptions([]);
        })
        .finally(() => {
          setIsLoadingLookups(false);
        });
    }
  }, [
    open,
    zoneOptions.length,
    sourceOptions.length,
    internalLookupOptions.length,
    triggerGetLookups,
    triggerGetZones,
  ]);

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

          notification.success(
            response,
            t("messages.updateSuccess", {
              entity: t(config.name.singular),
            }),
          );

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

      <Modal open={open} onCancel={onClose} width={1000} footer={null} title={null} closable={false}>
        <Spin spinning={isLoadingAttachments || isLoadingLookups || isLoadingZones || isLoadingAreas}>
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                {t("page.viewTitle", {
                  entity: t(config.name.singular),
                })}
              </Title>
            </Col>

            <Col>
              <Space>
                <Button type="text" icon={<ShareAltOutlined />} onClick={onShare} style={{ fontSize: 16 }} />

                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
              </Space>
            </Col>
          </Row>

          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {/* ================= Map ================= */}

            <Card
              title={t("form.obstacleLocation")}
              size="small"
              headStyle={{
                background: colorBgContainer,
                fontWeight: 600,
              }}
              style={{
                marginBottom: 16,
                borderRadius: 12,
              }}
            >
              {recordLocation ? (
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
                    center={[recordLocation.lng, recordLocation.lat]}
                    zoom={record.latitude && record.longitude ? 16 : 15}
                    height="260px"
                    clickable={false}
                    pickedLat={recordLocation.lat}
                    pickedLng={recordLocation.lng}
                    pickedLocationIconUrl={MAP_ICONS.obstacle}
                    pickedLocationIconSize={36}
                    showPath={false}
                    showFineLocations={false}
                  />
                </div>
              ) : (
                <Empty description={t("common.noData")} />
              )}
            </Card>

            {/* ================= Details ================= */}

            <Card
              title={t("form.obstacleDetails")}
              size="small"
              headStyle={{
                background: colorBgContainer,
                fontWeight: 600,
              }}
              style={{
                marginBottom: 16,
                borderRadius: 12,
              }}
            >
              <Row gutter={[0, 12]}>
                {/* Zone */}

                <Col span={10}>
                  <Text strong>{t("form.zone")}:</Text>
                </Col>

                <Col span={14}>
                  {(() => {
                    const found = effectiveZoneOptions.find((z) => String(z.value) === String(record.zone));
                    return found ? found.label : record.zone || t("common.noData");
                  })()}
                </Col>

                {/* Area */}

                <Col span={10}>
                  <Text strong>{t("form.area")}:</Text>
                </Col>

                <Col span={14}>
                  {(() => {
                    const areaKey = record.area !== undefined && record.area !== null ? String(record.area) : "";
                    const found =
                      (areaIdToNameMap &&
                        (areaIdToNameMap.get(Number(record.area) as any) || areaIdToNameMap.get(areaKey as any))) ||
                      effectiveAreaIdToNameMap.get(areaKey);
                    return found || t("common.noData");
                  })()}
                </Col>

                {/* Source */}

                <Col span={10}>
                  <Text strong>{t("form.sourceOfObstacle")}:</Text>
                </Col>

                <Col span={14}>
                  {(() => {
                    const found = effectiveSourceOptions.find(
                      (x) => String(x.value) === String(record.sourceOfObstacle),
                    );

                    return found ? found.label : record.sourceOfObstacle || t("common.noData");
                  })()}
                </Col>

                {/* Comments */}

                <Col span={10}>
                  <Text strong>{t("form.comments")}:</Text>
                </Col>

                <Col span={14}>{record.comments || t("common.noData")}</Col>

                {/* Resolve */}

                {!isRemoved && (
                  <>
                    <Col span={10}>
                      <Text strong>{t("common.resolveObstacle")}:</Text>
                    </Col>

                    <Col span={14}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveObstacle(record.inspectionGUID)}
                      >
                        {t("common.resolve")}
                      </Button>
                    </Col>
                  </>
                )}
              </Row>
            </Card>

            {/* ================= Attachments ================= */}

            <Card
              title={t("form.AttachedPhotos")}
              size="small"
              headStyle={{
                background: colorBgContainer,
                fontWeight: 600,
              }}
              style={{
                borderRadius: 12,
              }}
            >
              {attachments.length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {attachments.map((file) => (
                      <Image
                        key={file.attachmentGUID}
                        width={120}
                        height={120}
                        src={getMobileFileUrl(file.filePath)}
                        alt={file.fileName}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
              )}
            </Card>
          </div>
        </Spin>
      </Modal>
    </>
  );
};

export default InspectionObstaclesViewDrawer;
