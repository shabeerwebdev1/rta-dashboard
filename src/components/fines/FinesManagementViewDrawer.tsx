import React, { useState } from "react";
import {
  Drawer,
  Descriptions,
  Typography,
  Tag,
  Space,
  Divider,
  Image,
  Spin,
} from "antd";
import type { FineRecord } from "../../types/fine";

const { Title, Text } = Typography;

interface FinesManagementViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: FineRecord | null;
}

const FinesManagementViewDrawer: React.FC<FinesManagementViewDrawerProps> = ({
  open,
  onClose,
  record,
}) => {
  const [loading, setLoading] = useState(true);

  if (!record) return null;

  const statusTag = (status: string) => {
    let color = "";
    switch (status) {
      case "Issued":
        color = "orange";
        break;
      case "Paid":
        color = "green";
        break;
      case "Disputed":
        color = "red";
        break;
      default:
        color = "default";
    }
    return <Tag color={color}>{status}</Tag>;
  };

  const mapUrl = `https://maps.google.com/maps?q=${record.location.lat},${record.location.lng}&z=15&output=embed`;

  return (
    <Drawer
      title={`Fine Details`}
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
    >
      <Title level={4} style={{ marginTop: 0 }}>
        {record.fineNumber}
      </Title>

      <Descriptions
        column={1}
        bordered
        size="small"
        layout="horizontal"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Fine Number">
          <Text strong>{record.fineNumber}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Inspector Device">
          {record.inspectorDeviceNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Assigned Area">
          {record.assignedArea}
        </Descriptions.Item>
        <Descriptions.Item label="Fine Type">
          {record.fineType}
        </Descriptions.Item>
        <Descriptions.Item label="Fine Amount">
          <Text strong style={{ color: "#ff4d4f" }}>
            AED {record.fineAmount.toFixed(2)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {statusTag(record.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Issue Date">
          {record.issueDate}
        </Descriptions.Item>
        <Descriptions.Item label="Vehicle Details">
          <Space direction="vertical">
            <Text>Plate: {record.vehicleDetails?.plateNumber}</Text>
            <Text>Type: {record.vehicleDetails?.vehicleType}</Text>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>Evidence</Title>
      <div
        style={{
          height: "200px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px",
          backgroundColor: "#f0f0f0",
          marginBottom: "24px",
        }}
      >
        <Image
          src="https://example.com/evidence.jpg"
          alt="Evidence photo"
          height="100%"
          style={{ borderRadius: "4px" }}
          placeholder={<Text type="secondary">Loading evidence...</Text>}
        />
      </div>

      <Title level={5}>Map Location</Title>
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
          loading="lazy"
          allowFullScreen={false}
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoading(false)}
        ></iframe>
      </div>
    </Drawer>
  );
};

export default FinesManagementViewDrawer;
