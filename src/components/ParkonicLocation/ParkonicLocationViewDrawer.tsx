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
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <Drawer
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      open={open}
      onClose={onClose}
      width={500}
      extra={
        <Button icon={<ShareAltOutlined />} onClick={onShare}>
          {t("common.share")}
        </Button>
      }
      placement={isRtl ? "left" : "right"}
    >
      {record ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("form.zone")}>{record.zone}</Descriptions.Item>
          <Descriptions.Item label={t("form.area")}>{record.area}</Descriptions.Item>
          <Descriptions.Item label={t("form.lat")}>{record.latitude}</Descriptions.Item>
          <Descriptions.Item label={t("form.long")}>{record.longitude}</Descriptions.Item>
        </Descriptions>
      ) : (
        <p>{t("common.noData")}</p>
      )}
    </Drawer>
  );
};

export default ParkonicLocationViewDrawer;
