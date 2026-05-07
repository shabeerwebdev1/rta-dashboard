import React, { useMemo } from "react";
import { Collapse, Descriptions, Drawer, Empty, Progress, Space, Spin, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { evaluationTypeOptions } from "../../config/pageConfigs/teamEvaluationConfig";
import { formatDateByLocale } from "../../utils/dateFormatter";

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface PersonOption {
  value: string | number;
  label?: string;
  labelEn?: string;
  labelAr?: string;
}

interface TeamEvaluationViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  criteria?: any[];
  inspectors: PersonOption[];
  supervisors: PersonOption[];
  isLoading?: boolean;
}

const MAX_SCORE_PER_CRITERION = 5;

const getEvaluationTypeLabel = (value: unknown, language: string) => {
  if (value === null || value === undefined || value === "") return "";

  const found = evaluationTypeOptions.find((item) => String(item.value).toLowerCase() === String(value).toLowerCase());

  if (!found) return String(value);
  return language === "ar" ? found.labelAr : found.labelEn;
};

const getGradeColor = (grade: unknown, score?: number) => {
  const normalized = String(grade || "").toLowerCase();

  if (normalized === "excellent") return "green";
  if (normalized === "good") return "blue";
  if (normalized === "fair") return "orange";
  if (normalized === "unsatisfactory") return "red";

  if (typeof score === "number" && Number.isFinite(score)) {
    if (score >= 90) return "green";
    if (score >= 75) return "blue";
    if (score >= 50) return "orange";
    return "red";
  }

  return "default";
};

const getProgressStatus = (score: number): "success" | "normal" | "exception" => {
  if (score >= 80) return "success";
  if (score >= 60) return "normal";
  return "exception";
};

const getCriteriaScoreColor = (score: number) => {
  if (score >= 4) return "green";
  if (score >= 3) return "blue";
  if (score >= 2) return "orange";
  return "red";
};

const TeamEvaluationViewDrawer: React.FC<TeamEvaluationViewDrawerProps> = ({
  open,
  onClose,
  record,
  criteria = [],
  inspectors,
  supervisors,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const getPersonName = (id: unknown, options: PersonOption[], fallbackEn?: string, fallbackAr?: string) => {
    if (i18n.language === "ar" && fallbackAr) return fallbackAr;
    if (fallbackEn) return fallbackEn;

    const option = options.find((item) => String(item.value) === String(id));
    if (!option) return id ? String(id) : t("common.noData");

    if (i18n.language === "ar") return option.labelAr || option.label || option.labelEn || String(option.value);
    return option.labelEn || option.label || option.labelAr || String(option.value);
  };

  const formatDate = (value: unknown, withTime = false) => {
    const formatted = formatDateByLocale(
      value as string | number | Date,
      withTime ? { en: "DD MMM YYYY, h:mm A", ar: "DD MMM YYYY، h:mm A" } : { en: "DD MMM YYYY", ar: "DD MMM YYYY" },
      i18n.language,
    );

    return formatted || t("common.noData");
  };

  const criteriaScoresList = useMemo(() => {
    if (!record) return [];

    if (Array.isArray(record.criteriaDetails) && record.criteriaDetails.length > 0) {
      return record.criteriaDetails.map((criteriaDetail: any) => ({
        id: criteriaDetail.id,
        criteriaName: criteriaDetail.criteriaName,
        weight: criteriaDetail.weight,
        scoreValue: criteriaDetail.score,
        comments: criteriaDetail.comments || "",
      }));
    }

    if (Array.isArray(record.criteriaScores) && record.criteriaScores.length > 0) {
      return record.criteriaScores.map((score: any) => {
        const matchedCriteria = criteria.find((item) => String(item.id) === String(score.criteriaId));

        return {
          id: score.criteriaId,
          criteriaName:
            i18n.language === "ar"
              ? matchedCriteria?.descriptionAr || score.criteriaName
              : matchedCriteria?.descriptionEn || score.criteriaName,
          weight: matchedCriteria?.weight || score.weight,
          scoreValue: score.score,
          comments: score.comments || "",
        };
      });
    }

    return [];
  }, [criteria, i18n.language, record]);

  if (!record) return null;

  const totalScore = Number(record.totalScore || 0);
  const evaluationPeriod =
    record.fromDate || record.toDate || record.periodFrom || record.periodTo
      ? `${formatDate(record.fromDate || record.periodFrom)} - ${formatDate(record.toDate || record.periodTo)}`
      : t("common.noData");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={t("page.viewTitle", { entity: t("entity.evaluation") })}
      placement={isRtl ? "left" : "right"}
      className="team-evaluation-drawer"
    >
      <Spin spinning={isLoading}>
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label={t("form.inspectorName")}>
            {getPersonName(record.inspectorId, inspectors, record.inspectorName, record.inspectorNameAr)}
          </Descriptions.Item>

          <Descriptions.Item label={t("form.evaluationDate")}>{formatDate(record.evaluationDate)}</Descriptions.Item>

          <Descriptions.Item label={t("form.evaluationType")}>
            {getEvaluationTypeLabel(record.evaluationType, i18n.language) || t("common.noData")}
          </Descriptions.Item>

          <Descriptions.Item label={t("form.criteriaGroup")}>
            {(() => {
              const groupName_EN = record.groupName_EN || record.groupName;
              const groupName_AR = record.groupName_AR || record.groupName;
              return getPersonName(null, [], groupName_EN, groupName_AR);
            })()}
          </Descriptions.Item>

          <Descriptions.Item label={t("form.evaluationPeriod")}>{evaluationPeriod}</Descriptions.Item>

          <Descriptions.Item label={t("form.totalScore")}>
            <Progress
              percent={totalScore}
              status={getProgressStatus(totalScore)}
              size="small"
              format={(percent) => `${percent}%`}
            />
          </Descriptions.Item>

          <Descriptions.Item label={t("form.grade")}>
            {record.grade ? (
              <Tag color={getGradeColor(record.grade, totalScore)}>{record.grade}</Tag>
            ) : (
              t("common.noData")
            )}
          </Descriptions.Item>

          <Descriptions.Item label={t("form.notes")}>
            <Text style={{ whiteSpace: "pre-wrap" }}>{record.supervisorNotes || t("common.noData")}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginBottom: 12 }}>
          {t("form.evaluationCriteria")}
        </Title>

        {criteriaScoresList.length > 0 ? (
          <Collapse defaultActiveKey={[]}>
            {criteriaScoresList.map((score: any, index: number) => (
              <Panel
                key={String(index)}
                header={score.criteriaName || t("common.noData")}
                extra={
                  <Tag color={getCriteriaScoreColor(Number(score.scoreValue || 0))}>
                    {score.scoreValue || 0}/{MAX_SCORE_PER_CRITERION}
                  </Tag>
                }
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t("form.score")}>
                    {score.scoreValue || 0}/{MAX_SCORE_PER_CRITERION}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("form.weight")}>{score.weight || 0}%</Descriptions.Item>
                  <Descriptions.Item label={t("form.comments")}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Text style={{ whiteSpace: "pre-wrap" }}>{score.comments || t("common.noData")}</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Empty description={t("common.noData")} />
        )}
      </Spin>
    </Drawer>
  );
};

export default TeamEvaluationViewDrawer;
