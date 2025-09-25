import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Row, Col, Select, App, DatePicker } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { useSearchFinesQuery, useLazyGetLookupsQuery } from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { finesConfig } from "../config/pageConfigs/finesConfig";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";

const { Option } = Select;
const { RangePicker } = DatePicker;
const pageKey = "fines";

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

const FinesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = finesConfig;

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

  const { data, isLoading, isFetching } = useSearchFinesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const [triggerGetLookups] = useLazyGetLookupsQuery();

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    try {
      const result = await triggerGetLookups([1300, 1400, 1500]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
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
        const mappedData = selectedData.map((item: any) => ({
          ...item,
          inspectionType: getLabelFromValue(item.inspectionType, inspectionTypeOptions, i18n),
          inspectionCategory: getLabelFromValue(item.inspectionCategory, inspectionCategoryOptions, i18n),
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
              if (value == null || value === "") return t("common.noData");
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
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadCsv} 
              disabled={selectedRowKeys.length === 0}
            >
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
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        tableSize="small"
        rowKey={config.tableConfig.rowKey}
        actionMenuItems={actionMenuItems}
        state={state}
        lookupOptions={lookupOptions}
        getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
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

export default FinesPage;