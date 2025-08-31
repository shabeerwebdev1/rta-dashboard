import React, { useEffect, useState } from "react";
import { Card, Col, Row, Select, Table, Tag, Typography, Button, Space, Dropdown, Avatar, Statistic } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  MoreOutlined,
  CarOutlined,
  AppstoreAddOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import DashboardViewDrawer from "../components/dashboard/DashboardViewDrawer";

// ✅ Google Maps
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const { Text } = Typography;

const mapContainerStyle = {
  width: "100%",
  height: "575px",
};

const dubaiCenter = {
  lat: 25.1972,
  lng: 55.2743,
};

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [googleApi, setGoogleApi] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  // ✅ Inspectors data
  const inspectorAvatars = [
    {
      id: 1,
      name: "Inspector 1",
      lat: 25.1972,
      lng: 55.2743,
      status: "Checked-in",
      color: "#52c41a",
      details: { email: "inspector1@example.com" },
    },
    {
      id: 2,
      name: "Inspector 2",
      lat: 25.1965,
      lng: 55.2728,
      status: "Pending",
      color: "#faad14",
      details: { email: "inspector2@example.com" },
    },
    {
      id: 3,
      name: "Inspector 3",
      lat: 25.198,
      lng: 55.2735,
      status: "Checked-in",
      color: "#1890ff",
      details: { email: "inspector3@example.com" },
    },
    {
      id: 4,
      name: "Inspector 4",
      lat: 25.1975,
      lng: 55.275,
      status: "On Leave",
      color: "#ff4d4f",
      details: { email: "inspector4@example.com" },
    },
  ];

  // ✅ Drawer when clicking a marker
  const handleMarkerClick = (inspector: any) => {
    setSelectedInspector(inspector);
    setDrawerVisible(true);
  };

  // ✅ Tooltip on map when row clicked
  const handleViewClick = (record: any) => {
    const inspector = inspectorAvatars.find((insp) => insp.name === record.inspectorName);
    if (inspector) {
      setSelectedMarker(inspector);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspector(null);
  };

  // ✅ Dummy Table data
  const checkInData = inspectorAvatars.map((insp, idx) => ({
    key: idx,
    checkInId: `C000${idx + 1}`,
    inspectorName: insp.name,
    time: "08:30 AM",
    assignment: "Zone A",
    status: insp.status,
  }));

  const checkInColumns = [
    { title: "Check-in Id", dataIndex: "checkInId", key: "checkInId" },
    { title: "Inspector Name", dataIndex: "inspectorName", key: "inspectorName" },
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Assignment", dataIndex: "assignment", key: "assignment" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (status === "Checked-in") return <Tag color="green">Checked-in</Tag>;
        if (status === "Pending") return <Tag color="orange">Pending</Tag>;
        if (status === "On Leave") return <Tag color="red">On Leave</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => {
        const menuItems = [
          {
            key: "view",
            label: "View on Map",
            icon: <EyeOutlined />,
            onClick: () => handleViewClick(record),
          },
        ];
        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  useEffect(() => {
    setPageTitle("Dashboard");
  }, [setPageTitle]);

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        {" "}
        <Row gutter={16}>
          {" "}
          <Col span={6}>
            {" "}
            <Select placeholder="Select Supervisor" style={{ width: "100%" }} />{" "}
          </Col>{" "}
          <Col span={6}>
            {" "}
            <div>
              {" "}
              <Text strong>Name</Text> <br /> Supervisor Name{" "}
            </div>{" "}
          </Col>{" "}
          <Col span={6}>
            {" "}
            <div>
              {" "}
              <Text strong>Zone</Text> <br /> Zone{" "}
            </div>{" "}
          </Col>{" "}
          <Col span={6}>
            {" "}
            <div>
              {" "}
              <Text strong>Shift</Text> <br /> Shift{" "}
            </div>{" "}
          </Col>{" "}
        </Row>{" "}
      </Card>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {/* ✅ Google Map */}
        <Col span={16}>
          <Card bodyStyle={{ padding: 0 }}>
            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY!}>
              <GoogleMap mapContainerStyle={mapContainerStyle} center={dubaiCenter} zoom={15}>
                {window.google &&
                  inspectorAvatars.map((inspector) => (
                    <Marker
                      key={inspector.id}
                      position={{ lat: inspector.lat, lng: inspector.lng }}
                      onClick={() => handleMarkerClick(inspector)}
                      icon={{
                        url: "/images/Inspector.png",
                        scaledSize: new window.google.maps.Size(70, 80),
                      }}
                    />
                  ))}

                {selectedMarker && (
                  <InfoWindow
                    position={{
                      lat: selectedMarker.lat,
                      lng: selectedMarker.lng,
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <h4>{selectedMarker.name}</h4>
                      <p>{selectedMarker.details.email}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </Card>
        </Col>

        {/* ✅ Stats Cards */}
        <Col span={8}>
          <Row gutter={[16, 16]}>
            {/* Inspectors */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#1890ff" }}>
                <div className="inline-statistic">
                  <Statistic title="Total Inspectors" value={20} />
                </div>
                <Space size="large" style={{ marginTop: 8 }}>
                  <Statistic className="sub-statistic" title="Checked In" value={10} />
                  <Statistic className="sub-statistic" title="Missing" value={8} />
                  <Statistic className="sub-statistic" title="On Leave" value={2} />
                </Space>
                <Avatar size={56} icon={<UserOutlined />} style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }} />
              </Card>
            </Col>

            {/* Approvals */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#52c41a" }}>
                <div className="inline-statistic">
                  <Statistic title="Total Approvals" value={12} />
                </div>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col>
                    <Statistic className="sub-statistic" title="Leave" value={10} />
                  </Col>
                  <Col>
                    <Statistic className="sub-statistic" title="Towing" value={2} />
                  </Col>
                </Row>
                <Avatar
                  size={56}
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: "#f6ffed", color: "#52c41a" }}
                />
              </Card>
            </Col>

            {/* Inspections */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#faad14" }}>
                <div className="inline-statistic">
                  <Statistic title="Total Inspections" value={20} />
                </div>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col>
                    <Statistic className="sub-statistic" title="Fines" value={10} />
                  </Col>
                  <Col>
                    <Statistic className="sub-statistic" title="Amount" value={100000} suffix="AED" />
                  </Col>
                </Row>
                <Avatar
                  size={56}
                  icon={<SafetyCertificateOutlined />}
                  style={{ backgroundColor: "#fffbe6", color: "#faad14" }}
                />
              </Card>
            </Col>

            {/* Obstacles */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#ff4d4f", cursor: "pointer" }}>
                <div className="inline-statistic">
                  <Statistic title="Total Obstacles" value={10} />
                </div>
                <Avatar size={56} icon={<WarningOutlined />} style={{ backgroundColor: "#fff1f0", color: "#ff4d4f" }} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* ✅ Table Section */}
      <Card
        title="Overview Data"
        extra={
          <>
            <Button
              type={activeTable === "checkInStatus" ? "primary" : "default"}
              onClick={() => setActiveTable("checkInStatus")}
              icon={<UserOutlined />}
              style={{ marginRight: 8 }}
            >
              Inspectors Status
            </Button>
            <Button
              type={activeTable === "towingRequests" ? "primary" : "default"}
              onClick={() => setActiveTable("towingRequests")}
              icon={<CarOutlined />}
              style={{ marginRight: 8 }}
            >
              Towing Requests
            </Button>
            <Button
              type={activeTable === "leaveRequests" ? "primary" : "default"}
              onClick={() => setActiveTable("leaveRequests")}
              icon={<AppstoreAddOutlined />}
              style={{ marginRight: 8 }}
            >
              Leave Requests
            </Button>
            <Button
              type={activeTable === "obstacle" ? "primary" : "default"}
              onClick={() => setActiveTable("obstacle")}
              icon={<ExclamationCircleOutlined />}
            >
              Obstacle
            </Button>
          </>
        }
      >
        <Table columns={checkInColumns} dataSource={checkInData} pagination={false} />
      </Card>

      {/* ✅ Drawer */}
      <DashboardViewDrawer open={drawerVisible} onClose={handleDrawerClose} inspector={selectedInspector} />
    </div>
  );
};

export default SupervisorViewPage;
