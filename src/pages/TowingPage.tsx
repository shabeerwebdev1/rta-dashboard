import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, DatePicker, Row, Col, Select, Tooltip, App, Tag } from "antd";
import { EyeOutlined, DownloadOutlined, AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
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
import { towingConfig } from "../config/pageConfigs/towingConfig";
import { useGetLeaveDetailsQuery } from "../services/rtkApiFactory";
import TowingViewDrawer from "../components/Towing/TowingViewDrawer";

const { Option } = Select;

const TowingPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = towingConfig;

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

  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  //  Fetch leave data from API
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

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Stats */}
        <StatsDisplay statsConfig={config.statsConfig} data={apiData} loading={isFetching} />

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
                <Tooltip title={tableSize === "middle" ? t("common.compactView") : t("common.standardView")}>
                  <Button
                    icon={tableSize === "middle" ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                    onClick={() => setTableSize(tableSize === "middle" ? "small" : "middle")}
                  />
                </Tooltip>
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
          data={apiData}
          total={total}
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

      {/* Drawer for viewing towing details */}
      <TowingViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </>
  );
};

export default TowingPage;
