import React from "react";
import { Drawer, Descriptions, Tag, Typography, Badge } from "antd";
import type { WhitelistPlateResponseDto } from "../../../types/api";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

interface WhitelistPlateViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: WhitelistPlateResponseDto | null;
}

const WhitelistPlateViewDrawer: React.FC<WhitelistPlateViewDrawerProps> = ({
  open,
  onClose,
  record,
}) => {
  const { t } = useTranslation();

  if (!record) {
    return null;
  }

  const title = t("whitelist.plate.viewTitle");

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
      >{`Details for: ${record.plateNumber}`}</Title>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label={t("form.plateNumber")}>
          {record.plateNumber || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.plateSource")}>
          {record.plateSource || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.plateType")}>
          {record.plateType || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("form.plateColor")}>
          {record.plateColor ? (
            <Badge
              color={record.plateColor.toLowerCase()}
              text={record.plateColor}
            />
          ) : (
            "-"
          )}
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

export default WhitelistPlateViewDrawer;
