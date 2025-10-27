import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, DatePicker, Row, Col, Select, App } from "antd";
import { EyeOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { exportToCsv } from "../utils/csvExporter";
import { useAppNotification } from "../utils/notificationManager";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { leaveManagementPageConfig } from "../config/pageConfigs/leaveManagementConfig";
import LeaveViewDrawer from "../components/Leaves/LeaveViewDrawer";
import { useGetLeaveDetailsQuery, useLazyGetLookupsQuery } from "../services/rtkApiFactory";

const { Option } = Select;

const LeaveManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = leaveManagementPageConfig;

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

  const [tableSize, setTableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isFetching } = useGetLeaveDetailsQuery(apiParams);
  const [getLookups, { data: lookupData }] = useLazyGetLookupsQuery();

  // Fetch leave type lookup (ensure we request category 1900)
  useEffect(() => {
    getLookups([1900]);
  }, [getLookups]);

  const leaveTypeMap = useMemo(() => {
    const map = new Map<number, { en: string; ar: string }>();

    if (!lookupData?.data) {
      return map;
    }

    const categories = lookupData.data;

    categories.forEach((category: any) => {
      if (category.ddiCatgId === 1900 && category.ddItems && Array.isArray(category.ddItems)) {
        category.ddItems.forEach((item: any) => {
          const code = Number(item.ddiCode);
          if (!isNaN(code)) {
            map.set(code, {
              en: item.ddiDispText_En || `Leave Type ${code}`,
              ar: item.ddiDispText_Ar || `Leave Type ${code}`,
            });
          }
        });
      }
    });

    return map;
  }, [lookupData]);

  // Return localized label for a leaveType code
  const getLeaveTypeName = (code: number | string | undefined) => {
    if (code === undefined || code === null) {
      return "N/A";
    }

    const numericCode = typeof code === "string" ? parseInt(code, 10) : code;

    if (isNaN(numericCode as number)) {
      return String(code);
    }

    const entry = leaveTypeMap.get(numericCode as number);

    if (!entry) {
      return `Leave Type ${numericCode}`;
    }

    return i18n.language.startsWith("ar") ? entry.ar : entry.en;
  };

  // Status labels for CSV export
  const statusLabels = useMemo(() => {
    return {
      0: t("status.pending"),
      1: t("status.approved"),
      2: t("status.cancelled"),
      3: t("status.rejected"),
    };
  }, [t]);

  // API response data array
  const apiData = data?.data || [];

  // derive totals and pagination from response shape
  const totalCount =
    data?.totalCount ?? data?.totalRecords ?? data?.total ?? (Array.isArray(apiData) ? apiData.length : 0);
  const pageNumber = data?.pageNumber ?? 1;
  const pageSize = data?.pageSize ?? apiParams.pageSize ?? 10;

  const metadata = useMemo(() => {
    return {
      totalRecords: data?.totalRecords ?? data?.totalCount ?? totalCount,
      approvedRecords: data?.approvedRecords ?? 0,
      rejectedRecords: data?.rejectedRecords ?? 0,
      pendingRecords: data?.pendingRecords ?? 0,
      pageNumber,
      pageSize,
    };
  }, [data, totalCount, pageNumber, pageSize]);

  const filterOptions = {
    status: [
      { text: t("status.approved"), value: 1 },
      { text: t("status.rejected"), value: 3 },
      { text: t("status.pending"), value: 0 },
      { text: t("status.cancelled"), value: 2 },
    ],
  };

  const statusLabelsForTable = useMemo(() => {
    const statusMap: Record<number, React.ReactNode> = {
      0: t("status.pending"),
      1: t("status.approved"),
      2: t("status.cancelled"),
      3: t("status.rejected"),
    };
    return statusMap;
  }, [t]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  useEffect(() => {
    setSearchValue(state.searchValue);
  }, [state.searchValue]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const transformDataForCSV = (data: any[]) => {
    return data.map((item) => {
      const csvRecord: Record<string, unknown> = {};

      config.tableConfig.columns.forEach((column) => {
        const { key, title } = column;
        const headerName = columnLabels[key] || title;

        let value = item[key];

        // Transform specific fields
        if (key === "leaveType") value = getLeaveTypeName(value);
        else if (key === "status") value = statusLabels[value] || value;
        else if (key.includes("Date") && value) {
          value = key === "createdDate" ? dayjs(value).format("DD-MM-YYYY") : dayjs(value).format("DD-MM-YYYY");
        }

        csvRecord[headerName] = value !== null && value !== undefined ? value : "";
      });

      return csvRecord;
    });
  };

  // ✅ FIXED: Get CSV filename based on current language
  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `إدارة_الإجازات.csv`;
    } else {
      return `Leave_Management.csv`;
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
      onOk: () => {
        try {
          // ✅ FIXED: Get the selected data from the current page data
          const selectedData = tableData.filter((item: any) => selectedRowKeys.includes(item.id));

          if (selectedData.length === 0) {
            notification.error({ data: { en_Msg: t("messages.noDataToExport") } }, t("messages.exportFailed"));
            return;
          }

          // ✅ FIXED: Transform the data to match UI display
          const transformedData = transformDataForCSV(selectedData);

          // ✅ FIXED: Get filename based on current language
          const filename = getCsvFilename();

          // ✅ FIXED: Export to CSV using your common component
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
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns],
  );

  const actionMenuItems = (record: any) => [
    {
      key: "view",
      icon: record.status === 0 ? <EditOutlined /> : <EyeOutlined />,
      label: t("common.view"),
      onClick: () => {
        setSelectedRecord(record);
        setDrawerOpen(true);
      },
    },
  ];

  const handleShare = () => {
    if (!selectedRecord || !selectedRecord.id) {
      notification.error({ data: { en_Msg: "No record selected" } }, "No Record");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("viewRecord", selectedRecord.id);

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    navigator.clipboard.writeText(shareUrl).then(
      () => notification.success({ data: { en_Msg: "Share link copied to clipboard!" } }, "Link Copied!"),
      () => notification.error({ data: { en_Msg: "Failed to copy link." } }, "Copy Failed"),
    );
  };

  const handleSearchKeyChange = (newKey: string) => {
    const currentValue = searchValue;
    setTimeout(() => setSearchValue(""), 0);
    if (currentValue.trim()) setGlobalSearch(state.searchKey, currentValue);
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

  // Map leaveType code to label using lookup
  const tableData = useMemo(() => {
    if (!apiData) return [];

    const mappedData = (apiData || []).map((item: any) => ({
      ...item,
      leaveTypeName: getLeaveTypeName(item.leaveType),
    }));

    return mappedData;
  }, [apiData, leaveTypeMap, i18n.language]);

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Stats */}
        <StatsDisplay statsConfig={config.statsConfig} data={tableData} metadata={metadata} loading={isFetching} />

        {/* Filters + Search */}
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
              </Space>
            </Col>
          </Row>

          <ActiveFiltersDisplay
            state={state}
            onClearFilter={handleClearFilter}
            onClearAll={handleClearAll}
            columnLabels={columnLabels}
            statusLabels={statusLabelsForTable}
          />
        </Card>

        {/* Table */}
        <DataTableWrapper
          pageConfig={config}
          data={tableData}
          total={totalCount}
          isLoading={isFetching}
          apiParams={apiParams}
          handleTableChange={handleTableChange}
          handlePaginationChange={handlePaginationChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
            getCheckboxProps: (record: any) => ({
              // Use id as the row key since that's the unique identifier in your data
              name: record.id,
            }),
          }}
          actionMenuItems={actionMenuItems}
          tableSize={tableSize}
          rowKey={config.tableConfig.rowKey}
          state={state}
          filterOptions={filterOptions}
        />
      </Space>

      {/* Drawer for viewing leave details */}
      <LeaveViewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
        onShare={handleShare}
      />
    </>
  );
};

export default LeaveManagementPage;
