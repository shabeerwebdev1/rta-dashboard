// HRMSViewDrawer.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useRef, useState } from "react";
import { Modal, Descriptions, Badge, Typography, theme } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, CloseOutlined, CaretRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PageConfig } from "../../types/config";
import ArcGISMap from "../common/ArcGISMap";
import FinesViewDrawer from "../fines/FinesViewDrawer";
import { useGetInspectionByIdQuery, useGetViolationDetailsQuery } from "../../services/rtkApiFactory";
import dayjs from "dayjs";
import { Button } from "antd";

const { Text, Title } = Typography;

interface HRMSViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  statusLabels: Record<string, string>;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const ParkingFineIcon = ({ color = "#1565C0", size = "1em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <rect x="15" y="15" width="70" height="70" rx="12" ry="12" />
    <path
      d="M40,70 L40,30 L58,30 Q68,30 68,40 Q68,50 58,50 L48,50 L48,70 Z M48,42 L56,42 Q58,42 58,40 Q58,38 56,38 L48,38 Z"
      fill="white"
    />
  </svg>
);

const TotalFineIcon = ({ color = "#FF6F00", size = "1em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <g transform="translate(50,50) rotate(-20) translate(-50,-50)">
      <rect x="14" y="34" width="80" height="40" rx="6" ry="6" fill={color} opacity="0.6" />
      <rect x="6" y="26" width="80" height="40" rx="6" ry="6" fill={color} />
      <circle cx="6" cy="46" r="6" fill="white" />
      <circle cx="86" cy="46" r="6" fill="white" />
      <line x1="51" y1="26" x2="51" y2="66" stroke="white" strokeWidth="2.5" strokeDasharray="4,4" />
      <rect x="11" y="31" width="35" height="30" rx="3" ry="3" fill="white" opacity="0.9" />
    </g>
  </svg>
);

const FineIcon = ({ color = "#E53935", size = "1em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <g transform="translate(50,50) rotate(-40) translate(-50,-50)">
      <rect x="10" y="30" width="80" height="40" rx="6" ry="6" />
      <circle cx="10" cy="50" r="6" fill="white" />
      <circle cx="90" cy="50" r="6" fill="white" />
      <line x1="55" y1="30" x2="55" y2="70" stroke="white" strokeWidth="2.5" strokeDasharray="4,4" />
      <rect x="15" y="35" width="35" height="30" rx="3" ry="3" fill="white" />
    </g>
  </svg>
);

const ObstacleIcon = ({ color = "#f26322", size = "1em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <rect x="18" y="82" width="64" height="10" rx="5" ry="5" />
    <polygon points="25,82 75,82 65,62 35,62" />
    <polygon points="35,62 65,62 60,50 40,50" fill="white" />
    <polygon points="40,50 60,50 54,38 46,38" />
    <polygon points="46,38 54,38 51,30 49,30" fill="white" />
    <polygon points="49,30 51,30 56,20 44,20" />
    <ellipse cx="50" cy="20" rx="7" ry="5" />
  </svg>
);

const TowingIcon = ({ color = "#735fa9", size = "2.5em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 80"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <rect x="5" y="30" width="35" height="28" rx="5" ry="5" />
    <rect x="10" y="22" width="25" height="12" rx="6" ry="6" />
    <rect x="13" y="25" width="16" height="9" rx="3" ry="3" fill="white" opacity="0.9" />
    <rect x="38" y="42" width="55" height="16" rx="3" ry="3" />
    <polygon points="55,58 95,58 95,52 68,52" />
    <rect x="65" y="18" width="38" height="10" rx="4" ry="4" transform="rotate(-30,65,42)" />
    <rect x="62" y="30" width="12" height="24" rx="4" ry="4" />
    <circle cx="74" cy="32" r="9" fill={color} />
    <circle cx="74" cy="32" r="5" fill="white" />
    <path d="M88,22 Q96,22 96,30 Q96,36 90,36" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <circle cx="20" cy="62" r="11" fill={color} />
    <circle cx="20" cy="62" r="5" fill="white" />
    <circle cx="70" cy="62" r="11" fill={color} />
    <circle cx="70" cy="62" r="5" fill="white" />
  </svg>
);

const WarningIcon = ({ color = "#F9A825", size = "1em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 90"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <path d="M50,8 L92,80 Q94,86 88,86 L12,86 Q6,86 8,80 Z" strokeLinejoin="round" />
    <rect x="45" y="36" width="10" height="26" rx="5" ry="5" fill="white" />
    <circle cx="50" cy="71" r="6" fill="white" />
  </svg>
);

const InspectionIcon = ({ color = "#096dd9", size = "2.5em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <rect x="15" y="20" width="70" height="75" rx="6" ry="6" />
    <rect x="35" y="12" width="30" height="16" rx="8" ry="8" fill="white" />
    <rect x="25" y="45" width="50" height="6" rx="3" fill="white" opacity="0.85" />
    <rect x="25" y="58" width="40" height="6" rx="3" fill="white" opacity="0.85" />
    <rect x="25" y="71" width="30" height="6" rx="3" fill="white" opacity="0.85" />
  </svg>
);

const RoutineIcon = ({ color = "#34A853", size = "2.5em" }: { color?: string; size?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill={color}
    style={{ display: "inline-block", verticalAlign: "-0.125em" }}
  >
    <circle cx="50" cy="50" r="45" />
    <polyline
      points="28,52 44,68 72,36"
      fill="none"
      stroke="white"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const HRMSViewDrawer: React.FC<HRMSViewDrawerProps> = ({ open, onClose, record, statusLabels }) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const PERFORMANCE_ICON_FRAME = 34;
  const PERFORMANCE_ICON_SIZE = 30;

  const [finesExpanded, setFinesExpanded] = useState(false);

  const [fineDrawerOpen, setFineDrawerOpen] = React.useState(false);
  const [selectedFineId, setSelectedFineId] = React.useState<string | null>(null);
  const [selectedEntityCode, setSelectedEntityCode] = React.useState<string>("parking-inspection");
  const [fineData, setFineData] = React.useState<any>(null);

  const fetchedIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

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

  useEffect(() => {
    if (open && record) console.log("HRMSViewDrawer opened:", record.inspectorName);
  }, [open, record]);

  // Reset expansion when modal closes
  useEffect(() => {
    if (!open) setFinesExpanded(false);
  }, [open]);

  const openDrawerWithNewData = (inspectionGUID: string, entityCode: string) => {
    setFineData(null);
    setSelectedFineId(inspectionGUID);
    setSelectedEntityCode(entityCode || "parking-inspection");
    fetchedIdRef.current = inspectionGUID;
    isFetchingRef.current = true;
    setFineDrawerOpen(true);
  };

  const handleItemClick = useCallback(
    (item: any) => {
      if (!item) return;
      const inspectionGUID = item.inspectionGUID || item.id || item.inspectionId;
      if (!inspectionGUID) return;
      if (fineDrawerOpen) {
        setFineDrawerOpen(false);
        setTimeout(() => openDrawerWithNewData(inspectionGUID, item.entityCode), 100);
      } else {
        openDrawerWithNewData(inspectionGUID, item.entityCode);
      }
    },
    [fineDrawerOpen],
  );

  const handleFineDrawerClose = useCallback(() => setFineDrawerOpen(false), []);

  if (!record) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
      case "Checked Out":
        return "success";
      case "Checked In":
        return "processing";
      case "Absent":
        return "error";
      case "Leave":
        return "warning";
      default:
        return "default";
    }
  };

  const inspectorForMap =
    record.location?.lat && record.location?.lng
      ? [
          {
            id: record.inspectorId,
            name: record.inspectorName,
            nameAr: record.inspectorNameAr,
            lat: record.location.lat,
            lng: record.location.lng,
            status: record.status,
            statusAr: statusLabels[record.status],
            zone: record.location.zone,
          },
        ]
      : [];

  const renderPerformanceIcon = (icon: React.ReactNode, color: string) => {
    if (!React.isValidElement(icon)) return icon;
    const isImageIcon = typeof icon.type === "string" && icon.type === "img";
    const style = isImageIcon
      ? {
          width: PERFORMANCE_ICON_SIZE,
          height: PERFORMANCE_ICON_SIZE,
          objectFit: "contain" as const,
          display: "block",
          flexShrink: 0,
        }
      : { fontSize: PERFORMANCE_ICON_SIZE, color, display: "block", lineHeight: 1, flexShrink: 0 };
    return React.cloneElement(icon as React.ReactElement<any>, {
      style: { ...(icon.props?.style || {}), ...style },
    });
  };

  // Stat cell renderer
  const StatCell = ({
    stat,
    index,
    total,
    onClick,
    isActive,
    isChild,
  }: {
    stat: any;
    index: number;
    total: number;
    onClick?: () => void;
    isActive?: boolean;
    isChild?: boolean;
  }) => (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "14px 12px",
        borderRight: index < total - 1 ? "1px solid #e8e8e8" : "none",
        cursor: onClick ? "pointer" : "default",
        background: isActive ? "#fff7f0" : isChild ? "#fafafa" : "white",
        transition: "background 0.2s",
        position: "relative",
      }}
    >
      {/* left accent bar for child cells */}
      {isChild && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 2,
            background: stat.color,
            opacity: 0.5,
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: PERFORMANCE_ICON_FRAME,
            minWidth: PERFORMANCE_ICON_FRAME,
            color: stat.color,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {renderPerformanceIcon(stat.icon, stat.color)}
        </div>

        {/* Value + Label */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: 4 }}>
            {stat.value}
          </span>
          <span style={{ fontSize: 12, color: "#333", lineHeight: 1, whiteSpace: "nowrap" }}>{stat.label}</span>
        </div>

        {/* Expand indicator on Total Fines */}
        {onClick && (
          <CaretRightOutlined
            style={{
              fontSize: 10,
              color: stat.color,
              marginLeft: "auto",
              opacity: 0.7,
              transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );

  // Build the bar items
  const baseStats = [
    {
      label: t("form.obstacles") || "Obstacles",
      value: record.obstacles || 0,
      color: "#f26322",
      icon: <ObstacleIcon color="#f26322" size="3em" />,
    },
    {
      label: t("form.totaliinspections") || "Total Inspections",
      value: record.totalInspections || 0,
      color: "#096dd9",
      icon: <InspectionIcon color="#096dd9" size="3em" />,
    },
    {
      label: t("form.routineinspections") || "Routine Inspections",
      value: record.routineInspections || 0,
      color: "#34A853",
      icon: <RoutineIcon color="#34A853" size="3em" />,
    },
    {
      label: t("form.warninginspections") || "Warning Inspections",
      value: record.warningInspections || 0,
      color: "#c900b5",
      icon: <WarningIcon color="#c900b5" size="3em" />,
    },
  ];

  const totalFinesStat = {
    label: t("stats.totalFines") || "Total Fines",
    value: record.totalFinesIssued || 0,
    color: "#eb2630",
    icon: <TotalFineIcon color="#eb2630" size="3em" />,
  };

  const childFineStats = [
    {
      label: t("stats.vehicleFines") || "Vehicle Fines",
      value: record.vehicleFinesIssued || 0,
      color: "#E53935",
      icon: <FineIcon color="#E53935" size="3em" />,
    },
    {
      label: t("stats.parkingFines") || "Parking Fines",
      value: record.parkingFinesIssued || 0,
      color: "#29b6f6",
      icon: <ParkingFineIcon color="#29b6f6" size="3em" />,
    },
  ];

  const towingStat = {
    label: t("form.towingRequests") || "Towing Requests",
    value: record.towingRequests || 0,
    color: "#735fa9",
    icon: <TowingIcon color="#735fa9" size="3em" />,
  };

  const hasCheckedIn = Boolean(record.checkInTime);
  const formattedCheckInTime =
    record.checkInTime && dayjs(record.checkInTime).isValid()
      ? dayjs(record.checkInTime).format("DD MMM YYYY, hh:mm A")
      : record.checkInTime;

  const isDrawerLoading = isLoadingInspection || isFetchingInspection || (selectedFineId && !fineData);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={1600}
        footer={null}
        title={null}
        closable={false}
        style={{ top: 120 }}
        bodyStyle={{ padding: 0, maxHeight: "80vh", overflowY: "auto" }}
      >
        {/* ── Fixed Header ── */}
        <div
          style={{
            padding: 10,
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: token.colorBgContainer,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Title level={4} style={{ margin: 0, display: "inline" }}>
                {record.inspectorName}
                {record.displayNameAr && <Text style={{ fontWeight: 400, marginLeft: 8 }}>{record.displayNameAr}</Text>}
              </Title>
              {(record.zoneName || record.areaName) && (
                <div style={{ marginTop: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: "#0070ff" }}>
                    {[record.zoneName, record.areaName].filter(Boolean).join(" - ")}
                  </Text>
                </div>
              )}
            </div>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
          </div>
        </div>

        {/* ── Body ── */}
        <div>
          {/* Map + Details side by side */}
          <div style={{ display: "flex", alignItems: "stretch" }}>
            {/* LEFT: Map */}
            <div style={{ flex: 3, borderRight: "1px solid #e8e8e8" }}>
              <div style={{ background: "#f0f2f5", padding: 16 }}>
                {record.location?.lat && record.location?.lng ? (
                  <ArcGISMap
                    inspectors={inspectorForMap}
                    center={[record.location.lng, record.location.lat]}
                    obstacleLocations={record.obstacleLocations || []}
                    zoom={13}
                    height="500px"
                    inspectorPath={record.inspectorPath || []}
                    fineLocations={record.fineLocations || []}
                    parkingFineLocations={record.parkingFineLocations || []}
                    warningLocations={record.warningLocations || []}
                    routineLocations={record.routineLocations || []}
                    towingLocations={record.towingLocations || []}
                    showPath={true}
                    showFineLocations={true}
                    clickable={false}
                    onFineClick={handleItemClick}
                    onInspectionClick={handleItemClick}
                  />
                ) : (
                  <div
                    style={{
                      height: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "white",
                      borderRadius: 4,
                      border: "1px solid #e8e8e8",
                    }}
                  >
                    <span style={{ color: "#999" }}>No location data available</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Details */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ padding: 16, borderBottom: "1px solid #e8e8e8" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  {t("form.personaldetails") || "Basic Details"}
                </div>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t("form.InspectorName") || "Inspector Name"}>
                    {record.inspectorName}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.inspectorid") || t("common.noData")}>
                    {record.empNumber || t("common.noData")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.email") || t("common.noData")}>
                    {record.email || t("common.noData")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.mobile") || t("common.noData")}>
                    {record.mobile || t("common.noData")}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  {t("form.checkInLocation") || "Check In Details"}
                </div>
                <div
                  style={{
                    backgroundColor: hasCheckedIn ? "#f6ffed" : "#fff1f0",
                    border: `1px solid ${hasCheckedIn ? "#b7eb8f" : "#ffccc7"}`,
                    borderRadius: 4,
                    padding: 8,
                  }}
                >
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label={t("form.location") || "Zone"}>
                      {record.location?.zone || t("common.noData")}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.shift") || "Shift"}>
                      {record.shift || "Morning Shift"}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.checkInTime") || t("common.noData")}>
                      <Badge
                        status={getStatusBadge(record.status)}
                        text={
                          <span>
                            <CheckCircleOutlined style={{ marginRight: 4 }} />
                            {formattedCheckInTime || t("common.noData")}
                          </span>
                        }
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.checkOutTime") || t("common.noData")}>
                      {record.checkOutTime ? (
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {dayjs(record.checkOutTime).format("DD MMM YYYY, hh:mm A")}
                        </span>
                      ) : (
                        <span style={{ color: "#ff4d4f" }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {t("common.notCheckedOut") || t("common.noData")}
                        </span>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.status") || t("common.noData")}>
                      <Badge
                        status={getStatusBadge(record.status)}
                        text={statusLabels[record.status] || record.status}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </div>
            </div>
          </div>

          {/* ── Performance Bar ── */}
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #e8e8e8",
              background: "white",
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            {/* Base stats (Obstacles, Total Inspections, Routine, Warning) */}
            {baseStats.map((stat, i) => (
              <StatCell key={i} stat={stat} index={i} total={baseStats.length + 1 + (finesExpanded ? 2 : 0) + 1} />
            ))}

            {/* Total Fines — clickable toggle */}
            <StatCell
              stat={totalFinesStat}
              index={baseStats.length}
              total={baseStats.length + 1 + (finesExpanded ? 2 : 0) + 1}
              onClick={() => setFinesExpanded((v) => !v)}
              isActive={finesExpanded}
            />

            {/* Expandable: Vehicle Fines + Parking Fines */}
            <div
              style={{
                display: "flex",
                overflow: "hidden",
                maxWidth: finesExpanded ? 600 : 0,
                opacity: finesExpanded ? 1 : 0,
                transition: "max-width 0.3s ease, opacity 0.25s ease",
                flexShrink: 0,
              }}
            >
              {childFineStats.map((stat, i) => (
                <StatCell key={i} stat={stat} index={i} total={childFineStats.length} isChild />
              ))}
            </div>

            {/* Towing */}
            <StatCell stat={towingStat} index={0} total={1} />
          </div>
        </div>
      </Modal>

      <FinesViewDrawer
        open={fineDrawerOpen}
        onClose={handleFineDrawerClose}
        fine={fineData}
        isLoading={isDrawerLoading}
        readOnly
      />
    </>
  );
};

export default HRMSViewDrawer;
