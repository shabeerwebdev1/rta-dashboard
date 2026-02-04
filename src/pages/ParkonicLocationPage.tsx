/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Form, Row, Col, Select, App, DatePicker, Tag } from "antd";
import { DownloadOutlined, UserAddOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetParkonicsLocationQuery,
  useUpdateParkonicsLocationMutation,
  useLazyGetParkonicsLocationByIdQuery,
} from "../services/rtkApiFactory";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import { parkonicLocationPageConfig } from "../config/pageConfigs/parkonicLocationConfig";
import DataTableWrapper from "../components/common/DataTableWrapper";
import StatsDisplay from "../components/common/StatsDisplay";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Map modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetParkonicsLocationQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [updateLocation, { isLoading: isUpdating }] = useUpdateParkonicsLocationMutation();
  const [triggerGetLocation, { data: singleRecordData, isSuccess: isSingleRecordSuccess }] =
    useLazyGetParkonicsLocationByIdQuery();

  // State to maintain the rows data for downloading
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

  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};

      // Serial number column
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      // Parking name column (depends on current language)
      if (i18n.language === "ar") {
        csvRecord[t("form.parkingNameAr")] = item.parking_Name_Ar || "";
      } else {
        csvRecord[t("form.parkingNameEn")] = item.parking_Name_En || "";
      }

      csvRecord[t("form.parkonicsLocationId")] = item.parkonics_Location_Id || "";
      csvRecord[t("form.zone")] = item.zone || "";
      csvRecord[t("form.area")] = item.area || "";
      csvRecord[t("form.addedOn")] = item.created_At ? dayjs(item.created_At).format("DD-MM-YYYY") : "";
      csvRecord[t("form.approvedBy")] = item.updated_By || "";
      csvRecord[t("form.isApproved")] = item.isUpdatedBack ? t("form.approved") : t("form.pending");

      return csvRecord;
    });
  };

  // Get CSV filename based on current language
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

          // Transform the data to match UI display
          const transformedData = transformDataForCSV(selectedRows);

          // Get filename based on current language
          const filename = getCsvFilename();

          // Export to CSV using your common component
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
        if (column.key === "created_At") {
          return {
            ...column,
            render: (value: any) => formatDateTime(value),
          };
        }
        if (column.key === "updated_At") {
          return {
            ...column,
            render: (value: any) => formatDateTime(value),
          };
        }
        if (column.key === "isUpdatedBack") {
          return {
            ...column,
            render: (value: any) => {
              if (value) {
                return <Tag color="green">{t("form.approved")}</Tag>;
              } else {
                return <Tag color="orange">{t("form.pending")}</Tag>;
              }
            },
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, t],
  );

  const handleAssign = async (record: any) => {
    // notification.success({ data: { en_Msg: t("messages.assignSuccess") } }, t("messages.assignSuccess"));
    try {
      modal.confirm({
        title: t("messages.confirmAssignTitle"),
        content: t("messages.confirmAssignContent"),
        okText: t("common.approve"),
        cancelText: t("common.cancel"),
        onOk: async () => {
          const payload = {
            id: record.id,
            parking_Name_En: record.parking_Name_En || "Parking EN " + Math.floor(Math.random() * 1000),
            parking_Name_Ar: record.parking_Name_Ar || "موقف " + Math.floor(Math.random() * 1000),
            zone: record.zone || "Zone-" + Math.floor(Math.random() * 10),
            area: record.area || "Area-" + Math.floor(Math.random() * 10),
            latitude: record.latitude || (25 + Math.random()).toFixed(6).toString(),
            longitude: record.longitude || (55 + Math.random()).toFixed(6).toString(),
            updated_By: "system",
            status: true,
          };
          await updateLocation(payload).unwrap();
          notification.success({ data: { en_Msg: t("messages.assignSuccess") } }, t("messages.assignSuccess"));
        },
      });
    } catch (error: any) {
      notification.error({ data: { en_Msg: t("messages.assignFailed") } }, t("messages.assignFailed"));
    }
  };

  const actionMenuItems = (record: any) => [
    {
      key: "assign",
      label: t("common.assign"),
      icon: <UserAddOutlined />,
      disabled: record.isUpdatedBack,
      onClick: () => handleAssign(record),
    },
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

    // Check multiple possible field names
    return data.total || data.totalCount || data.count || 0;
  }, [data]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={config.statsConfig}
        data={data?.data || []}
        metadata={{ totalCount: data?.total || 0 }}
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
              {/* <span>{t("common.filterByaddedon")}</span>
              <DatePicker.RangePicker
                value={state.dateRange}
                format={"DD-MM-YYYY"}
                placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              /> */}
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
          isUpdatedBack: [
            { text: t("status.approved"), value: true },
            { text: t("status.pending"), value: false },
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
    </Space>
  );
};

export default ParkonicLocationPage;
