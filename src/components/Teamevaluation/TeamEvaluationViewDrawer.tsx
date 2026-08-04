import React, { useMemo } from "react";
import { Button, Collapse, Descriptions, Empty, Modal, Progress, Space, Spin, Tag, Typography } from "antd";
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

const getGradeLabel = (grade: unknown, language: string) => {
  if (grade === null || grade === undefined || grade === "") return "";
  const gradeLabels: Record<string, { en: string; ar: string }> = {
    excellent: { en: "Excellent", ar: "ممتاز" },
    good: { en: "Good", ar: "جيد" },
    fair: { en: "Fair", ar: "مقبول" },
    unsatisfactory: { en: "Unsatisfactory", ar: "غير مُرضٍ" },
  };
  const key = String(grade).toLowerCase();
  const found = gradeLabels[key];
  if (!found) return String(grade);
  return language === "ar" ? found.ar : found.en;
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

    const rawScores =
      (Array.isArray(record.criteriaDetails) && record.criteriaDetails.length > 0 && record.criteriaDetails) ||
      (Array.isArray(record.criteriaScores) && record.criteriaScores.length > 0 && record.criteriaScores) ||
      (Array.isArray(record.criteria) && record.criteria.length > 0 && record.criteria) ||
      [];

    if (rawScores.length > 0) {
      return rawScores.map((scoreDetail: any) => {
        const itemCriteriaId = scoreDetail.criteriaId || scoreDetail.id;
        const matchedCriteria = criteria.find(
          (item) => String(item.id).toLowerCase() === String(itemCriteriaId || "").toLowerCase(),
        );

        const scoreVal = scoreDetail.score !== undefined ? scoreDetail.score : (scoreDetail.scoreValue ?? 0);
        const nameVal =
          scoreDetail.criteriaName ||
          (i18n.language === "ar"
            ? matchedCriteria?.descriptionAr || scoreDetail.descriptionAr
            : matchedCriteria?.descriptionEn || scoreDetail.descriptionEn) ||
          "";

        return {
          id: itemCriteriaId,
          criteriaName: nameVal,
          weight: matchedCriteria?.weight || scoreDetail.weight || 0,
          scoreValue: scoreVal,
          comments: scoreDetail.comments || "",
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
    <Modal
      open={open}
      onCancel={onClose}
      width={750}
      title={t("page.viewTitle", { entity: t("entity.evaluation") })}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          {t("common.close")}
        </Button>,
      ]}
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 4,
        },
      }}
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
              <Tag color={getGradeColor(record.grade, totalScore)}>{getGradeLabel(record.grade, i18n.language)}</Tag>
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
    </Modal>
  );
};

export default TeamEvaluationViewDrawer;
