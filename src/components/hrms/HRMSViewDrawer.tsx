/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { Modal, Descriptions, Card, Row, Col, Statistic, Badge } from "antd";
import { useTranslation } from "react-i18next";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
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

  // ✅ DEBUG LOGGING - Check what data we're receiving
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "green";
      case "Absent":
        return "red";
      case "Leave":
        return "orange";
      default:
        return "default";
    }
  };

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

  // Mock upcoming shifts
  const upcomingShifts = [
    {
      date: "Monday, 25th Nov",
      zone: record.location?.zone || "Zone A",
      shift: record.shift || "Morning Shift (8:00 AM - 4:00 PM)",
    },
    {
      date: "Tuesday, 26th Nov",
      zone: record.location?.zone || "Zone A",
      shift: record.shift || "Morning Shift (8:00 AM - 4:00 PM)",
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
              {record.inspectorName}
              {record.inspectorNameAr && ` - ${record.inspectorNameAr}`}
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
      {/* ✅ FULL WIDTH MAP SECTION - TOP */}
      <div style={{ width: "100%", background: "#f5f5f5", padding: "16px", borderBottom: "1px solid #e8e8e8" }}>
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

            {/* Map Legend */}
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "white",
                borderRadius: 4,
                border: "1px solid #e8e8e8",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 600 }}>{t("form.MapLegend")}</h4>
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px" }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        background: "#00ff00",
                        borderRadius: "50%",
                        border: "2px solid white",
                        boxShadow: "0 0 3px rgba(0,0,0,0.3)",
                      }}
                    />
                    <span>{t("form.StartPoint")}</span>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px" }}>
                    <div
                      style={{
                        width: 24,
                        height: 3,
                        background: "#0070ff",
                      }}
                    />
                    <span>{t("form.InspectorPath")}</span>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px" }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        background: "#ff0000",
                        borderRadius: "50%",
                      }}
                    />
                    <span>{t("form.FineLocations")}</span>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px" }}>
                    <img
                      src="/images/Inspector.png"
                      alt="Inspector"
                      style={{ width: 20, height: 20 }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span>{t("form.CurrentLocation")}</span>
                  </div>
                </Col>
              </Row>
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

      {/* ✅ DETAILS SECTION - BELOW MAP */}
      <div style={{ padding: "24px" }}>
        <Row gutter={24}>
          {/* Left Column */}
          <Col span={12}>
            {/* Basic Details */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>{t("form.basicDetails") || "Basic Details"}</h3>
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
            </Card>

            {/* Check In Details */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>{t("form.checkInLocation") || "Check In Details"}</h3>
              <Card
                size="small"
                style={{
                  backgroundColor: record.status === "Present" ? "#f6ffed" : "#fff1f0",
                  border: `1px solid ${record.status === "Present" ? "#b7eb8f" : "#ffccc7"}`,
                }}
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t("form.zone") || "Zone"}>
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
              </Card>
            </Card>

            {/* Working Hours Summary */}
            <Card size="small">
              <h3 style={{ marginTop: 0 }}>{t("form.additionalInfo") || "Working Hours Summary"}</h3>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={t("form.workingHours") || "Working Hours"}>
                  {record.checkInTime && record.checkOutTime
                    ? `${record.checkInTime} - ${record.checkOutTime}`
                    : t("common.inProgress") || "In Progress"}
                </Descriptions.Item>
                <Descriptions.Item label={t("form.coordinates") || "Coordinates"}>
                  {record.location
                    ? `${record.location.lat.toFixed(6)}, ${record.location.lng.toFixed(6)}`
                    : t("common.noData") || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Right Column */}
          <Col span={12}>
            {/* Today's Performance */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>{t("form.todayPerformance") || "Today's Performance"}</h3>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <Statistic
                      title={t("form.obstacles") || "Obstacles"}
                      value={record.obstacles || 0}
                      prefix="🚧"
                      valueStyle={{ color: "#3f8600" }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <Statistic
                      title={t("form.finesIssued") || "Fines Issued"}
                      value={record.finesIssued || 0}
                      valueStyle={{ color: "#cf1322" }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <Statistic
                      title={t("form.towingRequests") || "Towing Requests"}
                      value={record.towingRequests || 0}
                      prefix="🚗"
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <Statistic
                      title={t("form.leaveRequested") || "Leave Requested"}
                      value={record.leaveRequested || 0}
                      prefix="📝"
                      valueStyle={{ color: "#722ed1" }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Upcoming Shifts */}
            <Card size="small">
              <h3 style={{ marginTop: 0 }}>{t("form.upcomingShifts") || "Upcoming Shift Details"}</h3>
              {upcomingShifts.map((shift, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    marginBottom: 12,
                    backgroundColor: index === 0 ? "#e6f7ff" : "#f9f9f9",
                    border: index === 0 ? "1px solid #91d5ff" : "1px solid #d9d9d9",
                  }}
                >
                  <div style={{ marginBottom: 8, fontWeight: "bold", color: "#1890ff", fontSize: "13px" }}>
                    {shift.date}
                  </div>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={t("form.zone") || "Zone"}>{shift.zone}</Descriptions.Item>
                    <Descriptions.Item label={t("form.shift") || "Shift"}>{shift.shift}</Descriptions.Item>
                  </Descriptions>
                </Card>
              ))}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default HRMSViewDrawer;
