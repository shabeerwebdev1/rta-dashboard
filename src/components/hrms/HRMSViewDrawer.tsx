/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useCallback, useState, useRef } from "react";
import { Modal, Descriptions, Badge, Spin } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, AuditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PageConfig } from "../../types/config";
import ArcGISMap from "../common/ArcGISMap";
import FinesViewDrawer from "../fines/FinesViewDrawer";
import { useGetInspectionByIdQuery, useGetViolationDetailsQuery } from "../../services/rtkApiFactory";
import dayjs from "dayjs";

const StartPin = () => (
  <svg width="22" height="22" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#00C853" stroke="white" strokeWidth="2.5" />
    <polygon points="16,13 30,20 16,27" fill="white" />
  </svg>
);

interface LegendRowProps {
  icon: React.ReactNode;
  label: string;
}

const LegendRow: React.FC<LegendRowProps> = ({ icon, label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "5px 0",
      borderBottom: "1px solid rgba(0,0,0,0.04)",
    }}
  >
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</div>
    <span style={{ fontSize: 12, color: "#444", flex: 1, fontWeight: 500 }}>{label}</span>
  </div>
);

interface HRMSViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  statusLabels: Record<string, string>;
}

const HRMSViewDrawer: React.FC<HRMSViewDrawerProps> = ({ open, onClose, record, statusLabels }) => {
  const { t } = useTranslation();
  const [legendOpen, setLegendOpen] = React.useState(false);

  // ── FinesViewDrawer state ──────────────────────────────────────────────
  const [fineDrawerOpen, setFineDrawerOpen] = React.useState(false);
  const [selectedFineId, setSelectedFineId] = React.useState<string | null>(null);
  const [selectedEntityCode, setSelectedEntityCode] = React.useState<string>("parking-inspection");
  const [fineData, setFineData] = React.useState<any>(null);

  // Use refs to track if we've fetched data for current ID
  const fetchedIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Fetch inspection data when selectedFineId changes
  const {
    data: inspectionData,
    isLoading: isLoadingInspection,
    isFetching: isFetchingInspection,
  } = useGetInspectionByIdQuery(selectedFineId as string, {
    skip: !selectedFineId,
  });

  // Fetch violation details when we have inspection data
  const {
    data: violationDetails,
    isLoading: isLoadingViolations,
    isFetching: isFetchingViolations,
  } = useGetViolationDetailsQuery(
    {
      inspectionGUID: selectedFineId as string,
      entityCode: selectedEntityCode,
    },
    {
      skip: !selectedFineId,
    },
  );

  // Combine data when both queries are ready - but only for the current ID
  useEffect(() => {
    if (selectedFineId && inspectionData && !isFetchingInspection && !isLoadingInspection) {
      // Only process if this is the current ID we're expecting
      if (fetchedIdRef.current === selectedFineId && isFetchingRef.current) {
        const combinedData = {
          ...inspectionData,
          violationDetails: violationDetails || [],
        };
        setFineData(combinedData);
        isFetchingRef.current = false;
        console.log("✅ Data loaded and set for:", selectedFineId);
      }
    }
  }, [inspectionData, violationDetails, isLoadingInspection, isFetchingInspection, selectedFineId]);

  // Reset when drawer closes
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

  // Handle fine/inspection click - uses refs to ensure multiple clicks work
  const handleItemClick = useCallback(
    (item: any) => {
      console.log("🟢 handleItemClick called with:", item);

      if (!item) {
        console.error("No item provided to handleItemClick");
        return;
      }

      // Get the inspection GUID
      const inspectionGUID = item.inspectionGUID || item.id || item.inspectionId;

      if (!inspectionGUID) {
        console.error("No inspectionGUID found in item:", item);
        return;
      }

      // Close existing drawer if open
      if (fineDrawerOpen) {
        setFineDrawerOpen(false);
        // Small delay to allow cleanup
        setTimeout(() => {
          openDrawerWithNewData(inspectionGUID, item.entityCode);
        }, 100);
      } else {
        openDrawerWithNewData(inspectionGUID, item.entityCode);
      }
    },
    [fineDrawerOpen],
  );

  const openDrawerWithNewData = (inspectionGUID: string, entityCode: string) => {
    console.log("📦 Fetching inspection details for GUID:", inspectionGUID);

    // Reset data first
    setFineData(null);
    setSelectedFineId(inspectionGUID);
    setSelectedEntityCode(entityCode || "parking-inspection");

    // Track this fetch
    fetchedIdRef.current = inspectionGUID;
    isFetchingRef.current = true;

    // Open the drawer
    setFineDrawerOpen(true);
  };

  const handleFineDrawerClose = useCallback(() => {
    setFineDrawerOpen(false);
  }, []);

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

  const performanceStats = [
    {
      label: t("form.obstacles") || "Obstacles",
      value: record.obstacles || 0,
      color: "#F57C00",
      icon: <img src="/images/obstacle.png" alt="Obstacles" style={{ width: 36, height: 36, objectFit: "contain" }} />,
    },
    {
      label: t("form.totaliinspections") || "Total",
      value: record.totalInspections || 0,
      color: "#096dd9",
      icon: <AuditOutlined />,
    },
    {
      label: t("form.routineinspections") || "Routine",
      value: record.routineInspections || 0,
      color: "#34A853",
      icon: <CheckCircleOutlined />,
    },
    {
      label: t("form.warninginspections") || "Warnings",
      value: record.warningInspections || 0,
      color: "#F9A825",
      icon: <img src="/images/warning.png" alt="Warnings" style={{ width: 36, height: 36, objectFit: "contain" }} />,
    },
    {
      label: t("stats.totalFines") || "Fines",
      value: record.finesIssued || 0,
      color: "#E53935",
      icon: <img src="/images/fine.png" alt="Fines" style={{ width: 36, height: 36, objectFit: "contain" }} />,
    },
    {
      label: t("form.towingRequests") || "Towing",
      value: record.towingRequests || 0,
      color: "#7B1FA2",
      icon: <img src="/images/towing.png" alt="Towing" style={{ width: 36, height: 36, objectFit: "contain" }} />,
    },
  ];

  const hasCheckedIn = Boolean(record.checkInTime);
  const checkInPanelBackground = hasCheckedIn ? "#f6ffed" : "#fff1f0";
  const checkInPanelBorder = hasCheckedIn ? "#b7eb8f" : "#ffccc7";
  const formattedCheckInTime =
    record.checkInTime && dayjs(record.checkInTime).isValid()
      ? dayjs(record.checkInTime).format("DD MMM YYYY, hh:mm A")
      : record.checkInTime;

  // Calculate loading state
  const isDrawerLoading = isLoadingInspection || isFetchingInspection || (selectedFineId && !fineData);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={1400}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 40 }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                {record.inspectorName} {record.inspectorNameAr && ` - ${record.inspectorNameAr}`}
              </span>
              <div style={{ fontSize: 12, color: "#666", fontWeight: "normal", marginTop: 4, display: "flex", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#0070ff" }}>{record.zoneName}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#0070ff" }}>-</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#0070ff" }}>{record.areaName}</span>
              </div>
            </div>
          </div>
        }
        footer={null}
        centered
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
        className="hrms-modal"
      >
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {/* LEFT: Map + Performance bar */}
          <div style={{ flex: 3, borderRight: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", background: "#f0f2f5", padding: 16, flex: 1 }}>
              {record.location?.lat && record.location?.lng ? (
                <>
                  <ArcGISMap
                    inspectors={inspectorForMap}
                    center={[record.location.lng, record.location.lat]}
                    obstacleLocations={record.obstacleLocations || []}
                    zoom={13}
                    height="500px"
                    inspectorPath={record.inspectorPath || []}
                    fineLocations={record.fineLocations || []}
                    warningLocations={record.warningLocations || []}
                    routineLocations={record.routineLocations || []}
                    towingLocations={record.towingLocations || []}
                    showPath={true}
                    showFineLocations={true}
                    clickable={false}
                    onFineClick={handleItemClick}
                    onInspectionClick={handleItemClick}
                  />

                  {/* Map Legend */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 35,
                      right: 28,
                      background: "rgba(255,255,255,0.97)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      zIndex: 10,
                      minWidth: 220,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setLegendOpen((prev) => !prev)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: legendOpen ? "1px solid #f0f0f0" : "none",
                        userSelect: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1a1a2e",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {t("form.MapLegend") || "Map Legend"}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#888",
                          display: "inline-block",
                          transform: legendOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                          marginLeft: 8,
                        }}
                      >
                        ▼
                      </span>
                    </div>
                    {legendOpen && (
                      <div style={{ padding: "8px 14px 10px" }}>
                        <LegendRow icon={<StartPin />} label={t("form.StartPoint") || "Start Point"} />
                        <LegendRow
                          icon={
                            <div
                              style={{
                                width: 22,
                                height: 3,
                                background: "linear-gradient(90deg,#0070ff,#40a9ff)",
                                borderRadius: 2,
                              }}
                            />
                          }
                          label={t("form.InspectorPath") || "Inspector Path"}
                        />
                        <LegendRow
                          icon={
                            <img
                              src="/images/icon_Routine.svg"
                              width={24}
                              height={24}
                              style={{ borderRadius: "50%" }}
                            />
                          }
                          label={t("form.RoutineLocations") || "Routine"}
                        />
                        <LegendRow
                          icon={
                            <img
                              src="/images/icon_Warning.svg"
                              width={24}
                              height={24}
                              style={{ borderRadius: "50%" }}
                            />
                          }
                          label={t("form.WarningLocations") || "Warning"}
                        />
                        <LegendRow
                          icon={
                            <img src="/images/icon_fine.svg" width={24} height={24} style={{ borderRadius: "50%" }} />
                          }
                          label={t("form.FineLocations") || "Fine Issued"}
                        />
                        <LegendRow
                          icon={
                            <img src="/images/icon_Towing.svg" width={24} height={24} style={{ borderRadius: "50%" }} />
                          }
                          label={t("form.TowingLocations") || "Towing"}
                        />
                        <LegendRow
                          icon={
                            <img
                              src="/images/icon_Obstacle.svg"
                              width={24}
                              height={24}
                              style={{ borderRadius: "50%" }}
                            />
                          }
                          label={"Obstacle"}
                        />
                        <LegendRow
                          icon={<img src="/images/icon1.png" width={24} height={24} style={{ borderRadius: "50%" }} />}
                          label={t("form.CurrentLocation") || "Inspector"}
                        />
                      </div>
                    )}
                  </div>
                </>
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

            {/* Performance bar */}
            <div style={{ display: "flex", borderTop: "1px solid #e8e8e8", background: "white" }}>
              {performanceStats.map((stat, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "16px 8px",
                    borderRight: index < performanceStats.length - 1 ? "1px solid #e8e8e8" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 26,
                        height: 26,
                        fontSize: 26,
                        color: stat.color,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {stat.icon}
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                      {stat.value}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, color: "#080101" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Details column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "80vh" }}>
            <div style={{ padding: 16, borderBottom: "1px solid #e8e8e8" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                {t("form.personaldetails") || "Basic Details"}
              </div>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={t("form.InspectorName") || "Inspector Name"}>
                  {record.inspectorName}
                </Descriptions.Item>
                <Descriptions.Item label={t("form.email") || "Email"}>{record.email || "No data"}</Descriptions.Item>
                <Descriptions.Item label={t("form.mobile") || "Mobile"}>{record.mobile || "No data"}</Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                {t("form.checkInLocation") || "Check In Details"}
              </div>
              <div
                style={{
                  backgroundColor: checkInPanelBackground,
                  border: `1px solid ${checkInPanelBorder}`,
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t("form.location") || "Zone"}>
                    {record.location?.zone || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.shift") || "Shift"}>
                    {record.shift || "Morning Shift"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.checkInTime") || "Check In Time"}>
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
                  <Descriptions.Item label={t("form.checkOutTime") || "Check Out Time"}>
                    {record.checkOutTime ? (
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(record.checkOutTime).format("DD MMM YYYY, hh:mm A")}
                      </span>
                    ) : (
                      <span style={{ color: "#ff4d4f" }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {t("common.notCheckedOut") || "Not Checked Out"}
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.status") || "Status"}>
                    <Badge status={getStatusBadge(record.status)} text={statusLabels[record.status] || record.status} />
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* FinesViewDrawer with loading state */}
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
