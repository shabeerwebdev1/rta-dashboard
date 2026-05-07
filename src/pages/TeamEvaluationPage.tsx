/* eslint-disable no-shadow-restricted-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
  Collapse,
  Spin,
  theme,
  Empty,
} from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, DownloadOutlined, TeamOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { exportToCsv } from "../utils/csvExporter";
import { formatDateByLocale } from "../utils/dateFormatter";
import { evaluationTypeOptions, teamEvaluationConfig } from "../config/pageConfigs/teamEvaluationConfig";
import TeamEvaluationViewDrawer from "../components/Teamevaluation/TeamEvaluationViewDrawer";
import {
  useGetActiveShiftsQuery,
  useGetTeamEvaluationsQuery,
  useCreateTeamEvaluationMutation,
  useUpdateTeamEvaluationMutation,
  useGetCriteriaGroupsQuery,
  useLazyGetCriteriaGroupByIdQuery,
} from "../services/rtkApiFactory";

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

const SCORE_OPTIONS = [
  { value: 1, labelEn: "Poor", labelAr: "ضعيف" },
  { value: 2, labelEn: "Below Average", labelAr: "أقل من المتوسط" },
  { value: 3, labelEn: "Average", labelAr: "متوسط" },
  { value: 4, labelEn: "Good", labelAr: "جيد" },
  { value: 5, labelEn: "Excellent", labelAr: "ممتاز" },
];

const getGradeTagColor = (grade: string, score?: number) => {
  const normalizedGrade = String(grade || "")
    .trim()
    .toLowerCase();
  if (normalizedGrade === "excellent") return "green";
  if (normalizedGrade === "good") return "blue";
  if (normalizedGrade === "fair") return "orange";
  if (normalizedGrade === "unsatisfactory") return "red";
  if (typeof score === "number" && Number.isFinite(score)) {
    if (score >= 90) return "green";
    if (score >= 75) return "blue";
    if (score >= 50) return "orange";
    return "red";
  }
  return "default";
};

const TeamEvaluationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const evaluationType = Form.useWatch("evaluationType", form);

  // ── Table params ────────────────────────────────────────────────────────────
  const {
    apiParams: rawApiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(teamEvaluationConfig.searchConfig!);

  const apiParams = {
    PageNumber: rawApiParams.PageNumber || 1,
    PageSize: rawApiParams.PageSize || 10,
    ...rawApiParams,
  };

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState<string>(state.searchValue);

  // ── Criteria from selected group ────────────────────────────────────────────
  const [groupCriteria, setGroupCriteria] = useState<any[]>([]);
  const [isGroupCriteriaLoading, setIsGroupCriteriaLoading] = useState(false);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  // ── API queries ─────────────────────────────────────────────────────────────
  const {
    data: evaluationsResponse,
    isLoading: isLoadingEvaluations,
    isFetching: isFetchingEvaluations,
  } = useGetTeamEvaluationsQuery(apiParams, { refetchOnMountOrArgChange: true });

  const [createTeamEvaluation, { isLoading: isCreating }] = useCreateTeamEvaluationMutation();
  const [updateTeamEvaluation, { isLoading: isUpdating }] = useUpdateTeamEvaluationMutation();

  // Criteria groups list
  const { data: criteriaGroupsResponse, isLoading: isLoadingGroups } = useGetCriteriaGroupsQuery({
    PageNumber: 1,
    PageSize: 1000,
  });

  // Lazy get-by-id for selected group
  const [triggerGetGroupById] = useLazyGetCriteriaGroupByIdQuery();

  const { data: activeShiftsData, isLoading: isLoadingShifts } = useGetActiveShiftsQuery({});

  // ── Derived: group options ──────────────────────────────────────────────────
  const criteriaGroupOptions = useMemo(() => {
    const items = Array.isArray(criteriaGroupsResponse?.data) ? criteriaGroupsResponse.data : [];
    return items
      .filter((g: any) => g.isActive !== false)
      .map((g: any) => ({
        value: g.id,
        label: i18n.language === "ar" ? g.groupName_AR || g.groupName_EN : g.groupName_EN || g.groupName_AR,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
  }, [criteriaGroupsResponse, i18n.language]);

  // ── Derived: inspectors ─────────────────────────────────────────────────────
  const inspectors = useMemo(() => {
    if (!activeShiftsData) return [];
    return (activeShiftsData as any[])
      .filter((s) => s.roleCode === "PARINSP")
      .map((s) => ({
        value: s.employeeId,
        labelEn: s.employeeName,
        labelAr: s.employeeNameAr || s.employeeName,
      }));
  }, [activeShiftsData]);

  const supervisors = useMemo(() => {
    if (!activeShiftsData) return [];
    return (activeShiftsData as any[])
      .filter((s) => s.roleCode === "PARSUP")
      .map((s) => ({
        value: s.employeeId,
        labelEn: s.employeeName,
        labelAr: s.employeeNameAr || s.employeeName,
      }));
  }, [activeShiftsData]);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPageTitle(t(teamEvaluationConfig.title));
  }, [setPageTitle, t, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  // ── Handle group selection → fetch criteria ─────────────────────────────────
  const handleGroupChange = async (groupId: string) => {
    if (!groupId) {
      setGroupCriteria([]);
      return;
    }
    // Clear previous criteria scores/comments from form
    const clearFields = groupCriteria.reduce((acc: any, c: any) => {
      acc[`criteria_${c.id}`] = undefined;
      acc[`comments_${c.id}`] = undefined;
      return acc;
    }, {});
    form.setFieldsValue(clearFields);
    setGroupCriteria([]);

    setIsGroupCriteriaLoading(true);
    try {
      const result = await triggerGetGroupById(groupId).unwrap();
      const details = result?.data?.details ?? [];
      setGroupCriteria(
        details.map((d: any) => ({
          id: d.id,
          descriptionEn: d.descriptionEn,
          descriptionAr: d.descriptionAr,
          weight: d.weight,
          isActive: true,
        })),
      );
    } catch {
      notification.error({ data: { en_Msg: "Failed to load group criteria" } }, "Error");
      setGroupCriteria([]);
    } finally {
      setIsGroupCriteriaLoading(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const evaluationsData: any[] = useMemo(() => {
    if (!evaluationsResponse) return [];
    if (Array.isArray(evaluationsResponse)) return evaluationsResponse;
    return (evaluationsResponse as any).data || [];
  }, [evaluationsResponse]);

  const totalCount = useMemo(() => {
    if (!evaluationsResponse) return 0;
    if (Array.isArray(evaluationsResponse)) return evaluationsResponse.length;
    return (evaluationsResponse as any).totalCount || 0;
  }, [evaluationsResponse]);

  const statsMetadata = useMemo(() => ({ totalRecords: totalCount }), [totalCount]);

  const getInspectorName = (inspectorId: string, fallbackEn?: string, fallbackAr?: string) => {
    if (i18n.language === "ar" && fallbackAr) return fallbackAr;
    if (fallbackEn) return fallbackEn;
    const inspector = inspectors.find((item) => String(item.value) === String(inspectorId));
    if (!inspector) return inspectorId || t("common.noData");
    return i18n.language === "ar" ? inspector.labelAr : inspector.labelEn;
  };

  // ── Modal open/close ─────────────────────────────────────────────────────────
  const openModal = async (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);

    if (mode === "edit" && record) {
      // If record has a criteriaGroupId, pre-load that group's criteria
      if (record.criteriaGroupId) {
        setIsGroupCriteriaLoading(true);
        try {
          const result = await triggerGetGroupById(record.criteriaGroupId).unwrap();
          const details = result?.data?.details ?? [];
          const loadedCriteria = details.map((d: any) => ({
            id: d.id,
            descriptionEn: d.descriptionEn,
            descriptionAr: d.descriptionAr,
            weight: d.weight,
            isActive: true,
          }));
          setGroupCriteria(loadedCriteria);

          // Build criteria field values
          const criteriaFields = (record.criteriaDetails || []).reduce((acc: any, cd: any) => {
            const matched = loadedCriteria.find(
              (c: any) => c.descriptionEn.toLowerCase() === String(cd.criteriaName || "").toLowerCase(),
            );
            if (matched) {
              acc[`criteria_${matched.id}`] = cd.score;
              acc[`comments_${matched.id}`] = cd.comments;
            }
            return acc;
          }, {});

          form.setFieldsValue({
            inspectorIds: [record.inspectorId],
            criteriaGroupId: record.criteriaGroupId,
            evaluationDate: dayjs(record.evaluationDate),
            evaluationType: String(record.evaluationType || "").toLowerCase(),
            evaluationPeriod: [dayjs(record.fromDate), dayjs(record.toDate)],
            supervisorNotes: record.supervisorNotes,
            ...criteriaFields,
          });
        } catch {
          notification.error({ data: { en_Msg: "Failed to load group criteria" } }, "Error");
        } finally {
          setIsGroupCriteriaLoading(false);
        }
      } else {
        form.setFieldsValue({
          inspectorIds: [record.inspectorId],
          evaluationDate: dayjs(record.evaluationDate),
          evaluationType: String(record.evaluationType || "").toLowerCase(),
          evaluationPeriod: [dayjs(record.fromDate), dayjs(record.toDate)],
          supervisorNotes: record.supervisorNotes,
        });
      }
    } else {
      form.resetFields();
      setGroupCriteria([]);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setGroupCriteria([]);
    form.resetFields();
  };

  // ── Form submit ──────────────────────────────────────────────────────────────
  const onFinish = async (values: any) => {
    const { inspectorIds, criteriaGroupId, evaluationDate, evaluationType, evaluationPeriod, supervisorNotes } = values;

    if (!inspectorIds || inspectorIds.length === 0) {
      notification.error({ data: { en_Msg: t("validation.selectRequired", { field: t("form.inspector") }) } }, "");
      return;
    }

    const criteriaPayload = groupCriteria
      .filter((c) => c.isActive)
      .map((c) => ({
        criteriaName: c.descriptionEn,
        weight: Number(c.weight),
        score: Number(values[`criteria_${c.id}`] ?? 0),
        comments: values[`comments_${c.id}`] ?? "",
      }));

    const payload: any = {
      inspectorIds,
      criteriaGroupId: values.criteriaGroupId,
      evaluationDate: evaluationDate.toISOString(),
      evaluationType,
      fromDate: evaluationPeriod[0].toISOString(),
      toDate: evaluationPeriod[1].toISOString(),
      supervisorNotes,
      criteria: criteriaPayload,
    };

    try {
      let response;
      if (modalMode === "add") {
        response = await createTeamEvaluation(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(teamEvaluationConfig.name.singular) }));
      } else {
        response = await updateTeamEvaluation({ id: selectedRecord?.id, ...payload }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(teamEvaluationConfig.name.singular) }));
      }
      closeModal();
    } catch (err: any) {
      notification.error(err as any, t("messages.operationFailed"));
    }
  };

  // ── CSV export ───────────────────────────────────────────────────────────────
  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: t("messages.selectRows") } }, t("messages.selectRows"));
      return;
    }
    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      okText: t("common.ok"),
      cancelText: t("common.cancel"),
      onOk: () => {
        const csvData = selectedRows.map((ev) => ({
          [t("form.evaluationDate")]: ev.evaluationDate,
          [t("form.evaluationType")]: ev.evaluationType,
          [t("form.totalScore")]: ev.totalScore,
          [t("form.grade")]: ev.grade,
          [t("form.supervisorNotes")]: ev.supervisorNotes,
        }));
        exportToCsv(csvData, `team-evaluations-${dayjs().format("YYYY-MM-DD")}.csv`);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        notification.success({ data: { en_Msg: t("messages.exportSuccess") } }, t("messages.exportSuccess"));
      },
    });
  };

  // ── Criteria form block (now uses groupCriteria instead of criteriaResponse) ─
  const renderCriteriaForm = () => {
    return (
      <div style={{ marginBottom: 24 }}>
        <Divider orientation="left">
          <TeamOutlined /> {t("form.evaluationCriteria")}
        </Divider>

        {/* Loading */}
        {isGroupCriteriaLoading && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin />
          </div>
        )}

        {/* No group selected */}
        {!form.getFieldValue("criteriaGroupId") && !isGroupCriteriaLoading && (
          <div style={{ padding: "8px 0", color: "#999" }}>
            {t("messages.selectGroupFirst") || "Please select a criteria group"}
          </div>
        )}

        {/* No criteria */}
        {form.getFieldValue("criteriaGroupId") && !isGroupCriteriaLoading && groupCriteria.length === 0 && (
          <div style={{ padding: "8px 0", color: "#999" }}>{t("messages.noCriteriaFound") || "No criteria found"}</div>
        )}

        {/* Criteria list (scrollable only this part) */}
        {groupCriteria.length > 0 && (
          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              paddingRight: 8,
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              padding: 8,
            }}
          >
            <Collapse defaultActiveKey={[]}>
              {groupCriteria.map((criterion) => (
                <Panel
                  header={i18n.language === "ar" ? criterion.descriptionAr : criterion.descriptionEn}
                  key={String(criterion.id)}
                  extra={
                    <Tag color={token.colorPrimary}>
                      {t("form.weight")}:{" "}
                      <span
                        style={{
                          display: "inline-block",
                          width: 28,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {criterion.weight}%
                      </span>
                    </Tag>
                  }
                >
                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={8}>
                      <Form.Item
                        name={`criteria_${criterion.id}`}
                        label={t("form.score")}
                        rules={[
                          {
                            required: true,
                            message: t("validation.required", {
                              field: t("form.score"),
                            }),
                          },
                        ]}
                      >
                        <Select placeholder={t("placeholders.score")}>
                          {SCORE_OPTIONS.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.value} - {i18n.language === "ar" ? option.labelAr : option.labelEn}
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
        )}
      </div>
    );
  };

  // ── Enhanced table config ────────────────────────────────────────────────────
  const enhancedTableConfig = useMemo(
    () => ({
      ...teamEvaluationConfig.tableConfig,
      columns: teamEvaluationConfig.tableConfig.columns.map((column) => {
        if (column.key === "inspectorId") {
          return {
            ...column,
            render: (value: string, record: any) =>
              getInspectorName(value, record.inspectorName, record.inspectorNameAr),
          };
        }
        if (column.key === "evaluationDate") {
          return {
            ...column,
            render: (value: string) =>
              formatDateByLocale(value, { en: "DD MMM YYYY", ar: "DD MMM YYYY" }, i18n.language),
          };
        }
        if (column.key === "totalScore") {
          return { ...column, render: (value: number) => <strong>{value}%</strong> };
        }
        if (column.key === "grade") {
          return {
            ...column,
            render: (value: string, record: any) => (
              <Tag color={getGradeTagColor(value, Number(record.totalScore))}>{value || t("common.noData")}</Tag>
            ),
          };
        }
        return column;
      }),
    }),
    [i18n.language, inspectors, t],
  );

  // ── Action menu ──────────────────────────────────────────────────────────────
  const actionMenuItems = (record: any) => [
    {
      key: "view",
      label: t("common.view"),
      icon: <EyeOutlined />,
      onClick: () => {
        setViewRecord(record);
        setIsViewOpen(true);
      },
    },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => openModal("edit", record),
    },
  ];

  const columnLabels = useMemo(
    () => Object.fromEntries(teamEvaluationConfig.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, i18n.language],
  );

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 160 }}>
      {teamEvaluationConfig.searchConfig?.globalSearchKeys.map((key) => (
        <Select.Option key={key} value={key}>
          {columnLabels[key]}
        </Select.Option>
      ))}
    </Select>
  );

  const normalizedEvaluationType = String(evaluationType || "").toLowerCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={teamEvaluationConfig.statsConfig}
        data={evaluationsData}
        metadata={statsMetadata}
        loading={isLoadingEvaluations}
      />

      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Input
                addonBefore={searchAddon}
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 450 }}
                allowClear
              />
              <span>{t("common.filterByevaluationDate")}</span>
              <DatePicker.RangePicker
                value={state.dateRange}
                format="DD MMM YYYY"
                placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
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
        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          lookupOptions={[]}
          getLabelFromValue={() => ""}
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...teamEvaluationConfig, tableConfig: enhancedTableConfig }}
        data={evaluationsData}
        total={totalCount}
        isLoading={isLoadingEvaluations || isFetchingEvaluations}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], rows: any[]) => {
            setSelectedRowKeys(keys);
            setSelectedRows((prev) => {
              const remaining = prev.filter((p) => keys.includes(p.id));
              const added = rows.filter((r) => !remaining.some((p) => p.id === r.id));
              return [...remaining, ...added];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
        lookupOptions={[]}
        getLabelFromValue={() => ""}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", {
          entity: t(teamEvaluationConfig.name.singular),
        })}
        onCancel={closeModal}
        styles={{
          body: {
            maxHeight: "60vh",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 4,
          },
        }}
        width={teamEvaluationConfig.formConfig?.modalWidth || "800px"}
        footer={[
          <Button key="back" onClick={closeModal}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" loading={isCreating || isUpdating} onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Spin spinning={isLoadingShifts || isLoadingGroups}>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ evaluationDate: dayjs() }}>
            <Row gutter={24}>
              {/* Inspector (multi-select) */}
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
                    optionFilterProp="children"
                    allowClear
                    loading={isLoadingShifts}
                    disabled={modalMode === "edit"}
                  >
                    {inspectors.map((inspector) => (
                      <Option key={inspector.value} value={inspector.value}>
                        {i18n.language === "ar" ? inspector.labelAr : inspector.labelEn}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Criteria Group — replaces Supervisor */}
              <Col span={12}>
                <Form.Item
                  name="criteriaGroupId"
                  label={t("form.criteriaGroup") || "Criteria Group"}
                  rules={[
                    {
                      required: true,
                      message: t("validation.selectRequired", { field: t("form.criteriaGroup") || "Criteria Group" }),
                    },
                  ]}
                >
                  <Select
                    showSearch
                    allowClear
                    loading={isLoadingGroups}
                    placeholder={t("placeholders.selectCriteriaGroup") || "Select criteria group"}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      String(option?.label || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={criteriaGroupOptions}
                    onChange={handleGroupChange}
                  />
                </Form.Item>
              </Col>

              {/* Evaluation Date */}
              <Col span={12}>
                <Form.Item
                  name="evaluationDate"
                  label={t("form.evaluationDate")}
                  rules={[
                    { required: true, message: t("validation.selectRequired", { field: t("form.evaluationDate") }) },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD MMM YYYY"
                    placeholder={t("placeholders.selectDate")}
                  />
                </Form.Item>
              </Col>

              {/* Evaluation Type */}
              <Col span={12}>
                <Form.Item
                  name="evaluationType"
                  label={t("form.evaluationType")}
                  rules={[
                    { required: true, message: t("validation.selectRequired", { field: t("form.evaluationType") }) },
                  ]}
                >
                  <Select
                    placeholder={t("placeholders.selectEvaluationType")}
                    onChange={() => form.setFieldsValue({ evaluationPeriod: null })}
                  >
                    {evaluationTypeOptions.map((et) => (
                      <Option key={et.value} value={et.value}>
                        {i18n.language === "ar" ? et.labelAr : et.labelEn}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Evaluation Period */}
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
                    picker={normalizedEvaluationType === "yearly" ? "year" : "month"}
                    format={normalizedEvaluationType === "yearly" ? "YYYY" : "MMM YYYY"}
                    placeholder={
                      normalizedEvaluationType === "yearly"
                        ? [t("placeholders.startYear"), t("placeholders.endYear")]
                        : [t("placeholders.startMonth"), t("placeholders.endMonth")]
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* ── Dynamic Criteria Section (driven by selected group) ── */}
            {renderCriteriaForm()}

            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="supervisorNotes"
                  label={t("form.notes")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.notes") }) }]}
                >
                  <TextArea placeholder={t("placeholders.Notes")} rows={2} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {/* ── View Drawer ── */}
      <TeamEvaluationViewDrawer
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewRecord(null);
        }}
        record={viewRecord}
        criteria={groupCriteria}
        inspectors={inspectors}
        supervisors={supervisors}
        isLoading={isLoadingShifts}
      />
    </Space>
  );
};

export default TeamEvaluationPage;
