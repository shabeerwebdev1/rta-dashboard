/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Upload,
  DatePicker,
  Spin,
  Image,
  Tag,
} from "antd";
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
  useLazyGetTradeLicenseDetailsQuery,
} from "../services/rtkApiFactory";
import { getFileUrl, useUploadFilesMutation } from "../services/rtkApiFactory";
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

// Helper function to determine pledge status
// ✅ KEEP THIS - Updated to handle both number and boolean
const getPledgeStatus = (record: any, i18n: any) => {
  const today = dayjs();
  const pledgeEndDate = dayjs(record.pledgeEndDate);

  // Handle both number (1/0) and boolean (true/false) from backend
  const isActiveBoolean = record.isActive === 1 || record.isActive === true;

  if (!isActiveBoolean) {
    return {
      status: i18n.language === "ar" ? "غير نشط" : "Inactive",
      color: "orange",
    };
  }

  if (pledgeEndDate.isBefore(today, "day")) {
    return {
      status: i18n.language === "ar" ? "منتهي" : "Expired",
      color: "red",
    };
  }

  return {
    status: i18n.language === "ar" ? "نشط" : "Active",
    color: "green",
  };
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
  const [tableSize] = useState<"middle" | "small">("small");
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

  //state to maintain the rows data for downlaoding
  const [selectedRows, setSelectedRows] = useState([]);

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
        isActive: record.isActive === 1 ? true : record.isActive, // Convert 1→true, 0→false
      });
    } else {
      // For add mode, set isActive to true by default
      form.setFieldsValue({
        isActive: true,
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

    // Build payload
    const payload: Record<string, string | number | boolean | null> = {
      PledgeType: values.pledgeType,
      TradeLicenseNumber: values.tradeLicenseNumber,
      BusinessName: values.businessName,
      Remarks: values.remarks,
      DocumentUploaded: false,
      IsActive: values.isActive,
      // Add date fields with proper formatting
      PledgeDate: startDate ? startDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
      PledgeEndDate: endDate ? endDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
    };

    try {
      // Separate existing and new files
      const existingFiles: string[] = [];
      const newFiles: any[] = [];

      if (values.document && Array.isArray(values.document)) {
        values.document.forEach((file: any) => {
          if (file.originFileObj) {
            // 🆕 New file to upload
            newFiles.push(file);
          } else if (file.url) {
            // 🧩 Extract just the filename (no URL, no query)
            const filename = file.url.split("/").pop()?.split("?")[0] || "";
            if (filename) existingFiles.push(filename);
          }
        });
      }

      // 🧱 Start with existing filenames
      const allDocumentPaths: string[] = [...existingFiles];

      // 📤 Upload new files if any
      if (newFiles.length > 0) {
        const formData = new FormData();
        formData.append("Category", "PledgeDocuments");

        newFiles.forEach((file: any) => {
          formData.append("Files", file.originFileObj);
        });

        const uploadResult = await uploadFiles(formData).unwrap();
        const savedFileNames = (uploadResult as any[]).map((f) => f.savedAs);

        // Add newly uploaded file names
        allDocumentPaths.push(...savedFileNames);
      }

      // 🪄 Combine all filenames into semicolon-separated string
      if (allDocumentPaths.length > 0) {
        payload.DocumentPath = allDocumentPaths.join(";");
        payload.DocumentUploaded = true;
      }

      // 🧾 Save or update pledge
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

    navigator.clipboard?.writeText(shareUrl).then(
      () =>
        notification.success(
          {
            data: {
              en_Msg: t("messages.shareSuccessEn"),
              ar_Msg: t("messages.shareSuccessAr"),
            },
          },
          t("messages.shareSuccessTitle"),
        ),
      () =>
        notification.error(
          {
            data: {
              en_Msg: t("messages.shareErrorEn"),
              ar_Msg: t("messages.shareErrorAr"),
            },
          },
          t("messages.shareErrorTitle"),
        ),
    );
  };

  // ✅ FIXED: Enhanced function to transform data for CSV export with proper headers
  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      // Only include fields that are visible in the UI table
      config.tableConfig.columns.forEach((column) => {
        if (column.key === "pledgeType") {
          csvRecord[t("form.pledgeType")] = getLabelFromValue(item.pledgeType, pledgeTypeOptions, i18n);
        } else if (column.key === "tradeLicenseNumber") {
          csvRecord[t("form.tradeLicenseNumber")] = item.tradeLicenseNumber || "";
        } else if (column.key === "businessName") {
          csvRecord[t("form.businessName")] = item.businessName || "";
        } else if (column.key === "pledgeDate") {
          csvRecord[t("form.pledgeDate")] = item.pledgeDate ? dayjs(item.pledgeDate).format("DD-MM-YYYY") : "";
        } else if (column.key === "pledgeEndDate") {
          csvRecord[t("form.pledgeEndDate")] = item.pledgeEndDate ? dayjs(item.pledgeEndDate).format("DD-MM-YYYY") : "";
        } else if (column.key === "remarks") {
          csvRecord[t("form.remarks")] = item.remarks || "";
        } else if (column.key === "isActive") {
          const statusInfo = getPledgeStatus(item, i18n);
          csvRecord[t("form.status")] = statusInfo.status;
        } else if (column.key === "createdDate") {
          csvRecord[t("form.createdDate")] = item.createdDate ? dayjs(item.createdDate).format("DD-MM-YYYY") : "";
        }
        // Skip any other fields that are not in the table config
      });

      return csvRecord;
    });
  };

  // ✅ FIXED: Get CSV filename based on current language
  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `التعهدات.csv`;
    } else {
      return `pledges.csv`;
    }
  };

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

          // ✅ FIXED: Transform the data to match UI display
          const transformedData = transformDataForCSV(selectedRows);

          // ✅ FIXED: Get filename based on current language
          const filename = getCsvFilename();

          // ✅ FIXED: Export to CSV using your common component
          exportToCsv(transformedData, filename);

          notification.success(
            { data: { en_Msg: t("messages.csvDownloaded", { count: selectedRows.length }) } },
            t("messages.exportSuccess"),
          );
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          notification.error({ data: { en_Msg: t("messages.exportError") } }, t("messages.exportFailed"));
        }
      },
    });
  };

  const statusFilterOptions = [
    { text: t("status.active"), value: "active" },
    { text: t("status.inactive"), value: "inactive" },
    { text: t("status.expired"), value: "expired" },
  ];

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
  );

  // Enhanced table config with render functions for dropdown values and status
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
        if (column.key === "isActive") {
          return {
            ...column,
            render: (value: any, record: any) => {
              const statusInfo = getPledgeStatus(record, i18n);
              return <Tag color={statusInfo.color}>{statusInfo.status}</Tag>;
            },
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
      active: data.active,
      inActive: data.inActive,
      expired: data.expired,
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
              <span>{t("common.filterByPledgeStartDate")}</span>

              <DatePicker.RangePicker
                value={state.dateRange}
                format={"DD-MM-YYYY"}
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
          onChange: (keys: React.Key[], selectedRows: any[]) => {
            setSelectedRowKeys(keys);

            setSelectedRows((prev) => {
              const remaining = prev.filter((p) => keys.includes(p.id));
              const newSelected = selectedRows.filter((r) => !remaining.some((p) => p.id === r.id));
              return [...remaining, ...newSelected];
            });
          },
          getCheckboxProps: (record: any) => ({
            name: record.id,
          }),
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
        lookupOptions={lookupOptions}
        getLabelFromValue={getLabelFromValue}
        filterOptions={{ isActive: statusFilterOptions }}
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
                <Form.Item
                  name="pledgeType"
                  label={t("form.pledgeType")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.pledgeType") }) }]}
                >
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
                  rules={[
                    { required: true, message: t("validation.required", { field: t("form.tradeLicenseNumber") }) },
                  ]}
                >
                  <Input.Group compact>
                    {/* Input field */}
                    <Form.Item
                      name="tradeLicenseNumber"
                      noStyle
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();

                            // Check for digits only
                            if (!/^[0-9]+$/.test(value)) {
                              return Promise.reject(
                                new Error(t("validation.onlyNumbers", { field: t("form.tradeLicenseNumber") })),
                              );
                            }

                            // Check for minimum length
                            if (value.length < 6) {
                              return Promise.reject(
                                new Error(
                                  t("validation.lengthRange", {
                                    field: t("form.tradeLicenseNumber"),
                                    min: 6,
                                  }),
                                ),
                              );
                            }

                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input
                        style={{ width: "calc(100% - 90px)" }}
                        addonBefore="TL-"
                        placeholder={t("placeholders.tradeLicenseNumber")}
                        minLength={6}
                        maxLength={12}
                      />
                    </Form.Item>

                    {/* Button */}
                    <Button
                      type="primary"
                      size="large"
                      style={{ width: 90 }}
                      loading={isFetchingTL}
                      onClick={async () => {
                        try {
                          const licenseNo = form.getFieldValue("tradeLicenseNumber");
                          if (!licenseNo) {
                            // Trigger validation if the field is empty
                            form.validateFields(["tradeLicenseNumber"]);
                            return;
                          }

                          const result = await triggerGetTradeLicenseDetails(
                            JSON.stringify(licenseNo.toString()),
                          ).unwrap();

                          setTlData(result?.data || result);

                          form.setFieldsValue({
                            businessName: result?.data?.companyName || "",
                          });

                          notification.success(result, t("messages.tradeLicenseFetched"));
                        } catch (error: any) {
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
                  rules={[{ required: true, message: t("validation.required", { field: t("form.businessName") }) }]}
                >
                  <Input disabled placeholder={t("placeholders.businessName")} />
                </Form.Item>
              </Col>

              {modalMode === "edit" && (
                <Col span={12}>
                  <Form.Item
                    name="isActive"
                    label={t("form.status")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.status") }) }]}
                  >
                    {selectedRecord && dayjs(selectedRecord.pledgeEndDate).isBefore(dayjs(), "day") ? (
                      // 🔒 Expired: show disabled Select with "Expired" value
                      <Select value="expired" disabled>
                        <Option value="expired">{t("status.expired")}</Option>
                      </Select>
                    ) : (
                      // ✅ Active/InActive: normal editable Select
                      <Select placeholder={t("placeholders.status")}>
                        <Option value={true}>{t("status.active")}</Option>
                        <Option value={false}>{t("status.inactive")}</Option>
                      </Select>
                    )}
                  </Form.Item>
                </Col>
              )}

              <Col span={12}>
                <Form.Item
                  name="dateRange"
                  label={t("form.Validity")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.Validity") }) }]}
                >
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    format={"DD-MM-YYYY"}
                    disabledDate={(d) => d && d < dayjs().startOf("day")}
                    placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                    disabled={[modalMode === "edit", false]}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="document"
                  label={t("form.photo")}
                  rules={[
                    {
                      required: modalMode === "add",
                      message: t("validation.required", { field: t("form.photo") }),
                    },
                  ]}
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
                  <Input.TextArea placeholder={t("placeholders.remarks")} maxLength={4000} />
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
