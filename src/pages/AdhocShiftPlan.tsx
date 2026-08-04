import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Tabs,
  Tooltip,
  Button,
  Card,
  Select,
  DatePicker,
  Space,
  Modal,
  Form,
  Calendar,
  List,
  Row,
  Col,
  Alert,
  message,
  Spin,
} from "antd";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSunday,
  getYear,
  getMonth,
  isSameMonth,
  isBefore,
  startOfDay,
} from "date-fns";
import { CalendarOutlined, UnorderedListOutlined, TableOutlined, EditOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { usePage } from "../contexts/PageContext";
import { AdhocShiftPlanConfig } from "../config/pageConfigs/adhocShiftPlanConfig";
import { useTranslation } from "react-i18next";
import {
  useLazyGetAdhocShiftsQuery,
  usePublishAdhocMutation,
  useLazyGetZonesQuery,
  useLazyGetAreasQuery,
  useGetAllAreasQuery,
  useGetInspectionShiftsQuery,
} from "../services/rtkApiFactory";
import { useAppNotification } from "../utils/notificationManager";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface ShiftType {
  shiftTypeGUID: string;
  shiftTypeGroupGUID: string;
  shiftTypeCode: string;
  shiftTypeNameEn: string;
  shiftTypeNameAr: string;
  shiftTimeFrom: string;
  shiftTimeTo: string;
  breakFromTime: string;
  breakToTime: string;
  isActive: boolean;
  colorCode: string;
  fontColor: string;
}

const monthNameByIndex = (i: number, lang = "en") => {
  const arMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  const enMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return lang.startsWith("ar") ? arMonths[i] : enMonths[i];
};

const getDayNamesForMonth = (year: number, monthIndex: number, lang = "en") => {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  const arDays: Record<string, string> = {
    Sun: "الأحد",
    Mon: "الاثنين",
    Tue: "الثلاثاء",
    Wed: "الأربعاء",
    Thu: "الخميس",
    Fri: "الجمعة",
    Sat: "السبت",
  };
  return days.map((d) => {
    const enDay = format(d, "EEE");
    return {
      dayOfMonth: format(d, "d"),
      dayOfWeek: lang.startsWith("ar") ? arDays[enDay] || enDay : enDay,
      isSunday: isSunday(d),
      fullDate: d,
    };
  });
};

const toLocalISOString = (date: Date) => {
  const tzOffsetMin = -date.getTimezoneOffset();
  const sign = tzOffsetMin >= 0 ? "+" : "-";
  const absOffset = Math.abs(tzOffsetMin);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetMinutes = String(absOffset % 60).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const sec = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}${sign}${offsetHours}:${offsetMinutes}`;
};

const disabledDate = (current: any) => current && isBefore(current, startOfDay(new Date()));

export default function AdhocShiftPlan() {
  const { setPageTitle } = usePage();
  const { i18n, t } = useTranslation();
  const config = AdhocShiftPlanConfig;
  const notification = useAppNotification();

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  // RTK Query hooks
  const [getAdhocShifts, { isLoading: isLoadingShifts }] = useLazyGetAdhocShiftsQuery();
  const [publishAdhoc, { isLoading: isPublishing }] = usePublishAdhocMutation();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetAreas] = useLazyGetAreasQuery();
  const { data: allAreasData } = useGetAllAreasQuery();
  const { data: shiftsResponse, isLoading: isShiftsLoading } = useGetInspectionShiftsQuery();

  const [loadingLocal, setLoadingLocal] = useState(false);
  const [zonesLookup, setZonesLookup] = useState<any[]>([]);
  const [areasLookup, setAreasLookup] = useState<any[]>([]);
  const [allAreasLookup, setAllAreasLookup] = useState<any[]>([]);
  const [shiftsLookup, setShiftsLookup] = useState<ShiftType[]>([]);

  // **NEW: Track modified entries for PUT request**
  const [modifiedEntries, setModifiedEntries] = useState<Set<string>>(new Set());

  const shiftsMap = useMemo(() => {
    const map: Record<string, ShiftType> = {};
    shiftsLookup.forEach((shift) => {
      map[shift.shiftTypeGUID] = shift;
    });
    return map;
  }, [shiftsLookup]);

  const [activeTab, setActiveTab] = useState("1");
  const [viewMode, setViewMode] = useState<"table" | "list" | "calendar">("table");
  const [rows, setRows] = useState<any[]>([]);
  const [rawApiData, setRawApiData] = useState<any[]>([]);
  const [selectedInspector, setSelectedInspector] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [hasPlanned, setHasPlanned] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(getYear(today));
  const [calMonthIdx, setCalMonthIdx] = useState(getMonth(today));

  const dayNames = useMemo(() => getDayNamesForMonth(calYear, calMonthIdx, i18n.language), [calYear, calMonthIdx, i18n.language]);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<number | null>(null);

  const [calIsSelecting, setCalIsSelecting] = useState(false);
  const [calSelStart, setCalSelStart] = useState<number | null>(null);
  const [calSelEnd, setCalSelEnd] = useState<number | null>(null);
  const [calSelectedInspector, setCalSelectedInspector] = useState<string | undefined>(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [form] = Form.useForm();
  const [isEditingSpecial, setIsEditingSpecial] = useState<"WO" | "LV" | null>(null);

  // Load shifts data
  useEffect(() => {
    if (shiftsResponse?.successful && shiftsResponse?.data && Array.isArray(shiftsResponse.data)) {
      const activeShifts = shiftsResponse.data.filter((shift: ShiftType) => shift.isActive);
      setShiftsLookup(activeShifts);
    }
  }, [shiftsResponse]);

  // Load zones
  useEffect(() => {
    const loadZones = async () => {
      try {
        const zonesRes = await triggerGetZones().unwrap();
        const zlist = zonesRes?.data ? zonesRes.data : Array.isArray(zonesRes) ? zonesRes : [];
        const normalized = zlist.map((z: any) => ({
          id: z.zoneId ?? z.zone_Id ?? z.id ?? z.zoneGUID ?? z.zoneCode ?? z.code,
          value: z.zoneId ?? z.zone_Id ?? z.id ?? z.zoneGUID ?? z.zoneCode ?? z.code,
          label: z.zone || z.zoneName || z.description || `${z.zoneCode ?? ""}${z.zone ? " - " + z.zone : ""}`,
          original: z,
        }));
        setZonesLookup(normalized);
      } catch (err) {
        console.error("Failed to load zones", err);
      }
    };
    loadZones();
  }, [triggerGetZones]);

  // Load all areas
  useEffect(() => {
    if (!allAreasData) return;
    const raw = allAreasData?.data ?? allAreasData ?? [];
    const normalized = raw.map((a: any) => ({
      id: a.areaId ?? a.area_Id ?? a.id ?? a.areaGUID ?? a.areaCode ?? a.area,
      value: a.areaId ?? a.area_Id ?? a.id ?? a.areaGUID ?? a.areaCode ?? a.area,
      label: a.area || a.areaName || a.name || String(a.areaId || a.area),
      zoneId: a.zoneId ?? a.zone_Id ?? a.parentZoneId ?? null,
      original: a,
    }));
    setAllAreasLookup(normalized);
    setAreasLookup(normalized);
  }, [allAreasData]);

  // Helper functions (refactored)
  const getLookupLabel = useMemo(
    () => (lookup: any[], value: any) => {
      if (!value && value !== 0) return "";
      const item = lookup.find((x) => String(x.value) === String(value) || String(x.id) === String(value));
      return item ? item.label : String(value);
    },
    [],
  );

  const getZoneName = useMemo(
    () => (zoneVal: any) => getLookupLabel(zonesLookup, zoneVal),
    [zonesLookup, getLookupLabel],
  );
  const getAreaName = useMemo(
    () => (areaVal: any) => getLookupLabel(allAreasLookup, areaVal),
    [allAreasLookup, getLookupLabel],
  );

  const getShiftInfoByGUID = useMemo(
    () =>
      (shiftGUID: string): ShiftType | null => {
        if (!shiftGUID) return null;
        return shiftsMap[shiftGUID] || null;
      },
    [shiftsMap],
  );

  // Process API data into table rows
  const processApiDataToRows = useMemo(
    () => (data: any[]) => {
      if (!data || data.length === 0) {
        setRows([]);
        return;
      }

      if (!dateRange[0] || !dateRange[1]) return;

      const start = dayjs((dateRange[0] as Dayjs).startOf("day").toDate());
      const end = dayjs((dateRange[1] as Dayjs).startOf("day").toDate());
      const totalDays = end.diff(start, "day") + 1;

      const grouped: Record<string, any> = {};

      data.forEach((item) => {
        const parsed = item.date ? new Date(item.date) : null;
        if (!parsed || isNaN(parsed.getTime())) return;
        const localStart = startOfDay(parsed);
        const date = dayjs(localStart);
        const dayIndex = date.diff(start, "day");

        if (dayIndex < 0 || dayIndex >= totalDays) return;

        const key = `${item.inspectorId}-${item.shiftId}`;

        if (!grouped[key]) {
          const shiftInfo = getShiftInfoByGUID(item.shiftId);
          grouped[key] = {
            key,
            inspector: item.inspectorName,
            inspectorId: item.inspectorId,
            month: monthNameByIndex(date.month(), i18n.language),
            shift: shiftInfo
              ? i18n.language === "ar"
                ? shiftInfo.shiftTypeNameAr
                : shiftInfo.shiftTypeNameEn
              : item.shiftCode,
            shiftId: item.shiftId,
            days: Array(totalDays).fill("NA"),
            _raw: {},
          };
        }

        if (item.isOff) {
          grouped[key].days[dayIndex] = item.offType === "weekOff" ? "WO" : "LV";
        } else {
          const zoneLabel = item.zoneId ? getZoneName(item.zoneId) : item.zoneCode || "NA";
          let areaLabels: string[] = [];

          if (item.areasIds && Array.isArray(item.areasIds)) {
            areaLabels = item.areasIds.map((aid: string) => getAreaName(aid)).filter(Boolean);
          } else if (item.areaId) {
            areaLabels = [getAreaName(item.areaId)];
          }

          const areaLabel = areaLabels.length ? areaLabels.join(", ") : item.areaCode || "NA";
          grouped[key].days[dayIndex] = `${zoneLabel}-${areaLabel}`;
        }

        // **FIX 1: Preserve original date field**
        grouped[key]._raw[dayIndex] = {
          rosterId: item.rosterId,
          shiftId: item.shiftId,
          batchId: item.batchId,
          inspectorId: item.inspectorId,
          inspectorName: item.inspectorName,
          zoneId: item.zoneId,
          zoneCode: item.zoneCode || "",
          areasIds: item.areasIds || (item.areaId ? [item.areaId] : []),
          areaId: item.areaId || (item.areasIds && item.areasIds[0]) || "",
          areaCode: item.areaCode || "",
          shiftCode: item.shiftCode || "",
          isOff: item.isOff || false,
          offType: item.offType || "",
          offTypeAr: item.offTypeAr || "",
          date: item.date, // **Preserve original date**
        };
      });

      const rowsArray = Object.values(grouped).map((r: any, index) => ({
        ...r,
        slno: index + 1,
        key: r.key || `row-${index}`,
      }));

      setRows(rowsArray);

      if (rowsArray.length > 0 && !selectedInspector) {
        const firstInspector = rowsArray[0].inspector;
        setSelectedInspector(firstInspector);
        setCalSelectedInspector(firstInspector);
      }
    },
    [dateRange, getShiftInfoByGUID, getZoneName, getAreaName, i18n.language, selectedInspector],
  );

  // Handle Plan button click
  const handlePlan = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.error(t("adhocShiftPlan.selectDateRange", "Please select date range"));
      return;
    }

    setLoadingLocal(true);
    try {
      const startDateLocal = toLocalISOString((dateRange[0] as Dayjs).startOf("day").toDate());
      const endDateLocal = toLocalISOString((dateRange[1] as Dayjs).startOf("day").toDate());

      const payload = { startDate: startDateLocal, endDate: endDateLocal, persist: true };
      const result = await getAdhocShifts(payload).unwrap();

      if (result.successful && result.data) {
        setRawApiData(result.data);
        processApiDataToRows(result.data);
        setHasPlanned(true);
        setModifiedEntries(new Set()); // **Reset modified entries**
        notification.success(
          {
            data: {
              en_Msg: result.en_Msg || "Shift plan loaded successfully",
              ar_Msg: result.ar_Msg || "تم تحميل خطة الورديات بنجاح",
            },
          },
          t("messages.operationSuccess"),
        );
      } else {
        notification.error(
          {
            data: {
              en_Msg: result.en_Msg || "Failed to load shift plan",
              ar_Msg: result.ar_Msg || "فشل تحميل خطة الورديات",
            },
          },
          t("common.error"),
        );
      }
    } catch (error: any) {
      console.error("Error fetching adhoc shifts:", error);
      notification.error(
        {
          data: {
            en_Msg: error?.data?.en_Msg || "An error occurred",
            ar_Msg: error?.data?.ar_Msg || "حدث خطأ",
          },
        },
        t("common.error"),
      );
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    const handleUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectedRowKey(null);
      }
      if (calIsSelecting) {
        setCalIsSelecting(false);
        if (calSelStart !== null && calSelEnd !== null) {
          openCalendarEdit(calSelStart, calSelEnd);
        }
        setCalSelStart(null);
        setCalSelEnd(null);
      }
    };
    document.addEventListener("mouseup", handleUp);
    return () => document.removeEventListener("mouseup", handleUp);
  }, [isSelecting, calIsSelecting, calSelStart, calSelEnd]);

  // Cell styling (refactored)
  const getCellStyle = (value: string, dayIndex?: number, isSunday?: boolean) => {
    let style: React.CSSProperties = { color: "#111", backgroundColor: "#fff" };

    if (value === "LV") style = { backgroundColor: "#ff4d4f", color: "#fff", fontWeight: 600 };
    else if (value === "WO") style = { backgroundColor: "#fa8c16", color: "#fff", fontWeight: 600 };
    else if (value?.includes("-")) style = { backgroundColor: "#e6f4ff", color: "#0958d9", fontWeight: 500 };

    if (isSunday) style = { ...style, borderLeft: "3px solid #cf1322" };

    if (selectionStart !== null && selectionEnd !== null && dayIndex !== undefined && selectedRowKey !== null) {
      const s = Math.min(selectionStart, selectionEnd);
      const e = Math.max(selectionStart, selectionEnd);
      if (dayIndex >= s && dayIndex <= e) {
        style = { ...style, boxShadow: "inset 0 0 0 2px #1677ff" };
      }
    }
    return style;
  };

  const handleMouseDown = (row: any, dayIndex: number) => {
    setIsSelecting(true);
    setSelectedRowKey(row.key);
    setSelectionStart(dayIndex);
    setSelectionEnd(dayIndex);
  };

  const handleMouseEnter = (row: any, dayIndex: number) => {
    if (isSelecting && selectedRowKey === row.key) setSelectionEnd(dayIndex);
  };

  const openEditForSelection = (row: any, startDayIndex: number, endDayIndex?: number) => {
    const value = row.days[startDayIndex];
    const rawData = row._raw?.[startDayIndex];

    const isWO = value === "WO";
    const isLV = value === "LV";
    setIsEditingSpecial(isWO ? "WO" : isLV ? "LV" : null);

    setEditingData({
      ...row,
      zone: rawData?.zoneId || undefined,
      area: rawData?.areasIds || [],
      dayStart: startDayIndex + 1,
      dayEnd: (endDayIndex ?? startDayIndex) + 1,
    });
    form.setFieldsValue({
      inspector: row.inspector,
      shift: row.shiftId,
      zone: rawData?.zoneId,
      area: rawData?.areasIds || [],
    });
    setIsModalOpen(true);
  };

  const handleMouseUp = (row: any) => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null && selectedRowKey === row.key) {
      setIsSelecting(false);
      const startDay = Math.min(selectionStart, selectionEnd);
      const endDay = Math.max(selectionStart, selectionEnd);
      openEditForSelection(row, startDay, endDay);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedRowKey(null);
    }
  };

  // Calendar drag handlers
  const calHandleMouseDown = (idx: number) => {
    setCalIsSelecting(true);
    setCalSelStart(idx);
    setCalSelEnd(idx);
  };

  const calHandleMouseEnter = (idx: number) => {
    if (calIsSelecting) setCalSelEnd(idx);
  };

  const openCalendarEdit = (startIdx: number, endIdx: number) => {
    const s = Math.min(startIdx, endIdx);
    const e = Math.max(startIdx, endIdx);
    const inspName = calSelectedInspector || (rows[0]?.inspector ?? "");
    const row = rows.find((r) => r.inspector === inspName) || rows[0];

    if (!row) return;

    const value = row.days[s];
    const rawData = row._raw?.[s];

    const isWO = value === "WO";
    const isLV = value === "LV";
    setIsEditingSpecial(isWO ? "WO" : isLV ? "LV" : null);

    setEditingData({
      ...row,
      dayStart: s + 1,
      dayEnd: e + 1,
      zone: rawData?.zoneId,
      area: rawData?.areasIds || [],
    });

    form.setFieldsValue({
      inspector: row.inspector,
      shift: row.shiftId,
      zone: rawData?.zoneId,
      area: rawData?.areasIds || [],
    });
    setIsModalOpen(true);
  };

  // **FIX 1 & 2: Modal save - Preserve date and track modifications**
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingData && editingData.dayStart && editingData.dayEnd) {
        const startIdx = editingData.dayStart - 1;
        const endIdx = editingData.dayEnd - 1;

        const zoneObj = zonesLookup.find((z) => String(z.value) === String(values.zone));
        const areaObjs = values.area
          .map((id: any) => allAreasLookup.find((a) => String(a.value) === String(id)))
          .filter(Boolean);

        const zoneName = zoneObj?.label || values.zone;
        const areaNames = areaObjs.map((a: any) => a?.label).filter(Boolean);

        setRows((prev) =>
          prev.map((r) => {
            const match = editingData.key ? r.key === editingData.key : r.inspector === values.inspector;
            if (!match) return r;

            const updated = { ...r };

            for (let i = startIdx; i <= endIdx; i++) {
              updated.days[i] = `${zoneName}-${areaNames.join(", ")}`;

              // **FIX 1: Preserve date when updating**
              const originalRaw = updated._raw[i] || {};
              updated._raw[i] = {
                ...originalRaw,
                zoneId: values.zone,
                zoneCode: zoneObj?.original?.zoneCode || originalRaw.zoneCode || "",
                areasIds: values.area,
                areaId: values.area[0],
                areaCode: areaObjs[0]?.original?.areaCode || originalRaw.areaCode || "",
                isOff: false,
                offType: "",
                // **Preserve original date field**
                date: originalRaw.date,
              };

              // **FIX 2: Track this entry as modified**
              const entryKey = `${r.inspectorId}-${i}`;
              setModifiedEntries((prev) => new Set(prev).add(entryKey));
            }
            return updated;
          }),
        );

        message.success(t("common.updateSuccess", "Updated successfully"));
      }

      setIsModalOpen(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedRowKey(null);
      setCalSelStart(null);
      setCalSelEnd(null);
      setIsEditingSpecial(null);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // **FIX 2: Build schedule entries - Only send modified entries**
  const buildScheduleEntries = () => {
    const entries: any[] = [];

    if (!dateRange[0]) return entries;

    const start = dayjs((dateRange[0] as Dayjs).startOf("day").toDate());

    rows.forEach((row) => {
      const raw = row._raw || {};
      Object.keys(raw).forEach((dayIdxStr) => {
        const dayIdx = parseInt(dayIdxStr, 10);
        if (Number.isNaN(dayIdx)) return;

        const rawEntry = raw[dayIdxStr];
        if (!rawEntry || !rawEntry.inspectorId) return;

        // **Check if this entry was modified**
        const entryKey = `${row.inspectorId}-${dayIdx}`;
        if (!modifiedEntries.has(entryKey)) return; // **Skip unmodified entries**

        // **Use preserved date or calculate from start date**
        const entryDate = rawEntry.date || toLocalISOString(start.add(dayIdx, "day").toDate());

        entries.push({
          id: rawEntry.id || 0,
          rosterId: rawEntry.rosterId || "00000000-0000-0000-0000-000000000000",
          date: entryDate,
          inspectorId: rawEntry.inspectorId,
          inspectorName: rawEntry.inspectorName,
          inspectorNameAr: rawEntry.inspectorName,
          zoneId: rawEntry.zoneId || "00000000-0000-0000-0000-000000000000",
          areaId: rawEntry.areaId || "00000000-0000-0000-0000-000000000000",
          areasIds: rawEntry.areasIds || [],
          shiftId: rawEntry.shiftId || "00000000-0000-0000-0000-000000000000",
          batchId: rawEntry.batchId || "00000000-0000-0000-0000-000000000000",
          zoneCode: rawEntry.zoneCode || "",
          areaCode: rawEntry.areaCode || "",
          shiftCode: rawEntry.shiftCode || "",
          isOff: rawEntry.isOff || false,
          offType: rawEntry.offType || "",
          offTypeAr: rawEntry.offTypeAr || "",
        });
      });
    });

    return entries;
  };

  // Handle publish
  const handlePublish = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.error(t("adhocShiftPlan.selectDateRange", "Please select date range"));
      return;
    }

    if (rows.length === 0) {
      message.warning(t("adhocShiftPlan.noDataToPublish", "No data to publish"));
      return;
    }

    // **Check if there are modifications**
    if (modifiedEntries.size === 0) {
      message.warning("No changes to publish");
      return;
    }

    setLoadingLocal(true);
    try {
      const scheduleEntries = buildScheduleEntries(); // **Only modified entries**

      const batchStart = toLocalISOString((dateRange[0] as Dayjs).startOf("day").toDate());
      const batchEnd = toLocalISOString((dateRange[1] as Dayjs).startOf("day").toDate());

      const payload = {
        batch: { startDate: batchStart, endDate: batchEnd, persist: true },
        scheduleEntries,
        isPublished: true,
      };

      const result = await publishAdhoc(payload).unwrap();

      if (result && (result.successful === true || result.isPublished === true || result.status === "success")) {
        notification.success(
          {
            data: {
              en_Msg: result.en_Msg || "Published successfully",
              ar_Msg: result.ar_Msg || "تم النشر بنجاح",
            },
          },
          t("messages.operationSuccess"),
        );

        // Reset modified entries after successful publish
        setModifiedEntries(new Set());

        // Reload data
        try {
          const reloadPayload = { startDate: batchStart, endDate: batchEnd, persist: false };
          const reloadResult = await getAdhocShifts(reloadPayload).unwrap();
          if (reloadResult && reloadResult.successful && Array.isArray(reloadResult.data)) {
            setRawApiData(reloadResult.data);
            processApiDataToRows(reloadResult.data);
            setHasPlanned(true);
          }
        } catch (reloadErr) {
          console.warn("Re-fetch after publish failed:", reloadErr);
        }
      } else {
        notification.error(
          {
            data: {
              en_Msg: result?.en_Msg || "Failed to publish",
              ar_Msg: result?.ar_Msg || "فشل النشر",
            },
          },
          t("common.error"),
        );
      }
    } catch (error: any) {
      console.error("Publish error:", error);
      notification.error(
        {
          data: {
            en_Msg: error?.data?.en_Msg || error?.message || "An error occurred",
            ar_Msg: error?.data?.ar_Msg || "حدث خطأ",
          },
        },
        t("common.error"),
      );
    } finally {
      setLoadingLocal(false);
    }
  };

  // Dynamic table columns
  const dayColumns = dayNames.map((day, i) => ({
    title: (
      <div style={{ fontWeight: day.isSunday ? "bold" : "normal", color: day.isSunday ? "#cf1322" : "#000" }}>
        <div>{day.dayOfMonth}</div>
        <div style={{ fontSize: 10 }}>{day.dayOfWeek}</div>
      </div>
    ),
    dataIndex: ["days", i],
    key: `day${i + 1}`,
    width: 80,
    render: (value: string, row: any) => {
      const rawData = row._raw?.[i];

      return (
        <Tooltip
          title={
            value?.includes("-") ? (
              <div style={{ maxWidth: 250 }}>
                <p style={{ marginBottom: 4 }}>
                  <b>{t("form.inspector", "Inspector")}:</b> {row.inspector}
                </p>
                <p style={{ marginBottom: 4 }}>
                  <b>{t("form.date", "Date")}:</b> {day.dayOfMonth} {monthNameByIndex(calMonthIdx, i18n.language)} ({day.dayOfWeek})
                </p>
                <p style={{ marginBottom: 4 }}>
                  <b>{t("form.shift", "Shift")}:</b> {row.shift}
                </p>
                <p style={{ marginBottom: 4 }}>
                  <b>{t("form.zone", "Zone")}:</b> {rawData?.zoneId ? getZoneName(rawData.zoneId) : "NA"}
                </p>
                <p style={{ marginBottom: 8 }}>
                  <b>{t("form.area", "Area")}:</b>{" "}
                  {rawData?.areasIds
                    ? rawData.areasIds.map((id: string) => getAreaName(id)).join(", ")
                    : getAreaName(rawData?.areaId) || "NA"}
                </p>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditForSelection(row, i)}>
                  {t("common.edit", "Edit")}
                </Button>
              </div>
            ) : value === "LV" ? (
              t("adhocShiftPlan.leave", "Leave (LV)")
            ) : value === "WO" ? (
              t("adhocShiftPlan.weekOff", "Week Off (WO)")
            ) : (
              t("common.noData", "Not Assigned")
            )
          }
        >
          <div
            style={{
              padding: "4px 8px",
              textAlign: "center",
              borderRadius: 4,
              cursor: "pointer",
              minHeight: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...getCellStyle(value, i, day.isSunday),
            }}
            onMouseDown={() => handleMouseDown(row, i)}
            onMouseEnter={() => handleMouseEnter(row, i)}
            onMouseUp={() => handleMouseUp(row)}
          >
            {value || "NA"}
          </div>
        </Tooltip>
      );
    },
  }));

  const columns = [
    {
      title: t("form.inspector", "Inspector"),
      dataIndex: "inspector",
      key: "inspector",
      fixed: "left" as const,
      width: 160,
      filters: [...new Set(rows.map((d) => d.inspector))].map((x) => ({ text: x as string, value: x })),
      onFilter: (value: any, record: any) => record.inspector === value,
      sorter: (a: any, b: any) => a.inspector.localeCompare(b.inspector),
    },
    {
      title: t("common.month", "Month"),
      dataIndex: "month",
      key: "month",
      fixed: "left" as const,
      width: 120,
      filters: [...new Set(rows.map((d) => d.month))].map((x) => ({ text: x as string, value: x })),
      onFilter: (value: any, record: any) => record.month === value,
      sorter: (a: any, b: any) => a.month.localeCompare(b.month),
    },
    {
      title: t("form.shift", "Shift"),
      dataIndex: "shift",
      key: "shift",
      fixed: "left" as const,
      width: 120,
      filters: [...new Set(rows.map((d) => d.shift))].map((x) => ({ text: x as string, value: x })),
      onFilter: (value: any, record: any) => record.shift === value,
      sorter: (a: any, b: any) => a.shift.localeCompare(b.shift),
    },
    ...dayColumns,
  ];

  const tableData = useMemo(() => rows, [rows]);
  const inspectorOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.inspector))), [rows]);

  // List View data
  const next10Days = useMemo(() => {
    const arr = [] as Date[];
    for (let i = 0; i < 10; i++) arr.push(addDays(today, i));
    return arr;
  }, [today]);

  const listData = useMemo(() => {
    return rows.map((ins) => {
      const days = next10Days.map((dt) => {
        let value = "NA";
        if (getYear(dt) === calYear && getMonth(dt) === calMonthIdx) {
          const index = parseInt(format(dt, "d"), 10) - 1;
          value = ins.days[index] ?? "NA";
        }
        const dayOfWeek = format(dt, "EEE");
        const day = format(dt, "d");
        return { value, day, dayOfWeek, isSunday: isSunday(dt) };
      });
      return { inspector: ins.inspector, inspectorId: ins.inspectorId, shift: ins.shift, days };
    });
  }, [rows, next10Days, calMonthIdx, calYear]);

  // Calendar cell renderer
  const dateCellRender = (value: any) => {
    const date: Date = value.toDate();
    if (!isSameMonth(date, new Date(calYear, calMonthIdx, 1))) return null;

    const dayIndex = parseInt(format(date, "d"), 10) - 1;

    const relevantRows = selectedInspector
      ? rows.filter((r) => r.inspector === selectedInspector)
      : rows.filter((r) => r.inspector === calSelectedInspector);

    const assignments = relevantRows
      .map((r) => ({ who: r.inspector, val: r.days[dayIndex], key: r.key }))
      .filter((x) => !!x.val);

    const selStart = calSelStart;
    const selEnd = calSelEnd;
    const inSel =
      selStart !== null &&
      selEnd !== null &&
      dayIndex >= Math.min(selStart, selEnd) &&
      dayIndex <= Math.max(selStart, selEnd);

    return (
      <div
        style={{ padding: 4 }}
        onMouseDown={() => calHandleMouseDown(dayIndex)}
        onMouseEnter={() => calHandleMouseEnter(dayIndex)}
      >
        {assignments.slice(0, 3).map((a, i) => {
          const v = a.val as string;
          const style: React.CSSProperties =
            v === "LV"
              ? { background: "#ff4d4f", color: "#fff" }
              : v === "WO"
                ? { background: "#fa8c16", color: "#fff" }
                : { background: "#e6f4ff", color: "#0958d9" };
          return (
            <div
              key={i}
              style={{
                ...style,
                borderRadius: 4,
                padding: "2px 4px",
                marginBottom: 2,
                fontSize: 11,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                boxShadow: inSel ? "inset 0 0 0 2px #1677ff" : undefined,
              }}
            >
              {selectedInspector ? v : `${a.who}: ${v}`}
            </div>
          );
        })}
        {assignments.length > 3 && <div style={{ fontSize: 11, opacity: 0.75 }}>+{assignments.length - 3} more</div>}
      </div>
    );
  };

  // Calendar custom header
  const calendarHeaderRender = ({ value, onChange }: any) => {
    const curYear = getYear(new Date());
    const years = Array.from({ length: 6 }).map((_, i) => curYear + i);
    const months = Array.from({ length: 12 }).map((_, i) => ({ label: monthNameByIndex(i, i18n.language), value: i }));

    return (
      <div style={{ padding: 8, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Select
            value={calMonthIdx}
            onChange={(m) => {
              setCalMonthIdx(m);
              const next = value.clone();
              next.month(m);
              onChange(next);
            }}
            options={months}
            style={{ width: 160 }}
          />
          <Select
            value={calYear}
            onChange={(y) => {
              setCalYear(y);
              const next = value.clone();
              next.year(y);
              onChange(next);
            }}
            options={years.map((y) => ({ label: y, value: y }))}
            style={{ width: 120 }}
          />
        </div>

        <div>
          <Select
            value={calSelectedInspector}
            onChange={(v) => setCalSelectedInspector(v)}
            options={inspectorOptions.map((x) => ({ label: x, value: x }))}
            placeholder={t("adhocShiftPlan.selectInspector", "Select Inspector")}
            style={{ width: 220 }}
          />
        </div>
      </div>
    );
  };

  // Handle zone change in modal
  const handleZoneChange = async (zoneValue: string) => {
    form.setFieldsValue({ area: [] });

    if (!zoneValue) {
      setAreasLookup(allAreasLookup);
      return;
    }

    try {
      const res = await triggerGetAreas(zoneValue).unwrap();
      const raw = res?.data ?? res ?? [];

      const normalized = raw.map((a: any) => ({
        id: a.areaId ?? a.area_Id ?? a.id ?? a.areaGUID ?? a.areaCode ?? a.area,
        value: a.areaId ?? a.area_Id ?? a.id ?? a.areaGUID ?? a.areaCode ?? a.area,
        label: a.area || a.areaName || a.name || String(a.areaId || a.area),
        zoneId: a.zoneId ?? a.zone_Id ?? null,
        original: a,
      }));

      setAreasLookup(normalized);
    } catch (err) {
      const selectedZone = zonesLookup.find(
        (z) => String(z.value) === String(zoneValue) || String(z.id) === String(zoneValue),
      );
      const zoneIdToFilter = selectedZone?.value || selectedZone?.id || zoneValue;
      setAreasLookup(allAreasLookup.filter((a) => String(a.zoneId) === String(zoneIdToFilter)));
    }
  };

  const loadingGlobal = isShiftsLoading || isPublishing || isLoadingShifts || loadingLocal;

  return (
    <Spin spinning={loadingGlobal} tip={t("common.loading", "Loading...")} size="large">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={12} align="middle">
            <Col>
              <Space>
                <Button
                  type={viewMode === "table" ? "primary" : "default"}
                  icon={<TableOutlined />}
                  onClick={() => setViewMode("table")}
                >
                  {t("adhocShiftPlan.tableView", "Table View")}
                </Button>
                <Button
                  type={viewMode === "list" ? "primary" : "default"}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode("list")}
                >
                  {t("adhocShiftPlan.listView", "List View (Next 10 Days)")}
                </Button>
                <Button
                  type={viewMode === "calendar" ? "primary" : "default"}
                  icon={<CalendarOutlined />}
                  onClick={() => setViewMode("calendar")}
                >
                  {t("adhocShiftPlan.calendarView", "Calendar View")}
                </Button>
              </Space>
            </Col>

            {viewMode !== "list" && (
              <Col>
                <Select
                  allowClear
                  placeholder={t("adhocShiftPlan.selectInspector", "Select Inspector")}
                  style={{ width: 220 }}
                  value={selectedInspector}
                  onChange={(v) => {
                    setSelectedInspector(v);
                    setCalSelectedInspector(v);
                  }}
                  options={inspectorOptions.map((x) => ({ label: x, value: x }))}
                  disabled={!hasPlanned}
                />
              </Col>
            )}

            <Col>
              <RangePicker
                disabledDate={disabledDate}
                value={dateRange as any}
                onChange={(val) => {
                  setDateRange(val ? [val[0], val[1]] : [null, null]);
                  setHasPlanned(false);
                  setRows([]);
                }}
                format="DD MMM YYYY"
              />
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={handlePlan}
                disabled={!dateRange[0] || !dateRange[1]}
                loading={isLoadingShifts || loadingLocal}
                style={{
                  backgroundColor: "#00a967",
                  borderColor: "#00a967",
                  color: "#ffffff",
                }}
              >
                {t("form.replan", "Plan")}
              </Button>
            </Col>

            {hasPlanned && rows.length > 0 && (
              <Col>
                <Button
                  type="primary"
                  onClick={handlePublish}
                  loading={isPublishing || loadingLocal}
                  style={{
                    backgroundColor: "#00a967",
                    borderColor: "#00a967",
                    color: "#ffffff",
                  }}
                  disabled={modifiedEntries.size === 0}
                >
                  {t("adhocShiftPlan.publish", "Publish")} {modifiedEntries.size > 0 && `(${modifiedEntries.size})`}
                </Button>
              </Col>
            )}
          </Row>
        </Card>

        {viewMode === "calendar" && hasPlanned && (
          <Card size="small" style={{ width: 420 }}>
            <Space>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 14, height: 14, background: "#ff4d4f", borderRadius: 3 }} />
                <div>{t("adhocShiftPlan.leave", "Leave (LV)")}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 14, height: 14, background: "#fa8c16", borderRadius: 3 }} />
                <div>{t("adhocShiftPlan.weekOff", "Week Off (WO)")}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 14, height: 14, background: "#e6f4ff", borderRadius: 3 }} />
                <div>{t("adhocShiftPlan.assigned", "Assigned (Z-A)")}</div>
              </div>
            </Space>
          </Card>
        )}

        {!hasPlanned && rows.length === 0 && (
          <Card>
            <Alert
              message={t("adhocShiftPlan.noData", "No Data")}
              description={t(
                "adhocShiftPlan.selectDateAndPlan",
                "Please select a date range and click Plan to load shift data",
              )}
              type="info"
              showIcon
            />
          </Card>
        )}

        {viewMode === "table" && rows.length > 0 && hasPlanned && (
          <Card bordered>
            <Tabs type="card" activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab={t("adhocShiftPlan.monthly", "Monthly")} key="1">
                <Table
                  dataSource={tableData}
                  columns={columns}
                  scroll={{ x: Math.max(1200, 200 + dayNames.length * 90), y: 700 }}
                  bordered
                  pagination={false}
                  rowKey="key"
                />
              </TabPane>
              <TabPane tab={t("adhocShiftPlan.inspectorWise", "Inspector Wise")} key="2">
                <Table
                  dataSource={selectedInspector ? rows.filter((d) => d.inspector === selectedInspector) : []}
                  columns={columns}
                  scroll={{ x: Math.max(1200, 200 + dayNames.length * 90), y: 700 }}
                  bordered
                  pagination={false}
                  rowKey="key"
                />
              </TabPane>
              <TabPane tab={t("adhocShiftPlan.all", "All")} key="3">
                <Table
                  dataSource={rows}
                  columns={columns}
                  scroll={{ x: Math.max(1200, 200 + dayNames.length * 90), y: 700 }}
                  bordered
                  pagination={false}
                  rowKey="key"
                />
              </TabPane>
            </Tabs>
          </Card>
        )}

        {viewMode === "list" && rows.length > 0 && hasPlanned && (
          <Card title={t("adhocShiftPlan.next10Days", "Next 10 Days")} bordered>
            <List
              itemLayout="vertical"
              dataSource={listData}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>
                    {item.inspector} ({item.inspectorId}) – {item.shift} {t("adhocShiftPlan.shift", "Shift")}
                  </div>
                  <Space wrap>
                    {item.days.map((d, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          border: "1px solid #d9d9d9",
                          borderRadius: 6,
                          width: 90,
                          textAlign: "center",
                          background: d.value === "LV" ? "#ffccc7" : d.value === "WO" ? "#ffe7ba" : "#fff",
                        }}
                      >
                        <div>
                          {d.day} ({d.dayOfWeek})
                        </div>
                        <div
                          style={{
                            color: d.value === "LV" ? "#a8071a" : d.value === "WO" ? "#d46b08" : "#0958d9",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {d.value}
                        </div>
                      </div>
                    ))}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {viewMode === "calendar" && rows.length > 0 && hasPlanned && (
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {t("adhocShiftPlan.shiftCalendar", "Shift Calendar")} – {monthNameByIndex(calMonthIdx)} {calYear}
                </div>
                <div style={{ fontWeight: 600 }}>{calSelectedInspector}</div>
              </div>
            }
            bordered
          >
            <Calendar
              headerRender={calendarHeaderRender}
              dateCellRender={dateCellRender}
              style={{ border: "1px solid #d9d9d9", borderRadius: 6 }}
            />
          </Card>
        )}

        <Modal
          title={t("adhocShiftPlan.editShiftDetails", "Edit Shift Details")}
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalOpen(false);
            setIsEditingSpecial(null);
          }}
          okText={t("adhocShiftPlan.saveChanges", "Save Changes")}
          cancelText={t("common.cancel", "Cancel")}
          width={600}
        >
          {isEditingSpecial && (
            <Alert
              message={
                isEditingSpecial === "WO"
                  ? t("adhocShiftPlan.editingWeekOff", "You are editing Week Off (WO) assignment")
                  : t("adhocShiftPlan.editingLeave", "You are editing Leave (LV) assignment")
              }
              description={
                isEditingSpecial === "WO"
                  ? t(
                      "adhocShiftPlan.weekOffWarning",
                      "Changing this will assign a zone and area instead of marking it as Week Off.",
                    )
                  : t(
                      "adhocShiftPlan.leaveWarning",
                      "Changing this will assign a zone and area instead of marking it as Leave.",
                    )
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              name="inspector"
              label={t("form.inspector", "Inspector")}
              rules={[{ required: true, message: t("adhocShiftPlan.selectInspectorMsg", "Please select inspector") }]}
            >
              <Select
                options={inspectorOptions.map((x) => ({ label: x, value: x }))}
                placeholder={t("adhocShiftPlan.selectInspector", "Select inspector")}
                disabled
              />
            </Form.Item>

            <Form.Item
              name="shift"
              label={t("form.shift", "Shift")}
              rules={[{ required: true, message: t("adhocShiftPlan.selectShiftMsg", "Please select a shift") }]}
            >
              <Select disabled>
                {shiftsLookup.map((shift) => (
                  <Select.Option key={shift.shiftTypeGUID} value={shift.shiftTypeGUID}>
                    {i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="zone"
              label={t("form.zone", "Zone")}
              rules={[{ required: true, message: t("adhocShiftPlan.selectZoneMsg", "Please select a zone") }]}
            >
              <Select
                placeholder={t("adhocShiftPlan.selectZone", "Select zone")}
                onChange={handleZoneChange}
                options={zonesLookup.map((z) => ({ label: z.label, value: z.value }))}
              />
            </Form.Item>

            <Form.Item
              name="area"
              label={t("form.area", "Area")}
              rules={[{ required: true, message: t("adhocShiftPlan.selectAreaMsg", "Please select an area") }]}
            >
              <Select
                mode="multiple"
                placeholder={t("adhocShiftPlan.selectArea", "Select area")}
                options={areasLookup.map((a) => ({ label: a.label, value: a.value }))}
                disabled={!form.getFieldValue("zone")}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Spin>
  );
}
