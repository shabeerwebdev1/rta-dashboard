/* eslint-disable no-shadow-restricted-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * TeamEvaluationPage.tsx
 *
 * Fixed and completed Team Evaluation page.
 * - Fixed drawer opening issue
 * - Option B logic: selecting multiple inspectors creates ONE evaluation record PER inspector
 * - Uses static data from teamEvaluationConfig.tsx
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  App,
  Tag,
  Divider,
  Rate,
  Collapse,
  message,
  Descriptions,
  Progress,
  Table,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import StatsDisplay from "../components/common/StatsDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { formatDateByLocale } from "../utils/dateFormatter";
import {
  teamEvaluationConfig,
  staticEvaluationsData as seedEvaluations,
  staticEvaluationCriteria,
  staticLookupData,
} from "../config/pageConfigs/teamEvaluationConfig";
import TeamEvaluationViewDrawer from "../components/Teamevaluation/TeamEvaluationViewDrawer";

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

const MAX_SCORE_PER_CRITERION = 5;
const SCORE_OPTIONS = [
  {
    value: 1,
    labelEn: "Poor",
    labelAr: "ضعيف",
    descriptionEn: "Does not meet expectations",
    descriptionAr: "لا يلبي التوقعات",
  },
  {
    value: 2,
    labelEn: "Below Average",
    labelAr: "أقل من المتوسط",
    descriptionEn: "Needs improvement",
    descriptionAr: "يحتاج إلى تحسين",
  },
  {
    value: 3,
    labelEn: "Average",
    labelAr: "متوسط",
    descriptionEn: "Meets expectations",
    descriptionAr: "يلبي التوقعات",
  },
  {
    value: 4,
    labelEn: "Good",
    labelAr: "جيد",
    descriptionEn: "Often exceeds expectations",
    descriptionAr: "غالبا ما يتجاوز التوقعات",
  },

  {
    value: 5,
    labelEn: "Excellent",
    labelAr: "ممتاز",
    descriptionEn: "Exceeds expectations consistently",
    descriptionAr: "يتجاوز التوقعات باستمرار",
  },
];

const TeamEvaluationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const [form] = Form.useForm();

  // UI state
  const [evaluations, setEvaluations] = useState<any[]>(seedEvaluations);
  const [criteria, setCriteria] = useState<any[]>(staticEvaluationCriteria);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);

  // Filters / search
  const [searchValue, setSearchValue] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // page title
  useEffect(() => {
    setPageTitle(t(teamEvaluationConfig.title));
  }, [setPageTitle, t]);

  // Helper: get label from staticLookupData
  const getLabel = (value: string, category: string) => {
    const arr = (staticLookupData as any)[category];
    if (!arr) return value;
    const found = arr.find((i: any) => i.value === value);
    if (!found) return value;
    return i18n.language === "ar" ? found.labelAr : found.labelEn;
  };

  // Filtering evaluations based on search, date range, filters
  const filteredEvaluations = useMemo(() => {
    let list = [...evaluations];

    if (searchValue) {
      const q = searchValue.toLowerCase();
      list = list.filter(
        (e) =>
          String(e.inspectorName || "")
            .toLowerCase()
            .includes(q) ||
          String(e.evaluatorName || "")
            .toLowerCase()
            .includes(q),
      );
    }

    if (dateRange) {
      const [start, end] = dateRange;
      list = list.filter((e) => {
        const d = dayjs(e.evaluationDate);
        return d.isSame(start, "day") || d.isSame(end, "day") || (d.isAfter(start) && d.isBefore(end));
      });
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        list = list.filter((e) => e[key] === value);
      }
    });

    return list;
  }, [evaluations, searchValue, dateRange, filters]);

  // Stats metadata for stats widgets
  const statsMetadata = useMemo(
    () => ({
      totalRecords: evaluations.length,
      completedRecords: evaluations.filter((e) => e.status === "completed").length,
      pendingRecords: evaluations.filter((e) => e.status === "pending").length,
      approvedRecords: evaluations.filter((e) => e.status === "approved").length,
    }),
    [evaluations],
  );

  // Calculate total score correctly using weights
  const calculateTotalScore = (criteriaScores: { criteriaId: number; score: number }[]) => {
    if (!criteriaScores || criteriaScores.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    criteriaScores.forEach((s) => {
      const crit = criteria.find((c) => c.id === s.criteriaId);
      if (crit && crit.isActive) {
        const weight = Number(crit.weight) || 0;
        weightedSum += s.score * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight <= 0) return 0;

    const percent = (weightedSum / (totalWeight * MAX_SCORE_PER_CRITERION)) * 100;
    return Number(percent.toFixed(2));
  };

  // Determine grade based on percent using lookup
  const determineGrade = (percent: number) => {
    const grade = staticLookupData.grades.find((g) => percent >= g.minScore && percent <= g.maxScore);
    return grade ? grade.value : "needs-improvement";
  };

  // Open modal for add or edit
  const openModal = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);

    if (mode === "edit" && record) {
      form.setFieldsValue({
        inspectorIds: [record.inspectorId],
        supervisorId: record.supervisorId,
        evaluationDate: dayjs(record.evaluationDate),
        evaluationType: record.evaluationType,
        evaluationPeriod: [dayjs(record.periodFrom), dayjs(record.periodTo)],
        zone: record.zone,
        supervisorNotes: record.supervisorNotes,
        ...record.criteriaScores?.reduce((acc: any, cs: any) => {
          acc[`criteria_${cs.criteriaId}`] = cs.score;
          acc[`comments_${cs.criteriaId}`] = cs.comments;
          return acc;
        }, {}),
      });
    } else {
      form.resetFields();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  // Submit form: Option B -> create one evaluation per selected inspector
  const onFinish = (values: any) => {
    const { inspectorIds, supervisorId, evaluationDate, evaluationType, evaluationPeriod, zone, supervisorNotes } =
      values;

    if (!inspectorIds || inspectorIds.length === 0) {
      message.error(t("validation.selectRequired", { field: t("form.inspector") }));
      return;
    }

    // Build criteriaScores from form values
    const criteriaScores = criteria
      .filter((c) => c.isActive)
      .map((c) => ({
        criteriaId: c.id,
        score: Number(values[`criteria_${c.id}`] ?? 0),
        comments: values[`comments_${c.id}`] ?? "",
      }));

    // For each selected inspector create a separate evaluation record
    const newRecords: any[] = inspectorIds.map((inspectorId: number) => {
      const inspectorLookup = staticLookupData.inspectors.find((i) => i.value === inspectorId);
      const inspectorName = inspectorLookup
        ? i18n.language === "ar"
          ? inspectorLookup.labelAr
          : inspectorLookup.labelEn
        : String(inspectorId);

      const totalScore = calculateTotalScore(criteriaScores);
      const grade = determineGrade(totalScore);

      return {
        id: modalMode === "add" ? Math.max(0, ...evaluations.map((e) => e.id)) + 1 : selectedRecord?.id,
        inspectorName,
        inspectorId,
        evaluationDate: evaluationDate.format("YYYY-MM-DD"),
        evaluationType,
        totalScore,
        grade,
        evaluatorName: "System User",
        supervisorName:
          (staticLookupData.supervisors.find((s) => s.value === supervisorId) || {}).labelEn || String(supervisorId),
        supervisorId,
        zone,
        status: modalMode === "add" ? "pending" : (selectedRecord?.status ?? "pending"),
        periodFrom: evaluationPeriod[0].format("YYYY-MM-DD"),
        periodTo: evaluationPeriod[1].format("YYYY-MM-DD"),
        criteriaScores,
        supervisorNotes,
        createdAt: new Date().toISOString(),
      };
    });

    if (modalMode === "add") {
      setEvaluations((prev) => [...newRecords, ...prev]);
      message.success(t("messages.addSuccess", { entity: t(teamEvaluationConfig.name.singular) }));
    } else {
      setEvaluations((prev) => {
        const updated = [...prev];
        newRecords.forEach((rec) => {
          const idx = updated.findIndex((e) => e.id === rec.id);
          if (idx >= 0) updated[idx] = rec;
          else updated.unshift(rec);
        });
        return updated;
      });
      message.success(t("messages.updateSuccess", { entity: t(teamEvaluationConfig.name.singular) }));
    }

    closeModal();
  };

  // View record - FIXED: Properly sets the record
  const handleView = (record: any) => {
    console.log("Opening drawer for record:", record);
    setViewRecord(record);
    setIsViewOpen(true);
  };

  // Approve / Return actions
  const handleApprove = (record: any) => {
    modal.confirm({
      title: t("messages.approveConfirmTitle"),
      content: t("messages.approveConfirmContent"),
      onOk: () => {
        setEvaluations((prev) => prev.map((r) => (r.id === record.id ? { ...r, status: "approved" } : r)));
        message.success(t("messages.approveSuccess"));
      },
    });
  };

  const handleReturn = (record: any) => {
    modal.confirm({
      title: t("messages.returnConfirmTitle"),
      content: t("messages.returnConfirmContent"),
      onOk: () => {
        setEvaluations((prev) => prev.map((r) => (r.id === record.id ? { ...r, status: "pending" } : r)));
        message.success(t("messages.returnSuccess"));
      },
    });
  };

  // Download CSV of selected rows
  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t("messages.selectRows"));
      return;
    }
    const selected = filteredEvaluations.filter((e) => selectedRowKeys.includes(e.id));
    const csvData = selected.map((ev) => ({
      [t("form.inspectorName")]: ev.inspectorName,
      [t("form.evaluationDate")]: ev.evaluationDate,
      [t("form.evaluationType")]: getLabel(ev.evaluationType, "evaluationTypes"),
      [t("form.totalScore")]: ev.totalScore,
      [t("form.grade")]: getLabel(ev.grade, "grades"),
      [t("form.evaluatorName")]: ev.evaluatorName,
      [t("form.zone")]: getLabel(ev.zone, "zones"),
      [t("form.status")]: getLabel(ev.status, "statuses"),
    }));
    exportToCsv(csvData, `team-evaluations-${dayjs().format("YYYY-MM-DD")}.csv`);
    message.success(t("messages.exportSuccess"));
  };

  // Render dynamic criteria form block used inside modal
  const renderCriteriaForm = () => (
    <div style={{ marginBottom: 24 }}>
      <Divider orientation="left">
        <TeamOutlined /> {t("form.evaluationCriteria")}
      </Divider>

      <Collapse defaultActiveKey={[]}>
        {criteria
          .filter((c) => c.isActive)
          .map((criterion) => (
            <Panel
              header={i18n.language === "ar" ? criterion.descriptionAr : criterion.descriptionEn}
              key={String(criterion.id)}
              extra={<Tag>Weight: {criterion.weight}%</Tag>}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={8}>
                  <Form.Item
                    name={`criteria_${criterion.id}`}
                    label={t("form.score")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.score") }) }]}
                  >
                    <Select placeholder={t("placeholders.score")}>
                      {SCORE_OPTIONS.map((option) => (
                        <Option key={option.value} value={option.value}>
                          <div>
                            <text>
                              {option.value} - {i18n.language === "ar" ? option.labelAr : option.labelEn}
                            </text>
                            {/* <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}>
                              {i18n.language === "ar" ? option.descriptionAr : option.descriptionEn}
                            </div> */}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={16}>
                  <Form.Item name={`comments_${criterion.id}`} label={t("form.comments")}>
                    <TextArea placeholder={t("placeholders.comments")} rows={2} />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>
          ))}
      </Collapse>
    </div>
  );

  // Table columns config - FIXED: Proper render function signature
  const tableColumns = [
    {
      title: t("form.inspectorName"),
      dataIndex: "inspectorName",
      key: "inspectorName",
    },
    {
      title: t("form.evaluationDate"),
      dataIndex: "evaluationDate",
      key: "evaluationDate",
      render: (d: string) => formatDateByLocale(d, { en: "DD/MM/YYYY", ar: "DD/MM/YYYY" }, i18n.language),
    },
    {
      title: t("form.evaluationType"),
      dataIndex: "evaluationType",
      key: "evaluationType",
      render: (type: string) => {
        const color = type === "monthly" ? "blue" : type === "yearly" ? "purple" : "orange";
        return <Tag color={color}>{getLabel(type, "evaluationTypes")}</Tag>;
      },
    },
    {
      title: t("form.totalScore"),
      dataIndex: "totalScore",
      key: "totalScore",
      render: (s: number) => <strong>{s}%</strong>,
    },
    {
      title: t("form.grade"),
      dataIndex: "grade",
      key: "grade",
      render: (g: string) => {
        const color =
          g === "excellent"
            ? "green"
            : g === "very-good"
              ? "blue"
              : g === "good"
                ? "cyan"
                : g === "satisfactory"
                  ? "orange"
                  : "red";
        return <Tag color={color}>{getLabel(g, "grades")}</Tag>;
      },
    },
    {
      title: t("form.evaluatorName"),
      dataIndex: "evaluatorName",
      key: "evaluatorName",
    },
    {
      title: t("form.zone"),
      dataIndex: "zone",
      key: "zone",
      render: (z: string) => getLabel(z, "zones"),
    },
    {
      title: t("form.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "approved" ? "green" : status === "completed" ? "blue" : "orange";
        const icon =
          status === "approved" || status === "completed" ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {getLabel(status, "statuses")}
          </Tag>
        );
      },
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (
        _: any,
        record: any, // FIXED: Proper signature to receive record
      ) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            {t("common.view")}
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openModal("edit", record)}
            disabled={record?.status === "approved"}
          >
            {t("common.edit")}
          </Button>
        </Space>
      ),
    },
  ];

  // Render
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={teamEvaluationConfig.statsConfig}
        data={filteredEvaluations}
        metadata={statsMetadata}
        loading={false}
      />

      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Input
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <DatePicker.RangePicker
                value={dateRange}
                format={"DD MMM YYYY"}
                placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                onChange={(vals) => setDateRange(vals as any)}
              />
              <Select
                placeholder={t("form.status")}
                style={{ width: 150 }}
                allowClear
                onChange={(v) => setFilters((prev: any) => ({ ...prev, status: v }))}
              >
                {staticLookupData.statuses.map((s) => (
                  <Option key={s.value} value={s.value}>
                    {i18n.language === "ar" ? s.labelAr : s.labelEn}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder={t("form.evaluationType")}
                style={{ width: 150 }}
                allowClear
                onChange={(v) => setFilters((prev: any) => ({ ...prev, evaluationType: v }))}
              >
                {staticLookupData.evaluationTypes.map((et) => (
                  <Option key={et.value} value={et.value}>
                    {i18n.language === "ar" ? et.labelAr : et.labelEn}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv")}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("add")}>
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* FIXED: Using Ant Design Table instead of plain HTML table */}
      <Card>
        <Table
          dataSource={filteredEvaluations}
          columns={tableColumns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <FileTextOutlined style={{ fontSize: "48px", color: "#ddd", marginBottom: "16px" }} />
                <p>{t("common.noData")}</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* Modal: Add / Edit Evaluation */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", {
          entity: t(teamEvaluationConfig.name.singular),
        })}
        onCancel={closeModal}
        style={{ top: 20 }}
        width={teamEvaluationConfig.formConfig?.modalWidth || "800px"}
        footer={[
          <Button key="back" onClick={closeModal}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="inspectorIds"
                label={t("form.inspector")}
                rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.inspector") }) }]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  placeholder={t("placeholders.selectInspector")}
                  optionFilterProp="label"
                  allowClear
                >
                  {staticLookupData.inspectors.map((ins) => (
                    <Option key={ins.value} value={ins.value}>
                      {i18n.language === "ar" ? ins.labelAr : ins.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="supervisorId"
                label={t("form.supervisor")}
                rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.supervisor") }) }]}
              >
                <Select placeholder={t("placeholders.selectSupervisor")} optionFilterProp="label">
                  {staticLookupData.supervisors.map((s) => (
                    <Option key={s.value} value={s.value}>
                      {i18n.language === "ar" ? s.labelAr : s.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="evaluationDate"
                label={t("form.evaluationDate")}
                rules={[
                  { required: true, message: t("validation.selectRequired", { field: t("form.evaluationDate") }) },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" placeholder={t("placeholders.selectDate")} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="evaluationType"
                label={t("form.evaluationType")}
                rules={[
                  { required: true, message: t("validation.selectRequired", { field: t("form.evaluationType") }) },
                ]}
              >
                <Select placeholder={t("placeholders.selectEvaluationType")}>
                  {staticLookupData.evaluationTypes
                    .filter((et) => et.value === "monthly" || et.value === "yearly")
                    .map((et) => (
                      <Option key={et.value} value={et.value}>
                        {i18n.language === "ar" ? et.labelAr : et.labelEn}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="evaluationPeriod"
                label={t("form.evaluationPeriod")}
                rules={[
                  { required: true, message: t("validation.selectRequired", { field: t("form.evaluationPeriod") }) },
                ]}
              >
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  format="DD MMM YYYY"
                  placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="zone"
                label={t("form.zone")}
                rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.zone") }) }]}
              >
                <Select placeholder={t("placeholders.selectZone")}>
                  {staticLookupData.zones.map((z) => (
                    <Option key={z.value} value={z.value}>
                      {i18n.language === "ar" ? z.labelAr : z.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Criteria Section */}
          {renderCriteriaForm()}

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="supervisorNotes" label={t("form.supervisorNotes")}>
                <TextArea placeholder={t("placeholders.supervisorNotes")} rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* FIXED: Drawer component */}
      <TeamEvaluationViewDrawer
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewRecord(null);
        }}
        record={viewRecord}
        criteria={criteria}
      />
    </Space>
  );
};

export default TeamEvaluationPage;
