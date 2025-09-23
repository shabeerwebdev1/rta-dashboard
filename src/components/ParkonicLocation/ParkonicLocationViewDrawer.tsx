import React from "react";
import { Drawer, Descriptions, Button, Space } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ParkonicLocationViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  config: any;
  onShare?: () => void;
}

const ParkonicLocationViewDrawer: React.FC<ParkonicLocationViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
}) => {
  const { t } = useTranslation();

  const title = (
    <Space>
      <span>{t("parkonicLocation.viewTitle")}</span>
      {onShare && (
        <Button
          type="text"
          icon={<ShareAltOutlined />}
          onClick={onShare}
          size="small"
        >
          {t("common.share")}
        </Button>
      )}
    </Space>
  );

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={480}
    >
      {record ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("form.zone")}>
            {record.zone}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.area")}>
            {record.area}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.street")}>
            {record.street}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.latitude")}>
            {record.latitude}
          </Descriptions.Item>
          <Descriptions.Item label={t("form.longitude")}>
            {record.longitude}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default ParkonicLocationViewDrawer;