// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import React, { useEffect } from "react";
// import { Modal, Descriptions, Card, Row, Col, Badge } from "antd";
// import { useTranslation } from "react-i18next";
// import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
// import type { PageConfig } from "../../types/config";
// import ArcGISMap from "../common/ArcGISMap";
// import { formatDateDisplay } from "../../utils/dateFormatter";

// interface HRMSViewDrawerProps {
//   open: boolean;
//   onClose: () => void;
//   record: Record<string, any> | null;
//   config: PageConfig;
//   onShare: () => void;
//   statusLabels: Record<string, string>;
// }

// const HRMSViewDrawer: React.FC<HRMSViewDrawerProps> = ({ open, onClose, record, statusLabels }) => {
//   const { t, i18n } = useTranslation();

//   useEffect(() => {
//     if (open && record) {
//       console.log("=== HRMSViewDrawer Debug ===");
//       console.log("Full Record:", record);
//       console.log("Inspector Path:", record.inspectorPath);
//       console.log("Path Length:", record.inspectorPath?.length);
//       console.log("Fine Locations:", record.fineLocations);
//       console.log("Fines Count:", record.fineLocations?.length);
//       console.log("Location:", record.location);
//       console.log("Has path data:", !!record.inspectorPath && record.inspectorPath.length > 0);
//       console.log("Has fine data:", !!record.fineLocations && record.fineLocations.length > 0);
//     }
//   }, [open, record]);

//   if (!record) return null;

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "Present":
//         return "success";
//       case "Absent":
//         return "error";
//       case "Leave":
//         return "warning";
//       default:
//         return "default";
//     }
//   };

//   // Prepare inspector data for ArcGIS map
//   const inspectorForMap =
//     record.location && record.location.lat && record.location.lng
//       ? [
//           {
//             id: record.inspectorId,
//             name: record.inspectorName,
//             nameAr: record.inspectorNameAr,
//             lat: record.location.lat,
//             lng: record.location.lng,
//             status: record.status,
//             statusAr: statusLabels[record.status],
//             zone: record.location.zone,
//           },
//         ]
//       : [];

//   const performanceStats = [
//     {
//       label: t("form.obstacles") || "Obstacles",
//       value: record.obstacles || 0,
//       color: "#3f8600",
//       prefix: "🚧",
//     },
//     {
//       label: t("form.totaliinspections") || "Total Inspections",
//       value: record.obstacles || 0,
//       color: "#3f8600",
//       prefix: "🔍",
//     },
//     {
//       label: t("form.routineinspections") || "Routine Inspections",
//       value: record.obstacles || 0,
//       color: "#3f8600",
//       prefix: "✅",
//     },
//     {
//       label: t("form.warninginspections") || "Warning Inspections",
//       value: record.obstacles || 0,
//       color: "#3f8600",
//       prefix: "⚠️",
//     },
//     {
//       label: t("form.finesIssued") || "Fines Issued",
//       value: record.finesIssued || 0,
//       color: "#cf1322",
//       prefix: "",
//     },
//     {
//       label: t("form.towingRequests") || "Towing Requests",
//       value: record.towingRequests || 0,
//       color: "#1890ff",
//       prefix: "🚗",
//     },
//     // {
//     //   label: t("form.leaveRequested") || "Leave Requested",
//     //   value: record.leaveRequested || 0,
//     //   color: "#722ed1",
//     //   prefix: "📝",
//     // },
//   ];

//   console.log("=== Passing to ArcGISMap ===");
//   console.log("Inspectors:", inspectorForMap);
//   console.log("Inspector Path being passed:", record.inspectorPath || []);
//   console.log("Fine Locations being passed:", record.fineLocations || []);

//   return (
//     <Modal
//       open={open}
//       onCancel={onClose}
//       width={1400}
//       title={
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "40px" }}>
//           <div>
//             <span style={{ fontSize: "16px", fontWeight: 600 }}>
//               {record.inspectorName} ({record.inspectorId}){record.inspectorNameAr && ` - ${record.inspectorNameAr}`}
//             </span>
//             <div style={{ fontSize: "12px", color: "#666", fontWeight: "normal", marginTop: 4 }}>
//               {record.inspectorPath && record.inspectorPath.length > 0 && (
//                 <span style={{ color: "#1890ff" }}>• {record.inspectorPath.length} path points</span>
//               )}
//               {record.fineLocations && record.fineLocations.length > 0 && (
//                 <span style={{ color: "#cf1322", marginLeft: 12 }}>• {record.fineLocations.length} fines issued</span>
//               )}
//             </div>
//           </div>
//         </div>
//       }
//       footer={null}
//       centered
//       bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
//       className="hrms-modal"
//     >
//       {/* ── BODY: map col (3/4) + details col (1/4) side by side ── */}
//       <div style={{ display: "flex", alignItems: "stretch" }}>
//         {/* ── LEFT: MAP COLUMN (3/4 width) ── */}
//         <div style={{ flex: 3, borderRight: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
//           {/* Map area */}
//           <div style={{ position: "relative", background: "#f5f5f5", padding: "16px", flex: 1 }}>
//             {record.location && record.location.lat && record.location.lng ? (
//               <>
//                 <ArcGISMap
//                   inspectors={inspectorForMap}
//                   center={[record.location.lng, record.location.lat]}
//                   zoom={13}
//                   height="500px"
//                   inspectorPath={record.inspectorPath || []}
//                   fineLocations={record.fineLocations || []}
//                   showPath={true}
//                   showFineLocations={true}
//                   clickable={false}
//                 />

//                 {/* ── MAP LEGEND — overlaid top-right inside map ── */}
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: 28,
//                     right: 28,
//                     background: "rgba(255, 255, 255, 0.93)",
//                     border: "1px solid #e8e8e8",
//                     borderRadius: 4,
//                     padding: "10px 12px",
//                     fontSize: 12,
//                     zIndex: 10,
//                     minWidth: 148,
//                     boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
//                   }}
//                 >
//                   <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 8 }}>{t("form.MapLegend")}</div>

//                   {/* Start point */}
//                   <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
//                     <div
//                       style={{
//                         width: 14,
//                         height: 14,
//                         background: "#00ff00",
//                         borderRadius: "50%",
//                         border: "2px solid white",
//                         boxShadow: "0 0 3px rgba(0,0,0,0.3)",
//                         flexShrink: 0,
//                       }}
//                     />
//                     <span>{t("form.StartPoint")}</span>
//                   </div>

//                   {/* Inspector path */}
//                   <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
//                     <div style={{ width: 22, height: 3, background: "#0070ff", flexShrink: 0 }} />
//                     <span>{t("form.InspectorPath")}</span>
//                   </div>

//                   {/* Fine locations */}
//                   <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
//                     <div
//                       style={{
//                         width: 14,
//                         height: 14,
//                         background: "#ff0000",
//                         borderRadius: "50%",
//                         flexShrink: 0,
//                       }}
//                     />
//                     <span>{t("form.FineLocations")}</span>
//                   </div>

//                   {/* Current location */}
//                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                     <img
//                       src="/images/Inspector.png"
//                       alt="Inspector"
//                       style={{ width: 18, height: 18, flexShrink: 0 }}
//                       onError={(e) => {
//                         (e.currentTarget as HTMLImageElement).style.display = "none";
//                       }}
//                     />
//                     <span>{t("form.CurrentLocation")}</span>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div
//                 style={{
//                   height: "500px",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   background: "white",
//                   borderRadius: "4px",
//                   border: "1px solid #e8e8e8",
//                 }}
//               >
//                 <span style={{ color: "#999" }}>No location data available</span>
//               </div>
//             )}
//           </div>

//           {/* ── PERFORMANCE BAR — horizontal, below map ── */}
//           <div
//             style={{
//               display: "flex",
//               borderTop: "1px solid #e8e8e8",
//               background: "white",
//             }}
//           >
//             {performanceStats.map((stat, index) => (
//               <div
//                 key={index}
//                 style={{
//                   flex: 1,
//                   textAlign: "center",
//                   padding: "14px 8px",
//                   borderRight: index < performanceStats.length - 1 ? "1px solid #e8e8e8" : "none",
//                 }}
//               >
//                 <div style={{ fontSize: 22, fontWeight: 500, color: stat.color, lineHeight: 1.2 }}>
//                   {stat.prefix}
//                   {stat.value}
//                 </div>
//                 <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── RIGHT: DETAILS COLUMN (1/4 width) ── */}
//         <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "80vh" }}>
//           {/* Basic Details */}
//           <div style={{ padding: "16px", borderBottom: "1px solid #e8e8e8" }}>
//             <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 10 }}>
//               {t("form.personaldetails") || "Basic Details"}
//             </div>
//             <Descriptions bordered column={1} size="small">
//               <Descriptions.Item label={t("form.inspectorId") || "Inspector ID"}>
//                 {record.inspectorId}
//               </Descriptions.Item>
//               <Descriptions.Item label={t("form.email") || "Email"}>{record.email || "N/A"}</Descriptions.Item>
//               <Descriptions.Item label={t("form.mobile") || "Mobile Number"}>
//                 {record.mobile || "N/A"}
//               </Descriptions.Item>
//               <Descriptions.Item label={t("form.supervisorName") || "Supervisor"}>
//                 {record.supervisorName}
//               </Descriptions.Item>
//               <Descriptions.Item label={t("form.date") || "Date"}>
//                 {formatDateDisplay(record.date, i18n.language)}
//               </Descriptions.Item>
//             </Descriptions>
//           </div>

//           {/* Check In Details */}
//           <div style={{ padding: "16px" }}>
//             <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 10 }}>
//               {t("form.checkInLocation") || "Check In Details"}
//             </div>
//             <div
//               style={{
//                 backgroundColor: record.status === "Present" ? "#f6ffed" : "#fff1f0",
//                 border: `1px solid ${record.status === "Present" ? "#b7eb8f" : "#ffccc7"}`,
//                 borderRadius: 4,
//                 padding: 8,
//               }}
//             >
//               <Descriptions bordered column={1} size="small">
//                 <Descriptions.Item label={t("form.zone") || "Zone"}>{record.location?.zone || "N/A"}</Descriptions.Item>
//                 <Descriptions.Item label={t("form.shift") || "Shift"}>
//                   {record.shift || "Morning Shift"}
//                 </Descriptions.Item>
//                 <Descriptions.Item label={t("form.checkInTime") || "Check In Time"}>
//                   <Badge
//                     status={getStatusBadge(record.status)}
//                     text={
//                       <span>
//                         <CheckCircleOutlined style={{ marginRight: 4 }} />
//                         {record.checkInTime}
//                       </span>
//                     }
//                   />
//                 </Descriptions.Item>
//                 <Descriptions.Item label={t("form.checkOutTime") || "Check Out Time"}>
//                   {record.checkOutTime ? (
//                     <span>
//                       <ClockCircleOutlined style={{ marginRight: 4 }} />
//                       {record.checkOutTime}
//                     </span>
//                   ) : (
//                     <span style={{ color: "#ff4d4f" }}>
//                       <ClockCircleOutlined style={{ marginRight: 4 }} />
//                       {t("common.notCheckedOut") || "Not Checked Out"}
//                     </span>
//                   )}
//                 </Descriptions.Item>
//                 <Descriptions.Item label={t("form.status") || "Status"}>
//                   <Badge status={getStatusBadge(record.status)} text={statusLabels[record.status] || record.status} />
//                 </Descriptions.Item>
//               </Descriptions>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default HRMSViewDrawer;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { Modal, Descriptions, Card, Row, Col, Badge } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  AuditOutlined,
  WarningOutlined,
  FileExclamationOutlined,
  CarOutlined,
  AimOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PageConfig } from "../../types/config";
import ArcGISMap from "../common/ArcGISMap";
import { formatDateDisplay } from "../../utils/dateFormatter";

interface HRMSViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  statusLabels: Record<string, string>;
}

const HRMSViewDrawer: React.FC<HRMSViewDrawerProps> = ({ open, onClose, record, statusLabels }) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (open && record) {
      console.log("=== HRMSViewDrawer Debug ===");
      console.log("Full Record:", record);
      console.log("Inspector Path:", record.inspectorPath);
      console.log("Path Length:", record.inspectorPath?.length);
      console.log("Fine Locations:", record.fineLocations);
      console.log("Fines Count:", record.fineLocations?.length);
      console.log("Location:", record.location);
      console.log("Has path data:", !!record.inspectorPath && record.inspectorPath.length > 0);
      console.log("Has fine data:", !!record.fineLocations && record.fineLocations.length > 0);
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

  // Prepare inspector data for ArcGIS map
  const inspectorForMap =
    record.location && record.location.lat && record.location.lng
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
      color: "#d46b08",
      icon: <WarningOutlined />,
    },
    {
      label: t("form.totaliinspections") || "Total Inspections",
      value: record.totalInspections || 0,
      color: "#096dd9",
      icon: <AuditOutlined />,
    },
    {
      label: t("form.routineinspections") || "Routine Inspections",
      value: record.routineInspections || 0,
      color: "#389e0d",
      icon: <CheckCircleOutlined />,
    },
    {
      label: t("form.warninginspections") || "Warning Inspections",
      value: record.warningInspections || 0,
      color: "#d4380d",
      icon: <FileExclamationOutlined />,
    },
    {
      label: t("form.finesIssued") || "Fines Issued",
      value: record.finesIssued || 0,
      color: "#cf1322",
      icon: <SafetyOutlined />,
      prefix: "AED ",
    },
    {
      label: t("form.towingRequests") || "Towing Requests",
      value: record.towingRequests || 0,
      color: "#1890ff",
      icon: <CarOutlined />,
    },
  ];

  console.log("=== Passing to ArcGISMap ===");
  console.log("Inspectors:", inspectorForMap);
  console.log("Inspector Path being passed:", record.inspectorPath || []);
  console.log("Fine Locations being passed:", record.fineLocations || []);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1400}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "40px" }}>
          <div>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>
              {record.inspectorName} ({record.inspectorId}){record.inspectorNameAr && ` - ${record.inspectorNameAr}`}
            </span>
            <div style={{ fontSize: "12px", color: "#666", fontWeight: "normal", marginTop: 4 }}>
              {record.inspectorPath && record.inspectorPath.length > 0 && (
                <span style={{ color: "#1890ff" }}>• {record.inspectorPath.length} path points</span>
              )}
              {record.fineLocations && record.fineLocations.length > 0 && (
                <span style={{ color: "#cf1322", marginLeft: 12 }}>• {record.fineLocations.length} fines issued</span>
              )}
            </div>
          </div>
        </div>
      }
      footer={null}
      centered
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
      className="hrms-modal"
    >
      {/* ── BODY: map col (3/4) + details col (1/4) side by side ── */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* ── LEFT: MAP COLUMN (3/4 width) ── */}
        <div style={{ flex: 3, borderRight: "1px solid #e8e8e8", display: "flex", flexDirection: "column" }}>
          {/* Map area */}
          <div style={{ position: "relative", background: "#f5f5f5", padding: "16px", flex: 1 }}>
            {record.location && record.location.lat && record.location.lng ? (
              <>
                <ArcGISMap
                  inspectors={inspectorForMap}
                  center={[record.location.lng, record.location.lat]}
                  zoom={13}
                  height="500px"
                  inspectorPath={record.inspectorPath || []}
                  fineLocations={record.fineLocations || []}
                  showPath={true}
                  showFineLocations={true}
                  clickable={false}
                />

                {/* ── MAP LEGEND — overlaid top-right inside map ── */}
                <div
                  style={{
                    position: "absolute",
                    top: 28,
                    right: 28,
                    background: "rgba(255, 255, 255, 0.93)",
                    border: "1px solid #e8e8e8",
                    borderRadius: 4,
                    padding: "10px 12px",
                    fontSize: 12,
                    zIndex: 10,
                    minWidth: 148,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 8 }}>{t("form.MapLegend")}</div>

                  {/* Start point */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <PlayCircleOutlined style={{ fontSize: 16, color: "#00aa00", flexShrink: 0 }} />
                    <span>{t("form.StartPoint")}</span>
                  </div>

                  {/* Inspector path */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 3, background: "#0070ff", flexShrink: 0 }} />
                    <span>{t("form.InspectorPath")}</span>
                  </div>

                  {/* Fine locations */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <FileExclamationOutlined style={{ fontSize: 16, color: "#cf1322", flexShrink: 0 }} />
                    <span>{t("form.FineLocations")}</span>
                  </div>

                  {/* Current location */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <AimOutlined style={{ fontSize: 16, color: "#1890ff", flexShrink: 0 }} />
                    <span>{t("form.CurrentLocation")}</span>
                  </div>

                  {/* Ending point */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StopOutlined style={{ fontSize: 16, color: "#cf1322", flexShrink: 0 }} />
                    <span>{t("form.EndPoint")}</span>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  height: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                  borderRadius: "4px",
                  border: "1px solid #e8e8e8",
                }}
              >
                <span style={{ color: "#999" }}>No location data available</span>
              </div>
            )}
          </div>

          {/* ── PERFORMANCE BAR — horizontal, below map ── */}
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
                  padding: "14px 8px",
                  borderRight: index < performanceStats.length - 1 ? "1px solid #e8e8e8" : "none",
                }}
              >
                {/* Icon row */}
                <div style={{ fontSize: 20, color: stat.color, marginBottom: 4, lineHeight: 1 }}>{stat.icon}</div>
                {/* Value row */}
                <div style={{ fontSize: 18, fontWeight: 600, color: stat.color, lineHeight: 1.2 }}>
                  {stat.prefix && <span style={{ fontSize: 11, fontWeight: 500, marginRight: 2 }}>{stat.prefix}</span>}
                  {stat.value}
                </div>
                {/* Label row */}
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: DETAILS COLUMN (1/4 width) ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "80vh" }}>
          {/* Basic Details */}
          <div style={{ padding: "16px", borderBottom: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 10 }}>
              {t("form.personaldetails") || "Basic Details"}
            </div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.inspectorId") || "Inspector ID"}>
                {record.inspectorId}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.email") || "Email"}>{record.email || "N/A"}</Descriptions.Item>
              <Descriptions.Item label={t("form.mobile") || "Mobile Number"}>
                {record.mobile || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.supervisorName") || "Supervisor"}>
                {record.supervisorName}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.date") || "Date"}>
                {formatDateDisplay(record.date, i18n.language)}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Check In Details */}
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: 10 }}>
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
                      {record.checkOutTime}
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
  );
};

export default HRMSViewDrawer;
