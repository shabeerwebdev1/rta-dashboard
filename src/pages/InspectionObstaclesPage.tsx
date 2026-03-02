/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  message,
} from "antd";
import { PlusOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
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
  useUploadInspectionFilesMutation,
} from "../services/rtkApiFactory";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import InspectionObstaclesViewDrawer from "../components/inspectionobstacle/InspectionObstaclesViewDrawer";
import { usePermission } from "../hooks/usePermission";

// ArcGISMap - make sure the file at this path supports onLocationPick, center, zoom, pickedLat/pickedLng
import ArcGISMap from "../components/common/ArcGISMap";
import { SorterResult } from "antd/es/table/interface";

const { Option } = Select;
const pageKey = "inspection-obstacles";

// Area coordinates data (used to zoom & validate)
const AREA_COORDINATES = [
  { area: "Bur dubai", lat: 25.2146, lng: 55.3033 },
  { area: "Business Bay", lat: 25.184242, lng: 55.27243 },
  { area: "Sheikh Zayed Road", lat: 25.216278, lng: 55.278774 },
  { area: "Al Quoz", lat: 25.1595803, lng: 55.2540203 },
  { area: "Al Jaddaf", lat: 25.2218696, lng: 55.3359246 },
  { area: "Emirates area", lat: 25.1021, lng: 55.2314 },
  { area: "Dubai Metro", lat: 25.1783, lng: 55.3567 },
  { area: "MBZ CITY", lat: 25.0458, lng: 55.2912 },
  { area: "City Centre Hyper Market", lat: 25.2674, lng: 55.4129 },
  { area: "Jumeirah Park", lat: 25.0423, lng: 55.1669 },
  { area: "Jabel Ali", lat: 24.986503, lng: 55.09052 },
  { area: "Emaar South", lat: 24.9577, lng: 55.1299 },
  { area: "Emaar North", lat: 25.2891, lng: 55.3433 },
  { area: "Deira", lat: 25.266666, lng: 55.316666 },
  { area: "Naakhil", lat: 25.1734, lng: 55.4032 },
];

const ONE_KM = 1000; // 1 km radius validation (you selected option B)

// Helper function to get label from value based on current language
const getLabelFromValue = (value: number | string, options: any[], i18n: any) => {
  const option = options.find((opt) => opt.value.toString() === value.toString());
  if (!option) return value;
  return i18n.language === "ar" ? option.labelAr : option.labelEn;
};

// Helper function to filter options by category
const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return (options || []).filter((option) => option.categoryId === categoryId);
};

// Haversine distance (meters)
const getDistanceInMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3; // metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
  const [tableSize] = useState<"middle" | "small">("small");
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

  // state to maintain the rows data for downloading
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Map related states
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.2743, 25.1972]); // [lng, lat]
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [areaCenter, setAreaCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [pickedLatitude, setPickedLatitude] = useState<number | null>(null);
  const [pickedLongitude, setPickedLongitude] = useState<number | null>(null);

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

  // Zone options from zones API - using GUID as value
  const zoneOptions = useMemo(() => {
    if (!zonesData) return [];

    return zonesData.map((zone: any) => ({
      value: zone.zone_Id || zone.zoneId, // Use GUID from API
      numericId: zone.zoneId, // Keep numeric ID for filtering
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

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleModalOpen = () => {
    // Reset map and picked coords when opening modal
    setPickedLatitude(null);
    setPickedLongitude(null);
    setAreaCenter(null);
    setMapCenter([55.2743, 25.1972]);
    setMapZoom(12);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
    setPickedLatitude(null);
    setPickedLongitude(null);
    setAreaCenter(null);
    setMapCenter([55.2743, 25.1972]);
    setMapZoom(12);
  };

  // Update the zone onChange handler to filter areas and enable the field
  const handleZoneChange = (zoneId: number) => {
    form.setFieldsValue({ Area: undefined, Latitude: undefined, Longitude: undefined });
    setPickedLatitude(null);
    setPickedLongitude(null);
    setAreaCenter(null);

    const filteredAreas =
      allAreasData
        ?.filter((area: any) => area.zone_Id === zoneId)
        .map((area: any) => ({
          label: area.area,
          value: area.area_Id,
          zoneId: area.zone_Id,
          original: area,
        })) || [];

    setFilteredAreaOptions(filteredAreas);
  };

  // When area changes: set areaCenter, map center and zoom; clear picked coords
  const handleAreaChange = (areaId: number) => {
    const selectedArea = allAreasData?.find((a: any) => a.area_Id === areaId);
    if (!selectedArea) {
      setAreaCenter(null);
      setMapCenter([55.2743, 25.1972]);
      setMapZoom(12);
      return;
    }

    const name = selectedArea.area;
    const areaInfo = AREA_COORDINATES.find((ac) => ac.area.toLowerCase() === name.toLowerCase());

    if (areaInfo) {
      setAreaCenter({ lat: areaInfo.lat, lng: areaInfo.lng });
      setMapCenter([areaInfo.lng, areaInfo.lat]);
      setMapZoom(15);
    } else {
      // fallback center
      setAreaCenter(null);
      setMapCenter([55.2743, 25.1972]);
      setMapZoom(12);
    }

    // Clear previously picked coordinates
    setPickedLatitude(null);
    setPickedLongitude(null);
    form.setFieldsValue({ Latitude: undefined, Longitude: undefined });
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
        latitude: pickedLatitude, // Add this
        longitude: pickedLongitude,
        // NOTE: lat/long are gathered in the form but not sent to backend yet (per requirement).
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
            formData.append("EntityCode", "parking-obstacle");
            formData.append("FilePath", "/uploads/temp");
            formData.append("Description", "Uploaded via inspection obstacle form");

            // Send API request for this file
            await uploadInspectionFiles(formData).unwrap();
          }
        }
      }

      notification.success({
        data: {
          en_Msg: t("messages.obstacleSuccessEn"),
          ar_Msg: t("messages.obstacleSuccessAr"),
        },
      });
      handleModalClose();
    } catch (err) {
      console.error("Failed to save inspection obstacle:", err);
      notification.error({
        data: {
          en_Msg: t("messages.obstacleErrorEn"),
          ar_Msg: t("messages.obstacleErrorAr"),
        },
      });
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
    const shareUrl = window.location.href;

    // Check for clipboard API support and secure context
    if (navigator?.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          notification.success(
            {
              data: {
                en_Msg: t("messages.shareSuccessEn"),
                ar_Msg: t("messages.shareSuccessEn"),
              },
            },
            t("messages.shareSuccessTitle"),
          );
        })
        .catch(() => {
          notification.error(
            {
              data: {
                en_Msg: t("messages.shareErrorEn"),
                ar_Msg: t("messages.shareErrorEn"),
              },
            },
            t("messages.shareErrorTitle"),
          );
        });
    } else {
      // Fallback: Use execCommand (works in most browsers)
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed"; // prevent scroll jump
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        notification.success(
          {
            data: {
              en_Msg: t("messages.shareSuccessEn"),
              ar_Msg: t("messages.shareSuccessEn"),
            },
          },
          t("messages.shareSuccessTitle"),
        );
      } catch {
        notification.error(
          {
            data: {
              en_Msg: t("messages.shareErrorEn"),
              ar_Msg: t("messages.shareErrorEn"),
            },
          },
          t("messages.shareErrorTitle"),
        );
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Transform data for CSV export with proper column headers
  const transformDataForCSV = (data: any[]) => {
    return data.map((item, index: number) => {
      const csvRecord: Record<string, unknown> = {};

      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;

      config.tableConfig.columns.forEach((column) => {
        if (column.key === "zone") {
          const zoneOption = zoneOptions.find((opt) => opt.value.toString() === item.zone.toString());
          csvRecord[t("form.zone")] = zoneOption ? zoneOption.label : item.zone;
        } else if (column.key === "area") {
          csvRecord[t("form.area")] = areaIdToNameMap.get(item.area) || item.area;
        } else if (column.key === "sourceOfObstacle") {
          const sourceOption = sourceOptions.find((opt) => opt.value.toString() === item.sourceOfObstacle.toString());
          csvRecord[t("form.sourceOfObstacle")] = sourceOption ? sourceOption.label : item.sourceOfObstacle;
        } else if (column.key === "closestPaymentDevice") {
          csvRecord[t("form.closestPD")] = item.closestPaymentDevice || "";
        } else if (column.key === "comments") {
          csvRecord[t("form.comments")] = item.comments || "";
        } else if (column.key === "status") {
          csvRecord[t("form.status")] = statusLabels[item.status] || item.status;
        } else if (column.key === "createdDate") {
          csvRecord[t("form.createdDate")] = item.createdDate ? dayjs(item.createdDate).format("DD MMM YYYY") : "";
        }
      });

      return csvRecord;
    });
  };

  // Get CSV filename based on current language
  const getCsvFilename = () => {
    if (i18n.language === "ar") {
      return `معوقات_التفتيش.csv`;
    } else {
      return `Inspection_Obstacles.csv`;
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

          // Transform the data to match UI display with proper headers
          const transformedData = transformDataForCSV(selectedRows);

          // Get filename based on current language
          const filename = getCsvFilename();

          // Export to CSV
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
    { key: "view", label: t("common.view"), icon: <EditOutlined />, onClick: () => handleView(record) },
  ];

  // Filter area options based on selected zone
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

  // Enhanced custom label function for zones and areas
  const getCustomLabelFromValue = (value: number | string, options: any[], i18nInstance: any) => {
    // Handle Zone
    const zone = zoneOptions.find((z) => z.value?.toString() === value.toString());
    if (zone) return zone.label;

    // Handle Area
    const area = areaOptions.find((a) => a.value?.toString() === value.toString());
    if (area) return area.label;

    // Handle Area from map
    const areaName = areaIdToNameMap.get(Number(value));
    if (areaName) return areaName;

    // Fallback to original lookup
    return getLabelFromValue(value, options, i18nInstance);
  };

  const platesData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : data.totalCount || 0;
  }, [data]);

  const metadata = useMemo(() => {
    if (!data || Array.isArray(data)) return {};
    return {
      totalRecords: data.totalRecords,
    };
  }, [data]);

  // Map location pick handler (called by ArcGISMap when user clicks)
  const onMapLocationPick = (lat: number, lng: number) => {
    console.log("Map clicked at:", lat, lng);

    // ❗ VALIDATION 1 — Area must be selected
    if (!areaCenter) {
      notification.error(
        {
          data: {
            en_Msg: "Please select an area first",
            ar_Msg: "يرجى اختيار المنطقة أولاً",
          },
        },
        "Validation Error",
      );

      setPickedLatitude(null);
      setPickedLongitude(null);
      form.setFieldsValue({ Latitude: undefined, Longitude: undefined });
      return;
    }

    // ❗ VALIDATION 2 — Must be within 1 km
    const distance = getDistanceInMeters(areaCenter.lat, areaCenter.lng, lat, lng);
    console.log("Distance:", distance);

    if (distance > ONE_KM) {
      notification.error(
        {
          data: {
            en_Msg: "Please select a point within the selected area (within 1 km).",
            ar_Msg: "يرجى اختيار نقطة داخل المنطقة المختارة (في حدود 1 كم).",
          },
        },
        "Invalid Location",
      );

      setPickedLatitude(null);
      setPickedLongitude(null);
      form.setFieldsValue({ Latitude: undefined, Longitude: undefined });
      return;
    }

    // ✅ VALID PICK — Save it
    const formattedLat = parseFloat(lat.toFixed(6));
    const formattedLng = parseFloat(lng.toFixed(6));

    setPickedLatitude(formattedLat);
    setPickedLongitude(formattedLng);

    form.setFieldsValue({
      Latitude: formattedLat,
      Longitude: formattedLng,
    });

    // SUCCESS NOTIFICATION
    notification.success(
      {
        data: {
          en_Msg: `Location picked successfully`,
          ar_Msg: `تم اختيار الموقع بنجاح`,
        },
      },
      "Location Picked",
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={platesData} metadata={metadata} loading={isLoading} />
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
              <span>{t("common.filterBycreatedDate")}</span>

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

              <Button type="primary" icon={<PlusOutlined />} onClick={handleModalOpen} disabled={!canCreate(menuName)}>
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
          zoneOptions={zoneOptions}
          areaOptions={areaOptions}
          areaIdToNameMap={areaIdToNameMap}
        />
      </Card>

      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={platesData}
        total={totalCount}
        isLoading={isLoading || isFetching || isLoadingAllAreas}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[], selectedRowsParam: any[]) => {
            setSelectedRowKeys(keys);

            setSelectedRows((prev) => {
              // Remove rows that are no longer selected
              const remaining = prev.filter((p) => keys.includes(p.id));

              // Add newly selected rows (avoid duplicates)
              const newSelected = selectedRowsParam.filter((r) => !remaining.some((p) => p.id === r.id));

              return [...remaining, ...newSelected];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        rowKey="iid"
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
        style={{ top: 20 }}
        title={t("page.addTitle", { entity: t(config.name.singular) })}
        onCancel={handleModalClose}
        width="750px"
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
              {/* ZONE */}
              <Col span={12}>
                <Form.Item
                  name="Zone"
                  label={t("form.zone")}
                  rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.zone") }) }]}
                >
                  <Select
                    placeholder={t("placeholders.zone")}
                    loading={isLoadingZones}
                    options={zoneOptions.map((opt) => ({ label: opt.label, value: opt.value }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                    onChange={handleZoneChange}
                  />
                </Form.Item>
              </Col>

              {/* AREA */}
              <Col span={12}>
                <Form.Item
                  name="Area"
                  label={t("form.area")}
                  rules={[{ required: true, message: t("validation.selectRequired", { field: t("form.area") }) }]}
                >
                  <Select
                    placeholder={t("placeholders.area")}
                    loading={isLoadingAllAreas}
                    options={filteredAreaOptions}
                    showSearch
                    disabled={!form.getFieldValue("Zone")}
                    onChange={(val) => handleAreaChange(val as number)}
                  />
                </Form.Item>
              </Col>

              {/* MAP SECTION */}
              <Col span={24}>
                <Form.Item label={t("form.pickLocationOnMap")}>
                  <div
                    style={{
                      width: "100%",
                      height: "260px",
                      borderRadius: 10,
                      border: "1px solid #e5e5e5",
                      overflow: "hidden",
                      marginBottom: 10,
                    }}
                  >
                    <ArcGISMap
                      inspectors={[]}
                      center={mapCenter}
                      zoom={mapZoom}
                      height="260px"
                      clickable={true}
                      onLocationPick={onMapLocationPick}
                      pickedLat={pickedLatitude}
                      pickedLng={pickedLongitude}
                      showPath={false}
                      showFineLocations={false}
                    />
                  </div>
                </Form.Item>
              </Col>

              {/* LAT / LNG */}
              <Col span={12}>
                <Form.Item
                  name="Latitude"
                  label={t("form.latitude")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.latitude") }) }]}
                >
                  <Input readOnly placeholder={t("placeholders.latitude")} value={pickedLatitude ?? ""} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="Longitude"
                  label={t("form.longitude")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.longitude") }) }]}
                >
                  <Input readOnly placeholder={t("placeholders.longitude")} value={pickedLongitude ?? ""} />
                </Form.Item>
              </Col>

              {/* SOURCE */}
              <Col span={12}>
                <Form.Item
                  name="SourceOfObstacle"
                  label={t("form.sourceOfObstacle")}
                  rules={[
                    { required: true, message: t("validation.selectRequired", { field: t("form.sourceOfObstacle") }) },
                  ]}
                >
                  <Select placeholder={t("placeholders.sourceOfObstacle")} options={sourceOptions} showSearch />
                </Form.Item>
              </Col>

              {/* CLOSEST PD */}
              <Col span={12}>
                <Form.Item
                  name="ClosestPaymentDevice"
                  label={t("form.closestPD")}
                  rules={[{ required: true, message: t("validation.required", { field: t("form.closestPD") }) }]}
                >
                  <Input placeholder={t("placeholders.closestPaymentDevice")} maxLength={20} />
                </Form.Item>
              </Col>

              {/* PHOTO */}
              <Col span={24}>
                <Form.Item
                  name="Photo"
                  label={t("form.photo")}
                  rules={[{ required: true, message: t("validation.uploadRequired", { field: t("form.photo") }) }]}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload
                    listType="picture-card"
                    beforeUpload={() => false}
                    multiple
                    accept=".jpg,.jpeg,.png"
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

              {/* COMMENTS */}
              <Col span={24}>
                <Form.Item name="Comments" label={t("form.comments")}>
                  <Input.TextArea placeholder={t("placeholders.comments")} rows={2} />
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
            // This will trigger a refetch of the data if drawer triggers it
          }}
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
