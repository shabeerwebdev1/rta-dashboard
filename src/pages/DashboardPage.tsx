/* eslint-disable @typescript-eslint/no-namespace */
import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Select,
  Table,
  Tag,
  Typography,
  Button,
  Avatar,
  Statistic,
  Spin,
  message,
} from "antd";
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
import {
  useGetSupervisorDashboardQuery,
  useGetActiveShiftsQuery,
} from "../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import ArcGISMap from "../components/common/ArcGISMap"; // ✅ our new reusable map

const { Text } = Typography;

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [supervisorInfo, setSupervisorInfo] = useState<any>(null);

  const { data: activeShiftsData, isLoading: isLoadingShifts } =
    useGetActiveShiftsQuery();

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useGetSupervisorDashboardQuery(selectedSupervisor as string, {
    skip: !selectedSupervisor,
  });

  const supervisors =
    activeShiftsData?.filter((shift: any) => shift.roleCode === "PARSUP") || [];

  const getLocalizedText = (englishText: string, arabicText: string) => {
    return i18n.language === "ar" ? arabicText : englishText;
  };

  const handleSupervisorChange = (value: string) => {
    setSelectedSupervisor(value);
  };

  // Mock Inspectors (replace with API data if needed)
  const inspectorAvatars = [
    {
      id: 1,
      name: "Inspector 1",
      nameAr: "المفتش ١",
      lat: 25.1972,
      lng: 55.2743,
      status: "Checked-in",
      statusAr: "تم التسجيل",
      details: { zone: "Zone A", lastCheckIn: "08:30 AM" },
    },
    {
      id: 2,
      name: "Inspector 2",
      nameAr: "المفتش ٢",
      lat: 25.1965,
      lng: 55.2728,
      status: "Pending",
      statusAr: "قيد الانتظار",
      details: { zone: "Zone B", lastCheckIn: "09:15 AM" },
    },
  ];

  const handleViewClick = (record: any) => {
    const inspector = inspectorAvatars.find(
      (insp) => insp.name === record.inspectorName
    );
    if (inspector) {
      setSelectedInspector(inspector);
      setDrawerVisible(true);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspector(null);
  };

  // Table Config
  const checkInData = inspectorAvatars.map((insp, idx) => ({
    key: idx,
    checkInId: `C000${idx + 1}`,
    inspectorName: getLocalizedText(insp.name, insp.nameAr),
    time: insp.details?.lastCheckIn || "-",
    assignment: insp.details?.zone || "-",
    status: getLocalizedText(insp.status, insp.statusAr),
    originalStatus: insp.status,
  }));

  const checkInColumns = [
    { title: t("form.checkInId", "Check-in Id"), dataIndex: "checkInId" },
    { title: t("form.inspectorName", "Inspector Name"), dataIndex: "inspectorName" },
    { title: t("form.time", "Time"), dataIndex: "time" },
    { title: t("form.assignment", "Assignment"), dataIndex: "assignment" },
    {
      title: t("form.status", "Status"),
      dataIndex: "status",
      render: (status: string, record: any) => {
        if (record.originalStatus === "Checked-in")
          return <Tag color="green">{status}</Tag>;
        if (record.originalStatus === "Pending")
          return <Tag color="orange">{status}</Tag>;
        if (record.originalStatus === "On Leave")
          return <Tag color="red">{status}</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: t("common.action", "Actions"),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewClick(record)}
        >
          {t("common.view", "View")}
        </Button>
      ),
    },
  ];

  useEffect(() => {
    setPageTitle(t("sidebar.dashboard", "Dashboard"));
  }, [setPageTitle, t, i18n.language]);

  if (error) {
    message.error(t("messages.errorLoading", "Error loading dashboard data"));
  }

  return (
    <div>
      {/* Supervisor Info */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder={t("common.selectSupervisor", "Select Supervisor")}
              style={{ width: "100%" }}
              value={selectedSupervisor}
              onChange={handleSupervisorChange}
              allowClear
              loading={isLoadingShifts}
            >
              {supervisors.map((sup: any) => (
                <Select.Option key={sup.employeeId} value={sup.employeeId}>
                  {sup.employeeName}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>{t("form.supervisorName", "Name")}</Text> <br />
              {dashboardData?.data?.users?.[0]?.employeeName || "N/A"}
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>{t("form.zone", "Zone")}</Text> <br />
              {dashboardData?.data?.users?.[0]?.zones?.join(", ") || "N/A"}
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>{t("form.shift", "Shift")}</Text> <br />
              {supervisorInfo ? supervisorInfo.role : "N/A"}
            </div>
          </Col>
        </Row>
      </Card>

      {(isLoading || isLoadingShifts) && (
        <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
      )}

      <Row gutter={16} style={{ marginBottom: 20 }}>
        {/* ✅ ArcGIS Map (Reusable Component) */}
        <Col span={16}>
          <Card bodyStyle={{ padding: 0, height: "100%", position: "relative" }}>
            <ArcGISMap
              inspectors={inspectorAvatars}
              center={[55.2743, 25.1972]}
              zoom={12}
              height="495px"
              onInspectorClick={(inspector) => {
                setSelectedInspector(inspector);
                setDrawerVisible(true);
              }}
            />
          </Card>
        </Col>

        {/* Stats Section */}
        <Col span={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card style={{ borderColor: "#1890ff" }}>
                <Row wrap={false} align="middle" justify="space-between">
                  <Col flex="none">
                    <Statistic
                      title={t("dashboard.totalInspectors", "Total Inspectors")}
                      value={dashboardData?.data?.totalInspectors || 0}
                    />
                  </Col>
                  <Col
                    flex="auto"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic
                        title={t("dashboard.checkedIn", "Checked In")}
                        value={dashboardData?.data?.checkedIn || 0}
                      />
                      <Statistic
                        title={t("dashboard.missing", "Missing")}
                        value={dashboardData?.data?.missing || 0}
                      />
                      <Statistic
                        title={t("dashboard.onLeave", "On Leave")}
                        value={dashboardData?.data?.onLeave || 0}
                      />
                    </div>
                  </Col>
                  <Col flex="none">
                    <Avatar
                      size={56}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card style={{ borderColor: "#52c41a" }}>
                <Row wrap={false} align="middle" justify="space-between">
                  <Col flex="none">
                    <Statistic
                      title={t("dashboard.totalApprovals", "Total Approvals")}
                      value={dashboardData?.data?.totalApprovals || 0}
                    />
                  </Col>
                  <Col
                    flex="auto"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic
                        title={t("dashboard.leave", "Leave")}
                        value={dashboardData?.data?.leaveRequests || 0}
                      />
                      <Statistic
                        title={t("dashboard.towing", "Towing")}
                        value={dashboardData?.data?.towingRequests || 0}
                      />
                    </div>
                  </Col>
                  <Col flex="none">
                    <Avatar
                      size={56}
                      icon={<CheckCircleOutlined />}
                      style={{ backgroundColor: "#f6ffed", color: "#52c41a" }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card style={{ borderColor: "#faad14" }}>
                <Row wrap={false} align="middle" justify="space-between">
                  <Col flex="none">
                    <Statistic
                      title={t("dashboard.totalInspections", "Total Inspections")}
                      value={dashboardData?.data?.totalInspections || 0}
                    />
                  </Col>
                  <Col
                    flex="auto"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic
                        title={t("dashboard.fines", "Fines")}
                        value={dashboardData?.data?.totalFines || 0}
                      />
                      <Statistic
                        title={t("dashboard.amount", "Amount")}
                        value={dashboardData?.data?.fineAmount || 0}
                        suffix="AED"
                      />
                    </div>
                  </Col>
                  <Col flex="none">
                    <Avatar
                      size={56}
                      icon={<SafetyCertificateOutlined />}
                      style={{ backgroundColor: "#fffbe6", color: "#faad14" }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card style={{ borderColor: "#ff4d4f", cursor: "pointer" }}>
                <Row wrap={false} align="middle" justify="space-between">
                  <Col flex="none">
                    <Statistic
                      title={t("dashboard.totalObstacles", "Total Obstacles")}
                      value={dashboardData?.data?.totalObstacles || 0}
                    />
                  </Col>
                  <Col flex="none">
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

      {/* Table Section */}
      <Card
        title={t("dashboard.overviewData", "Overview Data")}
        extra={
          <>
            <Button
              type={activeTable === "checkInStatus" ? "primary" : "default"}
              onClick={() => setActiveTable("checkInStatus")}
              icon={<UserOutlined />}
              style={{ marginRight: 8 }}
            >
              {t("dashboard.inspectorsStatus", "Inspectors Status")}
            </Button>
            <Button
              type={activeTable === "towingRequests" ? "primary" : "default"}
              onClick={() => setActiveTable("towingRequests")}
              icon={<CarOutlined />}
              style={{ marginRight: 8 }}
            >
              {t("dashboard.towingRequests", "Towing Requests")}
            </Button>
            <Button
              type={activeTable === "leaveRequests" ? "primary" : "default"}
              onClick={() => setActiveTable("leaveRequests")}
              icon={<AppstoreAddOutlined />}
              style={{ marginRight: 8 }}
            >
              {t("dashboard.leaveRequests", "Leave Requests")}
            </Button>
            <Button
              type={activeTable === "obstacle" ? "primary" : "default"}
              onClick={() => setActiveTable("obstacle")}
              icon={<ExclamationCircleOutlined />}
            >
              {t("dashboard.obstacle", "Obstacle")}
            </Button>
          </>
        }
      >
        <Table
          columns={checkInColumns}
          dataSource={checkInData}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Drawer */}
      <DashboardViewDrawer
        open={drawerVisible}
        onClose={handleDrawerClose}
        inspector={selectedInspector}
      />
    </div>
  );
};

export default SupervisorViewPage;
