import React, { useState, useEffect, useMemo } from "react";
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
  Upload,
  DatePicker,
  Tooltip,
  Spin,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
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
  useGetInspectionObstaclesQuery,
  useAddInspectionObstacleMutation,
  useLazyGetLookupsQuery,
} from "../services/rtkApiFactory";
import { useUploadFilesMutation } from "../services/fileApi";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import InspectionObstaclesViewDrawer from "../components/inspectionobstacle/InspectionObstaclesViewDrawer";

const { Option } = Select;
const pageKey = "inspection-obstacles";

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return value;
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
};

const InspectionObstaclesPage: React.FC = () => {
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetInspectionObstaclesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addObstacle, { isLoading: isAdding }] = useAddInspectionObstacleMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  // Fetch lookup data when language changes
  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([600, 700, 800]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  // Options with labels
  const zoneOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 600).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const areaOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 700).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const sourceOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 800).map((option) => ({
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

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const { Photo } = values;
    let finalPayload: Record<string, any> = {};

    try {
      let savedFileNames: string[] = [];

      if (Photo && Photo.length > 0) {
        const formData = new FormData();
        formData.append("Category", "Obstacles");

        // Append all selected files
        Photo.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append("Files", file.originFileObj);
          }
        });

        // Upload multiple files
        const uploadResult = await uploadFiles(formData).unwrap();

        // Collect all saved file names returned from the server
        savedFileNames = (uploadResult as any[]).map((f) => f.savedAs);
      }

      finalPayload = {
        zone: values.Zone,
        area: values.Area,
        sourceOfObstacle: values.SourceOfObstacle,
        closestPaymentDevice: values.ClosestPaymentDevice,
        comments: values.Comments,
        photoPath: savedFileNames.join(";"), // join with semicolon for drawer
      };

      const response = await addObstacle(finalPayload).unwrap();
      notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const statusLabels = useMemo(
    () => ({
      0: t("status.reported"),
      1: t("status.removed"),
    }),
    [t],
  );

  // Map IDs to labels before showing in drawer
  const handleView = (record: any) => {
    const mappedRecord = {
      ...record,
      zone: getLabelFromValue(record.zone, zoneOptions, i18n),
      area: getLabelFromValue(record.area, areaOptions, i18n),
      sourceOfObstacle: getLabelFromValue(record.sourceOfObstacle, sourceOptions, i18n),
      status: statusLabels[record.status as keyof typeof statusLabels] || record.status,
    };
    setViewRecord(mappedRecord);
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
        const selectedData = data?.data.filter((item: any) => selectedRowKeys.includes(item.id));

        // ✅ Map values → labels before exporting
        const formattedData = selectedData.map((item: any) => ({
          ...item,
          zone: getLabelFromValue(item.zone, zoneOptions, i18n),
          area: getLabelFromValue(item.area, areaOptions, i18n),
          sourceOfObstacle: getLabelFromValue(item.sourceOfObstacle, sourceOptions, i18n),
          status: statusLabels[item.status] || item.status,
        }));

        exportToCsv(formattedData, `obstacles_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
  );

  // Enhanced table config with proper renderers
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "zone") return { ...column, render: (v: any) => getLabelFromValue(v, zoneOptions, i18n) };
        if (column.key === "area") return { ...column, render: (v: any) => getLabelFromValue(v, areaOptions, i18n) };
        if (column.key === "sourceOfObstacle")
          return { ...column, render: (v: any) => getLabelFromValue(v, sourceOptions, i18n) };

        // ✅ Status column with badges
        if (column.key === "status") {
          return {
            ...column,
            render: (v: number) => {
              const statusKey = v === 1 ? "removed" : "reported";
              const color = v === 1 ? "green" : "orange";
              return <Tag color={color}>{t(`status.${statusKey}`)}</Tag>;
            },
            filters: [
              { text: t("status.reported"), value: 0 },
              { text: t("status.removed"), value: 1 },
            ],
            onFilter: (value: any, record: any) => record.status === value,
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, zoneOptions, areaOptions, sourceOptions, i18n, t],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key] || key}
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
              <Tooltip title={tableSize === "middle" ? t("common.compactView") : t("common.standardView")}>
                <Button
                  icon={tableSize === "middle" ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                  onClick={() => setTableSize(tableSize === "middle" ? "small" : "middle")}
                />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleModalOpen}>
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
          statusLabels={statusLabels}
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
        state={state}
        lookupOptions={lookupOptions}
        getLabelFromValue={getLabelFromValue}
        filterOptions={{
          status: [
            { text: t("status.reported"), value: 0 },
            { text: t("status.removed"), value: 1 },
          ],
        }}
      />

      <Modal
        open={isModalOpen}
        title={t("page.addTitle", { entity: t(config.name.singular) })}
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
            loading={isAdding || isUploading || isLoadingLookups}
            onClick={() => form.submit()}
          >
            {t("common.submit")}
          </Button>,
        ]}
      >
        <Spin spinning={isLoadingLookups}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="Zone" label={t("form.zone")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.zone")}
                    options={zoneOptions.map((option) => ({ label: option.label, value: option.value }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="Area" label={t("form.area")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.area")}
                    options={areaOptions.map((option) => ({ label: option.label, value: option.value }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="SourceOfObstacle" label={t("form.sourceOfObstacle")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.sourceOfObstacle")}
                    options={sourceOptions.map((option) => ({ label: option.label, value: option.value }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="ClosestPaymentDevice"
                  label={t("form.closestPaymentDevice")}
                  rules={[{ required: true }]}
                >
                  <Input placeholder={t("placeholders.closestPaymentDevice")} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="Photo"
                  label={t("form.photo")}
                  rules={[{ required: true }]}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload listType="picture-card" beforeUpload={() => false} multiple={true} accept=".jpg,.jpeg">
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>{t("form.UploadJPG/JPEG")}</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="Comments" label={t("form.comments")}>
                  <Input.TextArea placeholder={t("placeholders.comments")} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {viewRecord && (
        <InspectionObstaclesViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
          onShare={handleShare}
          onStatusChange={() => {
            // This will trigger a refetch of the data
            // You might need to add a refetch function to your query hook
          }}
        />
      )}
    </Space>
  );
};

export default InspectionObstaclesPage;
