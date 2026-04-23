/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, DatePicker, App, Spin, Tag } from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetTradeLicensesQuery,
  useAddTradeLicenseMutation,
  useUpdateTradeLicenseMutation,
  useDeleteTradeLicenseMutation,
  useLazyGetTradeLicenseByIdQuery,
  useLazyGetLookupsQuery,
  useLazyGetTradeLicenseDetailsQuery,
} from "../services/rtkApiFactory";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import WhitelistTradeViewDrawer from "../components/whitelist/WhitelistTradeViewDrawer";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { usePermission } from "../hooks/usePermission";

const { Option } = Select;
const pageKey = "whitelist-tradelicenses";

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

const WhitelistTradeLicensesPage: React.FC = () => {
  const { canCreate, canEdit } = usePermission();
  const menuName = "WhiteListTrade";
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
  const [searchParams] = useSearchParams();
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
  const [tableSize, setTableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [tlData, setTlData] = useState<any | null>(null);
  const [companyEmail, setCompanyEmail] = useState("");

  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetTradeLicensesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addTradeLicense, { isLoading: isAdding }] = useAddTradeLicenseMutation();
  const [updateTradeLicense, { isLoading: isUpdating }] = useUpdateTradeLicenseMutation();
  const [deleteTradeLicense, { isLoading: isDeleting }] = useDeleteTradeLicenseMutation();
  const [triggerGetTradeLicense, { data: singleRecordData, isSuccess: isSingleRecordSuccess }] =
    useLazyGetTradeLicenseByIdQuery();
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetTradeLicenseDetails, { isFetching: isFetchingTL }] = useLazyGetTradeLicenseDetailsQuery();

  // Fetch lookup data when modal opens or language changes
  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([100, 200, 300, 400, 500]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      const backendError = error?.data?.en_Msg || "Failed to load dropdown options";
      notification.error({ data: { en_Msg: backendError } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  // Get options for each category with proper labels based on current language
  const exemptionReasons = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 100).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const licenseSourceOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 200).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const licenseTypeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 300).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const plateStatusOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 500).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  // Hardcoded violation categories (to be replaced with API call later)
  const violationCategoryOptions = useMemo(
    () => [
      {
        value: "Parking Violation",
        labelEn: "Parking Violation",
        labelAr: "مخالفة وقوف",
        label: i18n.language === "ar" ? "مخالفة وقوف" : "Parking Violation",
      },
      {
        value: "Speed Violation",
        labelEn: "Speed Violation",
        labelAr: "مخالفة سرعة",
        label: i18n.language === "ar" ? "مخالفة سرعة" : "Speed Violation",
      },
      {
        value: "Traffic Light Violation",
        labelEn: "Traffic Light Violation",
        labelAr: "مخالفة إشارة مرور",
        label: i18n.language === "ar" ? "مخالفة إشارة مرور" : "Traffic Light Violation",
      },
      {
        value: "Lane Violation",
        labelEn: "Lane Violation",
        labelAr: "مخالفة مسار",
        label: i18n.language === "ar" ? "مخالفة مسار" : "Lane Violation",
      },
      {
        value: "No Entry Violation",
        labelEn: "No Entry Violation",
        labelAr: "مخالفة دخول ممنوع",
        label: i18n.language === "ar" ? "مخالفة دخول ممنوع" : "No Entry Violation",
      },
    ],
    [i18n.language],
  );

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  useEffect(() => {
    const recordId = state.viewRecordId;
    if (recordId && !isDrawerOpen) {
      triggerGetTradeLicense(recordId);
    }
  }, [state.viewRecordId, triggerGetTradeLicense, isDrawerOpen]);

  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      const record = singleRecordData.data || singleRecordData;
      setViewRecord(record);
      setIsDrawerOpen(true);
    }
  }, [isSingleRecordSuccess, singleRecordData]);

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
        plateStatus_Id: record.plateStatus_Id,
        dateRange: record.fromDate && record.toDate ? [dayjs(record.fromDate), dayjs(record.toDate)] : null,
      });
    } else {
      // For add mode, don't set any default status - let user select
      form.setFieldsValue({
        dateRange: null,
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const { dateRange, plateStatus_Id } = values;

    const payload = {
      tradeLicenseNumber: values.tradeLicenseNumber,
      tradeLicense_EN_Name: values.tradeLicense_EN_Name,
      tradeLicense_AR_Name: values.tradeLicense_AR_Name,
      plotNumber: values.plotNumber || "",
      violationCategory: values.violationCategory,
      isByLaw: values.isByLaw,
      exemptionReason_ID: values.exemptionReason_ID,
      plateStatus_Id: plateStatus_Id,
      fromDate: dateRange[0].format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
      toDate: dateRange[1].format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    };

    try {
      let response;

      if (modalMode === "add") {
        response = await addTradeLicense(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updateTradeLicense({
          id: selectedRecord.id,
          ...payload,
        }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }

      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = () => {
    const params = new URLSearchParams(searchParams);
    params.set("viewRecord", viewRecord.id);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          notification.success(
            {
              data: {
                en_Msg: t("messages.shareSuccessEn"),
                ar_Msg: t("messages.shareSuccessEn"),
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
                ar_Msg: t("messages.shareErrorEn"),
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
              ar_Msg: t("messages.shareSuccessEn"),
            },
          },
          t("messages.shareSuccessTitle"),
        );
      } catch {
        notification.error(
          {
            data: {
              en_Msg: t("messages.shareErrorEn"),
              ar_Msg: t("messages.shareErrorEn"),
            },
          },
          t("messages.shareErrorTitle"),
        );
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};

      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      config.tableConfig.columns.forEach((column) => {
        if (column.key === "tradeLicenseNumber") {
          csvRecord[t("form.tradeLicenseNumber")] = item.tradeLicenseNumber || "";
        } else if (column.key === "tradeLicense_EN_Name") {
          csvRecord[t("form.tradeLicense_EN_Name")] = item.tradeLicense_EN_Name || "";
        } else if (column.key === "tradeLicense_AR_Name") {
          csvRecord[t("form.tradeLicense_AR_Name")] = item.tradeLicense_AR_Name || "";
        } else if (column.key === "plotNumber") {
          csvRecord[t("form.plotNumber")] = item.plotNumber || "";
        } else if (column.key === "licenseSource_Id") {
          csvRecord[t("form.licenseSource")] =
            getLabelFromValue(item.licenseSource_Id, licenseSourceOptions, i18n) || "";
        } else if (column.key === "licenseType_Id") {
          csvRecord[t("form.licenseType")] = getLabelFromValue(item.licenseType_Id, licenseTypeOptions, i18n) || "";
        } else if (column.key === "plateStatus_Id") {
          csvRecord[t("form.status")] = getLabelFromValue(item.plateStatus_Id, plateStatusOptions, i18n) || "";
        } else if (column.key === "exemptionReason_ID") {
          csvRecord[t("form.exemptionReason")] =
            getLabelFromValue(item.exemptionReason_ID, exemptionReasons, i18n) || "";
        } else if (column.key === "violationCategory") {
          const violationCat = violationCategoryOptions.find((opt) => opt.value === item.violationCategory);
          csvRecord[t("form.violationCategory")] = violationCat?.label || "";
        } else if (column.key === "fromDate") {
          csvRecord[t("form.fromDate")] = item.fromDate ? dayjs(item.fromDate).format("DD MMM YYYY") : "";
        } else if (column.key === "toDate") {
          csvRecord[t("form.toDate")] = item.toDate ? dayjs(item.toDate).format("DD MMM YYYY") : "";
        }
      });

      return csvRecord;
    });
  };

  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `قائمة_الرخص_التجارية.csv`;
    } else {
      return `Trade_Licenses.csv`;
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
        if (column.key === "licenseSource_Id") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, licenseSourceOptions, i18n),
          };
        }
        if (column.key === "licenseType_Id") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, licenseTypeOptions, i18n),
          };
        }
        if (column.key === "plateStatus_Id") {
          return {
            ...column,
            render: (value: any) => {
              const label = getLabelFromValue(value, plateStatusOptions, i18n);

              if (value === 5001) {
                return <Tag color="green">{label}</Tag>;
              }
              if (value === 5002) {
                return <Tag color="default">{label}</Tag>;
              }
              if (value === 5003) {
                return <Tag color="red">{label}</Tag>;
              }

              return <Tag>{label}</Tag>;
            },
          };
        }
        if (column.key === "exemptionReason_ID") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, exemptionReasons, i18n),
          };
        }
        if (column.key === "violationCategory") {
          return {
            ...column,
            render: (value: any) => {
              const category = violationCategoryOptions.find((opt) => opt.value === value);
              return category?.label || value;
            },
          };
        }
        return column;
      }),
    }),
    [
      config.tableConfig,
      licenseSourceOptions,
      licenseTypeOptions,
      plateStatusOptions,
      exemptionReasons,
      violationCategoryOptions,
      i18n,
    ],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => handleModalOpen("edit", record),
      // disabled: !canEdit(menuName),
    },
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

  const licensesData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : data.total || 0;
  }, [data]);

  const metadata = useMemo(() => {
    if (!data || Array.isArray(data)) return {};
    return data;
  }, [data]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={licensesData} metadata={metadata} loading={isLoading} />
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
              <span>{t("common.filterByFromDate")}</span>
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
                // disabled={!canCreate(menuName)}
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
        data={licensesData}
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
          <Button key="submit" type="primary" loading={isAdding || isUpdating} onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Spin spinning={isLoadingLookups}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="tradeLicenseNumber"
                  label={t("form.tradeLicenseNumber")}
                >
                  <Input.Group compact>
                    <Form.Item
                      name="tradeLicenseNumber"
                      noStyle
                      rules={[
                        { required: true, message: t("validation.required", { field: t("form.tradeLicenseNumber") }) },
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
                        maxLength={15}
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

                          const licenseData = result?.data || result;

                          setTlData(licenseData);

                          form.setFieldsValue({
                            tradeLicense_EN_Name: licenseData?.premiseNameEn || licenseData?.companyName || "",
                            tradeLicense_AR_Name: licenseData?.premiseNameAr || "",
                          });

                          if (licenseData?.companyEmail) {
                            setCompanyEmail(licenseData.companyEmail);
                          }

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
                  name="tradeLicense_EN_Name"
                  label={t("form.tradeLicense_EN_Name")}
                  rules={[
                    { required: true, message: t("validation.required", { field: t("form.tradeLicense_EN_Name") }) },
                  ]}
                >
                  <Input placeholder={t("placeholders.tradeLicense_EN_Name")} maxLength={100} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="tradeLicense_AR_Name"
                  label={t("form.tradeLicense_AR_Name")}
                  rules={[
                    { required: true, message: t("validation.required", { field: t("form.tradeLicense_AR_Name") }) },
                  ]}
                >
                  <Input
                    placeholder={t("placeholders.tradeLicense_AR_Name")}
                    maxLength={100}
                    dir="rtl"
                    style={{ textAlign: "right" }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="plotNumber"
                  label={t("form.plotNumber")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.plotNumber") }) }]}
                >
                  <Input placeholder={t("placeholders.plotNumber")} maxLength={15} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="violationCategory"
                  label={t("form.violationCategory")}
                  rules={[
                    { required: true, message: t("validation.selectRequired", { field: t("form.violationCategory") }) },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder={t("placeholders.violationCategory")}
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
              </Col>

              <Col span={12}>
                <Form.Item
                  name="dateRange"
                  label={t("form.dateRange")}
                  rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.dateRange") }) }]}
                >
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    format={"DD MMM YYYY"}
                    disabledDate={(d) => d && d < dayjs().startOf("day")}
                    placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="exemptionReason_ID"
                  label={t("form.exemptionReason")}
                  rules={[
                    { required: true, message: t("validation.selectRequired", { field: t("form.exemptionReason") }) },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder={t("placeholders.exemptionReason")}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    options={exemptionReasons.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="plateStatus_Id"
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
                    options={plateStatusOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="isByLaw"
                  label={t("form.isByLaw")}
                  rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.isByLaw") }) }]}
                >
                  <Select
                    showSearch
                    placeholder={t("placeholders.isByLaw")}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    options={[
                      { label: t("common.true"), value: true },
                      { label: t("common.false"), value: false },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {viewRecord && (
        <WhitelistTradeViewDrawer
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

export default WhitelistTradeLicensesPage;