import React, { useEffect, useState } from "react";
import { Card, Col, Row, Select, Table, Tag, Typography, Button, Space, Dropdown, Avatar } from "antd";
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
import DashboardViewDrawer from "../components/dashboard/DashboardViewDrawer"; // Import the drawer component

const { Title, Text } = Typography;

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);

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

  const handleAvatarClick = (inspector: any) => {
    setSelectedInspector(inspector);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspector(null);
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
                height: 530,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                position: "relative",
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.390625704501!2d55.271884315011004!3d25.197197983897892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6820a963b18f%3A0xe9a72e1e0eaa2d17!2sBurj%20Khalifa!5e0!3m2!1sen!2sae!4v1692546354283!5m2!1sen!2sae"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>

              {/* Inspector Avatars on Map */}
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
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Row gutter={[0, 12]}>
            {/* Inspectors Card */}
            <Col span={24}>
              <Card
                style={{
                  backgroundColor: "#EBF5FE",
                  border: "1px solid #9ACCFF",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f0f0f0",
                    paddingBottom: "10px",
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    20 Inspectors
                  </Title>
                  <UserOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Checked In</Text>
                    <br />
                    <Text type="success" strong>
                      10
                    </Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Missing</Text>
                    <br />
                    <Text type="danger" strong>
                      8
                    </Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">On Leave</Text>
                    <br />
                    <Text type="warning" strong>
                      2
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Approvals Card */}
            <Col span={24}>
              <Card
                style={{
                  backgroundColor: "#ECFDF3",
                  border: "1px solid red",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f0f0f0",
                    paddingBottom: "10px",
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    12 Approvals
                  </Title>
                  <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Leave Requests</Text>
                    <br />
                    <Text type="success" strong>
                      10
                    </Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Towing Requests</Text>
                    <br />
                    <Text type="success" strong>
                      2
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Inspections Card */}
            <Col span={24}>
              <Card
                style={{
                  backgroundColor: "#FAF3FE",
                  border: "1px solid #DDB5FF",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f0f0f0",
                    paddingBottom: "10px",
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    20 Inspections
                  </Title>
                  <SafetyCertificateOutlined style={{ fontSize: "24px", color: "#faad14" }} />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Fines Issued</Text>
                    <br />
                    <Text strong>10</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Total Amount</Text>
                    <br />
                    <Text strong>100,000 AED</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Disputes</Text>
                    <br />
                    <Text strong>2</Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Obstacles Card */}
            <Col span={24}>
              <Card
                style={{
                  backgroundColor: "#FDF1F0",
                  border: "1px solid #F6A395",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "6px",
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    10 Obstacles
                  </Title>
                  <WarningOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />
                </div>
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
              type={activeTable === "Inspectors Status" ? "primary" : "default"}
              onClick={() => setActiveTable("Inspectors Status")}
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
