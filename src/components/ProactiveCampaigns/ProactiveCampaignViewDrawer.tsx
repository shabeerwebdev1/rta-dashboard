/* eslint-disable react/prop-types */
import React, { useMemo } from "react";
import { Modal, Descriptions, Tag, Row, Col, Card, Typography, Space } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateByLocale } from "../../utils/dateFormatter";
import ArcGISMap from "../common/ArcGISMap";

const { Text } = Typography;

const CAMPAIGN_LOCATION_CENTERS: Record<string, [number, number]> = {
  downtown: [25.2048, 55.2708],
  "business-bay": [25.191, 55.276],
  jumeirah: [25.144, 55.185],
  deira: [25.263, 55.31],
  "bur-dubai": [25.253, 55.276],
};

const getCampaignLocationCenter = (location?: string): [number, number] => {
  if (!location) return [25.2, 55.27];
  return CAMPAIGN_LOCATION_CENTERS[location] || [25.2, 55.27];
};

const parseBoundaryGeometry = (value: any) => {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed?.type && parsed?.coordinates ? parsed : null;
  } catch {
    return null;
  }
};

const getShapeCenter = (shape: { type: string; coordinates: any } | null): [number, number] | null => {
  if (!shape || !shape.coordinates) return null;

  if (shape.type === "Point") {
    // coordinates is [lng, lat]
    return [shape.coordinates[1], shape.coordinates[0]];
  }

  let points: number[][] = [];
  if (shape.type === "Polygon") {
    points = shape.coordinates[0] || [];
  } else if (shape.type === "LineString") {
    points = shape.coordinates || [];
  }

  if (points.length === 0) return null;

  const [totalLat, totalLng] = points.reduce(
    (acc, point) => {
      acc[0] += point[1]; // point[1] is latitude, point[0] is longitude
      acc[1] += point[0];
      return acc;
    },
    [0, 0],
  );

  return [totalLat / points.length, totalLng / points.length];
};

const getCampaignTitle = (record: any, lang = "en") => {
  const isArabic = String(lang).startsWith("ar");
  return (
    (isArabic
      ? record?.titleAr || record?.title || record?.titleEn
      : record?.titleEn || record?.title || record?.titleAr) || ""
  );
};
const getCampaignMessage = (record: any, lang = "en") => {
  const isArabic = String(lang).startsWith("ar");
  return (
    (isArabic
      ? record?.notificationMessageAr ||
        record?.campaignMessageAr ||
        record?.campaignMessage ||
        record?.notificationMessageEn
      : record?.notificationMessageEn ||
        record?.campaignMessage ||
        record?.notificationMessageAr ||
        record?.campaignMessageAr) || ""
  );
};
const normalizeStatus = (status?: string) =>
  String(status ?? "")
    .trim()
    .toLowerCase();

const ProactiveCampaignViewDrawer = ({ open, onClose, record, boundaryShape: boundaryShapeProp, getLabel }: any) => {
  const { t, i18n } = useTranslation();

  const boundaryShape = useMemo(() => {
    return (
      boundaryShapeProp || parseBoundaryGeometry(record?.boundaryGeoJson) || parseBoundaryGeometry(record?.polygon)
    );
  }, [boundaryShapeProp, record?.boundaryGeoJson, record?.polygon]);

  const center = useMemo(() => {
    const c = getShapeCenter(boundaryShape) || getCampaignLocationCenter(record?.location);
    return c ? [c[1], c[0]] : [55.27, 25.2];
  }, [boundaryShape, record?.location]);

  if (!record) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("common.viewCampaign", { defaultValue: "View Campaign" })}
      centered
      width={1100}
      footer={null}
      destroyOnClose
      bodyStyle={{ padding: 16 }}
    >
      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 12, height: "100%" }} bodyStyle={{ padding: 0 }}>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t("form.title", { defaultValue: "Title" })}>
                {getCampaignTitle(record, i18n.language) || t("common.noData")}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.timeInterval")}>
                {formatDateByLocale(
                  record.startTime,
                  { en: "DD MMM YYYY hh:mm A", ar: "DD MMM YYYY hh:mm A" },
                  i18n.language,
                )}{" "}
                -{" "}
                {formatDateByLocale(
                  record.endTime,
                  { en: "DD MMM YYYY hh:mm A", ar: "DD MMM YYYY hh:mm A" },
                  i18n.language,
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.violationTypes")}>
                <Space wrap>
                  {(record.violationTypes || []).length > 0 ? (
                    (record.violationTypes || []).map((v: string) => <Tag key={v}>{getLabel(v, "violationTypes")}</Tag>)
                  ) : (
                    <span>{t("common.noData")}</span>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.assignedInspectors")}>
                <Space wrap>
                  {(record.assignedInspectors || []).length > 0 ? (
                    (record.assignedInspectors || []).map((id: number) => (
                      <Tag key={id}>{getLabel(id, "inspectors")}</Tag>
                    ))
                  ) : (
                    <Tag>{t("common.all", { defaultValue: "All" })}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.status")}>
                <Tag
                  color={
                    normalizeStatus(record.status) === "active"
                      ? "green"
                      : normalizeStatus(record.status) === "cancelled"
                        ? "red"
                        : normalizeStatus(record.status) === "completed"
                          ? "blue"
                          : "orange"
                  }
                >
                  {normalizeStatus(record.status)
                    ? t(`status.${normalizeStatus(record.status)}`, {
                        defaultValue: normalizeStatus(record.status).replace(/^./, (c) => c.toUpperCase()),
                      })
                    : t("common.draft", { defaultValue: "Draft" })}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.campaignMessage", { defaultValue: "Campaign Message" })}>
                {getCampaignMessage(record, i18n.language) || t("common.noData")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={t("form.campaignMap", { defaultValue: "Campaign Map" })}
            bordered={false}
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ borderTop: "1px solid #f0f0f0" }}>
              <ArcGISMap
                inspectors={[]}
                center={center}
                zoom={boundaryShape ? 14 : 13}
                height="480px"
                clickable={false}
                legendEnabled={false}
                enableBoundaryDrawing={false}
                boundaryShape={boundaryShape}
                showPath={false}
                showFineLocations={false}
                showBasemapToggle={false}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default ProactiveCampaignViewDrawer;
