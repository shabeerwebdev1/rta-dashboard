/* eslint-disable react/prop-types */
import { Drawer, Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateByLocale } from "../../utils/dateFormatter";

const ProactiveCampaignViewDrawer = ({ open, onClose, record, getLabel }) => {
  const { t, i18n } = useTranslation();

  if (!record) return null;

  return (
    <Drawer open={open} onClose={onClose} width={500} title={t("common.viewCampaign")}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label={t("form.titleEn")}>{record.titleEn}</Descriptions.Item>

        <Descriptions.Item label={t("form.titleAr")}>{record.titleAr}</Descriptions.Item>

        <Descriptions.Item label={t("form.timeInterval")}>
          {formatDateByLocale(record.startTime, { en: "DD MMM YYYY HH:mm", ar: "DD MMM YYYY HH:mm" }, i18n.language)} -{" "}
          {formatDateByLocale(record.endTime, { en: "DD MMM YYYY HH:mm", ar: "DD MMM YYYY HH:mm" }, i18n.language)}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.violationTypes")}>
          {(record.violationTypes || []).map((v: string) => (
            <Tag key={v}>{getLabel(v, "violationTypes")}</Tag>
          ))}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.notificationMessageEn")}>{record.notificationMessageEn}</Descriptions.Item>

        <Descriptions.Item label={t("form.notificationMessageAr")}>{record.notificationMessageAr}</Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default ProactiveCampaignViewDrawer;
