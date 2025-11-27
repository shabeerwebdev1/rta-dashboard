import React, { useState, useEffect } from "react";
import { Descriptions, Tag, Button, Space, Input, Typography, Image, Empty, Spin, Modal } from "antd";
import {
  useUpdateTowingStatusMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { useAppNotification } from "../../utils/notificationManager";

const { Title } = Typography;

interface TowingViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const TowingViewDrawer: React.FC<TowingViewDrawerProps> = ({ open, onClose, record }) => {
  const { t } = useTranslation();
  const notification = useAppNotification();
  const [updateTowingStatus, { isLoading }] = useUpdateTowingStatusMutation();

  const [comments, setComments] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("0"); // default PENDING

  // Attachments API
  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record ? { inspectionGUID: record.inspectionGUID, entityCode: "parking-towing" } : skipToken,
  );

  // Normalize backend status
  useEffect(() => {
    if (record) {
      setCurrentStatus(String(record.towing_Status ?? "0")); // default to PENDING (0)
      setComments("");
    }
  }, [record]);

  // Map status → color
  const getStatusColor = (status: string | number) => {
    const s = String(status).toUpperCase();

    switch (s) {
      case "1":
      case "APPROVED":
        return "green";
      case "2":
      case "REJECTED":
        return "red";
      case "3":
      case "CANCELLED":
        return "orange";
      case "4":
      case "IN_TOWING":
        return "cyan";
      case "5":
      case "COMPLETED":
        return "purple";
      case "0":
      case "PENDING":
      default:
        return "blue";
    }
  };

  // Map status → readable label
  const getStatusLabel = (status: string | number) => {
    const s = String(status).toUpperCase();

    switch (s) {
      case "1":
      case "APPROVED":
        return t("status.approved");
      case "2":
      case "REJECTED":
        return t("status.rejected");
      case "3":
      case "CANCELLED":
        return t("status.cancelled");
      case "4":
        return t("status.inProgress");
      case "IN_TOWING":
        return t("status.inProgress");
      case "5":
      case "COMPLETED":
        return t("status.completed");
      case "0":
      case "PENDING":
      default:
        return t("status.pending");
    }
  };

  // ONLY pending allows approve/reject
  const isPending = (status: string | number) => Number(status) === 0;

  // Update status action
  const handleUpdateStatus = async (towing_status: number, statusLabel: string) => {
    const inspectionGUID = record?.inspectionGUID;

    if (!inspectionGUID) {
      notification.error(
        {
          data: {
            en_Msg: "Missing inspection GUID",
            ar_Msg: "معرّف الفحص مفقود",
          },
        },
        "",
      );
      return;
    }

    if (!comments.trim()) {
      notification.error(
        {
          data: {
            en_Msg: "Please enter review comments",
            ar_Msg: "يرجى إدخال ملاحظات المراجعة",
          },
        },
        "",
      );
      return;
    }

    try {
      const res = await updateTowingStatus({
        inspectionGUID,
        towing_status,
        lastReviewComments: comments.trim(),
      }).unwrap();

      setCurrentStatus(String(towing_status));
      notification.success(res, `Towing ${statusLabel.toLowerCase()} successfully`);
      onClose();
    } catch (err: any) {
      notification.error(err, `Failed to ${statusLabel.toLowerCase()} towing`);
    }
  };

  return (
    <Modal open={open} width={1200} onCancel={onClose} centered title={t("form.towingDetails")} footer={null}>
      {record ? (
        <>
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
            <Empty description={t("common.noLocation")} />
          )}

          {/* Details */}
          <Descriptions style={{ marginTop: 20 }} bordered column={1} size="small">
            <Descriptions.Item label={t("form.plateNumber")}>{record.plateNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleName")}>{record.vehicleBrand}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleColor")}>{record.vehicleColor}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerName")}>{record.vehicleOwnerName}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerMobile")}>{record.vehicleOwnerMobile}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerEmail")}>{record.vehicleOwnerEmail}</Descriptions.Item>
            <Descriptions.Item label={t("form.manufacturerYear")}>{record.manufacturerYear}</Descriptions.Item>

            <Descriptions.Item label={t("form.towingDate")}>
              {new Date(record.entityDateTime).toLocaleDateString()}
            </Descriptions.Item>

            <Descriptions.Item label={t("form.status")}>
              <Tag color={getStatusColor(currentStatus)}>{getStatusLabel(currentStatus)}</Tag>
            </Descriptions.Item>

            {record.lastReviewComments && (
              <Descriptions.Item label={t("form.lastReviewComments")}>{record.lastReviewComments}</Descriptions.Item>
            )}
          </Descriptions>

          {/* Photos */}
          <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
            {t("form.AttachedPhotos")}
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
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
            )}
          </Spin>

          {/* Approval Actions — Only when PENDING */}
          {isPending(currentStatus) && (
            <>
              <h4 style={{ marginTop: 16 }}>{t("form.approvalActions")}</h4>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
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
                <Button type="primary" loading={isLoading} onClick={() => handleUpdateStatus(1, "Approved")}>
                  {t("form.approve")}
                </Button>

                <Button danger loading={isLoading} onClick={() => handleUpdateStatus(2, "Rejected")}>
                  {t("form.reject")}
                </Button>
              </Space>
            </>
          )}
        </>
      ) : (
        <Empty description={t("common.noData")} />
      )}
    </Modal>
  );
};

export default TowingViewDrawer;
