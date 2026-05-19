// HRMSPage.tsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Spin, Tag } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetActiveShiftsQuery,
  useGetHRMSAttendanceQuery,
  useGetHRMSTrackingQuery,
  useGetInspectionObstaclesQuery,
  useGetTowingDetailsQuery,
  useGetInspectionsQuery,
} from "../services/rtkApiFactory";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import DataTableWrapper from "../components/common/DataTableWrapper";
import HRMSViewDrawer from "../components/hrms/HRMSViewDrawer";
import { formatDateDisplay, formatDateTimeDisplay } from "../utils/dateFormatter";
import { hrmsConfig } from "../config/pageConfigs/hrmsConfig";

const { Option } = Select;

const ZERO_DATE = "0001-01-01T00:00:00";
const ZERO_GUID = "00000000-0000-0000-0000-000000000000";

const INSPECTION_CATEGORY = {
  FINE: 13001,
  WARNING: 13002,
  ROUTINE: 13003,
} as const;

const normalizeDateValue = (value?: string | null) => {
  if (!value || value === ZERO_DATE) return null;
  return dayjs(value).isValid() ? value : null;
};

const parseCoordinate = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValidCoordinates = (lat: number | null, lng: number | null) =>
  lat !== null && lng !== null && !(lat === 0 && lng === 0);

const buildAttendanceStatus = (checkIn?: string | null, checkOut?: string | null) => {
  if (checkOut) return "Checked Out";
  if (checkIn) return "Checked In";
  return "Pending";
};

const getRecordDate = (...dates: Array<string | null | undefined>) => {
  const validDate = dates.find((value) => value && dayjs(value).isValid());
  return validDate || null;
};

const normalizeGuid = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase();

const buildPrimaryLocation = (record: any) => {
  const checkOutLat = parseCoordinate(record.checkOut_Lat);
  const checkOutLng = parseCoordinate(record.checkOut_Lng);
  if (hasValidCoordinates(checkOutLat, checkOutLng)) {
    return { lat: checkOutLat as number, lng: checkOutLng as number };
  }
  const checkInLat = parseCoordinate(record.checkIn_Lat);
  const checkInLng = parseCoordinate(record.checkIn_Lng);
  if (hasValidCoordinates(checkInLat, checkInLng)) {
    return { lat: checkInLat as number, lng: checkInLng as number };
  }
  return null;
};

const getAttendancePayload = (item: any) =>
  item?.attendance && typeof item.attendance === "object" ? item.attendance : item;

const normalizeAttendanceRecord = (item: any, inspectorNameMap: Map<string, string>) => {
  const attendance = getAttendancePayload(item);
  const checkIn = normalizeDateValue(attendance.checkIn);
  const checkOut = normalizeDateValue(attendance.checkOut);
  const addOn = normalizeDateValue(attendance.addOn) || attendance.addOn || null;
  const assignmentDate = normalizeDateValue(attendance.assignmentDate) || attendance.assignmentDate || null;
  const primaryLocation = buildPrimaryLocation(attendance);
  const recordDate = getRecordDate(checkIn, assignmentDate, addOn, checkOut);
  const inspectorGuid = attendance.inspectorGUID || attendance.inspectorGuid || item.inspectorGUID || ZERO_GUID;
  const attendanceId = attendance.attendance_Id || attendance.attendanceId || item.attendance_Id || item.attendanceId;
  const assignmentId = Number(attendance.assignment_id ?? attendance.assignmentId ?? 0);
  const zoneLabel =
    attendance.zoneName ||
    item.zoneName ||
    attendance.areaName ||
    item.areaName ||
    (assignmentId ? `Assignment ${assignmentId}` : "N/A");
  const inspectorName =
    item.inspectorName ||
    attendance.inspectorName ||
    inspectorNameMap.get(normalizeGuid(inspectorGuid)) ||
    (inspectorGuid !== ZERO_GUID ? inspectorGuid : "-");
  const supervisorName =
    item.supervisorName ||
    attendance.supervisorName ||
    attendance.supervisorNameEn ||
    attendance.supervisorNameAr ||
    "-";

  return {
    ...item,
    ...attendance,
    id: attendanceId || `${inspectorGuid}-${recordDate || attendance.addOn || "row"}`,
    attendance_Id: attendanceId || "-",
    inspectorGUID: inspectorGuid,
    inspectorId: attendance.inspectorId || inspectorGuid || "-",
    inspectorGuid,
    inspectorName,
    inspectorNameEn: inspectorName,
    inspectorNameAr: item.inspectorNameAr || attendance.inspectorNameAr || "",
    supervisorName,
    devices_id: Number(attendance.devices_id ?? attendance.devicesId ?? 0),
    assignment_id: assignmentId,
    checkIn,
    checkOut,
    addOn,
    assignmentDate,
    date: recordDate || addOn,
    recordDate,
    checkInTime: checkIn,
    checkOutTime: checkOut,
    status: buildAttendanceStatus(checkIn, checkOut),
    email: attendance.email || attendance.emailId || item.email || item.emailId || "",
    mobile: attendance.mobile || attendance.mobileNo || item.mobile || item.mobileNo || "",
    shift: attendance.shift || attendance.shiftName || item.shift || item.shiftName || "",
    location: primaryLocation ? { ...primaryLocation, zone: zoneLabel } : null,
    obstacleLocations: [],
    inspectorPath: [],
    trackingPoints: 0,
    obstacles: 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ KEY CHANGE: spread ...item FIRST so every raw API field is preserved.
//    ArcGISMap stores this whole object in graphic.attributes.fine
//    FinesViewDrawer reads inspectionGUID, entityCode, latitude, longitude,
//    tradeLicenseNumber, inspectionType, inspectionStatus etc. directly from it.
// ─────────────────────────────────────────────────────────────────────────────
const normalizeInspectionLocation = (item: any) => {
  const lat = parseCoordinate(item.latitude ?? item.entityLatitude);
  const lng = parseCoordinate(item.longitude ?? item.entityLongitude);
  if (!hasValidCoordinates(lat, lng)) return null;

  return {
    // 1. All raw API fields first (inspectionGUID, entityCode, latitude as string,
    //    longitude as string, tradeLicenseNumber, inspectionType, inspectionStatus,
    //    inspectionCategory, plateNumber, vehicleBrand, vehicleColor, etc.)
    ...item,
    // 2. Normalized number aliases used by ArcGISMap for rendering
    id: item.inspectionGUID || item.entityNo,
    lat: lat as number,
    lng: lng as number,
    // 3. Display helpers used in the popup tooltip
    timestamp: item.entityDateTime || item.actualDateTime,
    plateNumber: item.plateNumber,
    fineAmount: item.fineAmount,
    inspectionCategory: item.inspectionCategory,
  };
};

const HRMSPage: React.FC = () => {
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

  const apiParams = useMemo(() => {
    const { orFilters, ...rest } = rawApiParams as Record<string, any>;
    const normalizedParams: Record<string, any> = {
      PageNumber: rawApiParams.PageNumber || 1,
      PageSize: rawApiParams.PageSize || 10,
      ...rest,
    };
    if (orFilters && typeof orFilters === "object") {
      const { status: _statusFilter, ...serverOrFilters } = orFilters;
      if (Object.keys(serverOrFilters).length > 0) {
        normalizedParams.orFilters = serverOrFilters;
      }
    }
    return normalizedParams;
  }, [rawApiParams]);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [obstacleParams, setObstacleParams] = useState<Record<string, any> | null>(null);
  const [towingParams, setTowingParams] = useState<Record<string, any> | null>(null);
  const [trackingParams, setTrackingParams] = useState<{ inspectorGuid: string; trackedDtTm: string } | null>(null);
  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [inspectionDateParams, setInspectionDateParams] = useState<Record<string, any> | null>(null);

  const {
    data: attendanceResponse,
    isLoading,
    isFetching,
  } = useGetHRMSAttendanceQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const { currentData: towingResponse } = useGetTowingDetailsQuery(towingParams, {
    skip: !towingParams,
    refetchOnMountOrArgChange: true,
  });
  const { data: activeShiftsData } = useGetActiveShiftsQuery();
  const { currentData: obstacleResponse } = useGetInspectionObstaclesQuery(obstacleParams, {
    skip: !obstacleParams,
    refetchOnMountOrArgChange: true,
  });
  const { currentData: trackingResponse } = useGetHRMSTrackingQuery(trackingParams, {
    skip: !trackingParams,
    refetchOnMountOrArgChange: true,
  });

  const { currentData: fineInspectionResponse } = useGetInspectionsQuery(
    inspectionDateParams
      ? {
          ...inspectionDateParams,
          "orFilters[inspectionCategory]": INSPECTION_CATEGORY.FINE,
          PageNumber: 1,
          PageSize: 500,
        }
      : null,
    { skip: !inspectionDateParams, refetchOnMountOrArgChange: true },
  );
  const { currentData: warningInspectionResponse } = useGetInspectionsQuery(
    inspectionDateParams
      ? {
          ...inspectionDateParams,
          "orFilters[inspectionCategory]": INSPECTION_CATEGORY.WARNING,
          PageNumber: 1,
          PageSize: 500,
        }
      : null,
    { skip: !inspectionDateParams, refetchOnMountOrArgChange: true },
  );
  const { currentData: routineInspectionResponse } = useGetInspectionsQuery(
    inspectionDateParams
      ? {
          ...inspectionDateParams,
          "orFilters[inspectionCategory]": INSPECTION_CATEGORY.ROUTINE,
          PageNumber: 1,
          PageSize: 500,
        }
      : null,
    { skip: !inspectionDateParams, refetchOnMountOrArgChange: true },
  );

  const isAddingAttendance = false;
  const isLoadingLookups = false;

  const supervisorsData = [
    { id: 1, name: "Mohammed Ali", nameAr: "محمد علي" },
    { id: 2, name: "Sara Ahmed", nameAr: "سارة أحمد" },
    { id: 3, name: "Khalid Hassan", nameAr: "خالد حسن" },
  ];

  const supervisorOptions = useMemo(
    () =>
      supervisorsData.map((s) => ({
        value: s.id,
        label: i18n.language === "ar" ? s.nameAr : s.name,
      })),
    [i18n.language],
  );

  const inspectorNameMap = useMemo(() => {
    const shifts = Array.isArray(activeShiftsData) ? activeShiftsData : activeShiftsData?.data || [];
    const nameMap = new Map<string, string>();
    shifts.forEach((shift: any) => {
      const guid = normalizeGuid(shift.employeeId);
      if (guid) nameMap.set(guid, shift.employeeName || shift.employeeNameAr || shift.employeeId);
    });
    return nameMap;
  }, [activeShiftsData]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);
  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue]);

  useEffect(() => {
    if (!obstacleResponse) return;
    const obstacleLocations =
      obstacleResponse.data
        ?.map((item: any) => {
          const lat = parseCoordinate(item.latitude);
          const lng = parseCoordinate(item.longitude);
          if (!hasValidCoordinates(lat, lng)) return null;
          return {
            id: item.inspectionGUID || item.id || `${item.createdDateTime}-${lat}-${lng}`,
            lat: lat as number,
            lng: lng as number,
            createdDateTime: item.createdDateTime,
          };
        })
        .filter(Boolean) || [];
    setViewRecord((prev: any) =>
      prev ? { ...prev, obstacleLocations, obstacles: obstacleResponse.totalCount || obstacleLocations.length } : prev,
    );
  }, [obstacleResponse]);

  useEffect(() => {
    if (!trackingResponse) return;
    const trackingData = Array.isArray(trackingResponse) ? trackingResponse : trackingResponse?.data || [];
    const trackingMeta = trackingData[0];
    const inspectorPath = [...trackingData]
      .map((item: any) => {
        const lat = parseCoordinate(item.arcGis_Lat ?? item.geo_Lat);
        const lng = parseCoordinate(item.arcGis_Lng ?? item.geo_Lng);
        if (!hasValidCoordinates(lat, lng) || !item.trackedDtTm || !dayjs(item.trackedDtTm).isValid()) return null;
        return {
          lat: lat as number,
          lng: lng as number,
          timestamp: formatDateTimeDisplay(item.trackedDtTm, i18n.language),
          trackedDtTm: item.trackedDtTm,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => dayjs(a.trackedDtTm).valueOf() - dayjs(b.trackedDtTm).valueOf())
      .map(({ trackedDtTm, ...pathPoint }: any) => pathPoint);

    setViewRecord((prev: any) => {
      if (!prev) return prev;
      const lastTrackingPoint = inspectorPath[inspectorPath.length - 1];
      return {
        ...prev,
        inspectorName: trackingMeta?.inspectorName || prev.inspectorName,
        inspectorGuid: trackingMeta?.inspectorGuid || prev.inspectorGuid,
        displayNameAr: trackingMeta?.displayNameAr || prev.displayNameAr,
        empNumber: trackingMeta?.empNumber || prev.empNumber,

        email: trackingMeta?.emailId || prev.email,
        mobile: trackingMeta?.mobileNo || prev.mobile,
        attendanceId: trackingMeta?.attendanceId || prev.attendanceId,
        shiftId: trackingMeta?.shiftId || prev.shiftId,
        isOff: trackingMeta?.isOff ?? prev.isOff,
        assignmentDate: trackingMeta?.assignmentDate || prev.assignmentDate,
        zoneName: trackingMeta?.zoneName || prev.zoneName,
        areaName: trackingMeta?.areaName || prev.areaName,
        checkIn: prev.checkIn || normalizeDateValue(trackingMeta?.checkIn),
        checkOut: prev.checkOut || normalizeDateValue(trackingMeta?.checkOut),
        checkInTime: prev.checkInTime || normalizeDateValue(trackingMeta?.checkIn),
        checkOutTime: prev.checkOutTime || normalizeDateValue(trackingMeta?.checkOut),
        inspectorPath,
        trackingPoints: inspectorPath.length,
        location: lastTrackingPoint
          ? {
              lat: lastTrackingPoint.lat,
              lng: lastTrackingPoint.lng,
              zone:
                [trackingMeta?.zoneName, trackingMeta?.areaName].filter(Boolean).join(" - ") ||
                prev.location?.zone ||
                (prev.assignment_id ? `Assignment ${prev.assignment_id}` : "N/A"),
            }
          : prev.location,
      };
    });
  }, [trackingResponse, i18n.language]);

  useEffect(() => {
    if (!towingResponse) return;
    const towingLocations =
      towingResponse.data
        ?.map((item: any) => {
          const lat = parseCoordinate(item.latitude);
          const lng = parseCoordinate(item.longitude);
          if (!hasValidCoordinates(lat, lng)) return null;
          return {
            id: item.inspectionGUID || item.iid,
            lat: lat as number,
            lng: lng as number,
            timestamp: item.createdDateTime,
            plateNumber: item.plateNumber,
            towingStatus: item.towing_Status,
          };
        })
        .filter(Boolean) || [];
    setViewRecord((prev: any) =>
      prev ? { ...prev, towingLocations, towingRequests: towingResponse.total || towingLocations.length } : prev,
    );
  }, [towingResponse]);

  // ─── Change 1: Split fines into vehicle fines and parking fines ─────────────
  useEffect(() => {
    if (!fineInspectionResponse) return;

    const allLocations = (fineInspectionResponse.data || []).map(normalizeInspectionLocation).filter(Boolean);

    // Split by inspectionType
    const vehicleFineLocations = allLocations.filter((loc: any) => {
      const type = Number(loc.inspectionType);
      return type === 14001 || type === 14002 || type === 14003;
    });

    const parkingFineLocations = allLocations.filter((loc: any) => {
      const type = Number(loc.inspectionType);
      return type === 14004 || type === 14005;
    });

    setViewRecord((prev: any) =>
      prev
        ? {
            ...prev,
            fineLocations: vehicleFineLocations,
            vehicleFinesIssued: vehicleFineLocations.length,
            parkingFineLocations: parkingFineLocations,
            parkingFinesIssued: parkingFineLocations.length,
            totalFinesIssued: allLocations.length,
          }
        : prev,
    );
  }, [fineInspectionResponse]);

  useEffect(() => {
    if (!warningInspectionResponse) return;
    const warningLocations = (warningInspectionResponse.data || []).map(normalizeInspectionLocation).filter(Boolean);
    setViewRecord((prev: any) =>
      prev
        ? {
            ...prev,
            warningLocations,
            warningInspections: warningInspectionResponse.totalCount || warningLocations.length,
          }
        : prev,
    );
  }, [warningInspectionResponse]);

  useEffect(() => {
    if (!routineInspectionResponse) return;
    const routineLocations = (routineInspectionResponse.data || []).map(normalizeInspectionLocation).filter(Boolean);
    setViewRecord((prev: any) =>
      prev
        ? {
            ...prev,
            routineLocations,
            routineInspections: routineInspectionResponse.totalCount || routineLocations.length,
            totalInspections:
              (fineInspectionResponse?.totalCount || 0) +
              (warningInspectionResponse?.totalCount || 0) +
              (routineInspectionResponse?.totalCount || routineLocations.length),
          }
        : prev,
    );
  }, [routineInspectionResponse]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };
  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    try {
      notification.success({
        data: { en_Msg: `Attendance draft created for ${values.InspectorName}`, ar_Msg: "تم إنشاء مسودة الحضور بنجاح" },
      });
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const statusLabels = useMemo(
    () => ({
      "Checked In": t("status.checkedIn", { defaultValue: "Checked In" }),
      "Checked Out": t("status.checkedOut", { defaultValue: "Checked Out" }),
      Pending: t("status.pending", { defaultValue: "Pending" }),
    }),
    [t],
  );

  const handleView = (record: any) => {
    const recordDate = record.recordDate && dayjs(record.recordDate).isValid() ? dayjs(record.recordDate) : null;
    const selectedDate = recordDate ? recordDate.format("YYYY-MM-DD") : null;
    const trackedDtTm = selectedDate;

    setViewRecord({
      ...record,
      obstacleLocations: [],
      towingLocations: [],
      fineLocations: [],
      parkingFineLocations: [],
      warningLocations: [],
      routineLocations: [],
      inspectorPath: [],
      trackingPoints: 0,
      obstacles: 0,
      towingRequests: 0,
      vehicleFinesIssued: 0,
      parkingFinesIssued: 0,
      totalFinesIssued: 0,
      warningInspections: 0,
      routineInspections: 0,
      totalInspections: 0,
      trackingQueryDate: trackedDtTm,
    });

    setObstacleParams(
      selectedDate
        ? {
            PageNumber: 1,
            PageSize: 100,
            "betweens[createdDateTime][From]": selectedDate,
            "betweens[createdDateTime][To]": selectedDate,
            "orFilters[inspectorGUID]": record.inspectorGUID || "",
          }
        : null,
    );
    setTowingParams(
      selectedDate
        ? {
            PageNumber: 1,
            PageSize: 100,
            "betweens[createdDateTime][From]": selectedDate,
            "betweens[createdDateTime][To]": selectedDate,
            "orFilters[inspectorGUID]": record.inspectorGUID || "",
          }
        : null,
    );
    setTrackingParams(
      record.inspectorGUID && record.inspectorGUID !== ZERO_GUID && trackedDtTm
        ? { inspectorGuid: record.inspectorGUID, trackedDtTm }
        : null,
    );
    setInspectionDateParams(
      selectedDate
        ? {
            "betweens[entityDateTime][From]": selectedDate,
            "betweens[entityDateTime][To]": selectedDate,
            "orFilters[inspectorGUID]": record.inspectorGUID || "",
          }
        : null,
    );
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setViewRecord(null);
    setObstacleParams(null);
    setTowingParams(null);
    setTrackingParams(null);
    setInspectionDateParams(null);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator?.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() =>
          notification.success(
            { data: { en_Msg: "Link copied to clipboard", ar_Msg: "تم نسخ الرابط" } },
            "Share Success",
          ),
        )
        .catch(() =>
          notification.error({ data: { en_Msg: "Failed to copy link", ar_Msg: "فشل نسخ الرابط" } }, "Share Failed"),
        );
    }
  };

  const transformDataForCSV = (data: any[]) =>
    data.map((item, index: number) => {
      const csvRecord: Record<string, any> = {};
      csvRecord[i18n.language === "ar" ? "التسلسل" : "Sl.No"] = index + 1;
      config.tableConfig.columns.forEach((column) => {
        if (column.key === "date")
          csvRecord[t("form.date") || "Date"] = item.date ? formatDateDisplay(item.date, i18n.language) : "";
        else if (column.key === "inspectorName")
          csvRecord[t("form.inspectorName") || "Inspector Name"] = item.inspectorName || "";
        else if (column.key === "supervisorName")
          csvRecord[t("form.supervisorName") || "Supervisor Name"] = item.supervisorName || "";
        else if (column.key === "checkInTime")
          csvRecord[t("form.checkInTime") || "Check In"] = item.checkInTime
            ? dayjs(item.checkInTime).format("hh:mm A")
            : "";
        else if (column.key === "checkOutTime")
          csvRecord[t("form.checkOutTime") || "Check Out"] = item.checkOutTime
            ? dayjs(item.checkOutTime).format("hh:mm A")
            : "";
        else if (column.key === "status")
          csvRecord[t("form.status") || "Status"] = statusLabels[item.status] || item.status;
      });
      return csvRecord;
    });

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
          exportToCsv(
            transformDataForCSV(selectedRows),
            i18n.language === "ar" ? "سجلات_الحضور.csv" : "HRMS_Attendance_Records.csv",
          );
          notification.success(
            { data: { en_Msg: `${selectedRows.length} records exported successfully` } },
            "Export Success",
          );
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch {
          notification.error({ data: { en_Msg: "Failed to export data" } }, "Export Failed");
        }
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((column) => [column.key, t(column.title) || column.key])),
    [config.tableConfig.columns, i18n.language, t],
  );

  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "status")
          return {
            ...column,
            render: (value: string) => {
              const color = value === "Checked Out" ? "green" : value === "Checked In" ? "blue" : "orange";
              return <Tag color={color}>{statusLabels[value] || value}</Tag>;
            },
          };
        if (column.key === "date")
          return {
            ...column,
            render: (value: string | null) => (value ? formatDateDisplay(value, i18n.language) : t("common.noData")),
          };
        if (["checkInTime", "checkOutTime"].includes(column.key))
          return {
            ...column,
            render: (value: string | null) => (value ? dayjs(value).format("hh:mm A") : t("common.noData")),
          };
        return column;
      }),
    }),
    [config.tableConfig, i18n.language, statusLabels, t],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view") || "View", icon: <EyeOutlined />, onClick: () => handleView(record) },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 170 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  const hrmsData = useMemo(
    () => (attendanceResponse?.data ?? []).map((item: any) => normalizeAttendanceRecord(item, inspectorNameMap)),
    [attendanceResponse?.data, inspectorNameMap],
  );

  const totalCount = useMemo(() => attendanceResponse?.totalCount || 0, [attendanceResponse?.totalCount]);
  const metadata = useMemo(
    () => ({ totalRecords: attendanceResponse?.totalRecords || attendanceResponse?.totalCount || 0 }),
    [attendanceResponse],
  );

  const activeFilterState = useMemo(
    () => ({
      columnFilters: state?.columnFilters || {},
      searchKey: state?.searchKey || "",
      searchValue: state?.searchValue || "",
      dateRange: state?.dateRange || null,
      sortBy: state?.sortBy || undefined,
      sortOrder: state?.sortOrder || undefined,
    }),
    [state],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={hrmsData} metadata={metadata} loading={isLoading} />

      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Input
                addonBefore={searchAddon}
                placeholder={t("common.searchPlaceholder") || "Search..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 520 }}
                allowClear
              />
              <span>{t("common.filterByDate") || "Filter by Date:"}</span>
              <DatePicker.RangePicker
                value={state.dateRange}
                format="DD MMM YYYY"
                placeholder={[t("placeholders.startDate") || "Start Date", t("placeholders.endDate") || "End Date"]}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
              {t("common.downloadCsv") || "Download CSV"}
            </Button>
          </Col>
        </Row>
        <ActiveFiltersDisplay
          state={activeFilterState}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
        />
      </Card>

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
          onChange: (keys: React.Key[], nextSelectedRows: any[]) => {
            setSelectedRowKeys(keys);
            setSelectedRows((prev) => {
              const remaining = prev.filter((item) => keys.includes(item.id));
              const newSelected = nextSelectedRows.filter(
                (item) => !remaining.some((existing) => existing.id === item.id),
              );
              return [...remaining, ...newSelected];
            });
          },
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={activeFilterState}
        tableLayout="auto"
        scrollX={1200}
      />

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
                  <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="Status"
                  label={t("form.status") || "Status"}
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select showSearch placeholder="Select status">
                    <Option value="Checked In">{statusLabels["Checked In"]}</Option>
                    <Option value="Checked Out">{statusLabels["Checked Out"]}</Option>
                    <Option value="Pending">{statusLabels.Pending}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="CheckInTime"
                  label={t("form.checkInTime") || "Check In Time"}
                  rules={[{ required: true, message: "Please enter check-in time" }]}
                >
                  <Input placeholder="YYYY-MM-DD HH:MM" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="CheckOutTime" label={t("form.checkOutTime") || "Check Out Time"}>
                  <Input placeholder="YYYY-MM-DD HH:MM" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {viewRecord && (
        <HRMSViewDrawer
          open={isDrawerOpen}
          onClose={handleDrawerClose}
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
