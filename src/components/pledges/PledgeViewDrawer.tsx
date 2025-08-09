import { Drawer, Typography, Descriptions, Tag, Spin, Image } from "antd";
import type { PledgeRecord } from "../../types/pledge";
import { useState } from "react";

const { Title, Text } = Typography;

interface PledgeViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: PledgeRecord | null;
}

const PledgeViewDrawer: React.FC<PledgeViewDrawerProps> = ({
  open,
  onClose,
  record,
}) => {
  const [loading, setLoading] = useState(true);

  if (!record) return null;
  const mapUrl = `https://maps.google.com/maps?q=${record.location?.lat},${record.location?.lng}&z=15&output=embed`;

  const statusColor =
    record.status === "Active"
      ? "green"
      : record.status === "Expired"
        ? "red"
        : "orange";

  return (
    <Drawer
      title="Pledge Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={500}
    >
      <Title style={{ marginTop: 0 }} level={4}>
        {record.tradeLicenseNumber}
      </Title>

      <Descriptions
        bordered
        column={1}
        size="small"
        layout="horizontal"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Trade License Number">
          {record.tradeLicenseNumber}
        </Descriptions.Item>

        <Descriptions.Item label="Business Name">
          {record.businessName}
        </Descriptions.Item>
        <Descriptions.Item label="Pledge Type">
          {record.pledgeType}
        </Descriptions.Item>
        <Descriptions.Item label="Remarks">{record.remarks}</Descriptions.Item>
      </Descriptions>

      <Text strong style={{ display: "block", marginBottom: 8 }}>
        Uploaded Documents
      </Text>
      <Image.PreviewGroup>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {record.documents?.map((doc, index) => (
            <Image
              key={index}
              width={100}
              height={100}
              src={doc.url}
              alt={`Document ${index + 1}`}
              style={{ borderRadius: 4, objectFit: "cover" }}
            />
          ))}
        </div>
      </Image.PreviewGroup>

      {/* Map Section */}
      {record.location && (
        <>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Location
          </Text>
          <div
            style={{
              height: 300,
              width: "100%",
              borderRadius: 8,
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
        </>
      )}
    </Drawer>
  );
};

export default PledgeViewDrawer;
