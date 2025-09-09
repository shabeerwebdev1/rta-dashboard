import React, { useEffect, useState } from "react";
import { Card, Col, Row, Select, Table, Tag, Typography, Button, Avatar, Statistic, Spin, message } from "antd";
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
import { useGetSupervisorDashboardQuery } from "../services/rtkApiFactory";
import { useTranslation } from "react-i18next"; // Add this import

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

// Hardcoded supervisor IDs with Arabic names
const SUPERVISOR_IDS = [
  {
    id: "9C09B416-3AE4-406A-8627-71A23532A809",
    name: "Supervisor 1",
    nameAr: "المشرف ١",
    zone: "Zone A",
    zoneAr: "المنطقة أ",
    shift: "Morning Shift",
    shiftAr: "نوبة الصباح"
  },
  {
    id: "FCDF7BEC-9FC3-44F1-9AE2-B8D6223B9CE1",
    name: "Supervisor 2",
    nameAr: "المشرف ٢",
    zone: "Zone B",
    zoneAr: "المنطقة ب",
    shift: "Evening Shift",
    shiftAr: "نوبة المساء"
  }
];

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation(); // Get translation function and language
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [supervisorInfo, setSupervisorInfo] = useState<any>(null);

  // Use the RTK Query hook - skip if no supervisor is selected
  const { data: dashboardData, isLoading, error } = useGetSupervisorDashboardQuery(
    selectedSupervisor as string,
    { skip: !selectedSupervisor }
  );

  // Helper function to get text based on current language
  const getLocalizedText = (englishText: string, arabicText: string) => {
    return i18n.language === "ar" ? arabicText : englishText;
  };

  // Update supervisor info when selection changes
  const handleSupervisorChange = (value: string) => {
    setSelectedSupervisor(value);
    const info = SUPERVISOR_IDS.find(s => s.id === value);
    setSupervisorInfo(info);
  };

  // ✅ Inspectors data with Arabic support
  const inspectorAvatars = [
    {
      id: 1,
      name: "Inspector 1",
      nameAr: "المفتش ١",
      lat: 25.1972,
      lng: 55.2743,
      status: "Checked-in",
      statusAr: "تم التسجيل",
      color: "#52c41a",
      details: { 
        email: "inspector1@example.com",
        emailAr: "المفتش١@example.com"
      },
    },
    {
      id: 2,
      name: "Inspector 2",
      nameAr: "المفتش ٢",
      lat: 25.1965,
      lng: 55.2728,
      status: "Pending",
      statusAr: "قيد الانتظار",
      color: "#faad14",
      details: { 
        email: "inspector2@example.com",
        emailAr: "المفتش٢@example.com"
      },
    },
    {
      id: 3,
      name: "Inspector 3",
      nameAr: "المفتش ٣",
      lat: 25.198,
      lng: 55.2735,
      status: "Checked-in",
      statusAr: "تم التسجيل",
      color: "#1890ff",
      details: { 
        email: "inspector3@example.com",
        emailAr: "المفتش٣@example.com"
      },
    },
    {
      id: 4,
      name: "Inspector 4",
      nameAr: "المفتش ٤",
      lat: 25.1975,
      lng: 55.275,
      status: "On Leave",
      statusAr: "في إجازة",
      color: "#ff4d4f",
      details: { 
        email: "inspector4@example.com",
        emailAr: "المفتش٤@example.com"
      },
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

  // ✅ Dummy Table data with Arabic support
  const checkInData = inspectorAvatars.map((insp, idx) => ({
    key: idx,
    checkInId: `C000${idx + 1}`,
    inspectorName: getLocalizedText(insp.name, insp.nameAr),
    time: getLocalizedText("08:30 AM", "٠٨:٣٠ ص"),
    assignment: getLocalizedText("Zone A", "المنطقة أ"),
    status: getLocalizedText(insp.status, insp.statusAr),
    originalStatus: insp.status, // Keep original for filtering/sorting
  }));

  const checkInColumns = [
    { 
      title: t("form.checkInId", "Check-in Id"), 
      dataIndex: "checkInId", 
      key: "checkInId" 
    },
    { 
      title: t("form.inspectorName", "Inspector Name"), 
      dataIndex: "inspectorName", 
      key: "inspectorName" 
    },
    { 
      title: t("form.time", "Time"), 
      dataIndex: "time", 
      key: "time" 
    },
    { 
      title: t("form.assignment", "Assignment"), 
      dataIndex: "assignment", 
      key: "assignment" 
    },
    {
      title: t("form.status", "Status"),
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        const originalStatus = record.originalStatus;
        if (originalStatus === "Checked-in") return <Tag color="green">{status}</Tag>;
        if (originalStatus === "Pending") return <Tag color="orange">{status}</Tag>;
        if (originalStatus === "On Leave") return <Tag color="red">{status}</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: t("common.action", "Actions"),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => {
        return (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewClick(record)}
          >
            {t("common.view", "View")}
          </Button>
        );
      },
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
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select 
              placeholder={t("common.selectSupervisor", "Select Supervisor")} 
              style={{ width: "100%" }}
              value={selectedSupervisor}
              onChange={handleSupervisorChange}
              allowClear
            >
              {SUPERVISOR_IDS.map(supervisor => (
                <Select.Option key={supervisor.id} value={supervisor.id}>
                  {getLocalizedText(supervisor.name, supervisor.nameAr)}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>{t("form.supervisorName", "Name")}</Text> <br /> 
              {supervisorInfo ? getLocalizedText(supervisorInfo.name, supervisorInfo.nameAr) : "N/A"}
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>{t("form.zone", "Zone")}</Text> <br /> 
              {supervisorInfo ? getLocalizedText(supervisorInfo.zone, supervisorInfo.zoneAr) : "N/A"}
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text strong>{t("form.shift", "Shift")}</Text> <br /> 
              {supervisorInfo ? getLocalizedText(supervisorInfo.shift, supervisorInfo.shiftAr) : "N/A"}
            </div>
          </Col>
        </Row>
      </Card>
      
      {isLoading && <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />}
      
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
                      <h4>{getLocalizedText(selectedMarker.name, selectedMarker.nameAr)}</h4>
                      <p>{getLocalizedText(selectedMarker.details.email, selectedMarker.details.emailAr)}</p>
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
                  wrap={false}
                  align="middle"
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  <Col flex="none">
                    <Statistic title={t("dashboard.totalInspectors", "Total Inspectors")} value={dashboardData?.data?.totalInspectors || 0} />
                  </Col>
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic title={t("dashboard.checkedIn", "Checked In")} value={dashboardData?.data?.checkedIn || 0} />
                      <Statistic title={t("dashboard.missing", "Missing")} value={dashboardData?.data?.missing || 0} />
                      <Statistic title={t("dashboard.onLeave", "On Leave")} value={dashboardData?.data?.onLeave || 0} />
                    </div>
                  </Col>
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
                  wrap={false}
                  align="middle"
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  <Col flex="none">
                    <Statistic title={t("dashboard.totalApprovals", "Total Approvals")} value={dashboardData?.data?.totalApprovals || 0} />
                  </Col>
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic title={t("dashboard.leave", "Leave")} value={dashboardData?.data?.leaveRequests || 0} />
                      <Statistic title={t("dashboard.towing", "Towing")} value={dashboardData?.data?.towingRequests || 0} />
                    </div>
                  </Col>
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
                  wrap={false}
                  align="middle"
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  <Col flex="none">
                    <Statistic title={t("dashboard.totalInspections", "Total Inspections")} value={dashboardData?.data?.totalInspections || 0} />
                  </Col>
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Statistic title={t("dashboard.fines", "Fines")} value={dashboardData?.data?.totalFines || 0} />
                      <Statistic title={t("dashboard.amount", "Amount")} value={dashboardData?.data?.fineAmount || 0} suffix="AED" />
                    </div>
                  </Col>
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
                  borderColor: "#ff4d4f",
                  cursor: "pointer",
                }}
              >
                <Row
                  wrap={false}
                  align="middle"
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  <Col flex="none">
                    <Statistic title={t("dashboard.totalObstacles", "Total Obstacles")} value={dashboardData?.data?.totalObstacles || 0} />
                  </Col>
                  <Col flex="auto" style={{ display: "flex", justifyContent: "center" }}>
                    {/* Optional sub-stats can go here */}
                  </Col>
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
          className="compact-table"
        />
      </Card>

      {/* ✅ Drawer */}
      <DashboardViewDrawer 
        open={drawerVisible} 
        onClose={handleDrawerClose} 
        inspector={selectedInspector} 
      />
    </div>
  );
};

export default SupervisorViewPage;