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
  DatePicker,
  Grid,
  Radio,
  Space,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  CarOutlined,
  AppstoreAddOutlined,
  EnvironmentOutlined,
  AimOutlined,
  DollarOutlined,
  MobileOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import DashboardViewDrawer from "../components/dashboard/DashboardViewDrawer";
import {
  useGetSupervisorDashboardQuery,
  useGetActiveShiftsQuery,
  useLazyGetShiftsQuery,
} from "../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import ArcGISMap, { Inspector as ArcInspector } from "../components/common/ArcGISMap";
import ApproveRejectController from "../components/common/ApproveRejectController";

const { Text } = Typography;

// Define map view types
type MapViewType = "inspectors" | "supervisors" | "lastSeen" | "fineLocations" | "movementLocations" | "mobileShutdown";

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const [activeTable, setActiveTable] = useState("checkInStatus");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [selectedInspectorDropdown, setSelectedInspectorDropdown] = useState<string | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [mapViewType, setMapViewType] = useState<MapViewType>("inspectors");

  const { data: activeShiftsData, isLoading: isLoadingShifts } = useGetActiveShiftsQuery({});
  const [triggerGetShifts, { isLoading: isLoadingShiftsDropdown }] = useLazyGetShiftsQuery();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs && !screens.md;
  const isTablet = screens.md && !screens.lg;

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const result = await triggerGetShifts({}).unwrap();
        setShifts(result);
      } catch (err) {
        message.error(t("messages.errorLoading", "Error loading shifts"));
      }
    };
    fetchShifts();
  }, [triggerGetShifts, t]);

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useGetSupervisorDashboardQuery(selectedSupervisor as string, {
    skip: !selectedSupervisor,
  });

  const supervisors = activeShiftsData?.filter((shift: any) => shift.roleCode === "PARSUP") || [];
  const inspectors = activeShiftsData?.filter((shift: any) => shift.roleCode === "PARINSP") || [];

  const getLocalizedText = (englishText: string, arabicText: string) => {
    return i18n.language === "ar" ? arabicText : englishText;
  };

  const handleSupervisorChange = (value: string) => {
    setSelectedSupervisor(value);
  };

  // Mock data for different map views
  const inspectorAvatars: ArcInspector[] = [
    {
      id: 1,
      name: "Inspector 1",
      nameAr: "المفتش ١",
      lat: 25.251223,
      lng: 55.294172,
      status: "Checked-in",
      statusAr: "تم التسجيل",
      details: { zone: "Zone A", lastCheckIn: "08:30 AM" },
    },
    {
      id: 2,
      name: "Inspector 2",
      nameAr: "المفتش ٢",
      lat: 25.257065,
      lng: 55.289494,
      status: "Pending",
      statusAr: "قيد الانتظار",
      details: { zone: "Zone B", lastCheckIn: "09:15 AM" },
    },
    {
      id: 3,
      name: "Inspector 3",
      nameAr: "المفتش ٣",
      lat: 25.275635,
      lng: 55.315544,
      status: "Pending",
      statusAr: "قيد الانتظار",
      details: { zone: "Zone C", lastCheckIn: "10:15 AM" },
    },
  ];

  // Mock supervisor locations
  const supervisorLocations: ArcInspector[] = [
    {
      id: 101,
      name: "Supervisor 1",
      nameAr: "المشرف ١",
      lat: 25.268223,
      lng: 55.308172,
      status: "Active",
      statusAr: "نشط",
      details: { zone: "Zone A", lastCheckIn: "07:00 AM" },
    },
    {
      id: 102,
      name: "Supervisor 2",
      nameAr: "المشرف ٢",
      lat: 25.245065,
      lng: 55.285494,
      status: "Active",
      statusAr: "نشط",
      details: { zone: "Zone B", lastCheckIn: "07:15 AM" },
    },
  ];

  // Mock last seen locations
  const lastSeenLocations: ArcInspector[] = inspectorAvatars.map((insp) => ({
    ...insp,
    name: `${insp.name} (Last Seen)`,
    nameAr: `${insp.nameAr} (آخر ظهور)`,
    status: "Last Seen 10 min ago",
    statusAr: "آخر ظهور منذ 10 دقائق",
  }));

  // Mock fine locations
  const fineLocations: ArcInspector[] = [
    {
      id: 201,
      name: "Fine Location 1",
      nameAr: "موقع الغرامة ١",
      lat: 25.255223,
      lng: 55.298172,
      status: "Fine Issued",
      statusAr: "تم إصدار غرامة",
      details: { zone: "Zone A", amount: " AED 200 " },
    },
    {
      id: 202,
      name: "Fine Location 2",
      nameAr: "موقع الغرامة ٢",
      lat: 25.261065,
      lng: 55.292494,
      status: "Fine Issued",
      statusAr: "تم إصدار غرامة",
      details: { zone: "Zone B", amount: " AED 150 " },
    },
  ];

  // Mock movement locations (path tracking)
  const movementLocations: ArcInspector[] = [
    {
      id: 301,
      name: "Movement Point 1",
      nameAr: "نقطة الحركة ١",
      lat: 25.249223,
      lng: 55.290172,
      status: "09:00 AM",
      statusAr: "09:00 صباحاً",
      details: { zone: "Zone A" },
    },
    {
      id: 302,
      name: "Movement Point 2",
      nameAr: "نقطة الحركة ٢",
      lat: 25.253065,
      lng: 55.294494,
      status: "09:30 AM",
      statusAr: "09:30 صباحاً",
      details: { zone: "Zone A" },
    },
    {
      id: 303,
      name: "Movement Point 3",
      nameAr: "نقطة الحركة ٣",
      lat: 25.259635,
      lng: 55.299544,
      status: "10:00 AM",
      statusAr: "10:00 صباحاً",
      details: { zone: "Zone A" },
    },
  ];

  // Mock mobile shutdown locations
  const mobileShutdownLocations: ArcInspector[] = [
    {
      id: 401,
      name: "Mobile Shutdown 1",
      nameAr: "إيقاف الهاتف ١",
      lat: 25.248223,
      lng: 55.288172,
      status: "Offline",
      statusAr: "غير متصل",
      details: { zone: "Zone A", lastSeen: "11:45 AM" },
    },
    {
      id: 402,
      name: "Mobile Shutdown 2",
      nameAr: "إيقاف الهاتف ٢",
      lat: 25.262065,
      lng: 55.296494,
      status: "Offline",
      statusAr: "غير متصل",
      details: { zone: "Zone B", lastSeen: "12:15 PM" },
    },
  ];

  // Get the appropriate data based on selected map view type
  const getMapData = (): ArcInspector[] => {
    switch (mapViewType) {
      case "supervisors":
        return supervisorLocations;
      case "lastSeen":
        return lastSeenLocations;
      case "fineLocations":
        return fineLocations;
      case "movementLocations":
        return movementLocations;
      case "mobileShutdown":
        return mobileShutdownLocations;
      case "inspectors":
      default:
        return inspectorAvatars;
    }
  };

  // sequential index to pick next inspector on select
  const [sequentialIndex, setSequentialIndex] = useState(0);

  const handleInspectorChange = (value: string | undefined) => {
    setSelectedInspectorDropdown(value ?? null);

    if (!value) {
      setSelectedInspector(null);
      return;
    }

    const currentMapData = getMapData();
    const next = currentMapData[sequentialIndex % currentMapData.length];
    setSelectedInspector(next);
    setSequentialIndex((prev) => (prev + 1) % currentMapData.length);
  };

  const handleViewClick = (record: any) => {
    const currentMapData = getMapData();
    const inspector = currentMapData.find((insp) => insp.name === record.inspectorName);
    if (inspector) {
      setSelectedInspector(inspector);
      setDrawerVisible(true);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspector(null);
  };

  const handleMapViewChange = (e: any) => {
    setMapViewType(e.target.value);
    setSelectedInspector(null); // Reset selected inspector when changing view
  };

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
        if (record.originalStatus === "Checked-in") return <Tag color="green">{status}</Tag>;
        if (record.originalStatus === "Pending") return <Tag color="orange">{status}</Tag>;
        if (record.originalStatus === "On Leave") return <Tag color="red">{status}</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: t("common.action", "Actions"),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewClick(record)}>
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
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
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
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={t("common.selectInspector", "Select Inspector")}
              style={{ width: "100%" }}
              value={selectedInspectorDropdown ?? undefined}
              onChange={handleInspectorChange}
              allowClear
              loading={isLoadingShifts}
            >
              {inspectors.map((insp: any) => (
                <Select.Option key={insp.employeeId} value={insp.employeeId}>
                  {insp.employeeName}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={t("common.selectShift", "Select Shift")}
              style={{ width: "100%" }}
              value={selectedShift}
              onChange={(val) => setSelectedShift(val)}
              allowClear
              loading={isLoadingShiftsDropdown}
            >
              {shifts.map((shift) => (
                <Select.Option key={shift.shiftTypeGUID} value={shift.shiftTypeGUID}>
                  {`${shift.shiftTypeCode} - ${i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn}`}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format={"DD MMM YYYY"}
              placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
            />
          </Col>
        </Row>
      </Card>

      {(isLoading || isLoadingShifts) && <Spin size="large" style={{ display: "block", margin: "50px auto" }} />}

      <Row gutter={16} style={{ marginBottom: 20, display: "flex", alignItems: "stretch" }}>
        <Col xs={24} lg={14} style={{ display: "flex" }}>
          <Card
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
            bodyStyle={{ padding: 0, flex: 1, display: "flex", flexDirection: "column" }}
            title={
              <div style={{ padding: "8px 0" }}>
                <Radio.Group
                  value={mapViewType}
                  onChange={handleMapViewChange}
                  buttonStyle="solid"
                  size="middle"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  <Radio.Button
                    value="inspectors"
                    style={{
                      flex: "0 0 calc(33.333% - 6px)",
                      textAlign: "center",
                      minWidth: isMobile ? "100px" : "auto",
                    }}
                  >
                    <UserOutlined /> {t("dashboard.inspectors", "Inspectors")}
                  </Radio.Button>
                  <Radio.Button
                    value="supervisors"
                    style={{
                      flex: "0 0 calc(33.333% - 6px)",
                      textAlign: "center",
                      minWidth: isMobile ? "100px" : "auto",
                    }}
                  >
                    <SafetyCertificateOutlined /> {t("dashboard.supervisors", "Supervisors")}
                  </Radio.Button>
                  <Radio.Button
                    value="lastSeen"
                    style={{
                      flex: "0 0 calc(33.333% - 6px)",
                      textAlign: "center",
                      minWidth: isMobile ? "100px" : "auto",
                    }}
                  >
                    <AimOutlined /> {t("dashboard.lastSeen", "Last Seen")}
                  </Radio.Button>
                  <Radio.Button
                    value="fineLocations"
                    style={{
                      flex: "0 0 calc(33.333% - 6px)",
                      textAlign: "center",
                      minWidth: isMobile ? "100px" : "auto",
                    }}
                  >
                    <CreditCardOutlined /> {t("dashboard.fineLocations", "Fines")}
                  </Radio.Button>
                  <Radio.Button
                    value="movementLocations"
                    style={{
                      flex: "0 0 calc(33.333% - 6px)",
                      textAlign: "center",
                      minWidth: isMobile ? "100px" : "auto",
                    }}
                  >
                    <EnvironmentOutlined /> {t("dashboard.movement", "Movement")}
                  </Radio.Button>
                  <Radio.Button
                    value="mobileShutdown"
                    style={{
                      flex: "0 0 calc(33.333% - 6px)",
                      textAlign: "center",
                      minWidth: isMobile ? "100px" : "auto",
                    }}
                  >
                    <MobileOutlined /> {t("dashboard.mobileShutdown", "Mobile Shutdown")}
                  </Radio.Button>
                </Radio.Group>
              </div>
            }
          >
            <div style={{ flex: 1 }}>
              <ArcGISMap
                inspectors={getMapData()}
                center={[55.2743, 25.1972]}
                zoom={12}
                height="450px"
                clickable={true}
                onInspectorClick={(inspector) => {
                  setSelectedInspector(inspector);
                  setDrawerVisible(true);
                }}
                onlyInspector={selectedInspector ?? null}
                legendEnabled={false}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10} style={{ display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", flex: 1 }}>
            <Card style={{ borderColor: "#1890ff", flex: 1, display: "flex", flexDirection: "column" }}>
              <Row align="bottom" justify="space-between" wrap={true} gutter={[8, 8]}>
                <Col xs={11} sm={11} md={5}>
                  <Statistic
                    title={t("dashboard.totalInspectors", "Total Inspectors")}
                    value={dashboardData?.data?.totalInspectors || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={5}>
                  <Statistic
                    title={t("dashboard.checkedIn", "Checked In")}
                    value={dashboardData?.data?.checkedIn || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={5}>
                  <Statistic
                    title={t("dashboard.missing", "Missing")}
                    value={dashboardData?.data?.missing || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={5}>
                  <Statistic
                    title={t("dashboard.onLeave", "On Leave")}
                    value={dashboardData?.data?.onLeave || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={24} sm={24} md={4} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Avatar
                    size={isMobile ? 48 : 56}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}
                  />
                </Col>
              </Row>
            </Card>

            <Card style={{ borderColor: "#52c41a", flex: 1, display: "flex", flexDirection: "column" }}>
              <Row align="bottom" justify="space-between" wrap={true} gutter={[8, 8]}>
                <Col xs={11} sm={11} md={7}>
                  <Statistic
                    title={t("dashboard.totalApprovals", "Total Approvals")}
                    value={dashboardData?.data?.totalApprovals || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={7}>
                  <Statistic
                    title={t("dashboard.leave", "Leave")}
                    value={dashboardData?.data?.leaveRequests || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={6}>
                  <Statistic
                    title={t("dashboard.towing", "Towing")}
                    value={dashboardData?.data?.towingRequests || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={4} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Avatar
                    size={isMobile ? 48 : 56}
                    icon={<CheckCircleOutlined />}
                    style={{ backgroundColor: "#f6ffed", color: "#52c41a" }}
                  />
                </Col>
              </Row>
            </Card>

            <Card style={{ borderColor: "#faad14", flex: 1, display: "flex", flexDirection: "column" }}>
              <Row align="bottom" justify="space-between" wrap={true} gutter={[8, 8]}>
                <Col xs={11} sm={11} md={7}>
                  <Statistic
                    title={t("dashboard.totalInspections", "Total Inspections")}
                    value={dashboardData?.data?.totalInspections || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={7}>
                  <Statistic
                    title={t("dashboard.fines", "Fines")}
                    value={dashboardData?.data?.totalFines || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={6}>
                  <Statistic
                    title={t("dashboard.amount", "Amount")}
                    value={dashboardData?.data?.fineAmount || 0}
                    prefix="AED"
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={11} sm={11} md={4} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Avatar
                    size={isMobile ? 48 : 56}
                    icon={<SafetyCertificateOutlined />}
                    style={{ backgroundColor: "#fffbe6", color: "#faad14" }}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              style={{ borderColor: "#ff4d4f", cursor: "pointer", flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Row align="bottom" justify="space-between" wrap={true} gutter={[8, 8]}>
                <Col xs={18} sm={18} md={20}>
                  <Statistic
                    title={t("dashboard.totalObstacles", "Total Obstacles")}
                    value={dashboardData?.data?.totalObstacles || 0}
                    valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                  />
                </Col>
                <Col xs={6} sm={6} md={4} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Avatar
                    size={isMobile ? 48 : 56}
                    icon={<WarningOutlined />}
                    style={{ backgroundColor: "#fff1f0", color: "#ff4d4f" }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </Col>
      </Row>
      {/* Old table data hidden */}
      {/* <Card
        title={t("dashboard.overviewData", "Overview Data")}
        extra={
          <Space wrap size="small">
            <Button
              type={activeTable === "checkInStatus" ? "primary" : "default"}
              onClick={() => setActiveTable("checkInStatus")}
              icon={<UserOutlined />}
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && t("dashboard.inspectorsStatus", "Inspectors Status")}
            </Button>
            <Button
              type={activeTable === "towingRequests" ? "primary" : "default"}
              onClick={() => setActiveTable("towingRequests")}
              icon={<CarOutlined />}
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && t("dashboard.towingRequests", "Towing Requests")}
            </Button>
            <Button
              type={activeTable === "leaveRequests" ? "primary" : "default"}
              onClick={() => setActiveTable("leaveRequests")}
              icon={<AppstoreAddOutlined />}
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && t("dashboard.leaveRequests", "Leave Requests")}
            </Button>
          </Space>
        }
      >
        <Table
          scroll={{ x: "max-content" }}
          columns={checkInColumns}
          dataSource={checkInData}
          pagination={false}
          size="small"
        />
      </Card> */}

      <DashboardViewDrawer open={drawerVisible} onClose={handleDrawerClose} inspector={selectedInspector} />
    </div>
  );
};

export default SupervisorViewPage;
