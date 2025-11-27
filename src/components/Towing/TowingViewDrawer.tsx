import React, { useState, useEffect } from "react";
import { Descriptions, Tag, Button, Space, Input, Typography, Image, Empty, Spin, Modal } from "antd";
import {
  useUpdateTowingStatusMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
  useGetTowingEvidenceQuery,
  getFileUrl,
} from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { useAppNotification } from "../../utils/notificationManager";
import dayjs from "dayjs";

const { Title } = Typography;

export enum TowingStatus {
  Pending = "PENDING",
  Approved = "APPROVED",
  Rejected = "REJECTED",
  Cancelled = "CANCELLED",
  InProgress = "IN_TOWING",
  Completed = "COMPLETED",
}

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
  const [currentStatus, setCurrentStatus] = useState<string>(TowingStatus.Pending);

  // Normalize backend status
  useEffect(() => {
    if (record) {
      setCurrentStatus(record.towing_Status?.toUpperCase() || TowingStatus.Pending);
      setComments("");
    }
  }, [record]);

  // Check if status is COMPLETED
  const isCompleted = currentStatus === TowingStatus.Completed;

  // ✅ CONDITIONAL QUERY - Only fetch evidence when status is COMPLETED
  const { data: evidenceData, isLoading: isEvidenceLoading } = useGetTowingEvidenceQuery(
    isCompleted && record?.inspectionGUID ? { towingId: record.inspectionGUID } : skipToken,
  );

  // Attachments API
  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record ? { inspectionGUID: record.inspectionGUID, entityCode: "parking-towing" } : skipToken,
  );

  // ✅ DEBUG - Log evidence data when it loads
  useEffect(() => {
    if (isCompleted && evidenceData) {
      console.log("=== Towing Evidence Data ===");
      console.log("Evidence:", evidenceData);
      console.log("Start Point:", { lat: evidenceData.data?.startLat, lng: evidenceData.data?.startLng });
      console.log("End Point:", { lat: evidenceData.data?.endLat, lng: evidenceData.data?.endLng });
    }
  }, [evidenceData, isCompleted]);

  // Map status → color
  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();

    switch (s) {
      case TowingStatus.Approved:
        return "green";
      case TowingStatus.Rejected:
        return "red";
      case TowingStatus.Cancelled:
        return "orange";
      case TowingStatus.InProgress:
        return "cyan";
      case TowingStatus.Completed:
        return "purple";
      case TowingStatus.Pending:
      default:
        return "blue";
    }
  };

  // Map status → readable label
  const getStatusLabel = (status: string) => {
    const s = status.toUpperCase();

    switch (s) {
      case TowingStatus.Approved:
        return t("status.approved");
      case TowingStatus.Rejected:
        return t("status.rejected");
      case TowingStatus.Cancelled:
        return t("status.cancelled");
      case TowingStatus.InProgress:
        return t("status.inProgress");
      case TowingStatus.Completed:
        return t("status.completed");
      case TowingStatus.Pending:
      default:
        return t("status.pending");
    }
  };

  // ONLY pending allows approve/reject
  const isPending = currentStatus === TowingStatus.Pending;

  // Update status action
  const handleUpdateStatus = async (towing_status: TowingStatus, statusLabel: string) => {
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

      setCurrentStatus(towing_status);
      notification.success(res, `Towing ${statusLabel.toLowerCase()} successfully`);
      onClose();
    } catch (err: any) {
      notification.error(err, `Failed to ${statusLabel.toLowerCase()} towing`);
    }
  };

  // ✅ Parse towing documents
  const towingDocuments = React.useMemo(() => {
    if (!evidenceData?.data?.towingDocuments) return [];

    return evidenceData.data.towingDocuments
      .split("; ")
      .map((path: string) => path.trim())
      .filter((path: string) => path.length > 0);
  }, [evidenceData]);

  // ✅ FIX: Prepare map center and towing points properly
  const mapCenter = React.useMemo(() => {
    if (isCompleted && evidenceData?.data?.startLng && evidenceData?.data?.startLat) {
      return [evidenceData.data.startLng, evidenceData.data.startLat] as [number, number];
    }
    if (record?.longitude && record?.latitude) {
      return [record.longitude, record.latitude] as [number, number];
    }
    return [55.2743, 25.1972] as [number, number]; // Default Dubai
  }, [isCompleted, evidenceData, record]);

  const towingStart = React.useMemo(() => {
    if (isCompleted && evidenceData?.data?.startLat && evidenceData?.data?.startLng) {
      return {
        lat: evidenceData.data.startLat,
        lng: evidenceData.data.startLng,
      };
    }
    return undefined;
  }, [isCompleted, evidenceData]);

  const towingEnd = React.useMemo(() => {
    if (isCompleted && evidenceData?.data?.endLat && evidenceData?.data?.endLng) {
      return {
        lat: evidenceData.data.endLat,
        lng: evidenceData.data.endLng,
      };
    }
    return undefined;
  }, [isCompleted, evidenceData]);

  console.log("=== Map Props Debug ===");
  console.log("Is Completed:", isCompleted);
  console.log("Map Center:", mapCenter);
  console.log("Towing Start:", towingStart);
  console.log("Towing End:", towingEnd);
  console.log("Show Towing Route:", isCompleted && !!towingStart && !!towingEnd);

  return (
    <Modal open={open} width={1200} onCancel={onClose} centered title={t("form.towingDetails")} footer={null}>
      {record ? (
        <>
          {/* Map - Shows initial location or towing route if completed */}
          <h4 style={{ marginTop: 16 }}>{t("form.location")}</h4>
          {record.latitude && record.longitude ? (
            <ArcGISMap
              inspectors={
                !isCompleted
                  ? [
                      {
                        id: 1,
                        name: "Towing Location",
                        nameAr: "موقع السحب",
                        lat: record.latitude,
                        lng: record.longitude,
                        status: "Towing",
                        statusAr: "السحب",
                        markerType: "google-pin",
                      },
                    ]
                  : [] // ✅ FIX: Empty array when showing towing route to avoid conflicts
              }
              center={mapCenter}
              zoom={isCompleted ? 13 : 16}
              height="400px"
              showTowingRoute={isCompleted && !!towingStart && !!towingEnd}
              towingStartPoint={towingStart}
              towingEndPoint={towingEnd}
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

          {/* ✅ EVIDENCE SECTION - Only when COMPLETED */}
          {isCompleted && (
            <>
              <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
                {t("form.towingEvidence") || "Towing Evidence"}
              </Title>

              <Spin spinning={isEvidenceLoading}>
                {evidenceData?.data ? (
                  <>
                    <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                      <Descriptions.Item label={t("form.towingCompany") || "Towing Company"}>
                        {evidenceData.data.towingCompanyName}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.driverEmiratesId") || "Driver Emirates ID"}>
                        {evidenceData.data.towingDriverEmiratesId}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.towingVehicle") || "Towing Vehicle"}>
                        {evidenceData.data.towingVehicleNumber}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.vehicleId") || "Vehicle ID"}>
                        {evidenceData.data.vehicleId}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.entryTime") || "Entry Time"}>
                        {dayjs(evidenceData.data.entryTime).format("DD-MM-YYYY HH:mm:ss")}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.exitTime") || "Exit Time"}>
                        {dayjs(evidenceData.data.exitTime).format("DD-MM-YYYY HH:mm:ss")}
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Towing Documents */}
                    {towingDocuments.length > 0 && (
                      <>
                        <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
                          {t("form.towingDocuments") || "Towing Documents"}
                        </Title>
                        <Image.PreviewGroup>
                          <Space wrap>
                            {towingDocuments.map((docPath: string, index: number) => (
                              <Image
                                key={index}
                                width={100}
                                height={100}
                                src={getFileUrl(docPath)}
                                alt={`Towing Document ${index + 1}`}
                                style={{ objectFit: "cover", borderRadius: 8 }}
                              />
                            ))}
                          </Space>
                        </Image.PreviewGroup>
                      </>
                    )}
                  </>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
                )}
              </Spin>
            </>
          )}

          {/* Approval Actions — Only when PENDING */}
          {isPending && (
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
                <Button
                  type="primary"
                  loading={isLoading}
                  onClick={() => handleUpdateStatus(TowingStatus.Approved, "Approved")}
                >
                  {t("form.approve")}
                </Button>

                <Button
                  danger
                  loading={isLoading}
                  onClick={() => handleUpdateStatus(TowingStatus.Rejected, "Rejected")}
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
    </Modal>
  );
};

export default TowingViewDrawer;
