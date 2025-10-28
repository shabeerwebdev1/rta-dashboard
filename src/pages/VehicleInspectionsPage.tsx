/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Row, Col, Select, App, DatePicker, Tag } from "antd";
import { EyeOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { useSearchFinesQuery, useLazyGetLookupsQuery } from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";

import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";
import { vehicleInspectionsConfig } from "../config/pageConfigs/vehicleInspectionsConfig";

const { Option } = Select;
const { RangePicker } = DatePicker;

const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  if (!options || !Array.isArray(options)) return String(value);
  const option = options.find((opt) => opt.value === value || opt.id === value);
  if (!option) return String(value);
  return i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label;
};

const filterOptionsByCategory = (options: any[], categoryId: number) => {
  if (!options || !Array.isArray(options)) return [];
  return options.filter((option) => option.categoryId === categoryId);
};

const VehicleInspectionsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = vehicleInspectionsConfig;

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

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFineData, setSelectedFineData] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // Merge permanent filter with user filters
  const enhancedApiParams = useMemo(() => {
    const params = { ...apiParams };

    // Ensure orFilters exists
    if (!params.orFilters) {
      params.orFilters = {};
    }

    // Always add inspectionCategory filter
    params.orFilters = {
      ...params.orFilters,
      inspectionCategory: 13001, // Permanent filter - always applied
    };

    return params;
  }, [apiParams]);

  const { data, isLoading, isFetching } = useSearchFinesQuery(enhancedApiParams, {
    refetchOnMountOrArgChange: true,
  });

  const [triggerGetLookups] = useLazyGetLookupsQuery();

  const fineStatusColorMap: Record<number, string> = {
    15001: "orange",
    15002: "green",
    15003: "red",
    15004: "blue",
    15005: "purple",
  };

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    try {
      const result = await triggerGetLookups([1300, 1400, 1500, 1700]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    }
  };

  const inspectionTypeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 1400).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label,
      })),
    [lookupOptions, i18n.language],
  );

  const inspectionCategoryOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 1300).map((option) => ({
        ...option,
        label: i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label,
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

  const handleView = (record: any) => {
    setSelectedFineData(record);
    setDrawerVisible(true);
  };

  // ✅ FIXED: CSV download function that exports exactly what's shown in UI table
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
          const selectedData = tableData.filter((item: any) => selectedRowKeys.includes(item.inspectionGUID));

          if (selectedData.length === 0) {
            notification.error({ data: { en_Msg: t("messages.noDataToExport") } }, t("messages.exportFailed"));
            return;
          }

          // ✅ FIXED: Export exactly what's displayed in the table columns with date formatting
          const transformedData = selectedData.map((item: any) => {
            const csvRecord: Record<string, unknown> = {};

            // Use the same enhanced table config to get the exact same data as UI
            enhancedTableConfig.columns.forEach((column: any) => {
              const columnKey = column.key;
              const headerName = columnLabels[columnKey];

              // Apply the exact same render logic as in the table
              let displayValue = item[columnKey];

              if (columnKey === "inspectionType") {
                displayValue =
                  displayValue == null
                    ? t("common.noData")
                    : getLabelFromValue(displayValue, inspectionTypeOptions, i18n);
              } else if (columnKey === "inspectionCategory") {
                displayValue =
                  displayValue == null || displayValue === ""
                    ? t("common.noData")
                    : getLabelFromValue(displayValue, inspectionCategoryOptions, i18n);
              } else if (columnKey === "fineAmount") {
                displayValue = displayValue == null || displayValue === "" ? t("common.noData") : `${displayValue} AED`;
              } else if (columnKey === "inspectionStatus") {
                // For CSV, we just want the label text without the Tag component
                displayValue =
                  displayValue == null ? t("common.noData") : getLabelFromValue(displayValue, lookupOptions, i18n);
              }
              // ✅ ADDED: Date formatting for common date fields
              else if (
                columnKey.includes("Date") ||
                columnKey.includes("date") ||
                columnKey.includes("Time") ||
                columnKey.includes("time")
              ) {
                // Format any date/time field to DD-MM-YYYY
                displayValue = displayValue ? dayjs(displayValue).format("DD-MM-YYYY") : t("common.noData");
              } else {
                displayValue = displayValue == null || displayValue === "" ? t("common.noData") : displayValue;
              }

              csvRecord[headerName] = displayValue;
            });

            return csvRecord;
          });

          // ✅ FIXED: Language-specific filename
          const filename = i18n.language === "ar" ? `تفتيش_المركبات.csv` : `Vehicles_Fines.csv`;

          exportToCsv(transformedData, filename);

          notification.success(
            { data: { en_Msg: t("messages.csvDownloaded", { count: selectedData.length }) } },
            t("messages.exportSuccess"),
          );
          setSelectedRowKeys([]);
        } catch (error) {
          notification.error({ data: { en_Msg: t("messages.exportError") } }, t("messages.exportFailed"));
        }
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c: any) => [c.key, t(c.title)])),
    [t, config, i18n.language],
  );

  const actionMenuItems = (record: any) => [
    {
      key: "view",
      label: t("common.view"),
      icon: record.inspectionStatus === 15003 ? <EditOutlined /> : <EyeOutlined />,
      onClick: () => handleView(record),
    },
  ];

  const handleSearchKeyChange = (newKey: string) => {
    setSearchValue("");
    setGlobalSearch(newKey, "");
  };

  const searchAddon = (
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  const tableData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (data.total) return data.total;
    if (data.data && Array.isArray(data.data)) return data.data.length;
    return 0;
  }, [data]);

  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "inspectionType") {
          return {
            ...column,
            render: (value: any) => {
              if (value == null) return t("common.noData");
              return getLabelFromValue(value, inspectionTypeOptions, i18n);
            },
          };
        }

        if (column.key === "inspectionCategory") {
          return {
            ...column,
            render: (value: any) => {
              if (value == null || value === "") return t("common.noData");
              return getLabelFromValue(value, inspectionCategoryOptions, i18n);
            },
          };
        }

        if (column.key === "fineAmount") {
          return {
            ...column,
            render: (value: any) => {
              if (value == null || value === "") return t("common.noData");
              return `${value} AED`;
            },
          };
        }

        if (column.key === "inspectionStatus") {
          return {
            ...column,
            render: (value: number) => {
              if (value == null) return t("common.noData");

              const label = getLabelFromValue(value, lookupOptions, i18n);
              const color = fineStatusColorMap[value] || "default";

              return <Tag color={color}>{label}</Tag>;
            },
          };
        }

        return column;
      }),
    }),
    [config.tableConfig, inspectionTypeOptions, inspectionCategoryOptions, i18n, t, lookupOptions],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
              <span>{t("common.filterByfinedDate")}</span>

              <RangePicker
                value={state.dateRange}
                format={"DD-MM-YYYY"}
                placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
              {t("common.downloadCsv")}
            </Button>
          </Col>
        </Row>
        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          lookupOptions={lookupOptions}
          getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={tableData}
        total={totalCount}
        isLoading={isLoading || isFetching}
        apiParams={enhancedApiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        tableSize="small"
        rowKey={config.tableConfig.rowKey}
        actionMenuItems={actionMenuItems}
        state={state}
        lookupOptions={lookupOptions}
        getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
        columnLookupMap={{ inspectionType: 1700 }}
      />

      <FinesViewDrawer
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedFineData(null);
        }}
        fine={selectedFineData}
        isLoading={isFetching}
        lookupOptions={lookupOptions}
        getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
      />
    </Space>
  );
};

export default VehicleInspectionsPage;
