import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  DatePicker,
  Tag,
  Divider,
  message,
  Tooltip,
  App,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useDebounce } from "../hooks/useDebounce";
import { useTableParams } from "../hooks/useTableParams";
import { useAppNotification } from "../utils/notificationManager";
import { exportToCsv } from "../utils/csvExporter";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { usePermission } from "../hooks/usePermission";
import { proactiveCampaignsConfig } from "../config/pageConfigs/proactiveCampaignsConfig";
import ProactiveCampaignViewDrawer from "../components/ProactiveCampaigns/ProactiveCampaignViewDrawer";
import ArcGISMap from "../components/common/ArcGISMap";
import {
  useAddProactiveCampaignMutation,
  useGetActiveShiftsQuery,
  useGetAllAreasQuery,
  useGetProactiveCampaignsQuery,
  useUpdateProactiveCampaignMutation,
} from "../services/rtkApiFactory";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AreaOption {
  value: string;
  label: string;
  original: Record<string, any>;
}

interface InspectorOption {
  value: string;
  label: string;
  original: Record<string, any>;
}

const CAMPAIGN_LOCATION_CENTERS: Record<string, [number, number]> = {
  downtown: [25.2048, 55.2708],
  "business-bay": [25.191, 55.276],
  jumeirah: [25.144, 55.185],
  deira: [25.263, 55.31],
  "bur-dubai": [25.253, 55.276],
};

const getCampaignLocationCenter = (location?: string): [number, number] => {
  if (!location) return [25.2, 55.27];
  return CAMPAIGN_LOCATION_CENTERS[location] || [25.2, 55.27];
};

const parseBoundaryGeometry = (value: any) => {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed?.type && parsed?.coordinates ? parsed : null;
  } catch {
    return null;
  }
};

const getShapeCenter = (shape: { type: string; coordinates: any } | null): [number, number] | null => {
  if (!shape || !shape.coordinates) return null;

  if (shape.type === "Point") {
    // coordinates is [lng, lat]
    return [shape.coordinates[1], shape.coordinates[0]];
  }

  let points: number[][] = [];
  if (shape.type === "Polygon") {
    points = shape.coordinates[0] || [];
  } else if (shape.type === "LineString") {
    points = shape.coordinates || [];
  }

  if (points.length === 0) return null;

  const [totalLat, totalLng] = points.reduce(
    (acc, point) => {
      acc[0] += point[1]; // point[1] is latitude, point[0] is longitude
      acc[1] += point[0];
      return acc;
    },
    [0, 0],
  );

  return [totalLat / points.length, totalLng / points.length];
};

const getCampaignTitle = (record: any, lang = "en") => {
  const isArabic = String(lang).startsWith("ar");
  return (
    (isArabic
      ? record?.titleAr || record?.title || record?.titleEn
      : record?.titleEn || record?.title || record?.titleAr) || ""
  );
};
const getCampaignMessage = (record: any, lang = "en") => {
  const isArabic = String(lang).startsWith("ar");
  return (
    (isArabic
      ? record?.notificationMessageAr ||
        record?.campaignMessageAr ||
        record?.campaignMessage ||
        record?.notificationMessageEn
      : record?.notificationMessageEn ||
        record?.campaignMessage ||
        record?.notificationMessageAr ||
        record?.campaignMessageAr) || ""
  );
};
const normalizeStatus = (status?: string) =>
  String(status ?? "")
    .trim()
    .toLowerCase();

const normalizeInspectorSelection = (values?: string[]) => {
  if (!values || values.length === 0) return [];
  return values;
};

const ProactiveCampaignsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { canCreate, canEdit } = usePermission();
  const [form] = Form.useForm();
  const { modal, notification } = App.useApp();

  const config = proactiveCampaignsConfig;
  const menuName = "ProactiveCampaign";
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

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const selectedStatus = Form.useWatch("status", form);
  const {
    data: campaignsResponse,
    isLoading: isLoadingCampaigns,
    refetch,
  } = useGetProactiveCampaignsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const { data: allAreasResponse, isLoading: isLoadingAreas } = useGetAllAreasQuery(undefined);
  const { data: activeShiftsResponse, isLoading: isLoadingInspectors } = useGetActiveShiftsQuery({});
  const [addProactiveCampaign, { isLoading: isAddingCampaign }] = useAddProactiveCampaignMutation();
  const [updateProactiveCampaign, { isLoading: isUpdatingCampaign }] = useUpdateProactiveCampaignMutation();

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [viewBoundaryShape, setViewBoundaryShape] = useState<{ type: string; coordinates: any } | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // map/shape state (in modal)
  const [currentShape, setCurrentShape] = useState<{ type: string; coordinates: any } | null>(null);

  const campaigns = useMemo(() => campaignsResponse?.data || [], [campaignsResponse]);

  const totalCount = useMemo(
    () => campaignsResponse?.totalCount || campaigns.length || 0,
    [campaignsResponse, campaigns.length],
  );

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
    if (type === "search") {
      setSearchValue("");
    }
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleSearchKeyChange = (newKey: string) => {
    const currentValue = searchValue;
    setSearchValue("");
    if (currentValue.trim()) {
      setGlobalSearch(state.searchKey, currentValue);
    }
    setGlobalSearch(newKey, "");
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns],
  );

  const searchAddon = (
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  // Helper label
  const areaOptions = useMemo<AreaOption[]>(() => {
    const rawAreas = Array.isArray(allAreasResponse) ? allAreasResponse : (allAreasResponse as any)?.data || [];

    return rawAreas
      .map((area: any) => {
        const value =
          area.area_Id ?? area.areaId ?? area.id ?? area.areaGUID ?? area.areaCode ?? area.area ?? area.name;
        const label =
          i18n.language === "ar"
            ? area.areaAr ||
              area.areaNameAr ||
              area.nameAr ||
              area.area ||
              area.areaName ||
              area.name ||
              String(value ?? "")
            : area.area || area.areaName || area.name || String(value ?? "");

        return {
          value: String(value ?? ""),
          label: String(label || value || ""),
          original: area,
        };
      })
      .filter((area) => area.value);
  }, [allAreasResponse, i18n.language]);

  const inspectorOptions = useMemo<InspectorOption[]>(() => {
    const rawShifts = Array.isArray(activeShiftsResponse)
      ? activeShiftsResponse
      : (activeShiftsResponse as any)?.data || [];

    const mapped = rawShifts
      .filter((shift: any) => shift.roleCode === "PARINSP")
      .map((shift: any) => ({
        value: String(shift.employeeId ?? ""),
        label:
          i18n.language === "ar"
            ? String(shift.employeeNameAr || shift.employeeName || shift.employeeNameEn || shift.employeeId || "")
            : String(shift.employeeName || shift.employeeNameEn || shift.employeeNameAr || shift.employeeId || ""),
        original: shift,
      }))
      .filter((shift) => shift.value && shift.label);

    return mapped;
  }, [activeShiftsResponse, i18n.language]);

  const getLabel = (value: string | number, category: string) => {
    if (category === "locations") {
      const normalizedValue = String(value ?? "");
      const found =
        areaOptions.find((item) => item.value === normalizedValue) ||
        areaOptions.find((item) => item.label === normalizedValue) ||
        areaOptions.find((item) => String(item.original?.areaCode ?? "") === normalizedValue) ||
        areaOptions.find((item) => String(item.original?.areaName ?? "") === normalizedValue) ||
        areaOptions.find((item) => String(item.original?.area ?? "") === normalizedValue);

      return found?.label || normalizedValue;
    }

    if (category === "inspectors") {
      const normalizedValue = String(value ?? "");
      if (!normalizedValue) return t("common.all", { defaultValue: "All" });
      const found =
        inspectorOptions.find((item) => item.value === normalizedValue) ||
        inspectorOptions.find((item) => item.label === normalizedValue) ||
        inspectorOptions.find((item) => String(item.original?.employeeName ?? "") === normalizedValue);

      return found?.label || normalizedValue;
    }

    if (category === "statuses") {
      const normalizedValue = normalizeStatus(String(value ?? ""));
      const found = config.lookups?.statuses?.find((item: any) => normalizeStatus(item.value) === normalizedValue);
      return found
        ? i18n.language === "ar"
          ? found.labelAr
          : found.labelEn
        : normalizedValue || t("common.draft", { defaultValue: "Draft" });
    }

    const arr = config.lookups?.[category] || [];
    const found = arr.find((i: any) => i.value === value);
    if (!found) return String(value);
    return i18n.language === "ar" ? found.labelAr : found.labelEn;
  };

  const getLookupOptions = (category: keyof typeof config.lookups) => config.lookups?.[category] || [];

  const isDraftMode = !selectedStatus;

  // CSV Export Functions
  const transformDataForCSV = (dataToExport: any[]) => {
    return dataToExport.map((item, index) => {
      const csvRecord: Record<string, unknown> = {};
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;
      csvRecord[t("form.title")] = getCampaignTitle(item, i18n.language) || item.title || "";
      csvRecord[t("form.startTime")] = item.startTime ? dayjs(item.startTime).format("DD MMM YYYY, hh:mm A") : "";
      csvRecord[t("form.endTime")] = item.endTime ? dayjs(item.endTime).format("DD MMM YYYY, hh:mm A") : "";

      const rawViolations = item.violationTypes;
      const violationItems = Array.isArray(rawViolations)
        ? rawViolations
        : typeof rawViolations === "string"
          ? rawViolations.split(",").map((v: string) => v.trim())
          : [];
      csvRecord[t("form.violationTypes")] = violationItems.map((v: any) => getLabel(v, "violationTypes")).join(", ");

      const rawInspectors = item.assignedInspectors;
      if (Array.isArray(rawInspectors) && rawInspectors.length > 0) {
        csvRecord[t("form.assignedInspectors")] = rawInspectors.map((id: any) => getLabel(id, "inspectors")).join(", ");
      } else {
        csvRecord[t("form.assignedInspectors")] = t("common.all", { defaultValue: "All" });
      }

      csvRecord[t("form.status")] = getLabel(item.status, "statuses");

      return csvRecord;
    });
  };

  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `الحملات_الاستباقية.csv`;
    } else {
      return `Proactive_Campaigns.csv`;
    }
  };

  const handleDownloadCsv = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : campaigns;

    if (!dataToExport || dataToExport.length === 0) {
      notification.error({ data: { en_Msg: t("messages.noDataToExport") } });
      return;
    }

    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      okText: t("common.ok"),
      cancelText: t("common.cancel"),
      onOk: () => {
        try {
          const transformedData = transformDataForCSV(dataToExport);
          const filename = getCsvFilename();
          exportToCsv(transformedData, filename);

          notification.success(
            { data: { en_Msg: t("messages.csvDownloaded", { count: dataToExport.length }) } },
            t("messages.exportSuccess"),
          );
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          notification.error({ data: { en_Msg: t("messages.exportFailed") } });
        }
      },
    });
  };

  // Stats metadata
  const statsMetadata = useMemo(
    () => ({
      total: totalCount,
      active: campaigns.filter((c) => normalizeStatus(c.status) === "active").length,
      draft: campaigns.filter((c) => !normalizeStatus(c.status) || normalizeStatus(c.status) === "draft").length,
    }),
    [campaigns, totalCount],
  );

  // Modal open
  const openModal = (mode: "add" | "edit", record?: any) => {
    // Clear previous state FIRST to avoid showing old boundaries
    setCurrentShape(null);

    setModalMode(mode);
    setSelectedRecord(record || null);

    if (mode === "edit" && record) {
      // Load specific record's boundary only
      const shape = parseBoundaryGeometry(record?.boundaryGeoJson) || parseBoundaryGeometry(record?.polygon);
      setCurrentShape(shape);
    }

    setIsModalOpen(true);

    if (mode === "edit" && record) {
      const existingInspectors = Array.isArray(record.assignedInspectors) ? record.assignedInspectors : [];
      form.setFieldsValue({
        title: getCampaignTitle(record, i18n.language),
        timeInterval: [dayjs(record.startTime), dayjs(record.endTime)],
        violationTypes: record.violationTypes,
        assignedInspectors: existingInspectors.map((inspectorId: string | number) => String(inspectorId)),
        campaignMessage: getCampaignMessage(record, i18n.language),
        status:
          normalizeStatus(record.status) && normalizeStatus(record.status) !== "draft"
            ? normalizeStatus(record.status)
            : undefined,
        createdBy: record.createdBy,
        boundaryGeoJson: record.boundaryGeoJson || "",
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        assignedInspectors: [],
        createdBy: "System User",
        boundaryGeoJson: "",
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
    setCurrentShape(null);
  };

  // Handler for boundary drawing completion
  const handleBoundaryDrawn = useCallback(
    (shape: any) => {
      console.log("Shape drawn:", shape);
      setCurrentShape(shape);
      form.setFieldsValue({ boundaryGeoJson: JSON.stringify(shape) });
      message.success(t("messages.boundaryDrawn"));
    },
    [form, t],
  );

  // Handler for clearing boundary
  const handleClearBoundary = useCallback(() => {
    setCurrentShape(null);
    form.setFieldsValue({ boundaryGeoJson: "" });
    message.info(t("messages.boundaryCleared"));
  }, [form, t]);

  const mapCenter = getShapeCenter(currentShape) || getCampaignLocationCenter(selectedRecord?.location);
  const [mapLat, mapLng] = mapCenter;

  const handleFooterSave = async (draft: boolean) => {
    const canSave = modalMode === "add" ? canCreate(menuName) : canEdit(menuName);
    if (!canSave) return;

    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        startTime: values.timeInterval[0].toISOString(),
        endTime: values.timeInterval[1].toISOString(),
        campaignMessage: values.campaignMessage,
        violationTypes: values.violationTypes,
        assignedInspectors: normalizeInspectorSelection(values.assignedInspectors),
        boundaryGeoJson: values.boundaryGeoJson,
        status: draft ? "" : modalMode === "add" ? "active" : values.status || "",
      };

      if (draft) {
        if (!payload.boundaryGeoJson) {
          message.error(t("validation.required", { field: t("form.polygon") }));
          return;
        }
        if (modalMode === "edit" && selectedRecord?.id) {
          await updateProactiveCampaign({ ...payload, id: selectedRecord.id }).unwrap();
        } else {
          await addProactiveCampaign(payload).unwrap();
        }
      } else {
        if (modalMode === "edit" && !payload.status) {
          message.error(t("validation.required", { field: t("form.status") }));
          return;
        }
        if (modalMode === "edit" && selectedRecord?.id) {
          await updateProactiveCampaign({ ...payload, id: selectedRecord.id }).unwrap();
        } else {
          await addProactiveCampaign(payload).unwrap();
        }
      }

      await refetch();
      message.success(
        t(modalMode === "add" ? "messages.addSuccess" : "messages.updateSuccess", {
          entity: t(proactiveCampaignsConfig.name.singular),
        }),
      );
      closeModal();
    } catch {
      message.error(t("messages.saveFailed", { defaultValue: "Unable to save campaign" }));
    }
  };

  // View record
  const handleView = (record: any) => {
    const boundaryShape = parseBoundaryGeometry(record?.boundaryGeoJson) || parseBoundaryGeometry(record?.polygon);
    setViewRecord({
      ...record,
      boundaryGeoJson: record?.boundaryGeoJson || record?.polygon || "",
      polygon: record?.polygon || "",
    });
    setViewBoundaryShape(boundaryShape);
    setIsViewOpen(true);
  };

  const enhancedTableConfig = useMemo(
    () => ({
      ...proactiveCampaignsConfig.tableConfig,
      columns: proactiveCampaignsConfig.tableConfig.columns.map((column) => {
        if (column.key === "title") {
          return { ...column, render: (_: any, record: any) => getCampaignTitle(record, i18n.language) };
        }

        if (column.key === "assignedInspectors") {
          return {
            ...column,
            render: (values: Array<string | number>) =>
              values && values.length > 0 ? (
                values.map((id) => <Tag key={String(id)}>{getLabel(id, "inspectors")}</Tag>)
              ) : (
                <Tag>{t("common.all", { defaultValue: "All" })}</Tag>
              ),
          };
        }

        if (column.key === "status") {
          return {
            ...column,
            filterable: true,
            render: (value: string) => {
              const normalized = normalizeStatus(value);

              const label = normalized
                ? t(`status.${normalized}`, {
                    defaultValue: normalized.charAt(0).toUpperCase() + normalized.slice(1),
                  })
                : t("common.draft", { defaultValue: "Draft" });

              const color =
                normalized === "active"
                  ? "green"
                  : normalized === "cancelled"
                    ? "red"
                    : normalized === "completed"
                      ? "blue"
                      : "orange"; // Draft (default)

              return <Tag color={color}>{label}</Tag>;
            },
            onFilter: (value: any, record: any) =>
              String(record.status ?? "").toLowerCase() === String(value ?? "").toLowerCase(),
          } as any;
        }

        if (column.key === "violationTypes") {
          return {
            ...column,
            filterable: true,
            render: (values: string | string[]) => {
              const items = Array.isArray(values) ? values : typeof values === "string" ? values.split(",").map((v) => v.trim()) : [];
              return items
                .map((v) => getLabel(v, "violationTypes"))
                .join(", ");
            },
            onFilter: (value: any, record: any) =>
              (Array.isArray(record.violationTypes) ? record.violationTypes : []).includes(value),
          };
        }

        return column;
      }),
    }),
    [getLabel, t],
  );

  const actionMenuItems = (record: any) => [
    {
      key: "view",
      label: t("common.view"),
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => openModal("edit", record),
      disabled: !canEdit(menuName),
    },
  ];

  const filterOptions = useMemo(
    () => ({
      status: (config.lookups?.statuses || []).map((status: any) => ({
        text: i18n.language === "ar" ? status.labelAr : status.labelEn,
        value: status.value,
      })),
      violationTypes: (config.lookups?.violationTypes || []).map((item: any) => ({
        text: i18n.language === "ar" ? item.labelAr : item.labelEn,
        value: item.value,
      })),
    }),
    [areaOptions, config.lookups?.statuses, config.lookups?.violationTypes, i18n.language],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={proactiveCampaignsConfig.statsConfig}
        data={campaigns}
        metadata={statsMetadata}
        loading={isLoadingCampaigns}
      />

      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Input
                addonBefore={searchAddon}
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                allowClear
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 450 }}
              />
              <span>{t("common.filterByStartTime", "Filter by Start Time")}</span>

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
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={isLoadingCampaigns || campaigns.length === 0}>
                {t("common.downloadCsv")}
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal("add")}
                disabled={!canCreate(menuName)}
              >
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>

        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          areaOptions={areaOptions as any}
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...proactiveCampaignsConfig, tableConfig: enhancedTableConfig }}
        data={campaigns}
        total={totalCount}
        isLoading={isLoadingCampaigns}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], selectedRowsList: any[]) => {
            setSelectedRowKeys(keys);
            setSelectedRows((prev: any[]) => {
              const getRecordKey = (item: any) => item?.id ?? item?.campaignGUID ?? item?.campaignId ?? item?.key;
              const remaining = prev.filter((p: any) => keys.includes(getRecordKey(p)));
              const newSelected = selectedRowsList.filter(
                (r: any) => !remaining.some((p: any) => getRecordKey(p) === getRecordKey(r)),
              );
              return [...remaining, ...newSelected];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize="small"
        state={state}
        lookupOptions={[]}
        getLabelFromValue={(value: number, options: any[], i18nValue: any) => {
          if (!options || options.length === 0) return String(value);
          const matched = options.find((item) => String(item.value) === String(value));
          if (!matched) return String(value);
          return i18nValue.language === "ar"
            ? matched.labelAr || matched.label || matched.text
            : matched.labelEn || matched.label || matched.text;
        }}
        filterOptions={filterOptions}
        showPagination
        rowKey={(record: any) => record?.id ?? record?.campaignGUID ?? record?.campaignId ?? record?.key}
        scrollX="max-content"
      />

      {/* Modal: Create / Edit Campaign */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", {
          entity: t(proactiveCampaignsConfig.name.singular),
        })}
        onCancel={closeModal}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
        width={proactiveCampaignsConfig.formConfig?.modalWidth || 900}
        footer={[
          <Button key="back" onClick={closeModal}>
            {t("common.cancel")}
          </Button>,
          <Button
            key="draft"
            htmlType="button"
            onClick={() => handleFooterSave(true)}
            disabled={modalMode === "add" ? !canCreate(menuName) : !canEdit(menuName) || !isDraftMode}
            loading={isAddingCampaign || isUpdatingCampaign}
          >
            {t("common.saveAsDraft", { defaultValue: "Save as Draft" })}
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleFooterSave(false)}
            disabled={modalMode === "add" ? !canCreate(menuName) : !canEdit(menuName) || isDraftMode}
            loading={isAddingCampaign || isUpdatingCampaign}
          >
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="boundaryGeoJson" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label={t("form.title")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.title", { defaultValue: "Enter Title" })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timeInterval" label={t("form.timeInterval")} rules={[{ required: true }]}>
                <RangePicker
                  showTime={{ format: "hh:mm A" }}
                  format="DD MMM YYYY hh:mm A"
                  style={{ width: "100%" }}
                  placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="violationTypes" label={t("form.violationTypes")} rules={[{ required: true }]}>
                <Select mode="multiple" placeholder={t("placeholders.selectViolationTypes")}>
                  {getLookupOptions("violationTypes").map((v: any) => (
                    <Option key={v.value} value={v.value} label={i18n.language === "ar" ? v.labelAr : v.labelEn}>
                      {i18n.language === "ar" ? v.labelAr : v.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="assignedInspectors" label={t("form.assignedInspectors")}>
                <Select
                  mode="multiple"
                  placeholder={t("placeholders.selectInspector", { defaultValue: "Select inspectors" })}
                  allowClear
                  showSearch
                  loading={isLoadingInspectors}
                  optionFilterProp="label"
                >
                  {inspectorOptions.map((item) => (
                    <Option key={item.value} value={item.value} label={item.label}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {modalMode === "edit" && (
              <Col span={12}>
                <Form.Item name="status" label={t("form.status")} rules={[{ required: true }]}>
                  <Select placeholder={t("placeholders.selectStatus", { defaultValue: "Select status" })} allowClear>
                    <Option value="active">{t("status.active", { defaultValue: "Active" })}</Option>
                    <Option value="cancelled">{t("status.cancelled", { defaultValue: "Cancelled" })}</Option>
                    <Option value="completed">{t("status.completed", { defaultValue: "Completed" })}</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col span={24}>
              <Form.Item
                name="campaignMessage"
                label={t("form.campaignMessage", { defaultValue: "Campaign Message" })}
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={t("placeholders.campaignMessage", { defaultValue: "Enter campaign message" })}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Divider orientation="left">
                <EnvironmentOutlined /> {t("form.drawBoundary")}
              </Divider>

              <div style={{ position: "relative", border: "1px solid #eee", borderRadius: 4, overflow: "hidden" }}>
                <Tooltip title={t("common.clear") as string}>
                  <Button
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      zIndex: 5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    danger
                    shape="circle"
                    onClick={handleClearBoundary}
                    disabled={!currentShape}
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
                <ArcGISMap
                  inspectors={[]}
                  center={[mapLng, mapLat]}
                  zoom={currentShape ? 14 : 13}
                  height="400px"
                  clickable={false}
                  legendEnabled={false}
                  enableBoundaryDrawing={true}
                  onBoundaryDrawn={handleBoundaryDrawn}
                  boundaryShape={currentShape}
                  onClearBoundary={handleClearBoundary}
                  showBasemapToggle={false}
                />
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      <ProactiveCampaignViewDrawer
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewRecord(null);
          setViewBoundaryShape(null);
        }}
        record={viewRecord}
        boundaryShape={viewBoundaryShape}
        getLabel={getLabel}
      />
    </Space>
  );
};

export default ProactiveCampaignsPage;
