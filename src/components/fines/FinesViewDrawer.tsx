// components/FinesViewDrawer.tsx
import React from "react";
import { Drawer, Descriptions, Tag, Space, Image, Timeline, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { getFileUrl } from "../../services/fileApi";

interface FinesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  fine: any;
}

const inspectionTypeMap: Record<number, string> = {
  0: "Parking Violation",
  1: "Over Speeding",
  2: "No License",
};

const FinesViewDrawer: React.FC<FinesViewDrawerProps> = ({ open, onClose, fine }) => {
  const { t } = useTranslation();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("form.finedetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {!fine ? (
        <Empty description="No Data" />
      ) : (
        <>
          {/* Fine Details */}
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("form.fineNumber")}>{fine.fineNo || "No Data"}</Descriptions.Item>
            <Descriptions.Item label={t("form.supervisorName")}>{fine.supervisor || "No Data"}</Descriptions.Item>
            <Descriptions.Item label={t("form.fineType")}>
              {inspectionTypeMap[fine.inspectionType] || "No Data"}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.section")}>{fine.section || "No Data"}</Descriptions.Item>
            <Descriptions.Item label={t("form.date")}>{fine.createdAt || "No Data"}</Descriptions.Item>
            <Descriptions.Item label={t("form.amount")}>{fine.fineAmount ?? "No Data"}</Descriptions.Item>
            <Descriptions.Item label={t("form.status")}>
              <Tag color={fine.fineStatus === "Paid" ? "green" : "red"}>{fine.fineStatus || "No Data"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t("common.location")}>
              {fine.latitude && fine.longitude ? `${fine.latitude}, ${fine.longitude}` : "No Data"}
            </Descriptions.Item>
          </Descriptions>

          {/* Vehicle Details */}
          <h4 style={{ marginTop: 16 }}>{t("form.vehicleDetails")}</h4>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("form.plateNumber")}>
              {fine.plateDetails?.plateNumber || "No Data"}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.plateType")}>
              {fine.plateDetails?.plateType || "No Data"}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleColor")}>
              {fine.plateDetails?.vehicleColor || "No Data"}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleType")}>
              {fine.plateDetails?.vehicleType || "No Data"}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleBrand")}>
              {fine.plateDetails?.vehicleBrand || "No Data"}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleOwnerName")}>
              {fine.plateDetails?.vehicleOwnerName || "No Data"}
            </Descriptions.Item>
          </Descriptions>

          {/* Map */}
          <h4 style={{ marginTop: 16 }}>{t("form.FineLocation")}</h4>
          {fine.latitude && fine.longitude ? (
            <iframe
              title="Fine Location"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${fine.latitude},${fine.longitude}&z=15&output=embed`}
            ></iframe>
          ) : (
            <Empty description="No Location Data" />
          )}

          {/* Photos */}
          <h4 style={{ marginTop: 16 }}>{t("form.AttachedPhotos")}</h4>
          {fine.documents && (Array.isArray(fine.documents) ? fine.documents : [fine.documents]).length ? (
            <Image.PreviewGroup>
              <Space wrap>
                {(Array.isArray(fine.documents) ? fine.documents : [fine.documents]).map((doc: string, idx: number) => (
                  <Image key={idx} width={120} src={getFileUrl(doc)} />
                ))}
              </Space>
            </Image.PreviewGroup>
          ) : (
            <Empty description="No Photos" />
          )}

          {/* Activity Log */}
          {/* <h4 style={{ marginTop: 16 }}>{t("form.ActivityLog")}</h4>
          {fine.activities?.length ? (
            <Timeline>
              {fine.activities.map((act: any, idx: number) => (
                <Timeline.Item key={idx}>
                  <strong>{act.time}</strong> - {act.desc}
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Empty description="No Activities" />
          )} */}
        </>
      )}
    </Drawer>
  );
};

export default FinesViewDrawer;
