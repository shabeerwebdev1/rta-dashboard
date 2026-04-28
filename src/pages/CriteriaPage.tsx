/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, App, Switch, Tag } from "antd";
import { PlusOutlined, EditOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { usePermission } from "../hooks/usePermission";
import { exportToCsv } from "../utils/csvExporter";

import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import DataTableWrapper from "../components/common/DataTableWrapper";
import CriteriaViewDrawer from "../components/Criteria/CriteriaViewDrawer";

import { criteriaConfig } from "../config/pageConfigs/criteriaConfig";

import {
  useGetCriteriaWeightsQuery,
  useAddCriteriaWeightMutation,
  useUpdateCriteriaWeightMutation,
} from "../services/rtkApiFactory";

const { Option } = Select;

const menuName = "CriteriaWeight";

const objectiveTypeOptions = [
  { value: "target", labelEn: "Target", labelAr: "هدف" },
  { value: "competence", labelEn: "Competence", labelAr: "كفاءة" },
];

const CriteriaPage: React.FC = () => {
  const { canCreate, canEdit } = usePermission();
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = criteriaConfig;

  const [form] = Form.useForm();

  const {
    apiParams: rawApiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);

  const apiParams = {
    PageNumber: rawApiParams.PageNumber || 1,
    PageSize: rawApiParams.PageSize || 10,
    ...rawApiParams,
  };

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearch = useDebounce(searchValue, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);

  // ── Row selection (for CSV download, identical to WhitelistPlatesPage) ───────
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // ── API hooks ────────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useGetCriteriaWeightsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addCriteria, { isLoading: isAdding }] = useAddCriteriaWeightMutation();
  const [updateCriteria, { isLoading: isUpdating }] = useUpdateCriteriaWeightMutation();

  // ── Derived data ─────────────────────────────────────────────────────────────
  const criteriaList = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.data ?? []);
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : (data.totalCount ?? data.totalRecords ?? data.total ?? 0);
  }, [data]);

  const metadata = useMemo(() => {
    if (!data || Array.isArray(data)) return {};
    return {
      totalRecords: data.totalRecords ?? data.totalCount ?? data.total,
      totalCount: data.totalCount ?? data.totalRecords ?? data.total,
      active: data.active ?? data.activeRecords,
      inActive: data.inActive ?? data.inactiveRecords,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
    };
  }, [data]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getObjectiveLabel = (value: string) => {
    const option = objectiveTypeOptions.find((o) => o.value === value);
    if (!option) return value;
    return i18n.language === "ar" ? option.labelAr : option.labelEn;
  };

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearch);
  }, [debouncedSearch, state.searchKey, setGlobalSearch]);

  // ── Filters ───────────────────────────────────────────────────────────────────
  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  // ── Modal ─────────────────────────────────────────────────────────────────────
  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);

    if (mode === "edit" && record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ active: true });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleFormSubmit = async (values: any) => {
    const payload = {
      descriptionEn: values.descriptionEn,
      descriptionAr: values.descriptionAr,
      weight: Number(values.weight),
      active: values.active ?? true,
      objectiveType: values.objectiveType,
    };

    try {
      let response;
      if (modalMode === "add") {
        response = await addCriteria(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updateCriteria({ ...payload, id: selectedRecord.id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  // ── View ──────────────────────────────────────────────────────────────────────
  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  // ── CSV Export (mirrors WhitelistPlatesPage pattern exactly) ─────────────────
  const transformDataForCSV = (rows: any[]) => {
    return rows.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;
      csvRecord[t("form.descriptionEn")] = item.descriptionEn || "";
      csvRecord[t("form.descriptionAr")] = item.descriptionAr || "";
      csvRecord[t("form.weight")] = item.weight != null ? `${item.weight}%` : "";
      csvRecord[t("form.objectiveType")] = getObjectiveLabel(item.objectiveType) || "";
      csvRecord[t("form.isActive")] = item.active ? t("common.active") : t("common.inactive");
      return csvRecord;
    });
  };

  const getCsvFilename = () => (i18n.language === "ar" ? "معايير_الأوزان.csv" : "Criteria_Weights.csv");

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
        try {
          if (selectedRows.length === 0) {
            notification.error({ data: { en_Msg: t("messages.noDataToExport") } }, t("messages.exportFailed"));
            return;
          }
          const transformedData = transformDataForCSV(selectedRows);
          exportToCsv(transformedData, getCsvFilename());
          notification.success(
            { data: { en_Msg: t("messages.csvDownloaded", { count: selectedRows.length }) } },
            t("messages.exportSuccess"),
          );
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch {
          notification.error({ data: { en_Msg: t("messages.exportError") } }, t("messages.exportFailed"));
        }
      },
    });
  };

  // ── Enhanced table config ─────────────────────────────────────────────────────
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "objectiveType") {
          return {
            ...column,
            render: (value: string) => getObjectiveLabel(value),
          };
        }
        if (column.key === "active") {
          return {
            ...column,
            render: (value: boolean) =>
              value ? <Tag color="green">{t("common.active")}</Tag> : <Tag color="default">{t("common.inactive")}</Tag>,
          };
        }
        if (column.key === "weight") {
          return {
            ...column,
            render: (value: number) => <strong>{value}%</strong>,
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, i18n.language, t],
  );

  // ── Column labels ─────────────────────────────────────────────────────────────
  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
  );

  // ── Action menu ───────────────────────────────────────────────────────────────
  const actionMenuItems = (record: any) => [
    {
      key: "view",
      label: t("common.view"),
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => handleModalOpen("edit", record),
      disabled: !canEdit(menuName),
    },
  ];

  // ── Search addon ──────────────────────────────────────────────────────────────
  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 160 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key] || key}
        </Option>
      ))}
    </Select>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Stats cards — same as WhitelistPlatesPage */}
      <StatsDisplay statsConfig={config.statsConfig} data={criteriaList} metadata={metadata} loading={isLoading} />

      {/* Toolbar card */}
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          {/* Left: search input with column selector addon */}
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
            </Space>
          </Col>

          {/* Right: Download CSV (disabled until rows selected) + Add New */}
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv")}
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleModalOpen("add")}
                disabled={!canCreate(menuName)}
              >
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Active filter chips */}
        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          lookupOptions={[]}
          getLabelFromValue={() => ""}
        />
      </Card>

      {/* Data table with leading checkboxes — identical rowSelection shape to WhitelistPlatesPage */}
      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={criteriaList}
        total={totalCount}
        isLoading={isLoading || isFetching}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], rows: any[]) => {
            setSelectedRowKeys(keys);
            setSelectedRows((prev) => {
              const remaining = prev.filter((p) => keys.includes(p.id));
              const newSelected = rows.filter((r) => !remaining.some((p) => p.id === r.id));
              return [...remaining, ...newSelected];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize="small"
        state={state}
        lookupOptions={[]}
        getLabelFromValue={() => ""}
      />

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", {
          entity: t(config.name.singular),
        })}
        onCancel={handleModalClose}
        width={600}
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>,
          <Button key="cancel" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" loading={isAdding || isUpdating} onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="descriptionEn"
                label={t("form.descriptionEn")}
                rules={[{ required: true, message: t("validation.required", { field: t("form.descriptionEn") }) }]}
              >
                <Input placeholder={t("placeholders.descriptionEn")} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="descriptionAr"
                label={t("form.descriptionAr")}
                rules={[{ required: true, message: t("validation.required", { field: t("form.descriptionAr") }) }]}
              >
                <Input placeholder={t("placeholders.descriptionAr")} dir="rtl" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="weight"
                label={t("form.weight")}
                rules={[
                  { required: true, message: t("validation.required", { field: t("form.weight") }) },
                  {
                    type: "number",
                    min: 0,
                    max: 100,
                    message: t("validation.weightRange") || "Weight must be between 0 and 100",
                    transform: (v) => Number(v),
                  },
                ]}
              >
                <Input type="number" min={0} max={100} placeholder="0 – 100" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="objectiveType"
                label={t("form.objectiveType")}
                rules={[
                  {
                    required: true,
                    message: t("validation.selectRequired", { field: t("form.objectiveType") }),
                  },
                ]}
              >
                <Select
                  showSearch
                  placeholder={t("placeholders.selectObjective") || "Select objective type"}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  options={objectiveTypeOptions.map((o) => ({
                    label: i18n.language === "ar" ? o.labelAr : o.labelEn,
                    value: o.value,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="active" label={t("form.isActive")} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── View Drawer ──────────────────────────────────────────────────────── */}
      {viewRecord && (
        <CriteriaViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
        />
      )}
    </Space>
  );
};

export default CriteriaPage;
