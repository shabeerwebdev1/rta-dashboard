import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, DatePicker, Row, Col, Select, App, Tag } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
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
import { useGetLeaveDetailsQuery } from "../services/rtkApiFactory";

const { Option } = Select;

const LeaveManagementPage: React.FC = () => {
  const { t } = useTranslation();
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

  const apiData = data?.data || [];
  const total = data?.total || 0;

  const filterOptions = {
    status: [
      { text: t("status.approved"), value: 1 },
      { text: t("status.rejected"), value: 3 },
      { text: t("status.pending"), value: 0 },
      { text: t("status.cancelled"), value: 2 },
    ],
  };

  const statusLabels = useMemo(() => {
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

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: t("messages.selectRows") } }, t("messages.selectRows"));
      return;
    }
    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      onOk: () => {
        const selectedData = apiData.filter((item: any) => selectedRowKeys.includes(item.leaveId)) || [];
        exportToCsv(selectedData, `leave_management_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
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
      icon: <EyeOutlined />,
      label: t("common.view"),
      onClick: () => {
        setSelectedRecord(record);
        setDrawerOpen(true);
      },
    },
  ];

const handleShare = () => {
  if (!selectedRecord || !selectedRecord.id) {
    notification.error(
      { data: { en_Msg: "No record selected" } },
      "No Record"
    );
    return;
  }

  // Preserve current search params (like PageNumber, PageSize)
  const params = new URLSearchParams(window.location.search);
  params.set("viewRecord", selectedRecord.id); // ✅ use correct ID field

  const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

  navigator.clipboard.writeText(shareUrl).then(
    () =>
      notification.success(
        { data: { en_Msg: "Share link copied to clipboard!" } },
        "Link Copied!"
      ),
    () =>
      notification.error(
        { data: { en_Msg: "Failed to copy link." } },
        "Copy Failed"
      )
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
      approvedRecords: data.approvedRecords,
      rejectedRecords: data.rejectedRecords,
      pendingRecords: data.pendingRecords,
    };
  }, [data]);

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Stats */}
        <StatsDisplay statsConfig={config.statsConfig} data={platesData} metadata={metadata} loading={isFetching} />

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
            statusLabels={statusLabels}
          />
        </Card>

        {/* Table */}
        <DataTableWrapper
          pageConfig={config}
          data={platesData} // Use the extracted array
        total={totalCount}
          isLoading={isFetching}
          apiParams={apiParams}
          handleTableChange={handleTableChange}
          handlePaginationChange={handlePaginationChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
          }}
          actionMenuItems={actionMenuItems}
          tableSize={tableSize}
          rowKey={config.tableConfig.rowKey}
          state={state}
          filterOptions={{
            status: [
              { text: t("status.approved"), value: 1 },
              { text: t("status.rejected"), value: 3 },
              { text: t("status.pending"), value: 0 },
              { text: t("status.cancelled"), value: 2 },
            ],
          }}
        />
      </Space>

      {/* Drawer for viewing leave details */}
      <LeaveViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} onShare={handleShare} />
    </>
  );
};

export default LeaveManagementPage;
