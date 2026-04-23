import React from "react";
import { Drawer, Descriptions, Collapse, Tag, Progress } from "antd";
import { useTranslation } from "react-i18next";
import { staticLookupData } from "../../config/pageConfigs/teamEvaluationConfig";
import { formatDateByLocale } from "../../utils/dateFormatter";

const { Panel } = Collapse;

interface TeamEvaluationViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any | null;
  criteria: any[];
}

const MAX_SCORE_PER_CRITERION = 5;

// Helper: Get label from static lookup
const getLabel = (value: string, category: string, i18n: any) => {
  const arr: any[] = staticLookupData[category] || [];
  const found = arr.find((i) => i.value === value);
  if (!found) return value;

  return i18n.language === "ar" ? found.labelAr : found.labelEn;
};

const TeamEvaluationViewDrawer: React.FC<TeamEvaluationViewDrawerProps> = ({
  open,
  onClose,
  record,
  criteria,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  if (!record) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      placement={isRtl ? "left" : "right"}
      title={t("common.viewEvaluation")}
    >
      <Descriptions column={2} bordered>
        <Descriptions.Item label={t("form.inspectorName")} span={2}>
          {record.inspectorName}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.evaluationDate")}>
          {formatDateByLocale(record.evaluationDate, { en: "DD MMM YYYY", ar: "DD MMM YYYY" }, i18n.language)}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.evaluationType")}>
          {getLabel(record.evaluationType, "evaluationTypes", i18n)}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.evaluationPeriod")}>
          {formatDateByLocale(record.periodFrom, { en: "DD MMM YYYY", ar: "DD MMM YYYY" }, i18n.language)} -{" "}
          {formatDateByLocale(record.periodTo, { en: "DD MMM YYYY", ar: "DD MMM YYYY" }, i18n.language)}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.zone")}>
          {getLabel(record.zone, "zones", i18n)}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.status")}>
          <Tag
            color={
              record.status === "approved"
                ? "green"
                : record.status === "completed"
                ? "blue"
                : "orange"
            }
          >
            {getLabel(record.status, "statuses", i18n)}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label={t("form.totalScore")} span={2}>
          <Progress
            percent={record.totalScore}
            status={
              record.totalScore >= 80
                ? "success"
                : record.totalScore >= 60
                ? "normal"
                : "exception"
            }
            format={(p) => `${p}%`}
          />
        </Descriptions.Item>

        <Descriptions.Item label={t("form.grade")}>
          <Tag
            color={
              record.grade === "excellent"
                ? "green"
                : record.grade === "very-good"
                ? "blue"
                : record.grade === "good"
                ? "cyan"
                : record.grade === "satisfactory"
                ? "orange"
                : "red"
            }
          >
            {getLabel(record.grade, "grades", i18n)}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label={t("form.evaluatorName")}>
          {record.evaluatorName}
        </Descriptions.Item>

        <Descriptions.Item label={t("form.supervisorNotes")} span={2}>
          {record.supervisorNotes || t("common.noData")}
        </Descriptions.Item>

        {/* Criteria */}
        <Descriptions.Item label={t("form.evaluationCriteria")} span={2}>
          <Collapse>
            {record.criteriaScores?.map((score: any, idx: number) => {
              const crit = criteria.find((c) => c.id === score.criteriaId);
              if (!crit) return null;
              return (
                <Panel
                  key={idx}
                  header={i18n.language === "ar" ? crit.descriptionAr : crit.descriptionEn}
                  extra={
                    <Tag>
                      {score.score}/{MAX_SCORE_PER_CRITERION}
                    </Tag>
                  }
                >
                  <p>
                    <strong>{t("form.comments")}:</strong> {score.comments || t("common.noData")}
                  </p>
                  <p>
                    <strong>{t("form.weight")}:</strong> {crit.weight}%
                  </p>
                </Panel>
              );
            })}
          </Collapse>
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default TeamEvaluationViewDrawer;
