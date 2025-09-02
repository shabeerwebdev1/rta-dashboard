import React, { useEffect, useState } from "react";
import { Card, Col, Row, Select, Table, Tag, Typography, Button, Avatar, Statistic, Spin } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  CarOutlined,
  AppstoreAddOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import DashboardViewDrawer from "../components/dashboard/DashboardViewDrawer";
import { useGetSupervisorDashboardQuery } from "../services/rtkApiFactory"

// ✅ Google Maps
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const { Text } = Typography;

const mapContainerStyle = {
  width: "100%",
  height: "495px",
};

const dubaiCenter = {
  lat: 25.1972,
  lng: 55.2743,
};

// Hardcoded supervisor IDs
const SUPERVISOR_IDS = [
  {
    id: "457CEE92-D09B-4481-88B8-1676667713AD",
    name: "Supervisor 1",
    zone: "Zone A",
    shift: "Morning Shift"
  },
  {
    id: "824E667B-9CF9-4CD0-BA21-65538444509A",
    name: "Supervisor 2",
    zone: "Zone B",
    shift: "Evening Shift"
  }
];

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [supervisorInfo, setSupervisorInfo] = useState<any>(null);

  // Use the RTK Query hook
  const { data: dashboardData, isLoading, error } = useGetSupervisorDashboardQuery(
    selectedSupervisor || SUPERVISOR_IDS[0].id,
    { skip: !selectedSupervisor && SUPERVISOR_IDS.length > 0 }
  );

  // Set default supervisor on initial load
  useEffect(() => {
    if (SUPERVISOR_IDS.length > 0 && !selectedSupervisor) {
      setSelectedSupervisor(SUPERVISOR_IDS[0].id);
      setSupervisorInfo(SUPERVISOR_IDS[0]);
    }
  }, []);

  // Update supervisor info when selection changes
  const handleSupervisorChange = (value: string) => {
    setSelectedSupervisor(value);
    const info = SUPERVISOR_IDS.find(s => s.id === value);
    setSupervisorInfo(info);
  };

  // ✅ Inspectors data (you might want to replace this with actual data from the API)
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
      setSelectedInspector(inspector);
      setDrawerVisible(true);
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
      title: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => {
        return (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewClick(record)}
          >
            View
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    setPageTitle("Dashboard");
  }, [setPageTitle]);

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (error) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select 
              placeholder="Select Supervisor" 
              style={{ width: "100%" }}
              value={selectedSupervisor}
              onChange={handleSupervisorChange}
            >
              {SUPERVISOR_IDS.map(supervisor => (
                <Select.Option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Name</Text> <br /> 
              {supervisorInfo?.name || "N/A"}
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Zone</Text> <br /> 
              {supervisorInfo?.zone || "N/A"}
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Shift</Text> <br /> 
              {supervisorInfo?.shift || "N/A"}
            </div>
          </Col>
        </Row>
      </Card>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {/* ✅ Google Map */}
        <Col span={16}>
          <Card bodyStyle={{ padding: 0, height: "100%" }}>
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
        <Col span={8} style={{ height: "100%" }}>
          <Row gutter={[16, 16]} style={{ height: "100%" }}>
            {/* Inspectors */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#1890ff" }}>
                <Row
                  wrap={false} // ✅ prevent wrapping
                  align="middle" // ✅ vertical center
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  {/* Left: Total */}
                  <Col flex="none">
                    <Statistic title="Total Inspectors" value={dashboardData?.data?.totalInspectors || 0} />
                  </Col>

                  {/* Center: 3 stats */}
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic title="Checked In" value={dashboardData?.data?.checkedIn || 0} />
                      <Statistic title="Pending" value={dashboardData?.data?.missing || 0} />
                      <Statistic title="On Leave" value={dashboardData?.data?.onLeave || 0} />
                    </div>
                  </Col>

                  {/* Right: Icon */}
                  <Col flex="none" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    <Avatar
                      size={56}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Approvals */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#52c41a" }}>
                <Row
                  wrap={false} // prevent wrapping
                  align="middle" // vertical center
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  {/* Left: Total Approvals */}
                  <Col flex="none">
                    <Statistic title="Total Approvals" value={dashboardData?.data?.totalApprovals || 0} />
                  </Col>

                  {/* Center: Sub Stats */}
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic title="Leave" value={dashboardData?.data?.leaveRequests || 0} />
                      <Statistic title="Towing" value={dashboardData?.data?.towingRequests || 0} />
                    </div>
                  </Col>

                  {/* Right: Icon */}
                  <Col flex="none" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    <Avatar
                      size={56}
                      icon={<CheckCircleOutlined />}
                      style={{ backgroundColor: "#f6ffed", color: "#52c41a" }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Inspections */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#faad14" }}>
                <Row
                  wrap={false} // prevent wrapping
                  align="middle" // vertical center
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  {/* Left: Total Inspections */}
                  <Col flex="none">
                    <Statistic title="Total Inspections" value={dashboardData?.data?.totalInspections || 0} />
                  </Col>

                  {/* Center: Sub Stats */}
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic title="Fines" value={dashboardData?.data?.totalFines || 0} />
                      <Statistic title="Amount" value={dashboardData?.data?.fineAmount || 0} suffix="AED" />
                    </div>
                  </Col>

                  {/* Right: Icon */}
                  <Col flex="none" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    <Avatar
                      size={56}
                      icon={<SafetyCertificateOutlined />}
                      style={{ backgroundColor: "#fffbe6", color: "#faad14" }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Obstacles */}
            <Col span={24}>
              <Card
                className="dashboard-stat-card"
                style={{
                  borderColor: " #ff4d4f", // ✅ consistent border
                  cursor: "pointer",
                }}
              >
                <Row
                  wrap={false} // ✅ prevent wrapping
                  align="middle"
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  {/* Left: Total Obstacles */}
                  <Col flex="none">
                    <Statistic title="Total Obstacles" value={dashboardData?.data?.totalObstacles || 0} />
                  </Col>

                  {/* Center: (optional stats if needed) */}
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    {/* If later you want sub-stats, place them here */}
                  </Col>

                  {/* Right: Icon */}
                  <Col flex="none" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    <Avatar
                      size={56}
                      icon={<WarningOutlined />}
                      style={{ backgroundColor: "#fff1f0", color: "#ff4d4f" }}
                    />
                  </Col>
                </Row>
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
        <Table
          columns={checkInColumns}
          dataSource={checkInData}
          pagination={false}
          size="small"
          className="compact-table"
        />
      </Card>

      {/* ✅ Drawer */}
      <DashboardViewDrawer open={drawerVisible} onClose={handleDrawerClose} inspector={selectedInspector} />
    </div>
  );
};

export default SupervisorViewPage;