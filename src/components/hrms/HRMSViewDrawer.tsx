/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { Modal, Descriptions, Badge } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  AuditOutlined,
  WarningOutlined,
  FileExclamationOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PageConfig } from "../../types/config";
import ArcGISMap from "../common/ArcGISMap";
import dayjs from "dayjs";

// ─── Inline SVG Icon Components ───────────────────────────────────────────────

const RoutineIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)" />
    <path
      d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
      fill="#34A853"
      stroke="#27843f"
      strokeWidth="1.2"
    />
    <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)" />
    <circle cx="24" cy="19" r="11" fill="white" opacity="0.97" />
    <polyline
      points="17,19 22,25 32,13"
      fill="none"
      stroke="#34A853"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WarningIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)" />
    <path
      d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
      fill="#F9A825"
      stroke="#c97d00"
      strokeWidth="1.2"
    />
    <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)" />
    <circle cx="24" cy="19" r="11" fill="white" opacity="0.97" />
    <polygon points="24,10 33,27 15,27" fill="none" stroke="#F9A825" strokeWidth="2.4" strokeLinejoin="round" />
    <line x1="24" y1="15" x2="24" y2="22" stroke="#F9A825" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="24" cy="25" r="1.3" fill="#F9A825" />
  </svg>
);

const FineIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)" />
    <path
      d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
      fill="#E53935"
      stroke="#b71c1c"
      strokeWidth="1.2"
    />
    <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)" />
    <circle cx="24" cy="19" r="11" fill="white" opacity="0.97" />
    <rect x="18.5" y="11" width="11" height="14" rx="1.6" fill="none" stroke="#E53935" strokeWidth="2" />
    <path d="M26,11 L29.5,14.5 L26,14.5 Z" fill="#E53935" opacity="0.35" />
    <line x1="20.5" y1="17" x2="27.5" y2="17" stroke="#E53935" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="20.5" y1="20" x2="27.5" y2="20" stroke="#E53935" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="20.5" y1="23" x2="25" y2="23" stroke="#E53935" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TowingIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)" />
    <path
      d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
      fill="#1565C0"
      stroke="#0d47a1"
      strokeWidth="1.2"
    />
    <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)" />
    <circle cx="24" cy="19" r="11" fill="white" opacity="0.97" />
    <rect x="27" y="15.5" width="6" height="5" rx="1.1" fill="#1565C0" />
    <rect x="28.1" y="16.4" width="2.6" height="2.6" rx="0.5" fill="white" opacity="0.9" />
    <rect x="15.5" y="17.5" width="11.5" height="3.2" rx="0.8" fill="#1565C0" />
    <line x1="18.5" y1="17.5" x2="18.5" y2="13" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
    <line x1="18.5" y1="13" x2="23.5" y2="13" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
    <path d="M23.5,13 Q25.5,13 25.5,15.5" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
    <circle cx="18.5" cy="22" r="2" fill="#1565C0" stroke="white" strokeWidth="1" />
    <circle cx="29" cy="22" r="2" fill="#1565C0" stroke="white" strokeWidth="1" />
  </svg>
);

const ObstacleIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)" />
    <path
      d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
      fill="#F57C00"
      stroke="#bf360c"
      strokeWidth="1.2"
    />
    <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)" />
    <circle cx="24" cy="19" r="11" fill="white" opacity="0.97" />
    <polygon points="24,10 29.5,27 18.5,27" fill="#F57C00" />
    <polygon points="22.5,15.5 25.5,15.5 26.7,18.8 21.3,18.8" fill="white" opacity="0.9" />
    <polygon points="21,21.5 27,21.5 27.8,24.5 20.2,24.5" fill="white" opacity="0.9" />
    <rect x="17.5" y="27" width="13" height="2.3" rx="1.1" fill="#F57C00" />
  </svg>
);

const StartPin = () => (
  <svg width="22" height="22" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#00C853" stroke="white" strokeWidth="2.5" />
    <polygon points="16,13 30,20 16,27" fill="white" />
  </svg>
);

const InspectorPin = () => (
  <svg width="22" height="22" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="21" fill="#0070FF" stroke="white" strokeWidth="2.5" />
    <circle cx="22" cy="16" r="6" fill="white" />
    <path d="M10 38 Q10 28 22 28 Q34 28 34 38" fill="white" />
  </svg>
);

// ─── Legend row helper ────────────────────────────────────────────────────────
interface LegendRowProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  countColor?: string;
}

const LegendRow: React.FC<LegendRowProps> = ({ icon, label, count, countColor }) => (
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
    {count !== undefined && (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: countColor || "#666",
          background: `${countColor}18` || "#f5f5f5",
          borderRadius: 10,
          padding: "1px 7px",
          minWidth: 22,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    )}
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface HRMSViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  statusLabels: Record<string, string>;
}

// ─── Component ────────────────────────────────────────────────────────────────
const HRMSViewDrawer: React.FC<HRMSViewDrawerProps> = ({ open, onClose, record, statusLabels }) => {
  const { t, i18n } = useTranslation();

  // Legend collapsed by default
  const [legendOpen, setLegendOpen] = React.useState(false);

  useEffect(() => {
    if (open && record) {
      console.log("HRMSViewDrawer opened:", record.inspectorName);
    }
  }, [open, record]);

  if (!record) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return "success";
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
      icon: <WarningOutlined />,
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
      icon: <FileExclamationOutlined />,
    },
    {
      label: t("stats.totalFines") || "Fines",
      value: record.finesIssued || 0,
      color: "#E53935",
      icon: <SafetyOutlined />,
    },
    {
      label: t("form.towingRequests") || "Towing",
      value: record.towingRequests || 0,
      color: "#7B1FA2",
      icon: <CarOutlined />,
    },
  ];

  const pathCount = record.inspectorPath?.length || 0;
  const fineCount = record.fineLocations?.length || 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1400}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 40 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {record.inspectorName} ({record.inspectorId}){record.inspectorNameAr && ` - ${record.inspectorNameAr}`}
            </span>
            {/* <div style={{ fontSize: 12, color: "#666", fontWeight: "normal", marginTop: 4, display: "flex", gap: 12 }}>
              {pathCount > 0 && <span style={{ color: "#0070ff" }}>● {pathCount} path points</span>}
              {fineCount > 0 && <span style={{ color: "#E53935" }}>● {fineCount} fines issued</span>}
            </div> */}
          </div>
        </div>
      }
      footer={null}
      centered
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
      className="hrms-modal"
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* ── LEFT: Map + Performance bar ───────────────────────────────────── */}
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
                />

                {/* ── Collapsible Map Legend ─────────────────────────────── */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 35,
                    right: 28,
                    background: "rgba(255,255,255,0.97)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 12,
                    zIndex: 10,
                    minWidth: 190,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
                    backdropFilter: "blur(8px)",
                    overflow: "hidden",
                  }}
                >
                  {/* Header — always visible, click to toggle */}
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
                    {/* Chevron rotates when open */}
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

                  {/* Collapsible body — hidden by default */}
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
                      <LegendRow icon={<RoutineIcon size={22} />} label={t("form.RoutineLocations") || "Routine"} />
                      <LegendRow icon={<WarningIcon size={22} />} label={t("form.WarningLocations") || "Warning"} />
                      <LegendRow icon={<FineIcon size={22} />} label={t("form.FineLocations") || "Fine Issued"} />
                      <LegendRow icon={<TowingIcon size={22} />} label={t("form.TowingLocations") || "Towing"} />
                      <LegendRow icon={<ObstacleIcon size={22} />} label={"Obstacle"} />
                      <LegendRow
                        icon={
                          <img
                            src="/images/inspector-avatar.png"
                            width={22}
                            height={22}
                            style={{ borderRadius: "50%" }}
                          />
                        }
                        label={t("form.CurrentLocation") || "Inspector"}
                      />{" "}
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

          {/* ── Performance bar ────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #e8e8e8",
              background: "white",
            }}
          >
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
                {/* Icon + Count */}
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
                      fontSize: 22,
                      color: stat.color,
                      lineHeight: 1,
                    }}
                  >
                    {stat.icon}
                  </span>

                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: stat.color,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </span>
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: 14,
                    color: "#080101",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Details column ──────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "80vh" }}>
          {/* Basic Details */}
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

          {/* Check In Details */}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              {t("form.checkInLocation") || "Check In Details"}
            </div>
            <div
              style={{
                backgroundColor: record.status === "Present" ? "#f6ffed" : "#fff1f0",
                border: `1px solid ${record.status === "Present" ? "#b7eb8f" : "#ffccc7"}`,
                borderRadius: 4,
                padding: 8,
              }}
            >
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={t("form.zone") || "Zone"}>{record.location?.zone || "N/A"}</Descriptions.Item>
                <Descriptions.Item label={t("form.shift") || "Shift"}>
                  {record.shift || "Morning Shift"}
                </Descriptions.Item>
                <Descriptions.Item label={t("form.checkInTime") || "Check In Time"}>
                  <Badge
                    status={getStatusBadge(record.status)}
                    text={
                      <span>
                        <CheckCircleOutlined style={{ marginRight: 4 }} />
                        {record.checkInTime}
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
                {/* <Descriptions.Item label={t("form.supervisorName") || "Supervisor"}>
                  {record.supervisorName}
                </Descriptions.Item> */}
                <Descriptions.Item label={t("form.status") || "Status"}>
                  <Badge status={getStatusBadge(record.status)} text={statusLabels[record.status] || record.status} />
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HRMSViewDrawer;
