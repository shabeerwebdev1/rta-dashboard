/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Row, Col, Select, App, DatePicker, Tag } from "antd";
import { EyeOutlined, DownloadOutlined, EnvironmentOutlined, PaperClipOutlined, EditOutlined } from "@ant-design/icons";
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
import MapModal from "../components/fines/MapModal";
import AttachmentsModal from "../components/fines/AttachmentsModal";

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
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [attachmentsModalVisible, setAttachmentsModalVisible] = useState(false);
  const [selectedFineForModal, setSelectedFineForModal] = useState<any>(null);
  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  //state to maintain the rows data for downlaoding
  const [selectedRows, setSelectedRows] = useState([]);

  const [triggerGetLookups] = useLazyGetLookupsQuery();

  const fineStatusColorMap: Record<number, string> = {
    15001: "orange",
    15002: "green",
    15003: "red",
    15004: "blue",
    15005: "purple",
    15006: "indigo",
  };

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    try {
      // ✅ Fetch both 1400 (for rendering) and 1700 (for filters)
      const result = await triggerGetLookups([1300, 1400, 1500, 1700]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    }
  };

  // ✅ Use 1400 for rendering inspectionType (as before)
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

  // ✅ Filtered options excluding 13001 for dropdown
  const inspectionCategoryFilterOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 1300)
        .filter((option) => option.value !== 13001 && option.id !== 13001)
        .map((option) => ({
          ...option,
          label: i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label,
        })),
    [lookupOptions, i18n.language],
  );

  // ✅ Enhanced API params with orFilters to exclude inspectionCategory = 13001
  const enhancedApiParams = useMemo(() => {
    const params = { ...apiParams };

    // Get all category values except 13001
    const allowedCategories = inspectionCategoryFilterOptions.map((opt) => opt.value || opt.id);

    // Only add the filter if we have lookup data loaded
    if (allowedCategories.length > 0) {
      // If user hasn't filtered inspectionCategory, apply our exclusion filter
      if (!state.columnFilters?.inspectionCategory || state.columnFilters.inspectionCategory.length === 0) {
        params.orFilters = {
          ...params.orFilters,
          inspectionCategory: allowedCategories,
        };
      }
    }

    return params;
  }, [apiParams, inspectionCategoryFilterOptions, state.columnFilters]);

  const { data, isLoading, isFetching } = useSearchFinesQuery(enhancedApiParams, {
    refetchOnMountOrArgChange: true,
  });

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

  const handleViewLocation = (record: any) => {
    setSelectedFineForModal(record);
    setMapModalVisible(true);
  };

  const handleViewAttachments = (record: any) => {
    setSelectedFineForModal(record);
    setAttachmentsModalVisible(true);
  };

  // ✅ FIXED: Exact replica of table data display
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
          //const selectedRows = tableData.filter((item: any) => selectedRowKeys.includes(item.inspectionGUID));

          if (selectedRows.length === 0) {
            notification.error({ data: { en_Msg: t("messages.noDataToExport") } }, t("messages.exportFailed"));
            return;
          }
          //  Add "Sl. No" column and map table columns
          const transformedData = selectedRows.map((item: any, index: number) => {
            const csvRecord: Record<string, unknown> = {};
            csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

            enhancedTableConfig.columns.forEach((column: any) => {
              const columnKey = column.key;
              const headerName = columnLabels[columnKey];
              let displayValue = item[columnKey];

              if (columnKey === "inspectorName") {
                const lang = i18n.language.startsWith("ar") ? "ar" : "en";
                displayValue =
                  lang === "ar"
                    ? item.inspectorNameAr || item.inspectorNameEn || t("common.noData")
                    : item.inspectorNameEn || item.inspectorNameAr || t("common.noData");
              } else if (columnKey === "inspectionType") {
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
                displayValue =
                  displayValue == null ? t("common.noData") : getLabelFromValue(displayValue, lookupOptions, i18n);
              } else if (columnKey.includes("Date") || columnKey.includes("date")) {
                displayValue = displayValue ? dayjs(displayValue).format("DD-MM-YYYY") : t("common.noData");
              } else {
                displayValue = displayValue == null || displayValue === "" ? t("common.noData") : displayValue;
              }

              csvRecord[headerName] = displayValue;
            });

            return csvRecord;
          });
          const filename = i18n.language === "ar" ? `المخالفات.csv` : `Vehicle_Inspections.csv`;

          exportToCsv(transformedData, filename);
          notification.success(
            {
              data: {
                en_Msg: t("messages.csvDownloaded", {
                  count: selectedRows.length,
                }),
              },
            },
            t("messages.exportSuccess"),
          );
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          console.error("CSV Export Error:", error);
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
      label: record.inspectionStatus === 15003 ? t("common.edit") : t("common.view"),
      icon: record.inspectionStatus === 15003 ? <EditOutlined /> : <EyeOutlined />,
      onClick: () => handleView(record),
    },
    {
      key: "location",
      label: t("common.viewLocation"),
      icon: <EnvironmentOutlined />,
      onClick: () => handleViewLocation(record),
    },
    {
      key: "attachments",
      label: t("common.viewAttachments"),
      icon: <PaperClipOutlined />,
      onClick: () => handleViewAttachments(record),
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
            // ✅ Override filters to exclude 13001 from dropdown
            filters: inspectionCategoryFilterOptions.map((opt) => ({
              text: opt.label,
              value: opt.value || opt.id,
            })),
            render: (value: any) => {
              if (value == null || value === "") return t("common.noData");
              // ✅ Use FULL inspectionCategoryOptions for rendering labels
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
    [
      config.tableConfig,
      inspectionTypeOptions,
      inspectionCategoryOptions,
      inspectionCategoryFilterOptions,
      i18n,
      t,
      lookupOptions,
    ],
  );

  // ✅ Modified lookupOptions to exclude 13001 from DataTableWrapper filters
  const modifiedLookupOptions = useMemo(() => {
    return lookupOptions.filter((opt) => !(opt.categoryId === 1300 && (opt.value === 13001 || opt.id === 13001)));
  }, [lookupOptions]);

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
              <span>{t("common.filterByInspectionDate")}</span>

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
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], selectedRows: any[]) => {
            setSelectedRowKeys(keys);

            setSelectedRows((prev) => {
              // Remove rows that are no longer selected
              const remaining = prev.filter((p) => keys.includes(p.id));

              // Add newly selected rows (avoid duplicates)
              const newSelected = selectedRows.filter((r) => !remaining.some((p) => p.id === r.id));

              return [...remaining, ...newSelected];
            });
          },
        }}
        tableSize="small"
        rowKey={config.tableConfig.rowKey}
        actionMenuItems={actionMenuItems}
        state={state}
        lookupOptions={modifiedLookupOptions} // ✅ Use modified lookup options
        getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
        columnLookupMap={{ inspectionType: 1700, inspectionCategory: 1300 }}
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

      <MapModal open={mapModalVisible} onClose={() => setMapModalVisible(false)} fine={selectedFineForModal} />

      <AttachmentsModal
        open={attachmentsModalVisible}
        onClose={() => setAttachmentsModalVisible(false)}
        fine={selectedFineForModal}
      />
    </Space>
  );
};

export default FinesPage;
