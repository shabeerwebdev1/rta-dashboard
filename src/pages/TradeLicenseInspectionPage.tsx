import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Row, Col, Select, App, DatePicker, Spin } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { useSearchTradeQuery, useLazyGetLookupsQuery } from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { tradeLicenseConfig } from "../config/pageConfigs/tradelicenseConfig"; // ✅ you created this
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";

const { Option } = Select;
const { RangePicker } = DatePicker;
const pageKey = "tradeLicenseInspections";

// Fixed helper function to get label from value based on current language
const getLabelFromValue = (value: number, options: any[], i18n: any) => {
  if (!options || !Array.isArray(options)) return String(value);

  const option = options.find((opt) => opt.value === value || opt.id === value);
  if (!option) return String(value);

  return i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  if (!options || !Array.isArray(options)) return [];
  return options.filter((option) => option.categoryId === categoryId);
};

const TradeLicenseInspectionPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = tradeLicenseConfig;

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
  const [tableSize, setTableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useSearchTradeQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const [triggerGetLookups] = useLazyGetLookupsQuery();

  // Track language changes
  useEffect(() => {
    setLanguageChanged((prev) => !prev);
  }, [i18n.language]);

  // Fetch lookup data when component mounts or language changes
  useEffect(() => {
    fetchLookupData();
  }, [languageChanged]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      // Fetch inspection types (category 1400) and inspection categories (1300)
      const result = await triggerGetLookups([1300, 1400, 1500]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  // Get inspection type options with proper labels based on current language
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

  const handleView = (record: any) => {
    setSelectedFineData(record);
    setDrawerVisible(true);
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
        const selectedData = tableData.filter((item: any) => selectedRowKeys.includes(item.inspectionGUID)) || [];

        // Map numeric values to labels for CSV export
        const mappedData = selectedData.map((item: any) => ({
          ...item,
          inspectionType: getLabelFromValue(item.inspectionType, inspectionTypeOptions, i18n),
          inspectionCategory: getLabelFromValue(item.inspectionCategory, inspectionCategoryOptions, i18n),
          // Add other mapped fields if needed
        }));

        exportToCsv(mappedData, `fines_export_${i18n.language}.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
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
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
  ];

  const handleSearchKeyChange = (newKey: string) => {
    const currentValue = searchValue;

    setTimeout(() => {
      setSearchValue("");
    }, 0);

    if (currentValue.trim()) {
      setGlobalSearch(state.searchKey, currentValue);
    }

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

  const tableData = React.useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const totalCount = React.useMemo(() => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (data.total) return data.total;
    if (data.data && Array.isArray(data.data)) return data.data.length;
    return 0;
  }, [data]);

  // Enhanced table config with render functions for numeric values
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        // Add render functions for different column types
        if (column.key === "inspectionType") {
          return {
            ...column,
            render: (value: any) => {
              if (value === null || value === undefined || value === "") return t("common.noData");
              return getLabelFromValue(value, inspectionTypeOptions, i18n);
            },
          };
        }
        if (column.key === "inspectionCategory") {
          return {
            ...column,
            render: (value: any) => {
              if (value === null || value === undefined || value === "") return t("common.noData");
              return getLabelFromValue(value, inspectionCategoryOptions, i18n);
            },
          };
        }
        // Add more column renderers as needed
        if (column.key === "fineAmount") {
          return {
            ...column,
            render: (value: any) => {
              if (value === null || value === undefined || value === "") return t("common.noData");
              return `${value} AED`;
            },
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, inspectionTypeOptions, inspectionCategoryOptions, i18n, t],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={tableData} loading={isFetching} />

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
              <RangePicker
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
            </Space>
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

      <Spin spinning={isLoadingLookups}>
        <Card bordered={false} bodyStyle={{ padding: "5px 5px 0 5px" }}>
          <DataTableWrapper
            pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
            data={tableData}
            total={totalCount}
            isLoading={isLoading || isFetching}
            apiParams={apiParams}
            handleTableChange={handleTableChange}
            handlePaginationChange={handlePaginationChange}
            rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
            tableSize={tableSize}
            rowKey={config.tableConfig.rowKey}
            actionMenuItems={actionMenuItems}
            state={state}
            lookupOptions={lookupOptions}
            getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
          />
        </Card>
      </Spin>

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

export default TradeLicenseInspectionPage;
