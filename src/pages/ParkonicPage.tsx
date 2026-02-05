import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, DatePicker, Row, Col, Select, App } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useGetParkonicsQuery } from "../services/rtkApiFactory";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { exportToCsv } from "../utils/csvExporter";
import { useAppNotification } from "../utils/notificationManager";
import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { parkonicPageConfig } from "../config/pageConfigs/parkonicConfig";
import ParkonicAttachmentsModal from "../components/parkonic/ParkonicAttachmentsModal";

const { Option } = Select;

const ParkonicPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = parkonicPageConfig;

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

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tableSize, setTableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachmentsRecord, setAttachmentsRecord] = useState<any>(null);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  //state to maintain the rows data for downlaoding
  const [selectedRows, setSelectedRows] = useState([]);

  const { data, isLoading, isFetching } = useGetParkonicsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const statusLabels = useMemo(() => {
    const statusMap: Record<number, string> = {
      2: t("status.rejected"),
      1: t("status.approved"),
      0: t("status.pending"),
    };
    return statusMap;
  }, [t]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  // Sync local search value with state
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
      okText: t("common.ok"),
      cancelText: t("common.cancel"),
      onOk: () => {
        //const selectedData = data?.data?.filter((item: any) => selectedRowKeys.includes(item.fineId)) || [];
        exportToCsv(selectedRows, `parkonic_export.csv`);
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
    // ✏️ PRIMARY ICON — stays the same
    {
      key: "view",
      icon: <EditOutlined />,
      label: t("common.view"),
      onClick: () => showDrawer(record),
    },

    // ⬇️ THREE DOTS MENU ACTIONS
    {
      key: "approve",
      icon: <CheckCircleOutlined />,
      label: t("common.approve"),
      disabled: record.reviewStatus !== 0,
      onClick: () => handleApprove(record),
    },
    {
      key: "reject",
      icon: <CloseCircleOutlined />,
      label: t("common.reject"),
      disabled: record.reviewStatus !== 0,
      onClick: () => handleReject(record),
    },
    {
      key: "attachments",
      icon: <PaperClipOutlined />,
      label: t("common.viewAttachments"),
      onClick: () => {
        setAttachmentsRecord(record);
        setAttachmentsOpen(true);
      },
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

  const handleApprove = (record: any) => {
    modal.confirm({
      title: t("common.confirmApproval"),
      content: t("common.confirmApprovalContent"),
      okText: t("common.approve"),
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await fetch("/api/Parkonic/Review", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              iid: record.iid,
              review_Action: 1,
              review_Comments: "",
            }),
          });

          notification.success({ data: { en_Msg: t("messages.approvedSuccessfully") } });
        } catch (err) {
          notification.error({ data: { en_Msg: t("messages.actionFailed") } });
        }
      },
    });
  };

  const handleReject = (record: any) => {
    modal.confirm({
      title: t("common.confirmRejection"),
      content: t("common.confirmRejectionContent"),
      okText: t("common.reject"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await fetch("/api/Parkonic/Review", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              iid: record.iid,
              review_Action: 2,
              review_Comments: "",
            }),
          });

          notification.success({ data: { en_Msg: t("messages.rejectedSuccessfully") } });
        } catch (err) {
          notification.error({ data: { en_Msg: t("messages.actionFailed") } });
        }
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={config.statsConfig}
        data={data?.data || []}
        metadata={{ total: data?.total }}
        loading={isLoading}
      />
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
              <span>{t("common.filterByEntryDate")}</span>
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
          statusLabels={statusLabels}
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
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], selectedRows: any[]) => {
            setSelectedRowKeys(keys);

            setSelectedRows((prev) => {
              const remaining = prev.filter((p) => keys.includes(p.id));

              const newSelected = selectedRows.filter((r) => !remaining.some((p) => p.id === r.id));

              return [...remaining, ...newSelected];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        rowKey={config.tableConfig.rowKey}
        state={state}
        filterOptions={{
          reviewStatus: [
            { text: t("status.pending"), value: 0 },
            { text: t("status.approved"), value: 1 },
            { text: t("status.rejected"), value: 2 },
          ],
        }}
      />
      <ParkonicAttachmentsModal
        open={attachmentsOpen}
        onClose={() => setAttachmentsOpen(false)}
        record={attachmentsRecord}
      />

      <ParkonicViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </Space>
  );
};

export default ParkonicPage;
