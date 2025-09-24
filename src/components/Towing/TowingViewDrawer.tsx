import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space, App, Input } from "antd";
import { useUpdateTowingStatusMutation } from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";

interface TowingViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const TowingViewDrawer: React.FC<TowingViewDrawerProps> = ({ open, onClose, record }) => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
  const [updateTowingStatus, { isLoading }] = useUpdateTowingStatusMutation();
  
  const [comments, setComments] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");

  useEffect(() => {
    if (record) {
      setCurrentStatus(record.towing_Status || "pending");
      setComments("");
    }
  }, [record]);

  const handleUpdateStatus = async (statusCode: number, statusLabel: string) => {
    const inspectionGUID = record?.inspectionGUID;

    if (!inspectionGUID) {
      notification.error({ message: "Missing inspection GUID" });
      return;
    }

    if (!comments.trim()) {
      notification.error({ message: "Please enter review comments" });
      return;
    }

    try {
      await updateTowingStatus({
        inspectionGUID,
        statusCode,
        lastReviewComments: comments.trim()
      }).unwrap();
      
      setCurrentStatus(statusLabel);
      notification.success({ message: `Towing ${statusLabel.toLowerCase()} successfully` });
      onClose();
    } catch (err: any) {
      notification.error({ 
        message: err?.data?.message || `Failed to ${statusLabel.toLowerCase()} towing` 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": return "green";
      case "rejected": return "red";
      case "cancelled": return "orange";
      case "pending": 
      default: return "blue";
    }
  };

  const isStatusFinal = (status: string) => {
    return status?.toLowerCase() === "approved" || status?.toLowerCase() === "rejected";
  };

  return (
    <Drawer
      open={open}
      width={600}
      onClose={onClose}
      title={t("page.title.towingDetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {record ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("form.plateNumber")}>
              {record.plateNumber}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleName")}>
              {record.vehicleBrand}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleColor")}>
              {record.vehicleColor}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerName")}>
              {record.vehicleOwnerName}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerMobile")}>
              {record.vehicleOwnerMobile}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerEmail")}>
              {record.vehicleOwnerEmail}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.manufacturerYear")}>
              {record.manufacturerYear}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.towingDate")}>
              {new Date(record.entityDateTime).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.location")}>
              Lat: {record.latitude}, Long: {record.longitude}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.comments")}>
              {record.comments}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.status")}>
              <Tag color={getStatusColor(currentStatus)}>
                {currentStatus}
              </Tag>
            </Descriptions.Item>
            {record.lastReviewComments && (
              <Descriptions.Item label={t("form.lastReviewComments")}>
                {record.lastReviewComments}
              </Descriptions.Item>
            )}
          </Descriptions>

          {!isStatusFinal(currentStatus) && (
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  {t("form.reviewComments")} *
                </label>
                <Input.TextArea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={t("placeholders.enterReviewComments")}
                />
              </div>
              
              <Space>
                <Button
                  type="primary"
                  loading={isLoading}
                  onClick={() => handleUpdateStatus(1, "Approved")}
                  disabled={!comments.trim()}
                >
                  {t("form.approve")}
                </Button>
                <Button
                  danger
                  loading={isLoading}
                  onClick={() => handleUpdateStatus(2, "Rejected")}
                  disabled={!comments.trim()}
                >
                  {t("form.reject")}
                </Button>
              </Space>
            </Space>
          )}
        </Space>
      ) : (
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default TowingViewDrawer;