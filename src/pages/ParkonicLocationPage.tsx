/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Form, Row, Col, Select, App, Tag } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetActiveShiftsQuery,
  useGetParkonicsLocationQuery,
  useLazyGetParkonicsLocationByIdQuery,
} from "../services/rtkApiFactory";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import { parkonicLocationPageConfig } from "../config/pageConfigs/parkonicLocationConfig";
import DataTableWrapper from "../components/common/DataTableWrapper";
import StatsDisplay from "../components/common/StatsDisplay";
import ParkonicLocationViewDrawer from "../components/ParkonicLocation/ParkonicLocationViewDrawer";

const { Option } = Select;
const pageKey = "parkonic-location";

const ParkonicLocationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey] || parkonicLocationPageConfig;
  const [searchParams] = useSearchParams();

  const {
    apiParams: rawApiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);

  const apiParams = {
    PageNumber: rawApiParams.PageNumber || 1,
    PageSize: rawApiParams.PageSize || 10,
    ...rawApiParams,
  };

  const [form] = Form.useForm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetParkonicsLocationQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [triggerGetLocation, { data: singleRecordData, isSuccess: isSingleRecordSuccess }] =
    useLazyGetParkonicsLocationByIdQuery();

  const { data: activeShiftsData } = useGetActiveShiftsQuery({});

  const normalizeGuid = (guid?: string) => {
    if (!guid) return "";
    return guid.toLowerCase().trim();
  };

  const getEmployeeName = (guid?: string) => {
    if (!guid || !activeShiftsData) return "";

    const employee = activeShiftsData.find((emp: any) => normalizeGuid(emp.employeeId) === normalizeGuid(guid));

    return employee?.employeeName || "";
  };

  const [selectedRows, setSelectedRows] = useState([]);

  const formatDateTime = (value: number) => {
    if (!value) return "";
    const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");
    const isArabic = lang.startsWith("ar");
    return dayjs(value)
      .locale(isArabic ? "ar" : "en")
      .format(isArabic ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

  useEffect(() => {
    const recordId = state.viewRecordId;
    if (recordId && !isDrawerOpen) {
      triggerGetLocation(recordId);
    }
  }, [state.viewRecordId, triggerGetLocation, isDrawerOpen]);

  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      setViewRecord(singleRecordData.data);
      setIsDrawerOpen(true);
    }
  }, [isSingleRecordSuccess, singleRecordData]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, setGlobalSearch]);

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

  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};

      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      if (i18n.language === "ar") {
        csvRecord[t("form.parkingNameAr")] = item.parking_Name_Ar || "";
      } else {
        csvRecord[t("form.parkingNameEn")] = item.parking_Name_En || "";
      }

      csvRecord[t("form.parkonicsLocationId")] = item.parkonics_Location_Id || "";
      csvRecord[t("form.zone")] = item.zone || "";
      csvRecord[t("form.area")] = item.area || "";
      csvRecord[t("form.addedOn")] = item.created_At ? dayjs(item.created_At).format("DD MMM YYYY") : "";
      csvRecord[t("form.approvedBy")] = item.updated_By || "";
      csvRecord[t("form.isApproved")] = item.isUpdatedBack ? t("form.approved") : t("form.pending");

      return csvRecord;
    });
  };

  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `مواقع_باركونيك.csv`;
    } else {
      return `Parkonic_Locations.csv`;
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
      okText: t("common.ok"),
      cancelText: t("common.cancel"),
      onOk: () => {
        try {
          if (selectedRows.length === 0) {
            notification.error({ data: { en_Msg: t("messages.noDataToExport") } }, t("messages.exportFailed"));
            return;
          }

          const transformedData = transformDataForCSV(selectedRows);
          const filename = getCsvFilename();

          exportToCsv(transformedData, filename);

          notification.success(
            { data: { en_Msg: t("messages.csvDownloaded", { count: selectedRows.length }) } },
            t("messages.exportSuccess"),
          );
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
    [t, config.tableConfig.columns, i18n.language],
  );

  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        // format dates
        if (column.key === "created_At" || column.key === "updated_At") {
          return {
            ...column,
            render: (value: any) => formatDateTime(value),
          };
        }

        // convert GUID to employee name
        if (column.key === "updated_By") {
          return {
            ...column,
            render: (value: any) => getEmployeeName(value),
          };
        }

        // status badge
        if (column.key === "status") {
          return {
            ...column,
            render: (value: any) => {
              return value === 1 ? (
                <Tag color="green">{t("form.approved")}</Tag>
              ) : (
                <Tag color="orange">{t("form.pending")}</Tag>
              );
            },
          };
        }

        return column;
      }),
    }),
    [config.tableConfig, t, activeShiftsData],
  );

  const actionMenuItems = (record: any) => [
    // {
    //   key: "view",
    //   label: t("common.view"),
    //   icon: <EyeOutlined />,
    //   onClick: () => handleView(record),
    // },
  ];

  const statusLabels = useMemo(() => {
    const statusMap: Record<number, string> = {
      1: t("status.approved"),
      0: t("status.pending"),
    };
    return statusMap;
  }, [t]);

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
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ minWidth: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  const locationsData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    if (Array.isArray(data)) {
      return data.length;
    }
    return data.total || data.totalCount || data.count || 0;
  }, [data]);

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const statsMetadata = useMemo(() => {
    return {
      total: data?.totalCount || 0,
      pgnApprovedRecords: data?.pgnApprovedRecords || 0,
      pgnPendingRecords: data?.pgnPendingRecords || 0,
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
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={locationsData}
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
              const remaining = prev.filter((p) => keys.includes(p.id));
              const newSelected = selectedRows.filter((r) => !remaining.some((p) => p.id === r.id));
              return [...remaining, ...newSelected];
            });
          },
        }}
        filterOptions={{
          status: [
            { text: t("status.approved"), value: 1 },
            { text: t("status.pending"), value: 0 },
          ],
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
        pagination={{
          current: apiParams.PageNumber,
          pageSize: apiParams.PageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total, range) => t("pagination.showTotal", { start: range[0], end: range[1], total }),
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
      />

      <ParkonicLocationViewDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={viewRecord}
        config={config}
      />
    </Space>
  );
};

export default ParkonicLocationPage;
