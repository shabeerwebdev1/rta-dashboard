import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, DatePicker, App, Spin, Tag, Tabs } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetPlatesQuery,
  useAddPlateMutation,
  useUpdatePlateMutation,
  useLazyGetPlateByIdQuery,
  useLazyGetLookupsQuery,
} from "../services/rtkApiFactory";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import WhitelistPlatesViewDrawer from "../components/whitelist/WhitelistPlatesViewDrawer";
import { usePermission } from "../hooks/usePermission";

const { Option } = Select;
const pageKey = "whitelist-plates";

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

const WhitelistPlatesPage: React.FC = () => {
  const { canCreate, canEdit } = usePermission();
  const menuName = "WhiteListPlate";
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
  const [searchParams] = useSearchParams();
  const {
    apiParams: rawApiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);

  const apiParams = {
    PageNumber: rawApiParams.PageNumber || 1,
    PageSize: rawApiParams.PageSize || 10,
    ...rawApiParams,
  };
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetPlatesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addPlate, { isLoading: isAdding }] = useAddPlateMutation();
  const [updatePlate, { isLoading: isUpdating }] = useUpdatePlateMutation();
  const [triggerGetPlate, { data: singleRecordData, isSuccess: isSingleRecordSuccess }] = useLazyGetPlateByIdQuery();
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  //state to maintain the rows data for downlaoding
  const [selectedRows, setSelectedRows] = useState([]);

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

  const plateSourceOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 200).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const plateTypeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 300).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const plateColorOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 400).map((option) => ({
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

  useEffect(() => {
    const recordId = state.viewRecordId;
    if (recordId && !isDrawerOpen) {
      triggerGetPlate(recordId);
    }
  }, [state.viewRecordId, triggerGetPlate, isDrawerOpen]);

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
      fromDate: dateRange[0].format("YYYY-MM-DD"),
      toDate: dateRange[1].format("YYYY-MM-DD"),
      plateStatus_Id: modalMode === "add" ? 5001 : rest.plateStatus_Id,
    };

    try {
      let response;

      if (modalMode === "add") {
        response = await addPlate(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updatePlate({
          ...payload,
          id: selectedRecord.id,
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
        if (column.key === "plateNumber") {
          csvRecord[t("form.Number")] = item.plateNumber || "";
        } else if (column.key === "plateSource_Id") {
          csvRecord[t("form.Source")] = getLabelFromValue(item.plateSource_Id, plateSourceOptions, i18n) || "";
        } else if (column.key === "plateType_Id") {
          csvRecord[t("form.Type")] = getLabelFromValue(item.plateType_Id, plateTypeOptions, i18n) || "";
        } else if (column.key === "plateColor_Id") {
          csvRecord[t("form.Color")] = getLabelFromValue(item.plateColor_Id, plateColorOptions, i18n) || "";
        } else if (column.key === "plateStatus_Id") {
          csvRecord[t("form.status")] = getLabelFromValue(item.plateStatus_Id, plateStatusOptions, i18n) || "";
        } else if (column.key === "exemptionReason_ID") {
          csvRecord[t("form.exemptionReason")] =
            getLabelFromValue(item.exemptionReason_ID, exemptionReasons, i18n) || "";
        } else if (column.key === "isByLaw") {
          csvRecord[t("form.isByLaw")] = item.isByLaw ? t("common.yes") : t("common.no");
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
      return `قائمة_اللوحات_البيضاء.csv`;
    } else {
      return `Whitelist_Plates.csv`;
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
        if (column.key === "plateSource_Id") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, plateSourceOptions, i18n),
          };
        }
        if (column.key === "plateType_Id") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, plateTypeOptions, i18n),
          };
        }
        if (column.key === "plateColor_Id") {
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, plateColorOptions, i18n),
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
        if (column.key === "isByLaw") {
          return {
            ...column,
            render: (value: any) =>
              value ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#eb2630" />,
          };
        }
        return column;
      }),
    }),
    [
      config.tableConfig,
      plateSourceOptions,
      plateTypeOptions,
      plateColorOptions,
      plateStatusOptions,
      exemptionReasons,
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
      disabled: !canEdit(menuName),
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
      totalRecords: data.totalRecords,
      activeRecords: data.activeRecords,
      inactiveRecords: data.inactiveRecords,
      expiredRecords: data.expiredRecords,
      isbylawRecords: data.isbylawRecords,
    };
  }, [data]);

  // Tab items configuration
  const tabItems = [
    {
      key: "plate",
      label: t("tabs.addNewPlate") || "Add New Plate",
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="plateNumber"
              label={t("form.Number")}
              rules={[
                { required: true, message: t("validation.required", { field: t("form.Number") }) },
                {
                  pattern: /^[0-9]+$/,
                  message: t("validation.onlyNumbers", { field: t("form.Number") }),
                },
              ]}
              validateFirst
            >
              <Input placeholder={t("placeholders.plateNumber")} maxLength={5} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="plateSource_Id"
              label={t("form.Source")}
              rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.Source") }) }]}
            >
              <Select
                showSearch
                placeholder={t("placeholders.plateSource")}
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                options={plateSourceOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="plateType_Id"
              label={t("form.Type")}
              rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.Type") }) }]}
            >
              <Select
                showSearch
                placeholder={t("placeholders.plateType")}
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                options={plateTypeOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="plateColor_Id"
              label={t("form.Color")}
              rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.Color") }) }]}
            >
              <Select
                showSearch
                placeholder={t("placeholders.plateColor")}
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                options={plateColorOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="violationCategory"
              label={t("form.violationCategory") || "Violation Category"}
              rules={[
                { required: true, message: t("validation.selectRequired", { field: t("form.violationCategory") }) },
              ]}
            >
              <Select
                showSearch
                placeholder={t("placeholders.violationCategory") || "Select violation category"}
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
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
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                options={exemptionReasons.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>
          </Col>

          {modalMode === "edit" && (
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
                  options={(() => {
                    const statusId = form.getFieldValue("plateStatus_Id");
                    const baseOptions = plateStatusOptions.filter((opt) => [5001, 5002].includes(opt.value));

                    if (statusId === 5003) {
                      const expiredOption = plateStatusOptions.find((opt) => opt.value === 5003);
                      if (expiredOption) {
                        baseOptions.push(expiredOption);
                      }
                    }

                    return baseOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }));
                  })()}
                  disabled={form.getFieldValue("plateStatus_Id") === 5003}
                />
              </Form.Item>
            </Col>
          )}

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
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                options={[
                  { label: t("common.true"), value: true },
                  { label: t("common.false"), value: false },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={platesData} metadata={metadata} loading={isLoading} />
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
        isLoading={isLoading || isFetching}
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
        styles={{
          body: {
            maxHeight: "60vh",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 4,
          },
        }}
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
            {tabItems[0].children}
          </Form>
        </Spin>
      </Modal>

      {viewRecord && (
        <WhitelistPlatesViewDrawer
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
