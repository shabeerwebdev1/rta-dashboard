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
  useGetPledgesQuery,
  useAddPledgeMutation,
  useDeletePledgeMutation,
  useLazyGetLookupsQuery,
  useLazyGetPledgeByIdQuery,
  useLazyGetPledgeByIdQuery,
} from "../services/rtkApiFactory";
import { useUploadFilesMutation } from "../services/fileApi";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import DynamicViewDrawer from "../components/drawer";
import { useSearchParams } from "react-router-dom";

const { Option } = Select;
const pageKey = "pledges";

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

const PledgesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetPledgesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addPledge, { isLoading: isAdding }] = useAddPledgeMutation();
  const [deletePledge, { isLoading: isDeleting }] = useDeletePledgeMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();
  const [triggerGetPledge, { data: singleRecordData, isSuccess: isSingleRecordSuccess, isLoading: isPledgeLoading }] =
    useLazyGetPledgeByIdQuery();

  const [triggerGetLookups] = useLazyGetLookupsQuery();

  // Check for viewRecord parameter in URL on component mount
  useEffect(() => {
    const recordId = searchParams.get("viewRecord");
    if (recordId) {
      triggerGetPledge(recordId);
    }
  }, []);

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([900]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const pledgeTypeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 900).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  // Handle record view from table
  const handleViewFromTable = (recordId: string) => {
    triggerGetPledge(recordId);
  };

  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      setViewRecord(singleRecordData.data);
      setIsDrawerOpen(true);

      // Update URL with viewRecord parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("viewRecord", singleRecordData.data.id);
      setSearchParams(newSearchParams);
    }
  }, [isSingleRecordSuccess, singleRecordData]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

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

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const payload: Record<string, any> = {
      PledgeNumber: values.pledgeNumber,
      PledgeType: values.pledgeType,
      TradeLicenseNumber: values.tradeLicenseNumber,
      BusinessName: values.businessName,
      Remarks: values.remarks,
      DocumentUploaded: false,
    };

    try {
      if (values.document && values.document.length > 0) {
        const formData = new FormData();
        formData.append("Category", "PledgeDocuments");

        values.document.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append("Files", file.originFileObj);
          }
        });

        const uploadResult = await uploadFiles(formData).unwrap();
        const savedFileNames = (uploadResult as any[]).map((f) => f.savedAs);

        payload.documentPath = savedFileNames.join(";");
        payload.DocumentUploaded = true;
      }

      const response = await addPledge(payload).unwrap();
      notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: t("messages.deleteConfirmTitle"),
      content: t("messages.deleteConfirmContent", {
        entity: t(config.name.singular),
      }),
      onOk: async () => {
        try {
          const response = await deletePledge(id).unwrap();
          notification.success(response, t("messages.deleteSuccess", { entity: t(config.name.singular) }));
        } catch (err) {
          notification.error(err as any, "Delete Failed");
        }
      },
    });
  };

  const handleView = (record: any) => {
    handleViewFromTable(record.id);
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("viewRecord", viewRecord.id);
    navigator.clipboard.writeText(url.toString()).then(
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
  
        // ✅ Map values to labels before exporting
        const formattedData = selectedData.map((item: any) => ({
          ...item,
          pledgeType: getLabelFromValue(item.pledgeType, pledgeTypeOptions, i18n),
        }));
  
        exportToCsv(formattedData, `pledges_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };
  

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
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

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setViewRecord(null);

    // Remove viewRecord parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("viewRecord");
    setSearchParams(newSearchParams);
  };

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
        />
      </Card>

      <DataTableWrapper
        pageConfig={config}
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading || isFetching || isDeleting}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
        lookupOptions={lookupOptions}
        getLabelFromValue={getLabelFromValue}
      />

      <Modal
        open={isModalOpen}
        title={t("page.addTitle", { entity: "Pledge" })}
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
                <Form.Item name="pledgeType" label={t("form.pledgeType")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.pledgeType")}
                    loading={isLoadingLookups}
                    options={pledgeTypeOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tradeLicenseNumber" label={t("form.tradeLicenseNumber")} rules={[{ required: true }]}>
                  <Input placeholder={t("placeholders.tradeLicenseNumber")} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="businessName" label={t("form.businessName")} rules={[{ required: true }]}>
                  <Input placeholder={t("placeholders.businessName")} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="document"
                  label={t("form.document")}
                  rules={[{ required: true }]}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload listType="picture-card" beforeUpload={() => false} multiple={true} accept=".jpg,.jpeg">
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>{t("form.Upload JPG/JPEG")}</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="remarks" label={t("form.remarks")}>
                  <Input.TextArea placeholder={t("placeholders.remarks")} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      <PledgesViewDrawer
        open={isDrawerOpen}
        onClose={handleDrawerClose}
        record={viewRecord}
        config={config}
        onShare={() => handleShare(viewRecord)}
        isLoading={isPledgeLoading}
      />
    </Space>
  );
};

export default PledgesPage;
