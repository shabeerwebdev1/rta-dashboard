import React from "react";
import { Drawer, Descriptions } from "antd";
import { useTranslation } from "react-i18next";

interface ViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
}

const ParkonicLocationViewDrawer: React.FC<ViewDrawerProps> = ({
  open,
  onClose,
  record,
}) => {
  const { t } = useTranslation();

  return (
    <Drawer
      title={t("parkonicLocation.viewTitle")}
      open={open}
      onClose={onClose}
      width={480}
    >
      {record ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("parkonicLocation.zone")}>
            {record.zone}
          </Descriptions.Item>
          <Descriptions.Item label={t("parkonicLocation.area")}>
            {record.area}
          </Descriptions.Item>
          <Descriptions.Item label={t("parkonicLocation.street")}>
            {record.street}
          </Descriptions.Item>
          <Descriptions.Item label={t("parkonicLocation.lat")}>
            {record.lat}
          </Descriptions.Item>
          <Descriptions.Item label={t("parkonicLocation.long")}>
            {record.long}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default ParkonicLocationViewDrawer;
