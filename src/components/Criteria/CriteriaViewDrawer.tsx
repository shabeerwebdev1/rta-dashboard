/* eslint-disable react/prop-types */
import { Drawer, Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";

const CriteriaViewDrawer = ({ open, onClose, record }) => {
  const { t } = useTranslation();

  if (!record) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("common.viewCriteria")}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label={t("form.descriptionEn")}>
          {record.descriptionEn}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.descriptionAr")}>
          {record.descriptionAr}
        </Descriptions.Item>

        {/* <Descriptions.Item label={t("form.objectiveType")}>
          <Tag>{getLabel(record.objectiveType, "objectiveTypes")}</Tag>
        </Descriptions.Item> */}

        <Descriptions.Item label={t("form.weight")}>
          {record.weight}%
        </Descriptions.Item>

        {/* <Descriptions.Item label={t("form.ratingScale")}>
          {record.ratingScale}
        </Descriptions.Item> */}

        <Descriptions.Item label={t("form.isActive")}>
          {record.isActive ? (
            <Tag color="green">{t("common.active")}</Tag>
          ) : (
            <Tag color="red">{t("common.inactive")}</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default CriteriaViewDrawer;
