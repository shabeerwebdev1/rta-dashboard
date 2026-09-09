import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Row, Col, Select, App, DatePicker, Tag, Typography } from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  PaperClipOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useSearchTradeQuery,
  useLazyGetLookupsQuery,
  useLazyGetTLInspectionByIdQuery,
} from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";
import MapModal from "../components/fines/MapModal";
import AttachmentsModal from "../components/fines/AttachmentsModal";
import { parkingsInspectionsConfig } from "../config/pageConfigs/parkingsInspectionsConfig";

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

const TradeLicenseInspectionPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = parkingsInspectionsConfig;

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
  const [viewLoading, setViewLoading] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [attachmentsModalVisible, setAttachmentsModalVisible] = useState(false);
  const [selectedFineForModal, setSelectedFineForModal] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  //state to maintain the rows data for downlaoding
  const [selectedRows, setSelectedRows] = useState([]);

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
  const { data, isLoading, isFetching } = useSearchTradeQuery(enhancedApiParams, {
    refetchOnMountOrArgChange: true,
  });

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetTLInspectionById] = useLazyGetTLInspectionByIdQuery();

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    try {
      const result = await triggerGetLookups([1300, 1400, 1500, 1800]).unwrap();
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
    const actualKey =
      state.searchKey === "inspectorNameEn"
        ? i18n.language === "ar"
          ? "inspectorNameAr"
          : "inspectorNameEn"
        : state.searchKey;

    setGlobalSearch(actualKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch, i18n.language]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const mergeFineDetails = (record: any, response: any) => {
    const payload = response?.data ?? response ?? {};

    return {
      ...record,
      ...(payload && !Array.isArray(payload) ? payload : {}),
    };
  };

  const handleView = async (record: any) => {
    try {
      setViewLoading(true);
      const response = await triggerGetTLInspectionById(record.inspectionGUID).unwrap();
      setSelectedFineData(mergeFineDetails(record, response));
      setDrawerVisible(true);
    } catch (error) {
      notification.error({ data: { en_Msg: "Failed to load fine details" } }, "Load Failed");
      setSelectedFineData(record);
      setDrawerVisible(true);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewLocation = (record: any) => {
    setSelectedFineForModal(record);
    setMapModalVisible(true);
  };

  const handleViewAttachments = (record: any) => {
    setSelectedFineForModal(record);
    setAttachmentsModalVisible(true);
  };

  // Create a helper function to format data for CSV export
  const formatDataForExport = (data: any[]) => {
    return data.map((item: any, index: number) => {
      const formattedRow: any = {};

      formattedRow[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      enhancedTableConfig.columns.forEach((column: any) => {
        const key = column.key;
        let value = item[key];

        // Skip action columns
        if (key === "actions") return;

        // Apply the same formatting as in the table
        switch (key) {
          case "inspectorName":
            value =
              i18n.language === "ar"
                ? item?.inspectorNameAr || item?.inspectorNameEn || t("common.noData")
                : item?.inspectorNameEn || item?.inspectorNameAr || t("common.noData");
            break;
          case "inspectionType":
            value = getLabelFromValue(value, inspectionTypeOptions, i18n);
            break;
          case "inspectionCategory":
            value = getLabelFromValue(value, inspectionCategoryOptions, i18n);
            break;
          case "fineAmount":
            value = value != null && value !== "" ? `AED ${value} ` : t("common.noData");
            break;
          case "inspectionStatus":
            value = getLabelFromValue(value, lookupOptions, i18n);
            break;
          // ✅ ADDED: Date formatting for common date fields
          case "inspectionDate":
          case "createdDate":
          case "updatedDate":
          case "violationDate":
          case "issueDate":
          case "dueDate":
          case "paymentDate":
          case "date":
            // Format date fields to DD MMM YYYY
            value = value ? dayjs(value).format("DD MMM YYYY") : t("common.noData");
            break;
          default:
            // ✅ ADDED: Auto-detect other date fields
            if (key.includes("Date") || key.includes("date") || key.includes("Time") || key.includes("time")) {
              value = value ? dayjs(value).format("DD MMM YYYY") : t("common.noData");
            } else {
              value = value != null ? String(value) : t("common.noData");
            }
            break;
        }

        formattedRow[columnLabels[key] || key] = value;
      });

      return formattedRow;
    });
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
        //const selectedData = tableData.filter((item: any) => selectedRowKeys.includes(item.inspectionGUID)) || [];
        const formattedData = formatDataForExport(selectedRows);

        const filename = i18n.language === "ar" ? `مخالفات_التراخيص_التجارية.csv` : `Parkings_Fines.csv`;

        exportToCsv(formattedData, filename);
        notification.success(
          { data: { en_Msg: t("messages.csvDownloaded", { count: selectedFineData.length }) } },
          t("messages.exportSuccess"),
        );
        setSelectedRowKeys([]);
        setSelectedRows([]);
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

    const actualKey =
      newKey === "inspectorNameEn" ? (i18n.language === "ar" ? "inspectorNameAr" : "inspectorNameEn") : newKey;

    setGlobalSearch(actualKey, "");
  };
  const searchAddon = (
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {key === "inspectorNameEn" || key === "inspectorNameAr" ? t("common.inspectorName") : columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  const fineStatusColorMap: Record<number, string> = {
    15001: "green",
    15002: "blue",
    15003: "orange",
    15004: "green",
    15005: "red",
    15006: "green",
  };

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

              return (
                <Typography.Text type="danger" strong>
                  AED {value}
                </Typography.Text>
              );
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
        if (column.key === "paymentType") {
          return {
            ...column,
            render: (value: any) =>
              String(value) === "1" ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : (
                <CloseCircleTwoTone twoToneColor="#eb2630" />
              ),
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
                format={"DD MMM YYYY"}
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
        lookupOptions={lookupOptions}
        getLabelFromValue={(value, options) => getLabelFromValue(value, options, i18n)}
        columnLookupMap={{ inspectionType: 1800 }}
      />

      <FinesViewDrawer
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedFineData(null);
        }}
        fine={selectedFineData}
        isLoading={viewLoading}
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

export default TradeLicenseInspectionPage;
