import React from "react";
import { Drawer, Descriptions, Tag, Typography } from "antd";
import type { WhitelistTradeLicenseResponseDto } from "../../../types/api";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

interface WhitelistTradeLicenseViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: WhitelistTradeLicenseResponseDto | null;
}

const WhitelistTradeLicenseViewDrawer: React.FC<
  WhitelistTradeLicenseViewDrawerProps
> = ({ open, onClose, record }) => {
  const { t } = useTranslation();

  if (!record) {
    return null;
  }

  const title = t("whitelist.trade.viewTitle");

  return (
    <Drawer
      title={title}
      placement="right"
      width={500}
      onClose={onClose}
      open={open}
    >
      <Title
        level={5}
        style={{ marginTop: 0, marginBottom: "20px" }}
      >{`Details for: ${record.tradeLicenseNumber}`}</Title>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label={t("form.tradeLicenseNumber")}>
          {record.tradeLicenseNumber || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.tradeLicense_EN_Name")}>
          {record.tradeLicense_EN_Name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.tradeLicense_AR_Name")}>
          {record.tradeLicense_AR_Name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.plotNumber")}>
          {record.plotNumber || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.startDate")}>
          {record.fromDate
            ? dayjs(record.fromDate).format("DD MMMM, YYYY")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.endDate")}>
          {record.toDate ? dayjs(record.toDate).format("DD MMMM, YYYY") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.plateStatus")}>
          {record.plateStatus ? (
            <Tag
              color={
                record.plateStatus.toLowerCase() === "active" ? "green" : "red"
              }
            >
              {record.plateStatus}
            </Tag>
          ) : (
            "-"
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.exemptionReason")}>
          {record.exemptionReason_EN || "-"}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default WhitelistTradeLicenseViewDrawer;
