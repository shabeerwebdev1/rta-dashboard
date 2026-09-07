import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Card, Col, Row, Select, Avatar, Statistic, Spin, message, DatePicker, Space } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CreditCardOutlined,
  MoneyCollectOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import DashboardViewDrawer from "../components/dashboard/DashboardViewDrawer";
import DashboardDataModal from "../components/dashboard/DashboardDataModal";
import {
  useGetWebDashboardInspectorsQuery,
  useGetActiveUsersQuery,
  useLazyGetShiftsQuery,
  useGetInspectionByIdQuery,
  useGetViolationDetailsQuery,
  useLazyGetInspectionObstacleByIdQuery,
  useLazyGetTowingByIdQuery,
} from "../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import ArcGISMap, { Inspector as ArcInspector } from "../components/common/ArcGISMap";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";
import TowingViewDrawer from "../components/Towing/TowingViewDrawer";
import InspectionObstaclesViewDrawer from "../components/inspectionobstacle/InspectionObstaclesViewDrawer";

// Define map view types
type MapViewType = "inspectors" | "supervisors" | "lastSeen" | "fineLocations" | "movementLocations" | "mobileShutdown";

const SupervisorViewPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<any>(null);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[any, any]>([null, null]);
  const [finesExpanded, setFinesExpanded] = useState(false);
  const [dataModalType, setDataModalType] = useState<"onLeave" | "pendingCheckIn" | null>(null);

  const roleGUID = localStorage.getItem("roleGUID");
  const userGUID = localStorage.getItem("userGUID");
  const isSupervisorFieldHidden = roleGUID === "137db453-07cc-4218-9ef8-3aa236d9e951";

  const { data: activeUsersData, isLoading: isLoadingShifts } = useGetActiveUsersQuery(
    {},
    { refetchOnMountOrArgChange: true },
  );
  const [triggerGetShifts, { isLoading: isLoadingShiftsDropdown }] = useLazyGetShiftsQuery();

  const [fineDrawerOpen, setFineDrawerOpen] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState<string | null>(null);
  const [selectedEntityCode, setSelectedEntityCode] = useState<string>("parking-inspection");
  const [fineData, setFineData] = useState<any>(null);

  const [towingDrawerOpen, setTowingDrawerOpen] = useState(false);
  const [selectedTowingRecord, setSelectedTowingRecord] = useState<any>(null);

  const [obstacleDrawerOpen, setObstacleDrawerOpen] = useState(false);
  const [selectedObstacleRecord, setSelectedObstacleRecord] = useState<any>(null);

  const fetchedIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const [triggerGetObstacle] = useLazyGetInspectionObstacleByIdQuery();
  const [triggerGetTowing] = useLazyGetTowingByIdQuery();

  const {
    data: inspectionData,
    isLoading: isLoadingInspection,
    isFetching: isFetchingInspection,
  } = useGetInspectionByIdQuery(selectedFineId as string, { skip: !selectedFineId });

  const { data: violationDetails } = useGetViolationDetailsQuery(
    { inspectionGUID: selectedFineId as string, entityCode: selectedEntityCode },
    { skip: !selectedFineId },
  );

  useEffect(() => {
    if (selectedFineId && inspectionData && !isFetchingInspection && !isLoadingInspection) {
      if (fetchedIdRef.current === selectedFineId && isFetchingRef.current) {
        setFineData({ ...inspectionData, violationDetails: violationDetails || [] });
        isFetchingRef.current = false;
      }
    }
  }, [inspectionData, violationDetails, isLoadingInspection, isFetchingInspection, selectedFineId]);

  useEffect(() => {
    if (!fineDrawerOpen) {
      const timer = setTimeout(() => {
        setSelectedFineId(null);
        setFineData(null);
        fetchedIdRef.current = null;
        isFetchingRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fineDrawerOpen]);

  const openDrawerWithNewData = (inspectionGUID: string, entityCode: string) => {
    setFineData(null);
    setSelectedFineId(inspectionGUID);
    setSelectedEntityCode(entityCode || "parking-inspection");
    fetchedIdRef.current = inspectionGUID;
    isFetchingRef.current = true;
    setFineDrawerOpen(true);
  };

  const openObstacleDrawerWithNewData = useCallback(
    async (item: any) => {
      const obstacleId = item?.inspectionGUID || item?.id || item?.inspectionId;

      if (!obstacleId) {
        setSelectedObstacleRecord(item);
        setObstacleDrawerOpen(true);
        return;
      }

      try {
        const response = await triggerGetObstacle(String(obstacleId)).unwrap();
        setSelectedObstacleRecord(response?.data?.data ?? response?.data ?? response);
      } catch {
        setSelectedObstacleRecord(item);
      } finally {
        setObstacleDrawerOpen(true);
      }
    },
    [triggerGetObstacle],
  );

  const openTowingDrawerWithNewData = useCallback(
    async (item: any) => {
      const towingId = item?.inspectionGUID || item?.id || item?.inspectionId;

      if (!towingId) {
        setSelectedTowingRecord(item);
        setTowingDrawerOpen(true);
        return;
      }

      try {
        const response = await triggerGetTowing(String(towingId)).unwrap();
        setSelectedTowingRecord(response?.data?.data ?? response?.data ?? response);
      } catch {
        setSelectedTowingRecord(item);
      } finally {
        setTowingDrawerOpen(true);
      }
    },
    [triggerGetTowing],
  );

  const handleItemClick = useCallback(
    (item: any) => {
      if (!item) return;
      const inspectionGUID = item.inspectionGUID || item.id || item.inspectionId;
      if (!inspectionGUID) return;

      if (item.status === "Obstacle") {
        void openObstacleDrawerWithNewData(item);
      } else if (item.status === "Towing") {
        void openTowingDrawerWithNewData(item);
      } else {
        if (fineDrawerOpen) {
          setFineDrawerOpen(false);
          setTimeout(() => openDrawerWithNewData(inspectionGUID, item.entityCode), 100);
        } else {
          openDrawerWithNewData(inspectionGUID, item.entityCode);
        }
      }
    },
    [fineDrawerOpen, openDrawerWithNewData, openObstacleDrawerWithNewData, openTowingDrawerWithNewData],
  );

  const handleFineDrawerClose = useCallback(() => setFineDrawerOpen(false), []);

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

  const supervisors = activeUsersData?.filter((shift: any) => shift.roleCode === "PARSUP") || [];
  const inspectors = activeUsersData?.filter((shift: any) => shift.roleCode === "PARINSP") || [];

  const selectedSupervisorsData = useMemo(() => {
    return supervisors.filter((s: any) => selectedSupervisors.includes(s.employeeId));
  }, [supervisors, selectedSupervisors]);

  const supervisorZoneIdsArray = useMemo(() => {
    if (isSupervisorFieldHidden && userGUID && activeUsersData) {
      const currentUser = (activeUsersData as any[]).find(
        (u: any) => u.employeeId === userGUID || u.inspectorGUID === userGUID
      );
      if (currentUser && currentUser.zoneIds && currentUser.zoneIds.length > 0) {
        return currentUser.zoneIds.map(String);
      }
    }
    return selectedSupervisorsData.flatMap((s: any) => s.zoneIds || []).map(String);
  }, [selectedSupervisorsData, isSupervisorFieldHidden, userGUID, activeUsersData]);

  const supervisorZoneIds = useMemo(() => {
    return supervisorZoneIdsArray.length > 0 ? supervisorZoneIdsArray.join(",") : undefined;
  }, [supervisorZoneIdsArray]);

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useGetWebDashboardInspectorsQuery(
    {
      ...(supervisorZoneIds ? { "Filters[ZoneId]": supervisorZoneIds } : {}),
      orFilters: {
        ...(selectedInspectors.length > 0 ? { UserId: selectedInspectors } : {}),
        ...(selectedShifts.length > 0 ? { shiftId: selectedShifts } : {}),
      },
      ...(dateRange && dateRange[0] && dateRange[1]
        ? {
            betweens: {
              EntityDateTime: {
                From: dateRange[0].format("YYYY-MM-DD"),
                To: dateRange[1].format("YYYY-MM-DD"),
              },
            },
          }
        : {}),
    },
    { refetchOnMountOrArgChange: true },
  );

  // Show inspectors from activeUsersData, filtered by the selected supervisors' zones (or logged in supervisor's zones) if any
  const inspectorOptions = useMemo(() => {
    if (supervisorZoneIdsArray.length > 0) {
      return inspectors
        .filter((insp: any) => {
          const inspZones = (insp.zoneIds || []).map(String);
          return inspZones.some((z: string) => supervisorZoneIdsArray.includes(z));
        })
        .map((insp: any) => ({
          id: insp.employeeId,
          name: insp.employeeName,
        }));
    }
    return inspectors.map((insp: any) => ({
      id: insp.employeeId,
      name: insp.employeeName,
    }));
  }, [supervisorZoneIdsArray, inspectors]);

  const handleSupervisorChange = (value: string[]) => {
    setSelectedSupervisors(value);
    // Clear selected inspectors that are no longer in the options
    if (selectedInspectors.length > 0) {
      const newSelectedSupervisorsData = supervisors.filter((s: any) => value.includes(s.employeeId));
      const allZoneIds = newSelectedSupervisorsData.flatMap((s: any) => s.zoneIds || []).map(String);

      const validIds = new Set(
        value.length > 0 && allZoneIds.length > 0
          ? inspectors
              .filter((insp: any) => {
                const inspZones = (insp.zoneIds || []).map(String);
                return inspZones.some((z: string) => allZoneIds.includes(z));
              })
              .map((i: any) => i.employeeId)
          : inspectors.map((i: any) => i.employeeId),
      );
      setSelectedInspectors((prev) => prev.filter((id) => validIds.has(id)));
    }
  };

  const apiUsersLocations = useMemo(() => {
    return (dashboardData?.data?.users || [])
      .map((u: any) => ({
        ...u,
        id: u.inspectorGUID || Math.random(),
        name: u.inspectorName,
        nameAr: u.inspectorName,
        zone:
          u.zoneName ||
          u.areaName ||
          u.checkInZone ||
          u.checkOutZone ||
          u.checkInArea ||
          u.checkOutArea ||
          u.zone ||
          u.USWMUZMName ||
          u.USWMUZMNAME ||
          u.zoneNameEn ||
          u.zoneNameAr ||
          "N/A",
        lat: parseFloat(u.checkIn_Lat),
        lng: parseFloat(u.checkIn_Lng),
        status: "Checked-in",
        details: {
          zone:
            u.zoneName ||
            u.areaName ||
            u.checkInZone ||
            u.checkOutZone ||
            u.checkInArea ||
            u.checkOutArea ||
            u.zone ||
            u.USWMUZMName ||
            u.USWMUZMNAME ||
            u.zoneNameEn ||
            u.zoneNameAr ||
            "N/A",
          checkInZone: u.checkInZone,
          checkOutZone: u.checkOutZone,
          checkInArea: u.checkInArea,
          checkOutArea: u.checkOutArea,
          lastCheckIn: u.checkIn,
        },
      }))
      .filter((i: any) => !isNaN(i.lat) && !isNaN(i.lng));
  }, [dashboardData]);

  const apiWarningLocations = useMemo(() => {
    return (dashboardData?.data?.inspectionData || [])
      .filter((i: any) => i.inspectionCategory === "13002")
      .map((i: any) => ({
        ...i,
        id: i.inspectionGUID || Math.random(),
        name: i.entityNo || "Warning",
        lat: parseFloat(i.latitude),
        lng: parseFloat(i.longitude),
        status: "Warning",
        details: { amount: i.fineAmount },
      }))
      .filter((i: any) => !isNaN(i.lat) && !isNaN(i.lng));
  }, [dashboardData]);

  const apiRoutineLocations = useMemo(() => {
    return (dashboardData?.data?.inspectionData || [])
      .filter((i: any) => i.inspectionCategory === "13003")
      .map((i: any) => ({
        ...i,
        id: i.inspectionGUID || Math.random(),
        name: i.entityNo || "Routine",
        lat: parseFloat(i.latitude),
        lng: parseFloat(i.longitude),
        status: "Routine",
        details: { entityCode: i.entityCode },
      }))
      .filter((i: any) => !isNaN(i.lat) && !isNaN(i.lng));
  }, [dashboardData]);

  const apiFineLocations = useMemo(() => {
    return (dashboardData?.data?.inspectionData || [])
      .filter((i: any) => i.inspectionCategory === "13001")
      .map((f: any) => ({
        ...f,
        id: f.inspectionGUID || Math.random(),
        name: f.entityNo || "Fine",
        lat: parseFloat(f.latitude),
        lng: parseFloat(f.longitude),
        status: "Fine",
        details: { amount: f.fineAmount },
      }))
      .filter((i: any) => !isNaN(i.lat) && !isNaN(i.lng));
  }, [dashboardData]);

  const apiVehicleFineLocations = useMemo(() => {
    return apiFineLocations.filter((fine: any) => {
      const type = Number(fine.inspectionType);
      return type === 14001 || type === 14002 || type === 14003 || Number.isNaN(type);
    });
  }, [apiFineLocations]);

  const apiParkingFineLocations = useMemo(() => {
    return apiFineLocations.filter((fine: any) => {
      const type = Number(fine.inspectionType);
      return type === 14004 || type === 14005;
    });
  }, [apiFineLocations]);

  const apiObstacleLocations = useMemo(() => {
    return (dashboardData?.data?.obstacleData || [])
      .map((o: any) => ({
        ...o,
        id: o.inspectionGUID || Math.random(),
        name: o.comments || "Obstacle",
        lat: parseFloat(o.latitude),
        lng: parseFloat(o.longitude),
        status: "Obstacle",
        details: { comments: o.comments },
      }))
      .filter((i: any) => !isNaN(i.lat) && !isNaN(i.lng));
  }, [dashboardData]);

  const apiTowingLocations = useMemo(() => {
    return (dashboardData?.data?.towingData || [])
      .map((t: any) => ({
        ...t,
        id: t.inspectionGUID || t.id || Math.random(),
        name: t.entityNo || "Towing",
        lat: parseFloat(t.latitude),
        lng: parseFloat(t.longitude),
        status: "Towing",
      }))
      .filter((i: any) => !isNaN(i.lat) && !isNaN(i.lng));
  }, [dashboardData]);

  const handleInspectorChange = (value: string[]) => {
    setSelectedInspectors(value);
  };
  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspector(null);
  };

  useEffect(() => {
    setPageTitle(t("sidebar.dashboard", "Dashboard"));
  }, [setPageTitle, t, i18n.language]);

  const summaryCards = [
    {
      key: "totalInspectors",
      title: t("dashboard.totalInspectors", "Total Inspectors"),
      value: dashboardData?.data?.totalInspectors || 0,
      borderColor: "#1890ff",
      avatarBg: "#e6f7ff",
      avatarColor: "#1890ff",
      icon: <UserOutlined />,
    },
    {
      key: "checkedIn",
      title: t("dashboard.checkedIn", "Checked In"),
      value: dashboardData?.data?.checkedIn || 0,
      borderColor: "#52c41a",
      avatarBg: "#f6ffed",
      avatarColor: "#52c41a",
      icon: <CheckCircleOutlined />,
    },
    {
      key: "missing",
      title: t("dashboard.PendingCheckIn", "Pending Check-In"),
      value: dashboardData?.data?.pendingCheckIn || 0,
      borderColor: "#faad14",
      avatarBg: "#fffbe6",
      avatarColor: "#faad14",
      icon: <WarningOutlined />,
    },
    {
      key: "onLeave",
      title: t("dashboard.onLeave", "On Leave"),
      value: dashboardData?.data?.onLeave || 0,
      borderColor: "#ff4d4f",
      avatarBg: "#fff1f0",
      avatarColor: "#ff4d4f",
      icon: <SafetyCertificateOutlined />,
    },

    // {
    //   key: "totalApprovals",
    //   title: t("dashboard.totalApprovals", "Total Approvals"),
    //   value: dashboardData?.data?.totalApprovals || 0,
    //   borderColor: "#52c41a",
    //   avatarBg: "#f6ffed",
    //   avatarColor: "#52c41a",
    //   icon: <CheckCircleOutlined />,
    // },
    // {
    //   key: "leave",
    //   title: t("dashboard.leave", "Leave"),
    //   value: dashboardData?.data?.leaveRequests || 0,
    //   borderColor: "#13c2c2",
    //   avatarBg: "#e6fffb",
    //   avatarColor: "#13c2c2",
    //   icon: <AppstoreAddOutlined />,
    // },

    {
      key: "amount",
      title: t("dashboard.amount", "Amount"),
      value: dashboardData?.data?.amount || 0,
      prefix: "AED",
      borderColor: "#eb2630",
      avatarBg: "#ffe3e5",
      avatarColor: "#eb2630",
      icon: <MoneyCollectOutlined />,
    },

    {
      key: "totalInspections",
      title: t("dashboard.totalInspections", "Total Inspections"),
      value: dashboardData?.data?.totalInspections || 0,
      borderColor: "#096dd9",
      avatarBg: "#e6f4ff",
      avatarColor: "#096dd9",
      icon: <EnvironmentOutlined />,
    },
    {
      key: "routine",
      title: t("dashboard.routine", "Routine"),
      value: apiRoutineLocations.length,
      borderColor: "#34A853",
      avatarBg: "#e6f4ea",
      avatarColor: "#34A853",
      icon: <CheckCircleOutlined />,
    },
    {
      key: "warning",
      title: t("dashboard.warning", "Warning"),
      value: apiWarningLocations.length,
      borderColor: "#c900b5",
      avatarBg: "#fff0f6",
      avatarColor: "#c900b5",
      icon: <WarningOutlined />,
    },
    {
      key: "totalObstacles",
      title: t("dashboard.totalObstacles", "Total Obstacles"),
      value: dashboardData?.data?.totalObstacles || 0,
      borderColor: "#ff4d4f",
      avatarBg: "#fff1f0",
      avatarColor: "#ff4d4f",
      icon: <WarningOutlined />,
    },
    {
      key: "towing",
      title: t("dashboard.towing", "Towing"),
      value: dashboardData?.data?.totalTowing || 0,
      borderColor: "#9254de",
      avatarBg: "#f9f0ff",
      avatarColor: "#9254de",
      icon: <CarOutlined />,
    },
  ];

  const totalFinesValue = dashboardData?.data?.fines ?? apiVehicleFineLocations.length + apiParkingFineLocations.length;

  const fineSummaryCard = {
    key: "fines",
    title: t("dashboard.fines", "Fines"),
    value: totalFinesValue,
    borderColor: "#eb2630",
    avatarBg: "#fff0f6",
    avatarColor: "#eb2630",
    icon: <CreditCardOutlined />,
  };

  const fineBreakdownCards = [
    {
      key: "vehicleFines",
      title: t("stats.vehicleFines", "Vehicle Fines"),
      value: apiVehicleFineLocations.length,
      borderColor: "#E53935",
      avatarBg: "#fff1f0",
      avatarColor: "#E53935",
      icon: <CarOutlined />,
    },
    {
      key: "parkingFines",
      title: t("stats.parkingFines", "Parking Fines"),
      value: apiParkingFineLocations.length,
      borderColor: "#1565C0",
      avatarBg: "#e6f4ff",
      avatarColor: "#1565C0",
      icon: <CreditCardOutlined />,
    },
  ];

  const renderSummaryCard = (card: any, extraProps: { onClick?: () => void; isActive?: boolean } = {}) => (
    <Card
      key={card.key}
      style={{
        position: "relative",
        minWidth: 210,
        flex: "0 0 210px",
        borderColor: card.borderColor,
        cursor: extraProps.onClick ? "pointer" : "default",
      }}
      bodyStyle={{ padding: 16 }}
      onClick={extraProps.onClick}
    >
      <Row align="bottom" justify="space-between" wrap={false} gutter={[8, 8]}>
        <Col style={{ overflow: "hidden" }}>
          <Statistic title={card.title} value={card.value} prefix={card.prefix} valueStyle={{ fontSize: 24 }} />
        </Col>
        <Col style={{ display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
          <Avatar size={42} icon={card.icon} style={{ backgroundColor: card.avatarBg, color: card.avatarColor }} />
        </Col>
      </Row>
      {extraProps.onClick && (
        <CaretRightOutlined
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
            fontSize: 12,
            color: card.avatarColor,
            transform: extraProps.isActive ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      )}
    </Card>
  );

  if (error) {
    message.error(t("messages.errorLoading", "Error loading dashboard data"));
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 20,
          alignItems: "stretch",
        }}
      >
        {summaryCards.slice(0, 6).map((card) => {
          if (card.key === "missing") {
            return renderSummaryCard(card, { onClick: () => setDataModalType("pendingCheckIn") });
          }
          if (card.key === "onLeave") {
            return renderSummaryCard(card, { onClick: () => setDataModalType("onLeave") });
          }
          return renderSummaryCard(card);
        })}

        <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
          {renderSummaryCard(fineSummaryCard, {
            onClick: () => setFinesExpanded((value) => !value),
            isActive: finesExpanded,
          })}

          <div
            style={{
              display: "flex",
              gap: 16,
              overflow: "hidden",
              maxWidth: finesExpanded ? 520 : 0,
              opacity: finesExpanded ? 1 : 0,
              transition: "max-width 0.3s ease, opacity 0.25s ease",
              flexShrink: 0,
              marginInlineStart: finesExpanded ? 16 : 0,
            }}
          >
            {fineBreakdownCards.map((card) => (
              <div key={card.key}>{renderSummaryCard(card)}</div>
            ))}
          </div>
        </div>

        {summaryCards.slice(6).map((card) => renderSummaryCard(card))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          {!isSupervisorFieldHidden && (
            <Col xs={24} sm={12} md={6}>
              <Select
                mode="multiple"
                placeholder={t("common.selectSupervisor", "Select Supervisor")}
                style={{ width: "100%" }}
                value={selectedSupervisors}
                onChange={handleSupervisorChange}
                allowClear
                loading={isLoadingShifts}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase()?.includes(input.toLowerCase()) ?? false
                }
                maxTagCount="responsive"
              >
                {supervisors.map((sup: any) => (
                  <Select.Option key={sup.employeeId} value={sup.employeeId}>
                    {sup.employeeName}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          )}
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              placeholder={t("common.selectInspector", "Select Inspector")}
              style={{ width: "100%" }}
              value={selectedInspectors}
              onChange={handleInspectorChange}
              allowClear
              loading={isLoadingShifts}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase()?.includes(input.toLowerCase()) ?? false
              }
              maxTagCount="responsive"
            >
              {inspectorOptions.map((insp: any) => (
                <Select.Option key={insp.id} value={insp.id}>
                  {insp.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              placeholder={t("common.selectShift", "Select Shift")}
              style={{ width: "100%" }}
              value={selectedShifts}
              onChange={(val) => setSelectedShifts(val)}
              allowClear
              loading={isLoadingShiftsDropdown}
              maxTagCount="responsive"
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
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [any, any])}
            />
          </Col>
          <Col span={24}></Col>
        </Row>
      </Card>

      {(isLoading || isLoadingShifts) && <Spin size="large" style={{ display: "block", margin: "50px auto" }} />}

      <Row gutter={16} style={{ marginBottom: 20, display: "flex", alignItems: "stretch" }}>
        <Col xs={24} style={{ display: "flex" }}>
          <Card
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
            bodyStyle={{ padding: 0, flex: 1, display: "flex", flexDirection: "column" }}
            title={t("dashboard.mapView", "Map View")}
          >
            <div style={{ flex: 1 }}>
              <ArcGISMap
                inspectors={apiUsersLocations}
                fineLocations={apiVehicleFineLocations}
                parkingFineLocations={apiParkingFineLocations}
                obstacleLocations={apiObstacleLocations}
                towingLocations={apiTowingLocations}
                routineLocations={apiRoutineLocations}
                warningLocations={apiWarningLocations}
                center={[55.2743, 25.1972]}
                zoom={12}
                height="calc(100vh - 320px)"
                clickable={true}
                onInspectorClick={(inspector) => {
                  setSelectedInspector(inspector);
                  setDrawerVisible(true);
                }}
                onlyInspector={selectedInspector ?? null}
                legendEnabled={true}
                hiddenLegendItems={["startPoint", "inspectorPath"]}
                onFineClick={handleItemClick}
                onInspectionClick={handleItemClick}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <DashboardViewDrawer open={drawerVisible} onClose={handleDrawerClose} inspector={selectedInspector} />

      <FinesViewDrawer
        open={fineDrawerOpen}
        onClose={handleFineDrawerClose}
        fine={fineData}
        isLoading={isFetchingInspection || isLoadingInspection}
        readOnly
      />

      <TowingViewDrawer
        open={towingDrawerOpen}
        onClose={() => {
          setTowingDrawerOpen(false);
          setSelectedTowingRecord(null);
        }}
        record={selectedTowingRecord}
      />

      <InspectionObstaclesViewDrawer
        open={obstacleDrawerOpen}
        onClose={() => {
          setObstacleDrawerOpen(false);
          setSelectedObstacleRecord(null);
        }}
        record={selectedObstacleRecord}
        config={{ name: { singular: "obstacle", plural: "obstacles" } } as any}
        onShare={() => {}}
        onStatusChange={() => {}}
        zoneOptions={[]}
        sourceOptions={[]}
        areaIdToNameMap={new Map()}
        statusLabels={{}}
      />

      <DashboardDataModal
        open={dataModalType !== null}
        onClose={() => setDataModalType(null)}
        type={dataModalType || "onLeave"}
        data={
          dataModalType === "onLeave"
            ? dashboardData?.data?.onLeaveData || []
            : dashboardData?.data?.pendingCheckInData || []
        }
        supervisors={activeUsersData || []}
      />
    </div>
  );
};

export default SupervisorViewPage;
