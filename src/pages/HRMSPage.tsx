/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, App, DatePicker, Spin, Tag } from "antd";
import { PlusOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";

// ========== RTK Query Imports (COMMENTED OUT) ==========
// import {
//   useGetHRMSAttendanceQuery,
//   useAddHRMSAttendanceMutation,
//   useLazyGetLookupsQuery,
//   useLazyGetSupervisorsQuery,
// } from "../services/rtkApiFactory";

import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import DataTableWrapper from "../components/common/DataTableWrapper";
import HRMSViewDrawer from "../components/hrms/HRMSViewDrawer";
// import { usePermission } from "../hooks/usePermission";

// Import config and mock data
import { hrmsConfig, MOCK_INSPECTORS_DATA, InspectorAttendanceDTO } from "../config/pageConfigs/hrmsConfig";

const { Option } = Select;
const pageKey = "hrms";

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number | string, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value.toString() === value.toString());
  if (!option) return value;
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
};

const HRMSPage: React.FC = () => {
  // const { canCreate, canEdit } = usePermission();
  const canCreate = () => true; // Mock permission
  const canEdit = () => true; // Mock permission
  const menuName = "HRMS";

  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = hrmsConfig;

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // ========== MOCK DATA INSTEAD ==========
  const data = MOCK_INSPECTORS_DATA;
  const isLoading = false;
  const isFetching = false;
  const isAddingAttendance = false;
  const isLoadingSupervisors = false;

  // Mock supervisors data
  const supervisorsData = [
    { id: 1, name: "Mohammed Ali", nameAr: "محمد علي" },
    { id: 2, name: "Sara Ahmed", nameAr: "سارة أحمد" },
    { id: 3, name: "Khalid Hassan", nameAr: "خالد حسن" },
  ];

  // Mock lookup data for status
  const mockLookupOptions = [
    { value: 1, labelEn: "Present", labelAr: "حاضر", categoryId: 900 },
    { value: 2, labelEn: "Absent", labelAr: "غائب", categoryId: 900 },
    { value: 3, labelEn: "Leave", labelAr: "إجازة", categoryId: 900 },
  ];

  // State to maintain the rows data for downloading
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // ========== MOCK FETCH INSTEAD ==========
  useEffect(() => {
    setIsLoadingLookups(true);
    setTimeout(() => {
      setLookupOptions(mockLookupOptions);
      setIsLoadingLookups(false);
    }, 500);
  }, [i18n.language]);

  // Supervisor options
  const supervisorOptions = useMemo(() => {
    if (!supervisorsData) return [];
    return supervisorsData.map((supervisor: any) => ({
      value: supervisor.id,
      label: i18n.language === "ar" ? supervisor.nameAr : supervisor.name,
      original: supervisor,
    }));
  }, [supervisorsData, i18n.language]);

  // Status options from lookups
  const statusOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 900).map((option) => ({
        ...option,
        value: option.value,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

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

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const attendancePayload = {
        inspectorName: values.InspectorName,
        supervisorName: values.SupervisorName,
        date: values.Date.format("YYYY-MM-DD"),
        checkInTime: values.CheckInTime,
        checkOutTime: values.CheckOutTime || "",
        status: values.Status,
      };

      // ========== RTK Mutation (COMMENTED OUT) ==========
      // await addAttendance(attendancePayload).unwrap();

      // ========== MOCK SUCCESS ==========
      console.log("Mock submission:", attendancePayload);

      notification.success({
        data: {
          en_Msg: "Attendance record added successfully",
          ar_Msg: "تمت إضافة سجل الحضور بنجاح",
        },
      });

      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const statusLabels = useMemo(
    () => ({
      Present: t("status.present") || "Present",
      Absent: t("status.absent") || "Absent",
      Leave: t("status.leave") || "Leave",
    }),
    [t],
  );

  // ✅ FIX: Find the complete record from MOCK_INSPECTORS_DATA
  const handleView = (record: any) => {
    // Find the full record with path and fine data
    const fullRecord = MOCK_INSPECTORS_DATA.find((item) => item.id === record.id);
    if (fullRecord) {
      console.log("Opening drawer with full record:", fullRecord);
      setViewRecord(fullRecord);
      setIsDrawerOpen(true);
    } else {
      console.warn("Record not found in mock data");
      setViewRecord(record);
      setIsDrawerOpen(true);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;

    if (navigator?.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          notification.success(
            {
              data: {
                en_Msg: "Link copied to clipboard",
                ar_Msg: "تم نسخ الرابط",
              },
            },
            "Share Success",
          );
        })
        .catch(() => {
          notification.error(
            {
              data: {
                en_Msg: "Failed to copy link",
                ar_Msg: "فشل نسخ الرابط",
              },
            },
            "Share Failed",
          );
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        notification.success(
          {
            data: {
              en_Msg: "Link copied to clipboard",
              ar_Msg: "تم نسخ الرابط",
            },
          },
          "Share Success",
        );
      } catch {
        notification.error(
          {
            data: {
              en_Msg: "Failed to copy link",
              ar_Msg: "فشل نسخ الرابط",
            },
          },
          "Share Failed",
        );
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Transform data for CSV export
  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, any> = {};
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      config.tableConfig.columns.forEach((column) => {
        if (column.key === "date") {
          csvRecord[t("form.date") || "Date"] = item.date ? dayjs(item.date).format("DD-MM-YYYY") : "";
        } else if (column.key === "inspectorName") {
          csvRecord[t("form.inspectorName") || "Inspector Name"] = item.inspectorName || "";
        } else if (column.key === "supervisorName") {
          csvRecord[t("form.supervisorName") || "Supervisor Name"] = item.supervisorName || "";
        } else if (column.key === "checkInTime") {
          csvRecord[t("form.checkInTime") || "Check In Time"] = item.checkInTime || "";
        } else if (column.key === "checkOutTime") {
          csvRecord[t("form.checkOutTime") || "Check Out Time"] = item.checkOutTime || "";
        } else if (column.key === "status") {
          csvRecord[t("form.status") || "Status"] = statusLabels[item.status] || item.status;
        }
      });

      return csvRecord;
    });
  };

  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `سجلات_الحضور.csv`;
    } else {
      return `HRMS_Attendance_Records.csv`;
    }
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: "Please select at least one row to export" } }, "No Selection");
      return;
    }

    modal.confirm({
      title: "Export to CSV",
      content: `Export ${selectedRows.length} selected records?`,
      okText: "Export",
      cancelText: "Cancel",
      onOk: () => {
        try {
          if (selectedRows.length === 0) {
            notification.error({ data: { en_Msg: "No data to export" } }, "Export Failed");
            return;
          }

          const transformedData = transformDataForCSV(selectedRows);
          const filename = getCsvFilename();

          exportToCsv(transformedData, filename);

          notification.success(
            { data: { en_Msg: `${selectedRows.length} records exported successfully` } },
            "Export Success",
          );

          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          notification.error({ data: { en_Msg: "Failed to export data" } }, "Export Failed");
        }
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title) || c.key])),
    [t, config.tableConfig.columns, i18n.language],
  );

  // Enhanced table config with render functions
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "status") {
          return {
            ...column,
            render: (value: any) => {
              let color = "default";
              if (value === "Present") color = "green";
              if (value === "Absent") color = "red";
              if (value === "Leave") color = "orange";
              return <Tag color={color}>{statusLabels[value] || value}</Tag>;
            },
          };
        }

        if (column.key === "date") {
          return {
            ...column,
            render: (value: any) => (value ? dayjs(value).format("DD-MM-YYYY") : ""),
          };
        }

        return column;
      }),
    }),
    [config.tableConfig, statusLabels, i18n, t],
  );

  const actionMenuItems = (record: any) => [
    {
      key: "view",
      label: t("common.view") || "View",
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
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

  // ========== Process Mock Data with Filters ==========
  const hrmsData = useMemo(() => {
    let filteredData = [...MOCK_INSPECTORS_DATA];

    // Apply status filter
    if (state?.columnFilters?.status && state.columnFilters.status.length > 0) {
      filteredData = filteredData.filter((item) => state.columnFilters.status.includes(item.status));
    }

    // Apply supervisor filter
    if (state?.columnFilters?.supervisorName && state.columnFilters.supervisorName.length > 0) {
      filteredData = filteredData.filter((item) => state.columnFilters.supervisorName.includes(item.supervisorName));
    }

    // Apply date range filter
    if (state?.dateRange && state.dateRange[0] && state.dateRange[1]) {
      filteredData = filteredData.filter((item) => {
        const itemDate = dayjs(item.date);
        return itemDate.isAfter(state.dateRange[0]) && itemDate.isBefore(state.dateRange[1]);
      });
    }

    return filteredData;
  }, [data, state?.columnFilters, state?.dateRange]);

  const totalCount = useMemo(() => {
    return hrmsData.length;
  }, [hrmsData]);

  const metadata = useMemo(() => {
    return {
      totalRecords: MOCK_INSPECTORS_DATA.length,
    };
  }, []);

  // ✅ Create properly formatted state object
  const activeFilterState = useMemo(() => {
    return {
      columnFilters: state?.columnFilters || {},
      searchKey: state?.searchKey || "",
      searchValue: state?.searchValue || "",
      dateRange: state?.dateRange || null,
      sortBy: state?.sortBy || undefined,
      sortOrder: state?.sortOrder || undefined,
    };
  }, [state]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* ✅ Stats Display */}
      <StatsDisplay statsConfig={config.statsConfig} data={hrmsData} metadata={metadata} loading={isLoading} />

      {/* ✅ Search and Filter Card - EXACT LAYOUT AS WHITELIST */}
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Input
                addonBefore={searchAddon}
                placeholder={t("common.searchPlaceholder") || "Search..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 450 }}
                allowClear
              />
              <span>{t("common.filterByDate") || "Filter by Date:"}</span>
              <DatePicker.RangePicker
                value={state.dateRange}
                format={"DD-MM-YYYY"}
                placeholder={[t("placeholders.startDate") || "Start Date", t("placeholders.endDate") || "End Date"]}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv") || "Download CSV"}
              </Button>

              <Button type="primary" icon={<PlusOutlined />} onClick={handleModalOpen} disabled={!canCreate(menuName)}>
                {t("common.addNew") || "Add New"}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* ✅ Active Filters Display */}
        <ActiveFiltersDisplay
          state={activeFilterState}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          lookupOptions={lookupOptions}
          getLabelFromValue={getLabelFromValue}
        />
      </Card>

      {/* ✅ Data Table */}
      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={hrmsData}
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
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={activeFilterState}
        lookupOptions={lookupOptions}
        getLabelFromValue={getLabelFromValue}
      />

      {/* ✅ Add New Attendance Modal */}
      <Modal
        open={isModalOpen}
        title={t("common.addNew") || "Add New Attendance"}
        onCancel={handleModalClose}
        width="720px"
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset") || "Reset"}
          </Button>,
          <Button key="back" onClick={handleModalClose}>
            {t("common.cancel") || "Cancel"}
          </Button>,
          <Button key="submit" type="primary" loading={isAddingAttendance} onClick={() => form.submit()}>
            {t("common.submit") || "Submit"}
          </Button>,
        ]}
      >
        <Spin spinning={isLoadingLookups}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="InspectorName"
                  label={t("form.inspectorName") || "Inspector Name"}
                  rules={[{ required: true, message: "Please enter inspector name" }]}
                >
                  <Input placeholder="Enter inspector name" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="SupervisorName"
                  label={t("form.supervisorName") || "Supervisor Name"}
                  rules={[{ required: true, message: "Please select supervisor" }]}
                >
                  <Select
                    showSearch
                    placeholder="Select supervisor"
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                    options={supervisorOptions}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="Date"
                  label={t("form.date") || "Date"}
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="Status"
                  label={t("form.status") || "Status"}
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select
                    showSearch
                    placeholder="Select status"
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  >
                    <Option value="Present">{t("status.present") || "Present"}</Option>
                    <Option value="Absent">{t("status.absent") || "Absent"}</Option>
                    <Option value="Leave">{t("status.leave") || "Leave"}</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="CheckInTime"
                  label={t("form.checkInTime") || "Check In Time"}
                  rules={[{ required: true, message: "Please enter check-in time" }]}
                >
                  <Input placeholder="HH:MM AM/PM" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="CheckOutTime" label={t("form.checkOutTime") || "Check Out Time"}>
                  <Input placeholder="HH:MM AM/PM" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {/* ✅ View Modal */}
      {viewRecord && (
        <HRMSViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
          onShare={handleShare}
          statusLabels={statusLabels}
        />
      )}
    </Space>
  );
};

export default HRMSPage;
