/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Descriptions, Tag, Button, Space, Input, Typography, Image, Empty, Spin, Modal } from "antd";
import {
  useUpdateTowingStatusMutation,
  useGetInspectionAttachmentsQuery,
  useGetTowingEvidenceQuery,
  getMobileFileUrl,
  getFileUrl,
} from "../../services/rtkApiFactory";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { useAppNotification } from "../../utils/notificationManager";
import dayjs from "dayjs";
import { TowingStatus } from "../../config/pageConfigs/towingConfig";

const { Title } = Typography;

interface TowingViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const TowingViewDrawer: React.FC<TowingViewDrawerProps> = ({ open, onClose, record }) => {
  const { t, i18n } = useTranslation(); // 👈 Includes i18n
  const notification = useAppNotification();

  const [updateTowingStatus, { isLoading }] = useUpdateTowingStatusMutation();
  const [comments, setComments] = useState<string>("");

  const [currentStatus, setCurrentStatus] = useState<TowingStatus>(TowingStatus.Pending);

  useEffect(() => {
    if (record) {
      const status = (record.towing_Status || "").toUpperCase();
      setCurrentStatus(status as TowingStatus);
      setComments("");
    }
  }, [record]);

  const isCompleted = currentStatus === TowingStatus.Completed;
  const isPending = currentStatus === TowingStatus.Pending;

  const { data: attachments = [], isLoading: loadingAttachments } = useGetInspectionAttachmentsQuery(
    record ? { inspectionGUID: record.inspectionGUID, entityCode: "parking-towing" } : skipToken,
  );

  const { data: evidenceData, isLoading: loadingEvidence } = useGetTowingEvidenceQuery(
    isCompleted && record?.inspectionGUID ? { towingId: record.inspectionGUID } : skipToken,
  );

  const towingStart = evidenceData?.data?.startLat
    ? { lat: evidenceData.data.startLat, lng: evidenceData.data.startLng }
    : null;

  const towingEnd = evidenceData?.data?.endLat
    ? { lat: evidenceData.data.endLat, lng: evidenceData.data.endLng }
    : null;

  const mapCenter = towingStart
    ? [towingStart.lng, towingStart.lat]
    : record?.longitude && record?.latitude
      ? [record.longitude, record.latitude]
      : [55.2743, 25.1972];

  const getStatusColor = (status: TowingStatus) => {
    switch (status) {
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
      default:
        return "blue";
    }
  };

  const getStatusLabel = (status: TowingStatus) => {
    switch (status) {
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
      default:
        return t("status.pending");
    }
  };

  const handleUpdateStatus = async (status: TowingStatus, statusNumber: number) => {
    if (!record?.inspectionGUID) {
      notification.error({ data: { en_Msg: "Missing inspection GUID" } }, "");
      return;
    }

    if (!comments.trim()) {
      notification.error({ data: { en_Msg: "Please enter review comments" } }, "");
      return;
    }

    try {
      const res = await updateTowingStatus({
        inspectionGUID: record.inspectionGUID,

        // 🔥 SEND NUMBER TO BACKEND
        towing_status: statusNumber,

        lastReviewComments: comments,
      }).unwrap();

      // UI still uses TowingStatus (string)
      setCurrentStatus(status);

      notification.success(res, statusNumber === 1 ? "Approved successfully" : "Rejected successfully");

      onClose();
    } catch (err) {
      notification.error(err, statusNumber === 1 ? "Failed to approve" : "Failed to reject");
    }
  };

  const towingDocuments = useMemo(() => {
    const docs = evidenceData?.data?.towingDocuments;
    return docs ? docs.split("; ").filter((p: string) => p.trim()) : [];
  }, [evidenceData]);

  // --------- TITLE DETECTION (EN + AR AUTO SWITCH) ----------
  const getDocumentTitle = (filePath: string) => {
    const file = filePath.toLowerCase();
    const lang = i18n.language;
    const isAr = lang === "ar";

    if (file.includes("driverphoto")) return isAr ? "صورة السائق" : "Driver Photo";

    if (file.includes("signature")) return isAr ? "توقيع السائق" : "Driver Signature";

    if (file.includes("emiratesid")) return isAr ? "صورة بطاقة الهوية الإماراتية للسائق" : "Driver Emirates ID";

    return isAr ? "مستند" : "Document";
  };

  const shouldShowVideo = isCompleted || !!record?.evidenceFileName;

  const tempVideoUrl =
    "https://media.istockphoto.com/id/1421938947/video/tow-truck-transportation-4k-resolution.mp4?s=mp4-640x640-is&k=20&c=ii_HinNEKIvDOaPHA8bb8a5Nojmb09HVOp3JDLyPDvI=";

  const realVideoUrl = record?.evidenceFileName ? getMobileFileUrl(record.evidenceFileName) : null;

  const videoUrl = realVideoUrl || tempVideoUrl;

  return (
    <Modal open={open} width={1200} onCancel={onClose} centered title={t("form.towingDetails")} footer={null}>
      {!record ? (
        <Empty description={t("common.noData")} />
      ) : (
        <>
          <Title level={5} style={{ marginTop: 10 }}>
            {t("form.location")}
          </Title>

          <ArcGISMap
            inspectors={
              !isCompleted
                ? [
                    {
                      id: 1,
                      name: "Towing Location",
                      lat: record.latitude,
                      lng: record.longitude,
                      status: "Towing",
                    },
                  ]
                : []
            }
            center={mapCenter}
            height="400px"
            zoom={isCompleted ? 13 : 16}
            showTowingRoute={isCompleted && towingStart && towingEnd}
            towingStartPoint={towingStart || undefined}
            towingEndPoint={towingEnd || undefined}
          />

          <Descriptions bordered column={1} size="small" style={{ marginTop: 20 }}>
            <Descriptions.Item label={t("form.plateNumber")}>{record.plateNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleName")}>{record.vehicleBrand}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleColor")}>{record.vehicleColor}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerName")}>{record.vehicleOwnerName}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerMobile")}>{record.vehicleOwnerMobile}</Descriptions.Item>

            <Descriptions.Item label={t("form.towingDate")}>
              {dayjs(record.entityDateTime).format("DD-MM-YYYY")}
            </Descriptions.Item>

            <Descriptions.Item label={t("form.status")}>
              <Tag color={getStatusColor(currentStatus)}>{getStatusLabel(currentStatus)}</Tag>
            </Descriptions.Item>

            {record.lastReviewComments && (
              <Descriptions.Item label={t("form.lastReviewComments")}>{record.lastReviewComments}</Descriptions.Item>
            )}
          </Descriptions>

          <Title level={5} style={{ marginTop: 20 }}>
            {t("form.AttachedPhotos")}
          </Title>

          <Spin spinning={loadingAttachments}>
            {attachments.length ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {attachments.map((file) => (
                    <Image
                      key={file.attachmentGUID}
                      width={100}
                      height={100}
                      src={getMobileFileUrl(file.filePath)}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty />
            )}
          </Spin>

          {/* ----------- VIDEO SECTION ----------- */}
          {shouldShowVideo && (
            <>
              <Title level={5} style={{ marginTop: 25 }}>
                {t("form.towingVideo")}
              </Title>

              <video
                width="100%"
                height="360"
                controls
                autoPlay={false}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  background: "#000",
                  marginBottom: 10,
                }}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            </>
          )}

          {/* ----------- EVIDENCE DOCUMENTS ----------- */}
          {isCompleted && towingDocuments.length > 0 && (
            <>
              <Title level={5} style={{ marginTop: 20 }}>
                {t("form.towingDocuments")}
              </Title>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {towingDocuments.map((p, i) => {
                  const title = getDocumentTitle(p);

                  return (
                    <div key={i} style={{ width: 120, textAlign: "center" }}>
                      <div
                        style={{
                          marginBottom: 6,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {title}
                      </div>

                      <Image
                        width={120}
                        height={120}
                        src={getFileUrl(p)}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                          padding: 4,
                          background: "#fff",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {isPending && (
            <>
              <Title level={5} style={{ marginTop: 20 }}>
                {t("form.approvalActions")}
              </Title>

              <Input.TextArea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={t("placeholders.enterComments")}
              />

              <Space style={{ marginTop: 10 }}>
                <Button type="primary" loading={isLoading} onClick={() => handleUpdateStatus(TowingStatus.Approved, 1)}>
                  {t("form.approve")}
                </Button>

                <Button danger loading={isLoading} onClick={() => handleUpdateStatus(TowingStatus.Rejected, 2)}>
                  {t("form.reject")}
                </Button>
              </Space>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default TowingViewDrawer;
