import React, { useEffect } from "react";
import { Card, Col, Row, Select, Table, Tag, Typography, Button, Space, Dropdown } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";

const { Title, Text } = Typography;

const InspectorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();

  const inspectorsData = [
    {
      id: "TR001",
      name: "Inspector 1",
      location: "Location",
      vehicle: "Vehicle",
      time: "10:00",
      status: "completed",
    },
    {
      id: "TR001",
      name: "Inspector 1",
      location: "Location",
      vehicle: "Vehicle",
      time: "10:05",
      status: "pending",
    },
    {
      id: "TR001",
      name: "Inspector 2",
      location: "Location",
      vehicle: "Vehicle",
      time: "10:10",
      status: "in-progress",
    },
    {
      id: "TR001",
      name: "Inspector 3",
      location: "Location",
      vehicle: "Vehicle",
      time: "10:15",
      status: "completed",
    },
    {
      id: "TR001",
      name: "Inspector 4",
      location: "Location",
      vehicle: "Vehicle",
      time: "10:20",
      status: "pending",
    },
    {
      id: "TR001",
      name: "Inspector 5",
      location: "Location",
      vehicle: "Vehicle",
      time: "10:25",
      status: "in-progress",
    },
  ];

  const columns = [
    { title: "Request Id", dataIndex: "id", key: "id" },
    { title: "Inspector Name", dataIndex: "name", key: "name" },
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

  useEffect(() => {
    setPageTitle("Inspector View");
  }, [setPageTitle, " Inspector  View"]);

  return (
    <div style={{ padding: 0 }}>
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
              }}
            >
              <div style={{ width: "100%", height: "100%", background: "#e8f1f6" }} />
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
                  border: "1px solid #00D292",
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
                    <Text strong> AED 100,000 </Text>
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
            <Button>Check-In Status</Button>
            <Button danger style={{ marginLeft: 8 }}>
              Towing Requests
            </Button>
            <Button style={{ marginLeft: 8 }}>Leave Requests</Button>
            <Button style={{ marginLeft: 8 }}>Obstacle</Button>
          </>
        }
      >
        <Table columns={columns} dataSource={inspectorsData} rowKey="time" pagination={false} />
      </Card>
    </div>
  );
};

export default InspectorViewPage;
