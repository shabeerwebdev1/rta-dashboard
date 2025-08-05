// components/inspection/MapDrawer.tsx
import { Drawer, Typography, Descriptions, Tag, Spin } from "antd";
import type { InspectionRecord } from "../../types/inspection";
import { useState } from "react";

const { Title } = Typography;

interface MapDrawerProps {
  open: boolean;
  onClose: () => void;
  record: InspectionRecord | null;
}

const MapDrawer: React.FC<MapDrawerProps> = ({ open, onClose, record }) => {
  const [loading, setLoading] = useState(true);

  if (!record) return null;
  const mapUrl = `https://maps.google.com/maps?q=${record.location.lat},${record.location.lng}&z=15&output=embed`;

  const statusColor =
    record.status === "Open"
      ? "red"
      : record.status === "Resolved"
        ? "green"
        : "orange";

  return (
    <Drawer
      title="Inspection Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={500}
    >
      <Title style={{ marginTop: 0, paddingLeft: 2 }} level={4}>
        {record.obstacleNumber}
      </Title>

      <Descriptions
        bordered
        column={1}
        size="small"
        layout="horizontal"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Obstacle Number">
          {record.obstacleNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Zone">{record.zone}</Descriptions.Item>
        <Descriptions.Item label="Area">{record.area}</Descriptions.Item>
        <Descriptions.Item label="Obstacle Source">
          {record.obstacleSource}
        </Descriptions.Item>

        <Descriptions.Item label=" Closest Payment Device">
          {record.paymentDevice}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={statusColor}>{record.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Added by">
          <Tag>{record.addedBy}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <div
        style={{
          fontWeight: "bold",
        }}
      >
        Uploaded Images
      </div>
      <div
        style={{
          height: "200px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <img
          src="https://via.placeholder.com/150"
          alt="Dummy 1"
          style={{ height: "100%", borderRadius: "4px" }}
        />
        <img
          src="https://via.placeholder.com/150"
          alt="Dummy 2"
          style={{ height: "100%", borderRadius: "4px" }}
        />
        <img
          src="https://via.placeholder.com/150"
          alt="Dummy 3"
          style={{ height: "100%", borderRadius: "4px" }}
        />
      </div>

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
        ></iframe>
      </div>
    </Drawer>
  );
};

export default MapDrawer;
