import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, DatePicker, App, Tooltip } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetPlatesQuery,
  useAddPlateMutation,
  useUpdatePlateMutation,
  useDeletePlateMutation,
} from "../services/rtkApiFactory";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import DynamicViewDrawer from "../components/drawer";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";

const { Option } = Select;
const pageKey = "whitelist-plates";

// Dropdown options with numeric values
const plateSourceOptions = [
  { label: "Dubai", value: 1 },
  { label: "Abu Dhabi", value: 2 },
  { label: "Sharjah", value: 3 },
  { label: "Ajman", value: 4 },
  { label: "Ras Al Khaimah", value: 5 },
  { label: "Fujairah", value: 6 },
  { label: "Umm Al Quwain", value: 7 },
];

const plateTypeOptions = [
  { label: "Private", value: 1 },
  { label: "Commercial", value: 2 },
  { label: "Motorcycle", value: 3 },
  { label: "Taxi", value: 4 },
];

const plateColorOptions = [
  { label: "White", value: 1 },
  { label: "Red", value: 2 },
  { label: "Blue", value: 3 },
  { label: "Green", value: 4 },
  { label: "Black", value: 5 },
  { label: "Yellow", value: 6 },
  { label: "Orange", value: 7 },
  { label: "Purple", value: 8 },
];

const plateStatusOptions = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 0 },
];

const exemptionReasons = [
  { label: "Government Vehicle", value: 1 },
  { label: "Diplomatic Vehicle", value: 2 },
  { label: "Emergency Vehicle", value: 3 },
];

// Helper function to get label from value
const getLabelFromValue = (value, options) => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

const WhitelistPlatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
  const {
    apiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetPlatesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addPlate, { isLoading: isAdding }] = useAddPlateMutation();
  const [updatePlate, { isLoading: isUpdating }] = useUpdatePlateMutation();
  const [deletePlate, { isLoading: isDeleting }] = useDeletePlateMutation();

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") {
      setSearchValue("");
    }
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue({
        ...record,
        dateRange: record.fromDate && record.toDate ? [dayjs(record.fromDate), dayjs(record.toDate)] : null,
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const { dateRange, ...rest } = values;
    const payload = {
      ...rest,
      fromDate: dateRange[0].toISOString(),
      toDate: dateRange[1].toISOString(),
    };

    try {
      let response;
      if (modalMode === "add") {
        response = await addPlate(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updatePlate({ ...payload, id: selectedRecord.id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: t("messages.deleteConfirmTitle"),
      content: t("messages.deleteConfirmContent", { entity: t(config.name.singular) }),
      onOk: async () => {
        try {
          const response = await deletePlate(id).unwrap();
          notification.success(response, t("messages.deleteSuccess", { entity: t(config.name.singular) }));
        } catch (err) {
          notification.error(err as any, "Delete Failed");
        }
      },
    });
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => notification.success({ data: { en_Msg: "Share link copied to clipboard!" } }, "Link Copied!"),
      () => notification.error({ data: { en_Msg: "Failed to copy link." } }, "Copy Failed"),
    );
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: t("messages.selectRows") } }, t("messages.selectRows"));
      return;
    }
    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      onOk: () => {
        const selectedData = data.data.filter((item: any) => selectedRowKeys.includes(item.id));
        exportToCsv(selectedData, `whitelist-plates_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns],
  );

  // Enhanced table config with render functions for numeric values
  const enhancedTableConfig = useMemo(() => ({
    ...config.tableConfig,
    columns: config.tableConfig.columns.map(column => {
      if (column.key === 'plateSource') {
        return {
          ...column,
          render: (value) => getLabelFromValue(value, plateSourceOptions)
        };
      }
      if (column.key === 'plateType') {
        return {
          ...column,
          render: (value) => getLabelFromValue(value, plateTypeOptions)
        };
      }
      if (column.key === 'plateColor') {
        return {
          ...column,
          render: (value) => getLabelFromValue(value, plateColorOptions)
        };
      }
      if (column.key === 'plateStatus') {
        return {
          ...column,
          render: (value) => getLabelFromValue(value, plateStatusOptions)
        };
      }
      if (column.key === 'exemptionReason_ID') {
        return {
          ...column,
          render: (value) => getLabelFromValue(value, exemptionReasons)
        };
      }
      return column;
    })
  }), [config.tableConfig]);

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
    { key: "edit", label: t("common.edit"), icon: <EditOutlined />, onClick: () => handleModalOpen("edit", record) },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={data?.data || []} loading={isLoading} />
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
              <DatePicker.RangePicker
                value={state.dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv")}
              </Button>
              <Tooltip title={tableSize === "middle" ? "Compact view" : "Standard view"}>
                <Button
                  icon={tableSize === "middle" ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                  onClick={() => setTableSize(tableSize === "middle" ? "small" : "middle")}
                />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen("add")}>
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
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading || isFetching || isDeleting}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
      />

      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: t(config.name.singular) })}
        onCancel={handleModalClose}
        width="720px"
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>,
          <Button key="back" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,

          <Button key="submit" type="primary" loading={isAdding || isUpdating} onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="plateNumber" label={t("form.plateNumber")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.plateNumber")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateSource_Id" label={t("form.plateSource")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.plateSource")} options={plateSourceOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateType_Id" label={t("form.plateType")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.plateType")} options={plateTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateColor_Id" label={t("form.plateColor")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.plateColor")} options={plateColorOptions} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="dateRange" label={t("form.dateRange")} rules={[{ required: true }]}>
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  disabledDate={(d) => d && d < dayjs().startOf("day")}
                  placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exemptionReason_ID" label={t("form.exemptionReason")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.exemptionReason")} options={exemptionReasons} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateStatus_Id" label={t("form.status")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.status")} options={plateStatusOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isByLaw" label={t("form.isByLaw")}>
                <Select
                  placeholder={t("placeholders.isByLaw")}
                  options={[
                    { label: "True", value: true },
                    { label: "False", value: false },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {viewRecord && (
        <DynamicViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
          onShare={handleShare}
        />
      )}
    </Space>
  );
};

export default WhitelistPlatesPage;