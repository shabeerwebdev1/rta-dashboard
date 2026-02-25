/* eslint-disable no-self-assign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, DatePicker, Row, Col, Select, App, Tag } from "antd";
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
import { towingConfig } from "../config/pageConfigs/towingConfig";
import { useGetTowingDetailsQuery } from "../services/rtkApiFactory";
import TowingViewDrawer from "../components/Towing/TowingViewDrawer";

const { Option } = Select;

const TowingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  //state to maintain the rows data for downloading
  const [selectedRows, setSelectedRows] = useState([]);

  // ✅ FIX: Fetch towing data from API with proper caching control
  const { data, isFetching } = useGetTowingDetailsQuery(apiParams, {
    refetchOnMountOrArgChange: false, // Prevent refetch on mount if data exists
    refetchOnFocus: false, // Prevent refetch when window regains focus
    refetchOnReconnect: false, // Prevent refetch on network reconnect
  });

  const apiData = data?.data || [];
  const total = data?.total || 0;

  const statusLabels = useMemo(() => {
    const statusMap: Record<string, React.ReactNode> = {
      pending: <Tag color="blue">{t("status.pending")}</Tag>,
      Approved: <Tag color="green">{t("status.approved")}</Tag>,
      Rejected: <Tag color="red">{t("status.rejected")}</Tag>,
      cancelled: <Tag color="orange">{t("status.cancelled")}</Tag>,
      IN_TOWING: <Tag color="cyan">{t("status.inProgress")}</Tag>,
      completed: <Tag color="purple">{t("status.completed")}</Tag>,
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
      okText: t("common.ok"),
      cancelText: t("common.cancel"),
      onOk: () => {
        // Format data to match UI table display
        const formattedData = selectedRows.map((item: any, index: number) => {
          const csvRow: any = {};

          csvRow[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

          // Process each column based on table configuration
          config.tableConfig.columns.forEach((column: any) => {
            const key = column.key;
            let value = item[key];

            // Skip action columns
            if (key === "actions") return;

            // Apply formatting based on column type
            switch (key) {
              case "towing_Status":
                // Format status with translated labels
                const statusMap: Record<string, string> = {
                  PENDING: t("status.pending"),
                  APPROVED: t("status.approved"),
                  REJECTED: t("status.rejected"),
                  CANCELLED: t("status.cancelled"),
                  IN_TOWING: t("status.inProgress"),
                  COMPLETED: t("status.completed"),
                };

                value = statusMap[value] || value;
                break;

              case "created_Date":
              case "updated_Date":
              case "towing_Date":
              case "inspection_Date":
                // Format dates to DD MMM YYYY (without time)
                if (value) {
                  try {
                    value = dayjs(value).format("DD MMM YYYY");
                  } catch (error) {
                    value = value; // Keep original if parsing fails
                  }
                } else {
                  value = ""; // Empty string for null dates
                }
                break;

              default:
                // For other columns, use raw value with proper null handling
                value = value != null ? String(value) : "";
                break;
            }

            // ✅ ADDED: Auto-detect any other date fields not in the switch statement
            if (
              !key.includes("Status") &&
              (key.includes("Date") || key.includes("date") || key.includes("Time") || key.includes("time"))
            ) {
              if (value) {
                try {
                  value = dayjs(value).format("DD MMM YYYY");
                } catch (error) {
                  // Keep original value if parsing fails
                }
              } else {
                value = "";
              }
            }

            // Use column label as CSV header
            csvRow[columnLabels[key] || key] = value;
          });

          return csvRow;
        });
        const filename = i18n.language === "ar" ? "سحب_المركبات.csv" : "Towing.csv";

        exportToCsv(formattedData, filename);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
        setSelectedRows([]);
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
      icon: record.towing_Status?.toLowerCase() === "pending" ? <EditOutlined /> : <EyeOutlined />,
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
                <span>{t("common.filterBytowingDate")}</span>

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
            onChange: (keys: React.Key[], selectedRows: any[]) => {
              setSelectedRowKeys(keys);

              setSelectedRows((prev) => {
                // Remove rows that are no longer selected
                const remaining = prev.filter((p: any) => keys.includes(p.inspectionGUID));

                // Add newly selected rows (avoid duplicates)
                const newSelected = selectedRows.filter(
                  (r) => !remaining.some((p: any) => p.inspectionGUID === r.inspectionGUID),
                );

                return [...remaining, ...newSelected];
              });
            },
          }}
          actionMenuItems={actionMenuItems}
          tableSize={tableSize}
          rowKey={config.tableConfig.rowKey}
          state={state}
          filterOptions={{
            towing_Status: [
              { text: t("status.approved"), value: "APPROVED" },
              { text: t("status.rejected"), value: "REJECTED" },
              { text: t("status.pending"), value: "PENDING" },
              { text: t("status.cancelled"), value: "CANCELLED" },
              { text: t("status.inProgress"), value: "IN_TOWING" },
              { text: t("status.completed"), value: "COMPLETED" },
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
