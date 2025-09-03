import React, { useState, useEffect, useMemo, useRef } from "react";
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
  App,
  DatePicker,
  Tooltip,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetDisputesQuery,
  useAddDisputeMutation,
  useUpdateDisputeMutation,
  useLazyGetLookupsQuery,
  useLazyGetDisputeByIdQuery,
} from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { pageConfigs } from "../config/pageConfigs";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import DisputeViewModal from "../components/dispute/DisputeViewModal";

const { Option } = Select;
const pageKey = "dispute-management";

// Helper functions remain the same
const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return value;
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
};

const columnToCategoryMap: Record<string, number> = {
  department: 1000,
  payment_Type: 1100,
  dispute_Status: 1002,
};

const DisputeManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching, refetch } = useGetDisputesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addDispute, { isLoading: isAdding }] = useAddDisputeMutation();
  const [updateDispute, { isLoading: isUpdating }] = useUpdateDisputeMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetDisputeById] = useLazyGetDisputeByIdQuery();
  const searchInputRef = useRef<any>(null);

 

  // Fetch lookup data when modal opens or language changes
  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const categoryIds = Object.values(columnToCategoryMap);
      const result = await triggerGetLookups(categoryIds).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  // Get options for each category
  const departmentOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 1000).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const paymentTypeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 1100).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  // Sync local search value with state
  useEffect(() => {
    setSearchValue(state.searchValue);
  }, [state.searchValue]);

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

  const handleModalOpen = async (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);

    if (mode === "edit" && record) {
      try {
        // Fetch the latest dispute data for editing
        const result = await triggerGetDisputeById(record.dispute_Id).unwrap();
        if (result.data) {
          form.setFieldsValue({
            fineId: result.data.fine_Number, // Map fine_Number to fineId
            department: result.data.department,
            payment_Type: result.data.payment_Type,
            dispute_Reason: result.data.dispute_Reason,
            crM_Ref: result.data.crM_Ref,
            email: result.data.email,
            phone: result.data.phone,
            address: result.data.address,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dispute details:", error);
        notification.error({ data: { en_Msg: "Failed to load dispute details" } }, "Load Failed");
      }
    } else {
      form.resetFields();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    try {
      let response;

      // Prepare the payload according to API structure
      const payload = {
        fineId: Number(values.fineId), // Changed from fine_Number to fineId
        department: values.department,
        payment_Type: values.payment_Type,
        dispute_Reason: values.dispute_Reason,
        crM_Ref: values.crM_Ref,
        email: values.email,
        phone: values.phone,
        address: values.address,
      };

      if (modalMode === "add") {
        response = await addDispute(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        // For update, include dispute_Id in the payload
        response = await updateDispute({
          ...payload,
          dispute_Id: selectedRecord.dispute_Id,
        }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }

      handleModalClose();
      refetch(); // Refresh the table data
    } catch (err: any) {
      notification.error(err, "Operation Failed");
    }
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
        const selectedData = data?.data?.filter((item: any) => selectedRowKeys.includes(item.dispute_Id)) || [];
        exportToCsv(selectedData, `disputes_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () =>
      Object.fromEntries(
        config.formConfig.fields
          .map((f) => [f.name, t(f.label)])
          .concat(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
      ),
    [t, config, i18n.language],
  );

  // Enhanced table config with render functions for dropdown values
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        const categoryId = columnToCategoryMap[column.key];
        if (categoryId) {
          const options = filterOptionsByCategory(lookupOptions, categoryId);
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, options, i18n),
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, lookupOptions, i18n],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
    { key: "edit", label: t("common.edit"), icon: <EditOutlined />, onClick: () => handleModalOpen("edit", record) },
  ];

  // Handle search key change - preserve current search as filter and clear input

  const handleSearchKeyChange = (newKey: string) => {
    const currentValue = searchValue;

    // Clear the input field with a slight delay
    setTimeout(() => {
      setSearchValue("");
    }, 0);

    // If there's a current search value, preserve it as a column filter
    if (currentValue.trim()) {
      setGlobalSearch(state.searchKey, currentValue);
    }

    // Update the search key with empty value
    setGlobalSearch(newKey, "");
  };

  // Update the effect

  const searchAddon = (
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
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
                ref={searchInputRef}
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
              <Tooltip title={tableSize === "middle" ? t("common.compactView") : t("common.standardView")}>
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
          lookupOptions={lookupOptions}
          getLabelFromValue={getLabelFromValue}
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading || isFetching}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        rowKey={config.tableConfig.rowKey}
        state={state}
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
          <Button
            key="submit"
            type="primary"
            loading={isAdding || isUpdating || isLoadingLookups}
            onClick={() => form.submit()}
          >
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Spin spinning={isLoadingLookups}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Row gutter={24}>
              {/* Change fine_Number to fineId to match API payload */}
              <Col span={12}>
                <Form.Item
                  name="fineId"
                  label={t("form.fineNumber")}
                  rules={[{ required: true, message: t("messages.requiredField") }]}
                >
                  <Input placeholder={t("placeholders.fineNumber")} type="number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="department"
                  label={t("form.department")}
                  rules={[{ required: true, message: t("messages.requiredField") }]}
                >
                  <Select
                    placeholder={t("placeholders.department")}
                    loading={isLoadingLookups}
                    options={departmentOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="payment_Type"
                  label={t("form.paymentType")}
                  rules={[{ required: true, message: t("messages.requiredField") }]}
                >
                  <Select
                    placeholder={t("placeholders.paymentType")}
                    loading={isLoadingLookups}
                    options={paymentTypeOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dispute_Reason"
                  label={t("form.reason")}
                  rules={[{ required: true, message: t("messages.requiredField") }]}
                >
                  <Input placeholder={t("placeholders.reason")} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="crM_Ref"
                  label={t("form.crmReference")}
                  rules={[{ required: true, message: t("messages.requiredField") }]}
                >
                  <Input placeholder={t("placeholders.crmReference")} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label={t("form.email")}
                  rules={[
                    { required: true, message: t("messages.requiredField") },
                    { type: "email", message: t("messages.invalidEmail") },
                  ]}
                >
                  <Input placeholder={t("placeholders.email")} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label={t("form.phoneNumber")}
                  rules={[
                    { required: true, message: t("messages.requiredField") },
                    { pattern: /^[0-9]+$/, message: t("messages.numbersOnly") },
                  ]}
                >
                  <Input placeholder={t("placeholders.phoneNumber")} maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="address"
                  label={t("form.address")}
                  rules={[{ required: true, message: t("messages.requiredField") }]}
                >
                  <Input.TextArea placeholder={t("placeholders.address")} rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {viewRecord && (
        <DisputeViewModal
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          disputeId={viewRecord.dispute_Id}
          onStatusUpdate={refetch}
        />
      )}
    </Space>
  );
};

export default DisputeManagementPage;
