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

// Helper function to determine pledge status based on dates and isActive
const determinePledgeStatus = (record: any) => {
  const today = dayjs();
  const pledgeEndDate = dayjs(record.pledgeEndDate);
  const isActive = record.isActive === 1 || record.isActive === true;

  if (!isActive) {
    return 5002; // Inactive
  }

  if (pledgeEndDate.isBefore(today, "day")) {
    return 5003; // Expired
  }

  return 5001; // Active
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

  // Hardcoded violation categories (to be replaced with API call later)
  const violationCategoryOptions = useMemo(
    () => [
      {
        value: 6001,
        labelEn: "Parking Violation",
        labelAr: "مخالفة وقوف",
        label: i18n.language === "ar" ? "مخالفة وقوف" : "Parking Violation",
      },
      {
        value: 6002,
        labelEn: "Speed Violation",
        labelAr: "مخالفة سرعة",
        label: i18n.language === "ar" ? "مخالفة سرعة" : "Speed Violation",
      },
      {
        value: 6003,
        labelEn: "Traffic Light Violation",
        labelAr: "مخالفة إشارة مرور",
        label: i18n.language === "ar" ? "مخالفة إشارة مرور" : "Traffic Light Violation",
      },
      {
        value: 6004,
        labelEn: "Lane Violation",
        labelAr: "مخالفة مسار",
        label: i18n.language === "ar" ? "مخالفة مسار" : "Lane Violation",
      },
      {
        value: 6005,
        labelEn: "Renewal",
        labelAr: "تجديد",
        label: i18n.language === "ar" ? "تجديد" : "Renewal",
      },
    ],
    [i18n.language],
  );

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
      // Use category ID 900 for pledge types and 500 for status
      const result = await triggerGetLookups([900, 500]).unwrap();
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

  // Get pledge status options with proper labels based on current language
  const pledgeStatusOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 500).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  // Status filter options for the table column
  const statusFilterOptions = useMemo(
    () => [
      { text: getLabelFromValue(5001, pledgeStatusOptions, i18n), value: 5001 },
      { text: getLabelFromValue(5002, pledgeStatusOptions, i18n), value: 5002 },
      { text: getLabelFromValue(5003, pledgeStatusOptions, i18n), value: 5003 },
    ],
    [pledgeStatusOptions, i18n],
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

      // Determine the current status for display
      const currentStatus = record.pledgeStatus || determinePledgeStatus(record);

      form.setFieldsValue({
        pledgeType: record.pledgeType,
        tradeLicenseNumber: record.tradeLicenseNumber,
        businessName: record.businessName,
        businessEmail: record.businessEmail,
        sendToEmail: record.sendToEmail,
        // violationCategory_Id: record.violationCategory_Id , // Default to Renewal
        remarks: record.remarks,
        document: fileList,
        dateRange: dateRange,
        pledgeStatus: currentStatus,
      });
    } else {
      // For add mode, set defaults
      form.setFieldsValue({
        pledgeStatus: 5001,
        violationCategory_Id: 6005, // Default to Renewal (6005)
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

    // Build payload - send pledgeStatus directly to backend
    const payload: Record<string, string | number | boolean | null> = {
      PledgeType: values.pledgeType,
      TradeLicenseNumber: values.tradeLicenseNumber,
      BusinessName: values.businessName,
      BusinessEmail: values.businessEmail,
      sendToEmail: values.sendToEmail,
      ViolationCategory_Id: values.violationCategory_Id,
      Remarks: values.remarks,
      DocumentUploaded: false,
      PledgeStatus: values.pledgeStatus,
      IsActive: values.pledgeStatus === 5002 ? false : true,
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
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = (record: any) => {
    const url = new URL(window.location.href);
    url.searchParams.set("viewRecord", record.id);
    const shareUrl = url.toString();

    if (navigator?.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          notification.success(
            {
              data: {
                en_Msg: t("messages.shareSuccessEn"),
                ar_Msg: t("messages.shareSuccessAr"),
              },
            },
            t("messages.shareSuccessTitle"),
          );
        })
        .catch(() => {
          notification.error(
            {
              data: {
                en_Msg: t("messages.shareErrorEn"),
                ar_Msg: t("messages.shareErrorAr"),
              },
            },
            t("messages.shareErrorTitle"),
          );
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        notification.success(
          {
            data: {
              en_Msg: t("messages.shareSuccessEn"),
              ar_Msg: t("messages.shareSuccessAr"),
            },
          },
          t("messages.shareSuccessTitle"),
        );
      } catch {
        notification.error(
          {
            data: {
              en_Msg: t("messages.shareErrorEn"),
              ar_Msg: t("messages.shareErrorAr"),
            },
          },
          t("messages.shareErrorTitle"),
        );
      }
      document.body.removeChild(textArea);
    }
  };

  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      config.tableConfig.columns.forEach((column) => {
        if (column.key === "pledgeType") {
          csvRecord[t("form.pledgeType")] = getLabelFromValue(item.pledgeType, pledgeTypeOptions, i18n);
        } else if (column.key === "tradeLicenseNumber") {
          csvRecord[t("form.tradeLicenseNumber")] = item.tradeLicenseNumber || "";
        } else if (column.key === "businessName") {
          csvRecord[t("form.businessName")] = item.businessName || "";
        } else if (column.key === "pledgeDate") {
          csvRecord[t("form.pledgestartDate")] = item.pledgeDate ? dayjs(item.pledgeDate).format("DD MMM YYYY") : "";
        } else if (column.key === "pledgeEndDate") {
          csvRecord[t("form.pledgeEndDate")] = item.pledgeEndDate
            ? dayjs(item.pledgeEndDate).format("DD MMM YYYY")
            : "";
        } else if (column.key === "remarks") {
          csvRecord[t("form.remarks")] = item.remarks || "";
        } else if (column.key === "pledgeStatus") {
          const status = item.pledgeStatus || determinePledgeStatus(item);
          csvRecord[t("form.status")] = getLabelFromValue(status, pledgeStatusOptions, i18n);
        } else if (column.key === "createdDate") {
          csvRecord[t("form.createdDate")] = item.createdDate ? dayjs(item.createdDate).format("DD MMM YYYY") : "";
        }
      });

      return csvRecord;
    });
  };

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

          const transformedData = transformDataForCSV(selectedRows);
          const filename = getCsvFilename();
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

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
  );

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
        if (column.key === "pledgeStatus") {
          return {
            ...column,
            filters: statusFilterOptions,
            onFilter: (value: number, record: any) => {
              const recordStatus = record.pledgeStatus || determinePledgeStatus(record);
              return recordStatus === value;
            },
            render: (value: any, record: any) => {
              const status = record.pledgeStatus || determinePledgeStatus(record);
              const label = getLabelFromValue(status, pledgeStatusOptions, i18n);

              if (status === 5001) {
                return <Tag color="green">{label}</Tag>;
              }
              if (status === 5002) {
                return <Tag color="orange">{label}</Tag>;
              }
              if (status === 5003) {
                return <Tag color="red">{label}</Tag>;
              }

              return <Tag>{label}</Tag>;
            },
          };
        }

        return column;
      }),
    }),
    [config.tableConfig, pledgeTypeOptions, pledgeStatusOptions, statusFilterOptions, i18n],
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
    const rawData = Array.isArray(data) ? data : data.data || [];

    return rawData.map((item) => ({
      ...item,
      pledgeStatus: item.pledgeStatus || determinePledgeStatus(item),
    }));
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : data.totalCount || 0;
  }, [data]);

  const metadata = useMemo(() => {
    if (!data || Array.isArray(data)) return {};
    return {
      totalRecords: data.totalRecords,
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
                format={"DD MMM YYYY"}
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
        data={platesData}
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
        filterOptions={{ pledgeStatus: statusFilterOptions }}
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
                  rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.pledgeType") }) }]}
                >
                  <Select
                    placeholder={t("placeholders.pledgeType")}
                    loading={isLoadingLookups}
                    showSearch
                    optionFilterProp="label"
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
                    <Form.Item
                      name="tradeLicenseNumber"
                      noStyle
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();

                            if (!/^[0-9]+$/.test(value)) {
                              return Promise.reject(
                                new Error(t("validation.onlyNumbers", { field: t("form.tradeLicenseNumber") })),
                              );
                            }

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
                        addonBefore={i18n.language === "ar" ? "ر خ -" : "TL-"}
                        placeholder={t("placeholders.tradeLicenseNumber")}
                        minLength={6}
                        maxLength={12}
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      size="large"
                      style={{ width: 90 }}
                      loading={isFetchingTL}
                      onClick={async () => {
                        try {
                          const licenseNo = form.getFieldValue("tradeLicenseNumber");
                          if (!licenseNo) {
                            form.validateFields(["tradeLicenseNumber"]);
                            return;
                          }

                          const result = await triggerGetTradeLicenseDetails(
                            JSON.stringify(licenseNo.toString()),
                          ).unwrap();

                          setTlData(result?.data || result);

                          form.setFieldsValue({
                            businessName: result?.data?.companyName || "",
                            businessEmail: result?.data?.companyEmail || "",
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

              {/* Business Email Field */}
              <Col span={12}>
                <Form.Item
                  name="businessEmail"
                  label={t("form.businessEmail") || "Business Email"}
                  rules={[
                    {
                      required: true,
                      message: t("validation.required", { field: t("form.businessEmail") || "Business Email" }),
                    },
                    { type: "email", message: t("validation.invalidEmail") || "Please enter a valid email address" },
                  ]}
                >
                  <Input
                    type="email"
                    disabled
                    placeholder={t("placeholders.businessEmail") || "Enter business email"}
                  />
                </Form.Item>
              </Col>

              {/* To-send Email Field */}
              <Col span={12}>
                <Form.Item
                  name="sendToEmail"
                  label={t("form.toSendEmail") || "To-send Email"}
                  rules={[
                    {
                      required: true,
                      message: t("validation.required", { field: t("form.toSendEmail") || "To-send Email" }),
                    },
                    { type: "email", message: t("validation.invalidEmail") || "Please enter a valid email address" },
                  ]}
                >
                  <Input
                    type="email"
                    placeholder={t("placeholders.sendToEmail") || "Enter email to send notifications"}
                  />
                </Form.Item>
              </Col>

              {/* Violation Category Field */}
              {/* <Col span={12}>
                <Form.Item
                  name="violationCategory_Id"
                  label={t("form.violationCategory") || "Violation Category"}
                  rules={[
                    {
                      required: true,
                      message: t("validation.selectRequired", {
                        field: t("form.violationCategory") || "Violation Category",
                      }),
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder={t("placeholders.violationCategory") || "Select violation category"}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    options={violationCategoryOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col> */}

              {modalMode === "edit" && (
                <Col span={12}>
                  <Form.Item
                    name="pledgeStatus"
                    label={t("form.status")}
                    rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.status") }) }]}
                  >
                    <Select
                      showSearch
                      placeholder={t("placeholders.status")}
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label as string).toLowerCase().includes(input.toLowerCase())
                      }
                      options={(() => {
                        const currentStatus = form.getFieldValue("pledgeStatus");
                        const baseOptions = pledgeStatusOptions.filter((opt) => [5001, 5002].includes(opt.value));

                        if (currentStatus === 5003) {
                          const expiredOption = pledgeStatusOptions.find((opt) => opt.value === 5003);
                          if (expiredOption) {
                            baseOptions.push(expiredOption);
                          }
                        }

                        return baseOptions.map((option) => ({
                          label: option.label,
                          value: option.value,
                        }));
                      })()}
                      disabled={form.getFieldValue("pledgeStatus") === 5003}
                    />
                  </Form.Item>
                </Col>
              )}

              <Col span={24}>
                <Form.Item
                  name="dateRange"
                  label={t("form.Validity")}
                  rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.Validity") }) }]}
                >
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    format={"DD MMM YYYY"}
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
                      required: true,
                      message: t("validation.uploadRequired", { field: t("form.photo") }),
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
