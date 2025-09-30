import React, { useState, useEffect, useMemo } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Select,
  App,
  Upload,
  DatePicker,
  Spin,
  Tag,
  Image,
} from "antd";
import { PlusOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetInspectionObstaclesQuery,
  useAddInspectionObstacleMutation,
  useLazyGetLookupsQuery,
  useLazyGetZonesQuery,
  useGetAllAreasQuery,
} from "../services/rtkApiFactory";
import { useUploadInspectionFilesMutation } from "../services/inspectionFileApi";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import InspectionObstaclesViewDrawer from "../components/inspectionobstacle/InspectionObstaclesViewDrawer";
import { usePermission } from "../hooks/usePermission";

const { Option } = Select;
const pageKey = "inspection-obstacles";

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

const InspectionObstaclesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
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
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("small");
  const [filteredAreaOptions, setFilteredAreaOptions] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetInspectionObstaclesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addObstacle, { isLoading: isAddingObstacle }] = useAddInspectionObstacleMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones, { data: zonesData, isLoading: isLoadingZones }] = useLazyGetZonesQuery();
  const menuName = "InspectionObstacle"; // backend permission name
  const { canCreate } = usePermission();
  const { data: allAreasData, isLoading: isLoadingAllAreas } = useGetAllAreasQuery({});
  const [areaOptions, setAreaOptions] = useState<any[]>([]);
  const [uploadInspectionFiles, { isLoading: isUploading }] = useUploadInspectionFilesMutation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const getBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // Fetch lookup data and zones when language changes
  useEffect(() => {
    fetchLookupData();
    triggerGetZones({});
  }, [i18n.language]);

  // Create a memoized map of area IDs to area names for quick lookup
  const areaIdToNameMap = useMemo(() => {
    const map = new Map();
    if (allAreasData) {
      allAreasData.forEach((area: any) => {
        map.set(area.area_Id, area.area);
      });
    }
    return map;
  }, [allAreasData]);

  // Transform all areas data into options format
  useEffect(() => {
    if (allAreasData) {
      const transformedAreas = allAreasData.map((area: any) => ({
        label: area.area, // Display name
        value: area.area_Id, // ID value
        zoneId: area.zone_Id, // Keep zone reference for filtering
        original: area,
      }));
      setAreaOptions(transformedAreas);
    }
  }, [allAreasData]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([600, 700, 800]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  // Zone options from zones API
  const zoneOptions = useMemo(() => {
    if (!zonesData) return [];

    return zonesData.map((zone: any) => ({
      value: zone.zoneId, // Keep as number to match API response
      label: `${zone.zoneCode}-${zone.zone}`,
      original: zone,
    }));
  }, [zonesData, i18n.language]);

  // Source options from lookups
  const sourceOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 800).map((option) => ({
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
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // Update the zone onChange handler to filter areas
  const handleZoneChange = (zoneId: number) => {
    form.setFieldsValue({ Area: undefined }); // reset Area when Zone changes

    // Filter areas by zoneId
    const filteredAreas =
      allAreasData
        ?.filter((area: any) => area.zone_Id === zoneId)
        .map((area: any) => ({
          label: area.area,
          value: area.area_Id,
          zoneId: area.zone_Id,
          original: area,
        })) || [];

    setAreaOptions(filteredAreas);
  };

  const generateGuid = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  const handleFormSubmit = async (values: any) => {
    try {
      const inspectionGUID = generateGuid();
      const batchGUID = generateGuid();

      // 1. First save obstacle data using addObstacle API
      const obstaclePayload = {
        inspectionGUID,
        zone: values.Zone,
        area: values.Area,
        sourceOfObstacle: values.SourceOfObstacle,
        closestPaymentDevice: values.ClosestPaymentDevice,
        comments: values.Comments || "",
        requestFrom: "",
      };

      await addObstacle(obstaclePayload).unwrap();

      // 2. Then upload files if any using the new inspection file API
      if (values.Photo && values.Photo.length > 0) {
        for (const fileItem of values.Photo) {
          if (fileItem.originFileObj) {
            const formData = new FormData();

            // Append one file at a time
            formData.append("File", fileItem.originFileObj);
            formData.append("FileName", fileItem.name || fileItem.originFileObj.name);

            // Append metadata
            formData.append("InspectionGUID", inspectionGUID);
            formData.append("BatchGUID", batchGUID);
            formData.append("EntityCode", "parking-Obstacle");
            formData.append("FilePath", "/uploads/temp");
            formData.append("Description", "Uploaded via inspection obstacle form");

            // Send API request for this file
            await uploadInspectionFiles(formData).unwrap();
          }
        }
      }

      notification.success({
        data: { en_Msg: "Inspection Obstacle created successfully" },
      });
      handleModalClose();
    } catch (err) {
      console.error("Failed to save inspection obstacle:", err);
      notification.error(err as any, "Failed to save inspection obstacle");
    }
  };

  const statusLabels = useMemo(
    () => ({
      0: t("status.reported"),
      1: t("status.removed"),
    }),
    [t],
  );

  // Pass the original record to the drawer, the drawer will handle the mapping
  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
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
        const selectedData = data?.data.filter((item: any) => selectedRowKeys.includes(item.id));

        // ✅ Map values → labels before exporting
        const formattedData = selectedData.map((item: any) => {
          // Find area name from areaIdToNameMap
          const areaName = areaIdToNameMap.get(item.area) || item.area;

          return {
            ...item,
            zone: getLabelFromValue(item.zone, zoneOptions, i18n),
            area: areaName,
            sourceOfObstacle: getLabelFromValue(item.sourceOfObstacle, sourceOptions, i18n),
            status: statusLabels[item.status] || item.status,
          };
        });

        exportToCsv(formattedData, `obstacles_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
  );

  // Enhanced table config with proper renderers for labels
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,

      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "zone") {
          return {
            ...column,
            render: (value: any) => {
              const zoneOption = zoneOptions.find((opt) => opt.value.toString() === value.toString());
              return zoneOption ? zoneOption.label : value;
            },
          };
        }

        if (column.key === "area") {
          return {
            ...column,
            render: (value: any) => {
              // Find area name from areaIdToNameMap for quick lookup
              return areaIdToNameMap.get(value) || value;
            },
          };
        }
        if (column.key === "sourceOfObstacle") {
          return {
            ...column,
            render: (value: any) => {
              const sourceOption = sourceOptions.find((opt) => opt.value.toString() === value.toString());
              return sourceOption ? sourceOption.label : value;
            },
          };
        }

        if (column.key === "status") {
          return {
            ...column,
            render: () => <Tag color="green">{t("status.active")}</Tag>,
          };
        }

        return column;
      }),
    }),
    [config.tableConfig, zoneOptions, areaIdToNameMap, sourceOptions, i18n, t],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key] || key}
        </Option>
      ))}
    </Select>
  );

  useEffect(() => {
    const selectedZoneId = state.columnFilters.zone?.[0];
    if (selectedZoneId && allAreasData) {
      const filtered = allAreasData
        .filter((area: any) => area.zone_Id === selectedZoneId)
        .map((area: any) => ({ label: area.area, value: area.area_Id }));
      setFilteredAreaOptions(filtered);
    } else {
      setFilteredAreaOptions(allAreasData?.map((area: any) => ({ label: area.area, value: area.area_Id })) || []);
    }
  }, [state.columnFilters.zone, allAreasData]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  const handleDropdownFilterChange = (key: "zone" | "area", value: string | null) => {
    const newFilters: Record<string, any> = { ...state.columnFilters };

    if (value) {
      newFilters[key] = [value];
    } else {
      delete newFilters[key];
    }

    if (key === "zone") {
      delete newFilters.area;
    }

    const sorter = state.sortBy ? ({ field: state.sortBy, order: state.sortOrder } as SorterResult<any>) : {};

    handleTableChange({ current: 1, pageSize: apiParams.PageSize }, newFilters, sorter);
  };

  const getCustomLabelFromValue = (value: number | string, options: any[], i18nInstance: any) => {
    const zone = zoneOptions.find((z) => z.value === value);
    if (zone) return zone.label;

    const area = areaOptions.find((a) => a.value === value);
    if (area) return area.label;

    return getLabelFromValue(value, options, i18nInstance); // Fallback to original
  };

  const metadata = useMemo(() => {
    if (!data) return {};

    return {
      totalCount: data.total,
    };
  }, [data]);
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={data?.data || []} metadata={metadata} loading={isLoading} />
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Select
                placeholder={t("form.zone")}
                style={{ width: 220 }}
                allowClear
                options={zoneOptions}
                loading={isLoadingZones}
                value={state.columnFilters.zone?.[0] as string | undefined}
                onChange={(value) => handleDropdownFilterChange("zone", value)}
              />
              <Select
                placeholder={t("form.area")}
                style={{ width: 220 }}
                allowClear
                options={filteredAreaOptions}
                loading={isLoadingAllAreas}
                value={state.columnFilters.area?.[0] as string | undefined}
                onChange={(value) => handleDropdownFilterChange("area", value)}
                disabled={!state.columnFilters.zone?.[0]}
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

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleModalOpen}
                disabled={!canCreate(menuName)} // ✅ disable if user cannot create
              >
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
        <ActiveFiltersDisplay
          state={state}
          onClearFilter={clearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          lookupOptions={lookupOptions}
          getLabelFromValue={getCustomLabelFromValue}
          statusLabels={statusLabels}
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading || isFetching || isLoadingAllAreas}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
        lookupOptions={lookupOptions}
        getLabelFromValue={getLabelFromValue}
        filterOptions={{
          status: [
            { text: t("status.reported"), value: 0 },
            { text: t("status.removed"), value: 1 },
          ],
        }}
      />

      <Modal
        open={isModalOpen}
        title={t("page.addTitle", { entity: t(config.name.singular) })}
        onCancel={handleModalClose}
        width="720px"
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>,
          <Button key="back" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isAddingObstacle || isUploading || isLoadingLookups || isLoadingZones || isLoadingAllAreas}
            onClick={() => form.submit()}
          >
            {t("common.submit")}
          </Button>,
        ]}
      >
        <Spin spinning={isLoadingLookups || isLoadingZones || isLoadingAllAreas}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="Zone" label={t("form.zone")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.zone")}
                    loading={isLoadingZones}
                    options={zoneOptions.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                    onChange={handleZoneChange}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="Area" label={t("form.area")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.area")}
                    loading={isLoadingAllAreas}
                    options={areaOptions}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="SourceOfObstacle" label={t("form.sourceOfObstacle")} rules={[{ required: true }]}>
                  <Select
                    placeholder={t("placeholders.sourceOfObstacle")}
                    showSearch // enables the search input
                    optionFilterProp="label" // filter based on the label
                    filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    options={sourceOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="ClosestPaymentDevice" label={t("form.closestPD")} rules={[{ required: true }]}>
                  <Input placeholder={t("placeholders.closestPaymentDevice")} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="Photo"
                  label={t("form.photo")}
                  rules={[{ required: true }]}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload
                    listType="picture-card"
                    beforeUpload={() => false}
                    multiple
                    accept=".jpg,.jpeg,.png,.svg"
                    onPreview={async (file) => {
                      let src = file.url;
                      if (!src && file.originFileObj) {
                        src = await getBase64(file.originFileObj);
                      }
                      setPreviewImage(src || "");
                      setPreviewOpen(true);
                    }}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>{t("form.upload")}</div>
                    </div>
                  </Upload>
                </Form.Item>

                {previewImage && (
                  <Image
                    style={{ display: "none" }}
                    preview={{
                      visible: previewOpen,
                      src: previewImage,
                      onVisibleChange: (visible) => setPreviewOpen(visible),
                      afterClose: () => setPreviewImage(""),
                    }}
                    src={previewImage}
                  />
                )}
              </Col>
              <Col span={24}>
                <Form.Item name="Comments" label={t("form.comments")}>
                  <Input.TextArea placeholder={t("placeholders.comments")} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {viewRecord && (
        <InspectionObstaclesViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
          onShare={handleShare}
          onStatusChange={() => {
            // This will trigger a refetch of the data
            // You might need to add a refetch function to your query hook
          }}
          // Pass the necessary data for mapping
          zoneOptions={zoneOptions}
          sourceOptions={sourceOptions}
          areaIdToNameMap={areaIdToNameMap}
          statusLabels={statusLabels}
        />
      )}
    </Space>
  );
};

export default InspectionObstaclesPage;
