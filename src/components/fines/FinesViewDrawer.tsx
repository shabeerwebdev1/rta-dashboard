// components/FinesViewDrawer.tsx
import React from "react";
import { Drawer, Descriptions, Tag, Empty, Spin } from "antd";
import { useTranslation } from "react-i18next";

interface FinesViewDrawerProps {
  open: boolean;
  onClose: () => void;
  fine: any;
  isLoading?: boolean;
}

// Map inspection type GUIDs to human-readable names
const inspectionTypeMap: Record<string, string> = {
  "00000000-0000-0000-0000-000000000000": "Parking Violation",
  "00000000-0000-0000-0000-000000000001": "Over Speeding",
  "00000000-0000-0000-0000-000000000002": "No License",
  // Add more GUID mappings as needed
};

const paymentTypeMap: Record<string, string> = {
  "0": "Not Paid",
  "1": "Cash",
  "2": "Credit Card",
  "3": "Online",
};

const inspectionStatusMap: Record<number, string> = {
  0: "Pending",
  1: "Completed",
  2: "Cancelled",
};

const FinesViewDrawer: React.FC<FinesViewDrawerProps> = ({ open, onClose, fine, isLoading = false }) => {
  const { t } = useTranslation();

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "No Data";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Get inspection type label from GUID
  const getInspectionTypeLabel = (guid: string) => {
    if (!guid) return "No Data";
    return inspectionTypeMap[guid] || guid;
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("form.finedetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      <Spin spinning={isLoading}>
        {!fine ? (
          <Empty description="No Data" />
        ) : (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.inspectionId")}>{fine.inspectionGUID || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.supervisorId")}>{fine.inspectorGUID || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.fineType")}>
                {getInspectionTypeLabel(fine.inspectionTypeGUID)}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionDate")}>{formatDate(fine.actualDateTime)}</Descriptions.Item>
              <Descriptions.Item label={t("form.amount")}>
                {(fine.fineAmount ?? fine.fineAmount === 0) ? `${fine.fineAmount} AED` : "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.totalAmount")}>
                {(fine.totalFineAmount ?? fine.totalFineAmount === 0) ? `${fine.totalFineAmount} AED` : "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.paymentType")}>
                {paymentTypeMap[fine.paymentType] || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.status")}>
                <Tag color={fine.isPaid ? "green" : fine.inspectionStatus === 2 ? "red" : "orange"}>
                  {fine.isPaid ? "Paid" : inspectionStatusMap[fine.inspectionStatus || 0] || "Unknown"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t("form.blackPoints")}>
                {(fine.blackPoint ?? fine.blackPoint === 0) ? fine.blackPoint : "0"}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16 }}>{t("form.vehicleDetails")}</h4>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.plateNumber")}>{fine.plateNumber || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.plateCategory")}>
                {fine.plateCategoryValue || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.plateSource")}>{fine.plateSourceValue || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.plateCode")}>{fine.plateCodeValue || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.vehicleColor")}>{fine.vehicleColor || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.vehicleType")}>{fine.vehicleType || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.vehicleBrand")}>{fine.vehicleBrand || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.manufacturerYear")}>
                {fine.manufacturerYear || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.vehicleOwnerName")}>
                {fine.vehicleOwnerName || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.vehicleOwnerEmail")}>
                {fine.vehicleOwnerEmail || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.vehicleOwnerMobile")}>
                {fine.vehicleOwnerMobile || "No Data"}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16 }}>{t("form.locationDetails")}</h4>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.inspectionCommunity")}>
                {fine.inspectionCommunityEn || fine.inspectionCommunityAr || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.inspectionAddress")}>
                {fine.inspectionCommunityAddressEn || fine.inspectionCommunityAddressAr || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.entityCommunity")}>
                {fine.entityCommunityEn || fine.entityCommunityAr || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.entityAddress")}>
                {fine.entityCommunityAddressEn || fine.entityCommunityAddressAr || "No Data"}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16 }}>{t("form.FineLocation")}</h4>
            {fine.latitude && fine.longitude && fine.latitude !== "string" && fine.longitude !== "string" ? (
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
              <Empty description="No Location Data Available" />
            )}

            <h4 style={{ marginTop: 16 }}>{t("form.sourceInformation")}</h4>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.sourceCode")}>{fine.sourceCode || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.sourceReference")}>
                {fine.sourceReferenceNo || "No Data"}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.deviceId")}>{fine.deviceId || "No Data"}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16 }}>{t("form.assignmentInfo")}</h4>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.assignmentId")}>{fine.assignmentGUID || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.mobiUploadId")}>{fine.mobiUploadGUID || "No Data"}</Descriptions.Item>
              <Descriptions.Item label={t("form.formRevision")}>
                {(fine.formRevisionNo ?? fine.formRevisionNo === 0) ? fine.formRevisionNo : "No Data"}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16 }}>{t("form.AttachedPhotos")}</h4>
            <Empty description="No Photos Available" />
          </>
        )}
      </Spin>
    </Drawer>
  );
};

export default FinesViewDrawer;
