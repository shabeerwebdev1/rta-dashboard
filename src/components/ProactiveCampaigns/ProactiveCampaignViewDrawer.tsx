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

const getPolygonCenterFromRings = (rings?: number[][][]): [number, number] | null => {
  if (!rings || rings.length === 0 || rings[0].length === 0) return null;

  const points = rings[0];
  const [totalLat, totalLng] = points.reduce(
    (acc, point) => {
      acc[0] += point[1];
      acc[1] += point[0];
      return acc;
    },
    [0, 0],
  );

  return [totalLat / points.length, totalLng / points.length];
};

const ProactiveCampaignViewDrawer = ({ open, onClose, record, getLabel }: any) => {
  const { t, i18n } = useTranslation();

  let polygonRings = record?.polygon?.rings || record?.polygon || [];
  if (polygonRings.length > 0 && !Array.isArray(polygonRings[0][0])) {
    polygonRings = [polygonRings.map((p: number[]) => [p[1], p[0]])];
  }
  const center = useMemo(() => {
    const c = getPolygonCenterFromRings(polygonRings) || getCampaignLocationCenter(record?.location);
    return c ? [c[1], c[0]] : [55.27, 25.2];
  }, [polygonRings, record?.location]);

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
                {record.titleEn || t("common.noData")}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.location")}>
                {record.location ? getLabel(record.location, "locations") : t("common.noData")}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.timeInterval")}>
                {formatDateByLocale(
                  record.startTime,
                  { en: "DD MMM YYYY HH:mm", ar: "DD MMM YYYY HH:mm" },
                  i18n.language,
                )}{" "}
                -{" "}
                {formatDateByLocale(
                  record.endTime,
                  { en: "DD MMM YYYY HH:mm", ar: "DD MMM YYYY HH:mm" },
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
                    <span>{t("common.noData")}</span>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.status")}>
                <Tag color={record.status === "active" ? "green" : record.status === "draft" ? "orange" : "blue"}>
                  {getLabel(record.status, "statuses")}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.campaignMessage", { defaultValue: "Campaign Message" })}>
                {record.notificationMessageEn || t("common.noData")}
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
            <div style={{ padding: 16 }}>
              <Text type="secondary">{t("form.boundaryOverlay", { defaultValue: "Boundary Overlay" })}</Text>
            </div>
            <div style={{ borderTop: "1px solid #f0f0f0" }}>
              <ArcGISMap
                inspectors={[]}
                center={[center[1], center[0]]}
                zoom={polygonRings.length > 0 ? 14 : 13}
                height="480px"
                clickable={false}
                legendEnabled={false}
                enableBoundaryDrawing={false}
                boundaryPolygonRings={polygonRings}
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
