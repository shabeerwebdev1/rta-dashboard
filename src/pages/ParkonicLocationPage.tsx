import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, App, Spin, Tag, Pagination, DatePicker } from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, DownloadOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import dayjs  from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Enable the isBetween plugin
dayjs.extend(isBetween);
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetParkonicsLocationQuery,
  useAddParkonicsLocationMutation,
  useUpdateParkonicsLocationMutation,
  useLazyGetParkonicsLocationByIdQuery,
} from "../services/rtkApiFactory";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import { parkonicLocationPageConfig } from "../config/pageConfigs/parkonicLocationConfig";
import DataTableWrapper from "../components/common/DataTableWrapper";
import ParkonicLocationViewDrawer from "../components/ParkonicLocation/ParkonicLocationViewDrawer";
import { usePermission } from "../hooks/usePermission";
import ArcGISMap from "../components/common/ArcGISMap";

const { Option } = Select;
const { RangePicker } = DatePicker;
const pageKey = "parkonic-location";

const ParkonicLocationPage: React.FC = () => {
  const { canCreate, canEdit } = usePermission();
  const menuName = "ParkonicLocation";
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey] || parkonicLocationPageConfig;
  const [searchParams] = useSearchParams();

  // Basic API params without filtering - fetch all data
  const basicApiParams = {
    PageNumber: 1,
    PageSize: 1000, // Fetch all records for client-side filtering
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

  // Client-side filter states
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchKey, setSearchKey] = useState<string>("zone");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, (string | number)[] | null>>({});
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | undefined>();
  

  // Pagination states - matching UserZoneLinking pattern
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetParkonicsLocationQuery(basicApiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addLocation, { isLoading: isAdding }] = useAddParkonicsLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateParkonicsLocationMutation();
  const [triggerGetLocation, { data: singleRecordData, isSuccess: isSingleRecordSuccess }] =
    useLazyGetParkonicsLocationByIdQuery();

  // Client-side filtering logic with formatted dates
  const filteredData = useMemo(() => {
    if (!data?.data) return [];

    // 🔑 Format dates before doing any filtering
    let formatted = data.data.map((item: any) => ({
      ...item,
      created_At: item.created_At ? dayjs(item.created_At).format("DD-MM-YYYY") : "-",
    }));

    let filtered = [...formatted];

    // Apply search filter
    if (debouncedSearchValue && searchKey) {
      filtered = filtered.filter((item) => {
        const value = item[searchKey]?.toString().toLowerCase() || "";
        return value.includes(debouncedSearchValue.toLowerCase());
      });
    }

    // Apply date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter((item) => {
        if (!item.created_At) return false;
        const itemDate = dayjs(item.created_At);
        return itemDate.isBetween(startDate, endDate, 'day', '[]');
      });
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter((item) => {
          return values.includes(item[key]);
        });
      }
    });

    // Apply sorting
    if (sortBy && sortOrder) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortOrder === "ascend" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, debouncedSearchValue, searchKey, dateRange, columnFilters, sortBy, sortOrder]);

  // Paginated data for display - matching UserZoneLinking pattern
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredData.slice(startIdx, startIdx + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Create state object for ActiveFiltersDisplay
  const filterState = {
    searchKey,
    searchValue: debouncedSearchValue,
    dateRange,
    columnFilters,
    sortBy,
    sortOrder,
  };

  useEffect(() => {
    const recordId = searchParams.get('viewRecord');
    if (recordId && !isDrawerOpen) {
      triggerGetLocation(recordId);
    }
  }, [searchParams, triggerGetLocation, isDrawerOpen]);

  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData) {
      setViewRecord(singleRecordData.data);
      setIsDrawerOpen(true);
    }
  }, [isSingleRecordSuccess, singleRecordData]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") {
      setSearchValue("");
    } else if (type === "date") {
      setDateRange(null);
    } else if (type === "column" && key) {
      if (value !== undefined) {
        // Remove specific value from column filter
        setColumnFilters(prev => {
          const current = prev[key] || [];
          const updated = current.filter(v => v !== value);
          return { ...prev, [key]: updated.length > 0 ? updated : null };
        });
      } else {
        // Remove entire column filter
        setColumnFilters(prev => ({ ...prev, [key]: null }));
      }
    } else if (type === "sorter") {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearAll = () => {
    setSearchValue("");
    setDateRange(null);
    setColumnFilters({});
    setSortBy(undefined);
    setSortOrder(undefined);
    setCurrentPage(1);
  };

  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue({ ...record });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  // Handle map location selection
  const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    // Update the form fields with the selected coordinates
    form.setFieldsValue({
      latitude: location.lat.toString(),
      longitude: location.lng.toString()
    });
    setIsMapModalOpen(false);
  };

  const handleInspectorClick = (inspector: any) => {
    
    handleMapLocationSelect({
      lat: inspector.lat,
      lng: inspector.lng
    });
  };

  // Updated pagination handler to match UserZoneLinking pattern
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    // Handle sorting
    if (sorter && sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order);
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }

    // Handle column filters
    const newColumnFilters: Record<string, (string | number)[] | null> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values && Array.isArray(values) && values.length > 0) {
        newColumnFilters[key] = values as (string | number)[];
      }
    });
    setColumnFilters(newColumnFilters);
    setCurrentPage(1); // Reset to first page when table changes
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
      };
      let response;
      if (modalMode === "add") {
        response = await addLocation(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updateLocation({ ...payload, id: selectedRecord.id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = () => {
    const params = new URLSearchParams(searchParams);
    params.set("viewRecord", viewRecord.id);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => notification.success({ data: { en_Msg: "Share link copied to clipboard!" } }, "Link Copied!"),
      () => notification.error({ data: { en_Msg: "Failed to copy link." } }, "Copy Failed"),
    );
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
        const selectedData = filteredData.filter((item: any) => selectedRowKeys.includes(item.id));
        exportToCsv(selectedData, `parkonic-locations_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
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
        if (column.key === "zone" || column.key === "area") {
          return {
            ...column,
            filterable: false, // Enable column filtering for zone and area
          };
        }
        return column;
      }),
    }),
    [config.tableConfig],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => handleModalOpen("edit", record),
      disabled: canEdit(menuName),
    },
  ];

  const searchAddon = (
    <Select 
      value={searchKey} 
      onChange={(key) => setSearchKey(key)} 
      style={{ width: 150 }}
    >
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                format="DD-MM-YYYY"
                allowClear
                suffixIcon={<CalendarOutlined />}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv")} 
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleModalOpen("add")}
                disabled={canCreate(menuName)}
              >
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
        
        <ActiveFiltersDisplay
          state={filterState}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
        />
      </Card>
      
      <Spin spinning={isLoading || isFetching || isAdding || isUpdating}>
        <DataTableWrapper
          pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
          data={paginatedData}
          total={filteredData.length}
          isLoading={isLoading || isFetching}
          apiParams={basicApiParams}
          handleTableChange={handleTableChange}
          handlePaginationChange={() => {}} // Not needed for client-side pagination
          rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
          actionMenuItems={actionMenuItems}
          tableSize={tableSize}
          state={filterState}
          showPagination={false}
        />

       
        <div 
          style={{ 
            marginTop: 1, 
            textAlign: "right",
            padding: "12px 16px",
            backgroundColor: "#fafafa",
            border: "1px solid #f0f0f0",
            
          }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredData.length}
            onChange={handlePageChange}
            showSizeChanger={{ showSearch: false }}
            pageSizeOptions={[ "10", "20", "50"]}
            showQuickJumper={false}
            showTotal={(total, range) => (
              <span style={{ marginRight: 16, color: "#666" }}>
                {`${range[0]}-${range[1]} of ${total} items`}
              </span>
            )}
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}
          />
        </div>
      </Spin>

      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: t(config.name.singular) })}
        onCancel={handleModalClose}
        width="720px"
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>,
          <Button key="back" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" loading={isAdding || isUpdating} onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="parkingName" label={t("form.parkingName")} rules={[{ required: true }]}>
                <Input  placeholder={t("placeholders.parkingName")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parkingNameArabic" label={t("form.parkingNameArabic")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.parkingNameArabic")} dir="rtl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="zone" label={t("form.zone")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.zones")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="area" label={t("form.area")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.areas")} />
              </Form.Item>
            
            </Col>
            
            <Col span={24}>
        <Form.Item label={t("form.pickLocation")} required>
  <Input.Group compact style={{ display: "flex" }}>
    <Form.Item
      name="latitude"
      noStyle
      rules={[{ required: true }]}
      style={{ width: "50%" }}
    >
      <Input placeholder={t("placeholders.latitude")} />
    </Form.Item>
    <Form.Item
      name="longitude"
      noStyle
      rules={[{ required: true }]}
      style={{ width: "50%" }}
    >
      <Input placeholder={t("placeholders.longitude")} />
    </Form.Item>
    <Button
    type="primary" 
      icon={<EnvironmentOutlined />}
      onClick={() => setIsMapModalOpen(true)}
      style={{ width: "20%" }}
    >
      Pick
    </Button>
  </Input.Group>
</Form.Item>
</Col>

          </Row>
        </Form>
      </Modal>

      
      <Modal
        open={isMapModalOpen}
        title="Select Location on Map"
        onCancel={() => setIsMapModalOpen(false)}
        width="80%"
        style={{ maxWidth: '1000px' }}
        footer={[
          <Button key="cancel" onClick={() => setIsMapModalOpen(false)}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            disabled={!selectedLocation}
            onClick={() => {
              if (selectedLocation) {
                handleMapLocationSelect(selectedLocation);
              }
            }}
          >
            Confirm Location
          </Button>,
        ]}
      >
        <div style={{ height: '400px' }}>
          <ArcGISMap
            inspectors={[]} 
            center={[55.2743, 25.1972]}
            zoom={12}
            height="100%"
            onInspectorClick={handleInspectorClick}
          />
        </div>
       
      </Modal>

      {viewRecord && (
        <ParkonicLocationViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
          onShare={handleShare}
        />
      )}
    </Space>
  );
};

export default ParkonicLocationPage;