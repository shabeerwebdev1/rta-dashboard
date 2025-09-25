import React, { useState, useEffect } from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  App,
  Input,
  Typography,
  Image,
  Empty,
  Spin,
} from "antd";
import { useUpdateTowingStatusMutation } from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import {
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/inspectionFileApi";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap"; // ✅ map import
import { useAppNotification } from "../../utils/notificationManager";


const { Title } = Typography;

interface TowingViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const TowingViewDrawer: React.FC<TowingViewDrawerProps> = ({
  open,
  onClose,
  record,
}) => {
  const { t } = useTranslation();
const notification = useAppNotification();
  const [updateTowingStatus, { isLoading }] = useUpdateTowingStatusMutation();

  const [comments, setComments] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");

  // ✅ Attachments API call
  const { data: attachments = [], isLoading: isLoadingAttachments } =
    useGetInspectionAttachmentsQuery(
      record
        ? { inspectionGUID: record.inspectionGUID, entityCode: "parking-towing" }
        : skipToken
    );

  useEffect(() => {
    if (record) {
      setCurrentStatus(record.towing_Status || "pending");
      setComments("");
    }
  }, [record]);

const handleUpdateStatus = async (statusCode: number, statusLabel: string) => {
  const inspectionGUID = record?.inspectionGUID;

  if (!inspectionGUID) {
    notification.error({}, "Missing inspection GUID");
    return;
  }

  if (!comments.trim()) {
    notification.error({}, "Please enter review comments");
    return;
  }

  try {
    const res = await updateTowingStatus({
      inspectionGUID,
      statusCode,
      lastReviewComments: comments.trim(),
    }).unwrap();

    setCurrentStatus(statusLabel);
    notification.success(res, `Towing ${statusLabel.toLowerCase()} successfully`);
    onClose();
  } catch (err: any) {
    notification.error(err, `Failed to ${statusLabel.toLowerCase()} towing`);
  }
};

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "cancelled":
        return "orange";
      case "pending":
      default:
        return "blue";
    }
  };

  const isStatusFinal = (status: string) =>
    status?.toLowerCase() === "approved" || status?.toLowerCase() === "rejected";

  return (
    <Drawer
      open={open}
      width={500}
      onClose={onClose}
      title={t("form.towingDetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {record ? (
        <>
          {/* Details */}
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
            <Descriptions.Item label={t("form.status")}>
              <Tag color={getStatusColor(currentStatus)}>{currentStatus}</Tag>
            </Descriptions.Item>
            {record.lastReviewComments && (
              <Descriptions.Item label={t("form.lastReviewComments")}>
                {record.lastReviewComments}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Map */}
          <h4 style={{ marginTop: 16 }}>{t("form.location")}</h4>
          {record.latitude && record.longitude ? (
            <ArcGISMap
              inspectors={[
                {
                  id: 1,
                  name: "Towing Location",
                  nameAr: "Towing Location",
                  lat: record.latitude,
                  lng: record.longitude,
                  status: "Towing",
                  statusAr: "Towing",
                  details: { zone: "", lastCheckIn: "" },
                  markerType: "google-pin",
                },
              ]}
              center={[record.longitude, record.latitude]}
              zoom={16}
              height="300px"
            />
          ) : (
            <Empty description="No Location Data Available" />
          )}

          {/* Photos */}
          <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
            {t("form.photo")}
          </Title>
          <Spin spinning={isLoadingAttachments}>
            {attachments.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {attachments.map((file) => (
                    <Image
                      key={file.attachmentGUID}
                      width={100}
                      height={100}
                      src={getMobileFileUrl(file.filePath)}
                      alt={file.fileName}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("common.noData")}
              />
            )}
          </Spin>

          {/* Approval Actions */}
          {!isStatusFinal(currentStatus) && (
            <>
              <h4 style={{ marginTop: 16 }}>{t("form.approvalActions")}</h4>
              <div style={{ marginBottom: 10 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
                >
                  {t("form.reviewComments")} *
                </label>
                <Input.TextArea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={t("placeholders.enterComments")}
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
            </>
          )}
        </>
      ) : (
        <Empty description={t("common.noData")} />
      )}
    </Drawer>
  );
};

export default TowingViewDrawer;