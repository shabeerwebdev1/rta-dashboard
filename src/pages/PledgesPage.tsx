import React, { useState, useEffect, useMemo, useRef } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, App, Upload, DatePicker, Spin, Image } from "antd";
import { PlusOutlined, EyeOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetPledgesQuery,
  useAddPledgeMutation,
  useUpdatePledgeMutation,
  useDeletePledgeMutation,
  useLazyGetLookupsQuery,
  useLazyGetPledgeByIdQuery,
  useLazyGetTradeLicenseDetailsQuery
} from "../services/rtkApiFactory";
import { getFileUrl, useUploadFilesMutation } from "../services/fileApi";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import PledgesViewDrawer from "../components/pledge/PledgesViewDrawer";
import { useSearchParams } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

const { Option } = Select;
const pageKey = "pledges";

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value === value);
  if (!option) return value;

  // Use Arabic label if language is Arabic, otherwise English
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
};

const PledgesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { canCreate, canEdit } = usePermission();
  const menuName = "Pledge";
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

  // Add modal mode and selected record state
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [tlData, setTlData] = useState<any | null>(null);
    const [companyEmail, setCompanyEmail] = useState("");

  

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const searchInputRef = useRef<any>(null);

  const { data, isLoading, isFetching } = useGetPledgesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addPledge, { isLoading: isAdding }] = useAddPledgeMutation();
  const [updatePledge, { isLoading: isUpdating }] = useUpdatePledgeMutation();
  const [deletePledge, { isLoading: isDeleting }] = useDeletePledgeMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();
  const [triggerGetPledge, { data: singleRecordData, isSuccess: isSingleRecordSuccess, isLoading: isPledgeLoading }] =
    useLazyGetPledgeByIdQuery();
      const [triggerGetTradeLicenseDetails, { isFetching: isFetchingTL }] = useLazyGetTradeLicenseDetailsQuery();
    

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const getBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // Check for viewRecord parameter in URL on component mount
  useEffect(() => {
    const recordId = searchParams.get("viewRecord");
    if (recordId) {
      triggerGetPledge(recordId);
    }
  }, []);

  // Fetch lookup data when modal opens or language changes
  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  // Sync local search value with state
  useEffect(() => {
    setSearchValue(state.searchValue);
  }, [state.searchValue]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      // Use category ID 900 for pledge types
      const result = await triggerGetLookups([900]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  


  // Get pledge type options with proper labels based on current language
  const pledgeTypeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 900).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      setViewRecord(singleRecordData.data);
      setIsDrawerOpen(true);
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

  const handleModalOpen = (mode: "add" | "edit" = "add", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);

    if (mode === "edit" && record) {
      let fileList: any[] = [];

      if (record.documentPath) {
        const files = record.documentPath.split(";");
        fileList = files.map((file: string, index: number) => ({
          uid: String(index),
          name: file.split("/").pop() || `file-${index}`,
          status: "done",
          url: getFileUrl(file),
        }));
      }

      // Set date range from individual date fields
      const dateRange =
        record.pledgeDate && record.pledgeEndDate ? [dayjs(record.pledgeDate), dayjs(record.pledgeEndDate)] : null;

      form.setFieldsValue({
        pledgeType: record.pledgeType,
        tradeLicenseNumber: record.tradeLicenseNumber,
        businessName: record.businessName,
        remarks: record.remarks,
        document: fileList,
        dateRange: dateRange,
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setModalMode("add");
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    // Extract dates from the range picker
    const startDate = values.dateRange?.[0];
    const endDate = values.dateRange?.[1];

    const payload: Record<string, string | number | boolean | null> = {
      PledgeType: values.pledgeType,
      TradeLicenseNumber: values.tradeLicenseNumber,
      BusinessName: values.businessName,
      Remarks: values.remarks,
      DocumentUploaded: false,
      // Add date fields with proper formatting
      PledgeDate: startDate ? startDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
      PledgeEndDate: endDate ? endDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
    };

    try {
      // handle file upload only if new files were added
      if (values.document && values.document.some((f: any) => f.originFileObj)) {
        const formData = new FormData();
        formData.append("Category", "PledgeDocuments");

        values.document.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append("Files", file.originFileObj);
          }
        });

        const uploadResult = await uploadFiles(formData).unwrap();
        const savedFileNames = (uploadResult as any[]).map((f) => f.savedAs);

        payload.DocumentPath = savedFileNames.join(";");
        payload.DocumentUploaded = true;
      } else if (modalMode === "edit" && selectedRecord?.documentPath) {
        // keep old document if not uploading new
        payload.DocumentPath = selectedRecord.documentPath;
        payload.DocumentUploaded = true;
      }

      let response;
      if (modalMode === "add") {
        response = await addPledge(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updatePledge({ id: selectedRecord.id, ...payload }).unwrap();
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
    setViewRecord(record); // ✅ use row data directly
    setIsDrawerOpen(true);
  };

  const handleShare = (record: any) => {
    // Create URL with record ID parameter
    const url = new URL(window.location.href);
    url.searchParams.set("viewRecord", record.id);
    const shareUrl = url.toString();

    navigator.clipboard.writeText(shareUrl).then(
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

  // Enhanced table config with render functions for dropdown values
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "pledgeType") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, pledgeTypeOptions, i18n),
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, pledgeTypeOptions, i18n],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => handleModalOpen("edit", record),
      disabled: !canEdit(menuName),
    },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
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
  };


  const platesData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : data.totalCount || 0;
  }, [data]);

  const metadata = useMemo(() => {
    if (!data || Array.isArray(data)) return {};
    return {
      totalCount: data.totalCount,
      corporate: data.corporate,
      individual: data.individual,
    };
  }, [data]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={platesData} metadata={metadata} loading={isLoading} />
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
                format={"DD-MM-YYYY"}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
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
        data={platesData} // Use the extracted array
        total={totalCount}
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
            loading={isAdding || isUpdating || isUploading || isLoadingLookups}
            onClick={() => form.submit()}
          >
            {t(modalMode === "add" ? "common.submit" : "common.update")}
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
                    showSearch // 👈 enables search input
                    optionFilterProp="label" // 👈 tells Select to filter by the label
                    filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    options={pledgeTypeOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>
       <Col span={12}>
  <Form.Item
    name="tradeLicenseNumber"
    label={t("form.tradeLicenseNumber")}
    rules={[{ required: true }]}
  >
    <Input.Group compact>
      {/* Bigger input */}
      <Form.Item name="tradeLicenseNumber" noStyle rules={[{ required: true }]}>
        <Input
          style={{ width: "calc(100% - 90px)" }}   // ⬅️ more width
          placeholder={t("placeholders.tradeLicenseNumber")}
        />
      </Form.Item>

      {/* Smaller button */}
      <Button
        type="primary"
        size="large"       
        style={{ width: 90 }} 
        loading={isFetchingTL}
        onClick={async () => {
          try {
            const licenseNo = form.getFieldValue("tradeLicenseNumber");
            if (!licenseNo) {
              notification.error(
                { data: { en_Msg: "Please enter Trade License Number first" } },
                "Missing Input"
              );
              return;
            }

            const result = await triggerGetTradeLicenseDetails(
              JSON.stringify(licenseNo.toString())
            ).unwrap();

            setTlData(result?.data || result);

            
            form.setFieldsValue({
              businessName: result?.data?.companyName || "",
            });

           
            // setCompanyEmail(result?.data?.companyEmail || "");

            notification.success(result, t("messages.tradeLicenseFetched"));
          } catch (error: any) {
            console.error("Trade License fetch failed:", error);
            notification.error(error, t("messages.failedToFetchTradeLicense"));
            setTlData(null);
            setCompanyEmail("");
          }
        }}
      >
        {t("common.getDetails")}
      </Button>
    </Input.Group>
  </Form.Item>
</Col>


<Col span={12}>
  <Form.Item
    name="businessName"
    label={t("form.businessName")}
    rules={[{ required: true }]}
  >
    <Input disabled placeholder={t("placeholders.businessName")} />
  </Form.Item>
</Col>

{/* <Col span={12}>
  <Form.Item label={t("form.companyEmail")}>
    <Input value={companyEmail} disabled placeholder={t("placeholders.companyEmail")} />
  </Form.Item>
</Col> */}


              <Col span={12}>
                <Form.Item name="dateRange" label={t("form.Validity")} rules={[{ required: true }]}>
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    format={"DD-MM-YYYY"}
                    disabledDate={(d) => d && d < dayjs().startOf("day")}
                    placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="document"
                  label={t("form.photo")}
                  rules={[{ required: modalMode === "add" }]}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload
                    listType="picture-card"
                    beforeUpload={() => false}
                    multiple={true}
                    accept=".jpg,.jpeg,image/jpeg"
                    onPreview={async (file) => {
                      let src = file.url;
                      if (!src && file.originFileObj) {
                        src = await getBase64(file.originFileObj);
                      }
                      setPreviewImage(src || "");
                      setPreviewOpen(true);
                    }}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>{t("form.upload")}</div>
                    </div>
                  </Upload>
                </Form.Item>

                {previewImage && (
                  <Image
                    style={{ display: "none" }}
                    preview={{
                      visible: previewOpen,
                      src: previewImage,
                      onVisibleChange: (visible) => setPreviewOpen(visible),
                      afterClose: () => setPreviewImage(""),
                    }}
                    src={previewImage}
                  />
                )}
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
