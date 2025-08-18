import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Space, Tag, Button, Dropdown, Input, DatePicker, Row, Col, Select, Tooltip, App } from "antd";
import { EyeOutlined, DownloadOutlined, AppstoreOutlined, UnorderedListOutlined, CheckCircleOutlined, CloseCircleOutlined, IdcardOutlined } from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useSearchParkonicsQuery } from "../services/rtkApiFactory";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { exportToCsv } from "../utils/csvExporter";
import { useAppNotification } from "../utils/notificationManager";
import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import type { PageConfig } from "../types/config";

const { Option } = Select;

const parkonicPageConfig: PageConfig = {
  key: "parkonic",
  title: "page.title.parkonic",
  name: { singular: "Parkonic Record", plural: "Parkonic Records" },
  api: { get: "/api/Parkonic", post: "", put: "/api/Parkonic/Review", delete: "" },
  searchConfig: {
    globalSearchKeys: ["plateNumber"],
    columnFilterKeys: ["reviewStatus"],
    dateRangeKey: "entryDateTime",
  },
  statsConfig: [
    { title: "Total Records", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.reviewStatus === 1).length,
      color: "#52c41a",
    },
    {
      title: "Rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.reviewStatus === 0).length,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    rowKey: "fineId",
    columns: [
      { key: "plateNumber", title: "form.vehicleNumber", type: "string", sortable: true },
      {
        key: "reviewStatus",
        title: "form.reviewStatus",
        type: "custom",
        sortable: true,
        filterable: true,
        render: (status: number) => {
          const statusMap: Record<number, { text: string; color: string }> = {
            0: { text: "Rejected", color: "red" },
            1: { text: "Approved", color: "green" },
            2: { text: "Pending", color: "blue" },
          };
          const { text, color } = statusMap[status] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
      { key: "entryDateTime", title: "form.entryDateTime", type: "date", sortable: true },
      { key: "exitDateTime", title: "form.exitDateTime", type: "date", sortable: true },
    ],
    viewRecord: true,
  },
  formConfig: { modalWidth: "0", fields: [] },
};

const ParkonicPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = parkonicPageConfig;
  const { apiParams, handleTableChange, handlePaginationChange, setGlobalSearch, setDateRange, clearFilter, clearAll, state } =
    useTableParams(config.searchConfig!);

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useSearchParkonicsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

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

  const showDrawer = (record: any) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
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
        const selectedData = data.data.filter((item: any) => selectedRowKeys.includes(item.fineId));
        exportToCsv(selectedData, `parkonic_export.csv`);
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
    { key: "view", icon: <EyeOutlined />, label: t("common.view"), onClick: () => showDrawer(record) },
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

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={data?.data || []} loading={isLoading} />
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
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv")}
              </Button>
              <Tooltip title={tableSize === "middle" ? "Compact view" : "Standard view"}>
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
        />
      </Card>

      <DataTableWrapper
        pageConfig={config}
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading || isFetching}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        rowKey={config.tableConfig.rowKey}
      />

      <ParkonicViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </Space>
  );
};

export default ParkonicPage;