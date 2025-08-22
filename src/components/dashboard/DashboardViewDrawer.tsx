import React from "react";
import { Drawer, Descriptions, Card, Row, Col, Statistic, Divider, Badge } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

interface DashboardViewDrawerProps {
  open: boolean;
  onClose: () => void;
  inspector: any;
}

const DashboardViewDrawer: React.FC<DashboardViewDrawerProps> = ({ open, onClose, inspector }) => {
  // Hardcoded data as shown in the screenshot
  const inspectorData = inspector?.details || {
    name: "INS - 000-111 - RTA",
    email: "Email00@gmail.com",
    dob: "dd-mm-yyyy",
    mobile: "0000000000",
    zone: "Zone",
    area: "Area",
    street: "Street",
    doorNumber: "Number",
    obstacles: 3,
    finesIssued: 3,
    towingRequests: 0,
    leaveRequested: 1,
    checkInArea: "Expo City Dubai",
    checkInZone: "JABAL ALI INDUSTRIAL SECOND",
    checkInTime: "9:10 Am",
    shift: "Morning Shift",
    status: "Checked-in",
    temporarilyClosed: true,
  };

  // Dummy coords for Expo City Dubai
  const lat = 25.1522;
  const lng = 55.3529;

  // Upcoming shift data
  const upcomingShifts = [
    {
      date: "Monday, 18th Aug",
      area: "Downtown Area",
      zone: "Zone A",
      shift: "Morning Shift (8:00 AM - 4:00 PM)",
    },
    {
      date: "Tuesday, 19th Aug",
      area: "Residential Area",
      zone: "Zone B",
      shift: "Evening Shift (4:00 PM - 12:00 AM)",
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title="Inspector Details"
      bodyStyle={{ overflowY: "auto", padding: 16 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, padding: 0 }}>{inspector?.name || inspectorData.name}</h2>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <h3>Basic Details</h3>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Email">{inspectorData.email}</Descriptions.Item>
          <Descriptions.Item label="Date Of Birth">{inspectorData.dob}</Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{inspectorData.mobile}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <h3>Address Details</h3>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Zone">{inspectorData.zone}</Descriptions.Item>
          <Descriptions.Item label="Area">{inspectorData.area}</Descriptions.Item>
          <Descriptions.Item label="Street">{inspectorData.street}</Descriptions.Item>
          <Descriptions.Item label="Door Number">{inspectorData.doorNumber}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <h3>Today's Performance</h3>
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Obstacles"
                value={inspectorData.obstacles}
                prefix="🚧"
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Fines Issued"
                value={inspectorData.finesIssued}
                suffix="AED"
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Towing Requests"
                value={inspectorData.towingRequests}
                prefix="🚗"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Leave Requested"
                value={inspectorData.leaveRequested}
                prefix="📝"
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Check In Location Details */}
        <h3>Check In Location Details</h3>
        <Card
          size="small"
          style={{
            marginBottom: 16,
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
          }}
        >
          {/* Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              color: "red",
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            <div>Area</div>
            <div>Zone</div>
            <div>Shift</div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <Badge
              status="success"
              text={
                <span>
                  <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />
                  Checked In: {inspectorData.checkInTime}
                </span>
              }
            />
          </div>

          {inspectorData.temporarilyClosed && (
            <div style={{ marginBottom: 8, color: "#ff4d4f" }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Temporarily closed
            </div>
          )}

          {/* Static Map */}
          <div
            style={{
              height: 200,
              borderRadius: 8,
              overflow: "hidden",
              marginTop: 8,
              backgroundColor: "#eee",
            }}
          >
            <iframe
              title="Check-in location"
              src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </Card>

        <Divider />

        {/* Upcoming Shift Details */}
        <h3>Upcoming Shift Details</h3>
        {upcomingShifts.map((shift, index) => (
          <Card
            key={index}
            size="small"
            style={{
              marginBottom: 12,
              backgroundColor: index === 0 ? "#e6f7ff" : "#f9f9f9",
              border: index === 0 ? "1px solid #91d5ff" : "1px solid #d9d9d9",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: "bold", color: "#1890ff" }}>{shift.date}</div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Area">{shift.area}</Descriptions.Item>
              <Descriptions.Item label="Zone">{shift.zone}</Descriptions.Item>
              <Descriptions.Item label="Shift">{shift.shift}</Descriptions.Item>
            </Descriptions>
          </Card>
        ))}
      </Card>
    </Drawer>
  );
};

export default DashboardViewDrawer;
