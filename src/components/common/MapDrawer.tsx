import React, { useState } from "react";
import { Drawer, Typography, Descriptions, Tag, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { WhitelistRecord } from "../../types";

const { Title } = Typography;

interface MapDrawerProps {
  open: boolean;
  onClose: () => void;
  record: WhitelistRecord | null;
}

const MapDrawer: React.FC<MapDrawerProps> = ({ open, onClose, record }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  if (!record) return null;

  const mapUrl = `https://maps.google.com/maps?q=${record.location.lat},${record.location.lng}&z=15&output=embed`;
  const statusColor = record.status === "Active" ? "green" : record.status === "Expired" ? "red" : "gold";

  return (
    <Drawer title={t("whitelist.locationDetails")} placement="right" onClose={onClose} open={open} width={500}>
      <Title style={{ marginTop: 0, paddingLeft: 2 }} level={4}>
        {record.tradeLicenseName}
      </Title>

      <Descriptions bordered column={1} size="small" layout="horizontal" style={{ marginBottom: 24 }}>
        <Descriptions.Item label={t("whitelist.licenseNumber")}>{record.licenseNumber}</Descriptions.Item>
        <Descriptions.Item label={t("whitelist.addedBy")}>{record.addedBy}</Descriptions.Item>
        <Descriptions.Item label={t("whitelist.expiryDate")}>{record.date}</Descriptions.Item>
        <Descriptions.Item label={t("whitelist.status")}>
          <Tag color={statusColor}>{t(`status.${record.status.toLowerCase()}`)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t("whitelist.type")}>
          <Tag>{t(`status.${record.type.toLowerCase()}`)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t("whitelist.photo")}>
          <Avatar src={(record as { photo?: string }).photo} icon={<UserOutlined />} />
        </Descriptions.Item>
      </Descriptions>

      {/* Map Loader */}
      <div
        style={{
          height: "300px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#fff",
              zIndex: 1,
            }}
          >
            <Spin tip="Loading map..." size="large" />
          </div>
        )}

        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoading(false)}
        />
      </div>
    </Drawer>
  );
};

export default MapDrawer;
