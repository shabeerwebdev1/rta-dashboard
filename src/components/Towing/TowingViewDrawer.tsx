import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space, App } from "antd";
import { TowingStatus } from "../../config/pageConfigs/towingConfig";
import { useUpdateLeaveStatusMutation } from "../../services/rtkApiFactory"; // ✅ replace later with towing mutation
import { t } from "i18next";

interface TowingViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const TowingViewDrawer: React.FC<TowingViewDrawerProps> = ({ open, onClose, record }) => {
  const { notification } = App.useApp();
  const [updateLeaveStatus, { isLoading }] = useUpdateLeaveStatusMutation(); // ✅ replace later with towing mutation

  const [status, setStatus] = useState<number>(record?.status ?? TowingStatus.Pending);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
    }
  }, [record]);

  const handleUpdateStatus = async (newStatus: TowingStatus) => {
    const towingId = record?.towingId || record?.id;

    if (!towingId) {
      notification.error({ message: "Missing towing ID" });
      return;
    }

    try {
      await updateLeaveStatus({ id: towingId, status: newStatus }).unwrap(); // ✅ same for now
      setStatus(newStatus);
      notification.success({ message: `Towing updated to ${TowingStatus[newStatus]}` });
      onClose();
    } catch (err: any) {
      notification.error({ message: err?.data?.message || "Failed to update towing" });
    }
  };

  return (
    <Drawer
      open={open}
      width={500}
      onClose={onClose}
      title="Towing Details"
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {record ? (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label={t("form.vehicleName")}>
            {record.vehicleName}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.vehiclePlateNumber")}>
            {record.vehiclePlateNumber}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.towingDriverName")}>
            {record.towingDriverName}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.addedBy")}>
            {record.addedBy}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.status")}>
            <Tag
              color={
                status === TowingStatus.Approved
                  ? "green"
                  : status === TowingStatus.Pending
                  ? "blue"
                  : status === TowingStatus.Cancelled
                  ? "orange"
                  : "red"
              }
            >
              {TowingStatus[status]}
            </Tag>
          </Descriptions.Item>

          {status !== TowingStatus.Approved && (
            <Descriptions.Item label={t("form.actions")}>
              <Space>
                <Button
                  type="primary"
                  loading={isLoading}
                  onClick={() => handleUpdateStatus(TowingStatus.Approved)}
                >
                  {t("form.approve")}
                </Button>
                <Button
                  danger
                  loading={isLoading}
                  onClick={() => handleUpdateStatus(TowingStatus.Rejected)}
                >
                  {t("form.reject")}
                </Button>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      ) : (
        <p>No Data</p>
      )}
    </Drawer>
  );
};

export default TowingViewDrawer;
