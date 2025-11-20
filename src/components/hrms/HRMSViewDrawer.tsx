import React from "react";
import { Modal, Descriptions, Card, Row, Col, Statistic, Divider, Badge, Space } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { PageConfig } from "../../types/config";
import ArcGISMap from "../common/ArcGISMap";

interface HRMSViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  config: PageConfig;
  onShare: () => void;
  statusLabels: Record<string, string>;
}

const HRMSViewDrawer: React.FC<HRMSViewDrawerProps> = ({ open, onClose, record, config, onShare, statusLabels }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

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
          },
        ]
      : [];

  // Mock upcoming shifts (you can replace with actual data)
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1000}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "40px" }}>
          <span>{t("page.viewTitle", { entity: "Inspector Details" })}</span>
          <ShareAltOutlined
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            style={{ cursor: "pointer", fontSize: "18px", color: "#1890ff" }}
          />
        </div>
      }
      footer={null}
      centered
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: 24 }}
      className="hrms-modal"
    >
      {/* Inspector Name Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, padding: 0 }}>
          {record.inspectorName}
          {record.inspectorNameAr && ` - ${record.inspectorNameAr}`}
        </h2>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        {/* Basic Details */}
        <h3>{t("form.basicDetails") || "Basic Details"}</h3>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label={t("form.inspectorId") || "Inspector ID"}>{record.inspectorId}</Descriptions.Item>
          <Descriptions.Item label={t("form.email") || "Email"}>{record.email || "N/A"}</Descriptions.Item>
          <Descriptions.Item label={t("form.mobile") || "Mobile Number"}>{record.mobile || "N/A"}</Descriptions.Item>
          <Descriptions.Item label={t("form.supervisorName") || "Supervisor"}>
            {record.supervisorName}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.date") || "Date"}>
            {dayjs(record.date).format("DD-MM-YYYY")}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Today's Performance */}
        <h3>{t("form.todayPerformance") || "Today's Performance"}</h3>
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title={t("form.obstacles") || "Obstacles"}
                value={record.obstacles || 0}
                prefix="🚧"
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
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
            <Card size="small">
              <Statistic
                title={t("form.towingRequests") || "Towing Requests"}
                value={record.towingRequests || 0}
                prefix="🚗"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title={t("form.leaveRequested") || "Leave Requested"}
                value={record.leaveRequested || 0}
                prefix="📝"
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Check In Location Details */}
        <h3>{t("form.checkInLocation") || "Check In Location Details"}</h3>
        <Card
          size="small"
          style={{
            marginBottom: 16,
            backgroundColor: record.status === "Present" ? "#f6ffed" : "#fff1f0",
            border: `1px solid ${record.status === "Present" ? "#b7eb8f" : "#ffccc7"}`,
          }}
        >
          {/* Time Details */}
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t("form.zone") || "Zone"}>{record.location?.zone || "N/A"}</Descriptions.Item>
            <Descriptions.Item label={t("form.shift") || "Shift"}>{record.shift || "Morning Shift"}</Descriptions.Item>
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

          {/* ArcGIS Map */}
          {record.location && record.location.lat && record.location.lng && (
            <div style={{ marginTop: 16 }}>
              <ArcGISMap
                inspectors={inspectorForMap}
                center={[record.location.lng, record.location.lat]}
                zoom={15}
                height="250px"
              />
            </div>
          )}
        </Card>

        <Divider />

        {/* Upcoming Shift Details */}
        <h3>{t("form.upcomingShifts") || "Upcoming Shift Details"}</h3>
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
            <div style={{ marginBottom: 8, fontWeight: "bold", color: "#1890ff" }}>{shift.date}</div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t("form.zone") || "Zone"}>{shift.zone}</Descriptions.Item>
              <Descriptions.Item label={t("form.shift") || "Shift"}>{shift.shift}</Descriptions.Item>
            </Descriptions>
          </Card>
        ))}

        <Divider />

        {/* Working Hours Summary */}
        <h3>{t("form.additionalInfo") || "Working Hours Summary"}</h3>
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
    </Modal>
  );
};

export default HRMSViewDrawer;
