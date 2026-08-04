import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, DatePicker, Row, Col, Select, App } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeFilled,
  EyeOutlined,
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
import { parkonicPageConfig, plateSources, PLATE_COLOR } from "../config/pageConfigs/parkonicConfig";
import ParkonicAttachmentsModal from "../components/parkonic/ParkonicAttachmentsModal";

const { Option } = Select;

const ParkonicPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  const transformDataForCSV = (data: any[]) => {
    const isArabic = i18n.language === "ar";
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};

      csvRecord[isArabic ? "التسلسل" : "Sl.No"] = index + 1;

      config.tableConfig.columns.forEach((column: any) => {
        const headerTitle = t(column.title);

        if (column.key === "entityNo") {
          // Grid shows entityNo if approved (reviewStatus === 1), otherwise transcationId
          csvRecord[headerTitle] = item.reviewStatus === 1 ? item.entityNo || "" : item.transcationId || "";
        } else if (column.key === "plateNumber") {
          const source = plateSources[item.plateSource]?.[isArabic ? "ar" : "en"] || "";
          const code = PLATE_COLOR[item.plateCode] || "";
          const num = item.plateNumber || "";
          csvRecord[headerTitle] = [source, code, num].filter(Boolean).join(" ");
        } else if (column.key === "categoryId") {
          const catName = isArabic
            ? item.violationNameAr || item.violationNameEn
            : item.violationNameEn || item.violationNameAr;
          csvRecord[headerTitle] = catName ? `${item.categoryId ?? ""} (${catName})` : (item.categoryId ?? "");
        } else if (column.key === "violationAmount") {
          csvRecord[headerTitle] = item.violationAmount != null ? `AED ${item.violationAmount}` : "";
        } else if (column.key === "reviewStatus") {
          csvRecord[headerTitle] =
            item.reviewStatus === 1
              ? t("status.approved")
              : item.reviewStatus === 2
                ? t("status.rejected")
                : t("status.pending");
        } else if (column.key === "createdDateTime") {
          csvRecord[headerTitle] = item.createdDateTime
            ? dayjs(item.createdDateTime).format("DD MMM YYYY, hh:mm A")
            : "";
        } else if (column.key === "reviewerName") {
          csvRecord[headerTitle] = item.reviewerName || "";
        } else if (column.key === "reviewedDtTm") {
          csvRecord[headerTitle] = item.reviewedDtTm ? dayjs(item.reviewedDtTm).format("DD MMM YYYY, hh:mm A") : "";
        } else if (column.key === "review_updateback_status") {
          csvRecord[headerTitle] =
            item.review_updateback_status === 1
              ? isArabic
                ? "ناجح"
                : "Success"
              : item.review_updateback_status === 2
                ? isArabic
                  ? "فشل"
                  : "Failed"
                : "";
        } else {
          csvRecord[headerTitle] = item[column.key] ?? "";
        }
      });

      return csvRecord;
    });
  };

  const getCsvFilename = () => {
    return i18n.language === "ar" ? "بيانات_باركونك.csv" : "Parkonic_Data.csv";
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
        try {
          const transformedData = transformDataForCSV(selectedRows);

          exportToCsv(transformedData, getCsvFilename());

          notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));

          setSelectedRowKeys([]);
          setSelectedRows([]);
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
    // ✏️ PRIMARY ICON — stays the same
    {
      key: "view",
      icon: <EyeOutlined />,
      label: t("common.view"),
      onClick: () => showDrawer(record),
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

  const statsMetadata = useMemo(() => {
    return {
      total: data?.total ?? 0,
      pendingRecords: data?.pending ?? 0,
      approvedRecords: data?.approved ?? 0,
      rejectedRecords: data?.rejected ?? 0,
    };
  }, [data]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={config.statsConfig}
        data={data?.data || []}
        metadata={statsMetadata}
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
              <span>{t("common.filterByaddedon")}</span>
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
          onChange: (keys: React.Key[], selectedRowsList: any[]) => {
            setSelectedRowKeys(keys);

            setSelectedRows((prev: any[]) => {
              const getRecordKey = (r: any) => r?.iid ?? r?.fineId ?? r?.transcationId ?? r?.id ?? r?.key;
              const remaining = prev.filter((p) => keys.includes(getRecordKey(p)));
              const newSelected = selectedRowsList.filter(
                (r) => !remaining.some((p) => getRecordKey(p) === getRecordKey(r)),
              );
              return [...remaining, ...newSelected];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        rowKey={(record: any) => record?.iid ?? record?.fineId ?? record?.transcationId ?? record?.id ?? record?.key}
        state={state}
        tableLayout="fixed"
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
