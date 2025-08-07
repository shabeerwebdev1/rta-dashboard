import React, { useState } from "react";
import { Drawer, Descriptions, Tag, Typography, Spin } from "antd";
import type { ParkonicRecord } from "../../types/parkonic";

const { Title } = Typography;

type Props = {
  open: boolean;
  onClose: () => void;
  record: ParkonicRecord | null;
};

const statusColorMap: Record<string, string> = {
  Paid: "green",
  Unpaid: "volcano",
  Pending: "orange",
};

const typeColorMap: Record<string, string> = {
  Parkonic: "blue",
  RTA: "red",
  Other: "default",
};

const ParkonicViewDrawer: React.FC<Props> = ({ open, onClose, record }) => {
  const [loading, setLoading] = useState(true);

  if (!record) return null;

  const mapUrl = `https://maps.google.com/maps?q=${record.location.lat},${record.location.lng}&z=15&output=embed`;

  return (
    <Drawer open={open} onClose={onClose} width={500} title="Parkonic Details">
      <Title style={{ marginTop: 0, paddingLeft: 2 }} level={4}>
        {record.fineNumber}
      </Title>

      <Descriptions
        bordered
        column={1}
        size="small"
        layout="horizontal"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Fine Number">
          {record.fineNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Issued By">
          {record.issuedBy}
        </Descriptions.Item>
        <Descriptions.Item label="Amount">
          AED {record.fineAmount.toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Issued Date">
          {record.issuedDate}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={statusColorMap[record.status]}>{record.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          <Tag color={typeColorMap[record.type]}>{record.type}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="reason">
          <Tag color={typeColorMap[record.reason]}>{record.reason}</Tag>
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

      {/* Map Viewer */}
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        Location on Map
      </div>
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

export default ParkonicViewDrawer;
