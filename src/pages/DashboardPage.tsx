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

const { Title, Text } = Typography;

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [showObstacles, setShowObstacles] = useState(false);
  const [mapTitle, setMapTitle] = useState("Inspectors Location");

  // Dummy data for check-in status table
  const checkInData = [
    {
      key: "1",
      checkInId: "C0001",
      inspectorName: "Inspector 1",
      time: "08:30 AM",
      assignment: "Zone A - Downtown",
      status: "Checked-in",
    },
    {
      key: "2",
      checkInId: "C0002",
      inspectorName: "Inspector 2",
      time: "08:45 AM",
      assignment: "Zone B - Residential",
      status: "Pending",
    },
  ];

  // Dummy data for towing requests
  const towingData = [
    {
      key: "1",
      requestId: "TR001",
      inspectorName: "Inspector 1",
      location: "Downtown Mall",
      vehicle: "Toyota Camry",
      time: "10:00 AM",
      status: "completed",
    },
    {
      key: "2",
      requestId: "TR002",
      inspectorName: "Inspector 2",
      location: "Residential Area",
      vehicle: "Honda Civic",
      time: "10:05 AM",
      status: "pending",
    },
  ];

  // Dummy data for leave requests
  const leaveData = [
    {
      key: "1",
      requestId: "LR001",
      inspectorName: "Inspector 1",
      leaveType: "Annual Leave",
      startDate: "2025-08-25",
      endDate: "2025-08-28",
      status: "Approved",
    },
    {
      key: "2",
      requestId: "LR002",
      inspectorName: "Inspector 2",
      leaveType: "Sick Leave",
      startDate: "2025-08-21",
      endDate: "2025-08-23",
      status: "Pending",
    },
  ];

  // Dummy data for obstacles
  const obstacleData = [
    {
      key: "1",
      obstacleId: "OB001",
      inspectorName: "Inspector 1",
      location: "Main Street",
      description: "Road construction blocking access",
      time: "09:15 AM",
      status: "Resolved",
    },
    {
      key: "2",
      obstacleId: "OB002",
      inspectorName: "Inspector 2",
      location: "City Center",
      description: "Vehicle parked in no-parking zone",
      time: "09:30 AM",
      status: "Pending",
    },
  ];

  // Dummy data for inspector avatars on map
  const inspectorAvatars = [
    {
      id: 1,
      name: "Inspector 1",
      lat: 25.1972,
      lng: 55.2743,
      status: "Checked-in",
      color: "#52c41a",
      details: {
        email: "inspector1@example.com",
        dob: "01-01-1990",
        mobile: "0501234567",
        zone: "Zone A",
        area: "Downtown",
        street: "Main Street",
        doorNumber: "123",
        obstacles: 3,
        finesIssued: 5,
        towingRequests: 2,
        leaveRequested: 1,
        checkInArea: "Downtown",
        checkInZone: "Zone A",
        checkInTime: "08:30 AM",
        shift: "Morning",
      },
    },
    {
      id: 2,
      name: "Inspector 2",
      lat: 25.1965,
      lng: 55.2728,
      status: "Pending",
      color: "#faad14",
      details: {
        email: "inspector2@example.com",
        dob: "02-02-1991",
        mobile: "0507654321",
        zone: "Zone B",
        area: "Residential",
        street: "Oak Avenue",
        doorNumber: "456",
        obstacles: 1,
        finesIssued: 3,
        towingRequests: 0,
        leaveRequested: 0,
        checkInArea: "Residential",
        checkInZone: "Zone B",
        checkInTime: "08:45 AM",
        shift: "Morning",
      },
    },
  ];

  // Dummy obstacle locations
  const obstacleLocations = [
    { id: 1, lat: 25.1975, lng: 55.2735, type: "construction", description: "Road construction" },
    { id: 2, lat: 25.197, lng: 55.274, type: "accident", description: "Traffic accident" },
    { id: 3, lat: 25.1968, lng: 55.2732, type: "parking", description: "Illegal parking" },
    { id: 4, lat: 25.1973, lng: 55.2725, type: "construction", description: "Sidewalk repair" },
    { id: 5, lat: 25.1962, lng: 55.2738, type: "accident", description: "Car breakdown" },
    { id: 6, lat: 25.1978, lng: 55.2728, type: "parking", description: "Blocking driveway" },
    { id: 7, lat: 25.1965, lng: 55.2745, type: "construction", description: "Utility work" },
    { id: 8, lat: 25.1971, lng: 55.273, type: "accident", description: "Minor collision" },
    { id: 9, lat: 25.1969, lng: 55.2742, type: "parking", description: "No parking zone" },
    { id: 10, lat: 25.1976, lng: 55.2733, type: "construction", description: "Road closure" },
  ];

  const handleAvatarClick = (inspector: any) => {
    setSelectedInspector(inspector);
    setDrawerVisible(true);
  };

  const handleObstaclesClick = () => {
    setShowObstacles(!showObstacles);
    setMapTitle(showObstacles ? "Inspectors Location" : "Obstacles Location");
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspector(null);
  };

  const handleViewClick = (record: any) => {
    // Find the inspector based on the record data
    const inspector = inspectorAvatars.find(
      (insp) => insp.id === record.inspectorId || insp.name === record.inspectorName,
    );

    if (inspector) {
      setSelectedInspector(inspector);
      setDrawerVisible(true);
    }
  };

  const getObstacleIcon = (type: string) => {
    switch (type) {
      case "construction":
        return "🚧";
      case "accident":
        return "🚨";
      case "parking":
        return "🅿️";
      default:
        return "⚠️";
    }
  };

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
      width: 100,
      render: (_: any, record: any) => {
        const menuItems = [
          {
            key: "view",
            label: "View",
            icon: <EyeOutlined />,
            onClick: () => handleViewClick(record),
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const towingColumns = [
    { title: "Request Id", dataIndex: "requestId", key: "requestId" },
    { title: "Inspector Name", dataIndex: "inspectorName", key: "inspectorName" },
    { title: "Location", dataIndex: "location", key: "location" },
    { title: "Vehicle", dataIndex: "vehicle", key: "vehicle" },
    { title: "Time", dataIndex: "time", key: "time" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (status === "completed") return <Tag color="green">Completed</Tag>;
        if (status === "pending") return <Tag color="orange">Pending</Tag>;
        if (status === "in-progress") return <Tag color="blue">In Progress</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      align: "center" as const,
      width: 100,
      render: (_: any, record: any) => {
        const menuItems = [
          {
            key: "view",
            label: "View",
            icon: <EyeOutlined />,
            onClick: () => handleViewClick(record),
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const leaveColumns = [
    { title: "Request Id", dataIndex: "requestId", key: "requestId" },
    { title: "Inspector Name", dataIndex: "inspectorName", key: "inspectorName" },
    { title: "Leave Type", dataIndex: "leaveType", key: "leaveType" },
    { title: "Start Date", dataIndex: "startDate", key: "startDate" },
    { title: "End Date", dataIndex: "endDate", key: "endDate" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (status === "Approved") return <Tag color="green">Approved</Tag>;
        if (status === "Pending") return <Tag color="orange">Pending</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      align: "center" as const,
      width: 100,
      render: (_: any, record: any) => {
        const menuItems = [
          {
            key: "view",
            label: "View",
            icon: <EyeOutlined />,
            onClick: () => handleViewClick(record),
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const obstacleColumns = [
    { title: "Obstacle Id", dataIndex: "obstacleId", key: "obstacleId" },
    { title: "Inspector Name", dataIndex: "inspectorName", key: "inspectorName" },
    { title: "Location", dataIndex: "location", key: "location" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Time", dataIndex: "time", key: "time" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (status === "Resolved") return <Tag color="green">Resolved</Tag>;
        if (status === "Pending") return <Tag color="orange">Pending</Tag>;
        if (status === "In Progress") return <Tag color="blue">In Progress</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      align: "center" as const,
      width: 100,
      render: (_: any, record: any) => {
        const menuItems = [
          {
            key: "view",
            label: "View",
            icon: <EyeOutlined />,
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const getTableData = () => {
    switch (activeTable) {
      case "checkInStatus":
        return { data: checkInData, columns: checkInColumns };
      case "towingRequests":
        return { data: towingData, columns: towingColumns };
      case "leaveRequests":
        return { data: leaveData, columns: leaveColumns };
      case "obstacle":
        return { data: obstacleData, columns: obstacleColumns };
      default:
        return { data: checkInData, columns: checkInColumns };
    }
  };

  const { data, columns } = getTableData();

  useEffect(() => {
    setPageTitle("Dashboard");
  }, [setPageTitle]);

  return (
    <div style={{ padding: 0 }}>
      {/* Header Filters */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select placeholder="Select Supervisor" style={{ width: "100%" }} />
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Name</Text>
              <br />
              Supervisor Name
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Zone</Text>
              <br />
              Zone
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Shift</Text>
              <br />
              Shift
            </div>
          </Col>
        </Row>
      </Card>

      {/* Map + Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={16}>
          <Card bodyStyle={{ padding: 0 }}>
            <div
              style={{
                height: "575px",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                position: "relative",
              }}
            >
              {/* Map Embed */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.390625704501!2d55.271884315011004!3d25.197197983897892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6820a963b18f%3A0xe9a72e1e0eaa2d17!2sBurj%20Khalifa!5e0!3m2!1sen!2sae!4v1692546354283!5m2!1sen!2sae"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>

              {/* Title inside the map */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontWeight: "bold",
                  fontSize: "14px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  zIndex: 1200,
                }}
              >
                {mapTitle}
              </div>

              {/* Inspector Avatars */}
              {inspectorAvatars.map((inspector) => (
                <div
                  key={inspector.id}
                  style={{
                    position: "absolute",
                    top: `${((25.1985 - inspector.lat) / 0.003) * 100}%`,
                    left: `${((inspector.lng - 55.271) / 0.004) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 1000,
                    cursor: "pointer",
                  }}
                  onClick={() => handleAvatarClick(inspector)}
                >
                  <Avatar
                    size="large"
                    style={{
                      backgroundColor: inspector.color,
                      border: `2px solid white`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                    icon={<UserOutlined />}
                  />
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "2px 6px",
                      borderRadius: 4,
                      marginTop: 4,
                      fontSize: "10px",
                      fontWeight: "bold",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {inspector.name}
                  </div>
                </div>
              ))}

              {/* Obstacle Markers */}
              {showObstacles &&
                obstacleLocations.map((obstacle) => (
                  <div
                    key={obstacle.id}
                    style={{
                      position: "absolute",
                      top: `${((25.1985 - obstacle.lat) / 0.003) * 100}%`,
                      left: `${((obstacle.lng - 55.271) / 0.004) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 900,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#ff4d4f",
                        color: "white",
                        borderRadius: "50%",
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        fontSize: "16px",
                      }}
                    >
                      {getObstacleIcon(obstacle.type)}
                    </div>
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginTop: 4,
                        fontSize: "10px",
                        fontWeight: "bold",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        maxWidth: "100px",
                      }}
                    >
                      {obstacle.description}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Row gutter={[16, 16]}>
            {/* Inspectors */}
            <Col span={24}>
              <Card className="dashboard-stat-card" style={{ borderColor: "#1890ff" }}>
                <div className="inline-statistic">
                  <Statistic title="Total Inspectors" value={20} />
                </div>
                <Space size="large" style={{ marginTop: 8 }}>
                  <Statistic
                    className="sub-statistic"
                    title="Checked In"
                    value={10}
                  />
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
              <Card
                className="dashboard-stat-card"
                style={{ borderColor: "#ff4d4f", cursor: "pointer" }}
                onClick={handleObstaclesClick}
              >
                <div className="inline-statistic">
                  <Statistic title="Total Obstacles" value={10} />
                </div>
                <Avatar size={56} icon={<WarningOutlined />} style={{ backgroundColor: "#fff1f0", color: "#ff4d4f" }} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Table Section */}
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
        <Table columns={columns} dataSource={data} pagination={false} />
      </Card>

      {/* Dashboard View Drawer */}
      <DashboardViewDrawer open={drawerVisible} onClose={handleDrawerClose} inspector={selectedInspector} />
    </div>
  );
};

export default SupervisorViewPage;
