/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState, useRef } from "react";
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
  message,
  Input,
  Radio,
  Tag,
} from "antd";
import { LeftOutlined, RightOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { ShiftPlanningConfig } from "../config/pageConfigs/shiftPlanningConfig";
import {
  useGetShiftPlanMutation,
  useLazyGetZonesQuery,
  useLazyGetAreasQuery,
  useGetAllAreasQuery,
  useGetLastBatchDetailQuery,
  usePublishShiftPlanMutation,
  useGetSavedScheduleDraftQuery,
  useGetInspectionShiftsQuery,
} from "../services/rtkApiFactory";
import { useAppNotification } from "../utils/notificationManager";

// Enable UTC plugin
dayjs.extend(utc);

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

type ViewMode = "week" | "month" | "all";

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

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper function to convert date to UTC ISO string at start of day
const toUTCStartOfDay = (date: Dayjs | string): string => {
  const d = dayjs(date);
  return dayjs.utc(`${d.format("YYYY-MM-DD")}T00:00:00.000Z`).toISOString();
};

export default function CreateShiftPlan() {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();

  const [modal, contextHolder] = Modal.useModal();

  // RTK hooks
  const [getShiftPlan, { isLoading: isPlanning }] = useGetShiftPlanMutation();
  const [publishShiftPlan, { isLoading: isPublishing }] = usePublishShiftPlanMutation();

  const { data: lastBatch } = useGetLastBatchDetailQuery();

  const {
    data: savedDraft,
    isLoading: isDraftLoading,
    refetch: refetchDraft,
    isSuccess: isDraftSuccess,
  } = useGetSavedScheduleDraftQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetAreas] = useLazyGetAreasQuery();
  const { data: allAreasData } = useGetAllAreasQuery();

  // Use the query hook to get shifts
  const { data: shiftsResponse, isLoading: isShiftsLoading, isError: isShiftsError } = useGetInspectionShiftsQuery();

  // Lookups normalized
  const [zonesLookup, setZonesLookup] = useState<any[]>([]);
  const [areasLookup, setAreasLookup] = useState<any[]>([]);
  const [allAreasLookup, setAllAreasLookup] = useState<any[]>([]);
  const [shiftsLookup, setShiftsLookup] = useState<ShiftType[]>([]);

  // Create a map for quick shift lookup by GUID
  const shiftsMap = useMemo(() => {
    const map: Record<string, ShiftType> = {};
    shiftsLookup.forEach((shift) => {
      map[shift.shiftTypeGUID] = shift;
    });
    return map;
  }, [shiftsLookup]);

  // Main table & UI state
  const [rawApiData, setRawApiData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [form] = Form.useForm();

  const [dateRange, setDateRange] = useState<(Dayjs | null)[]>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string[]>([]);

  // Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // View & pagination
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentPage, setCurrentPage] = useState(0);

  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [hasValidData, setHasValidData] = useState(false);
  const [tempStart, setTempStart] = useState<Dayjs | null>(null);

  const draftPromptShownRef = useRef(false);
  const [isLoadedFromDraft, setIsLoadedFromDraft] = useState(false);

  // Process shifts data when it changes
  useEffect(() => {
    if (shiftsResponse?.successful && shiftsResponse?.data && Array.isArray(shiftsResponse.data)) {
      const activeShifts = shiftsResponse.data.filter((shift: ShiftType) => shift.isActive);
      setShiftsLookup(activeShifts);
      console.log("Loaded shifts:", activeShifts);
    } else if (isShiftsError) {
      message.error(t("shiftPlanning.failedToLoadShifts", "Failed to load shifts"));
    }
  }, [shiftsResponse, isShiftsError, t]);

  // Dynamic shift map from API (by code)
  const shiftCodeMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    shiftsLookup.forEach((shift) => {
      if (shift.shiftTypeCode) {
        map[shift.shiftTypeCode] = i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn;
      }
    });
    return map;
  }, [shiftsLookup, i18n.language]);

  const [editsMap, setEditsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    setPageTitle(t(ShiftPlanningConfig.title));
    if (!hasDataLoaded) generateDefaultTable();
    loadZones();
  }, [setPageTitle, t]);

  useEffect(() => {
    setPageTitle(t(ShiftPlanningConfig.title));
  }, [i18n.language, setPageTitle, t]);

  // Draft prompt with proper modal usage
  useEffect(() => {
    if (isDraftLoading) return;
    if (!isDraftSuccess) return;
    if (draftPromptShownRef.current) return;
    if (!savedDraft) return;

    const draftData = savedDraft?.data ?? [];

    if (draftData && draftData.length > 0) {
      draftPromptShownRef.current = true;

      modal.confirm({
        title: t("shiftPlanning.loadDraftTitle", "Load Saved Draft?"),
        content: t(
          "shiftPlanning.loadDraftMessage",
          `A saved draft with ${draftData.length} entries was found. Would you like to load it?`,
        ),
        okText: t("common.yes", "Yes"),
        cancelText: t("common.no", "No"),
        onOk() {
          loadDraftData(draftData);
        },
        onCancel() {
          // User declined
        },
      });
    }
  }, [isDraftLoading, isDraftSuccess, savedDraft, t, modal]);

  // Function to load draft data
  const loadDraftData = (draftData: any[]) => {
    if (!draftData || draftData.length === 0) return;

    const dates = draftData.map((item) => dayjs(item.date)).filter((d) => d.isValid());
    if (dates.length === 0) return;

    const minDate = dates.reduce((min, d) => (d.isBefore(min) ? d : min), dates[0]);
    const maxDate = dates.reduce((max, d) => (d.isAfter(max) ? d : max), dates[0]);

    setDateRange([minDate, maxDate]);
    form.setFieldsValue({ planDate: [minDate, maxDate] });

    setRawApiData(draftData);
    setHasDataLoaded(true);
    setHasValidData(true);
    setIsLoadedFromDraft(true);
    resetAllFilters();

    notification.success(
      {
        data: {
          en_Msg: `Draft loaded successfully with ${draftData.length} entries`,
          ar_Msg: `تم تحميل المسودة بنجاح مع ${draftData.length} إدخالات`,
        },
      },
      t("messages.operationSuccess"),
    );
  };

  // Load zones (normalize)
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
      // Silent fail
    }
  };

  // Normalize all areas list for label lookups
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

  // Default NA table (30 days)
  const generateDefaultTable = () => {
    const defaultDays = Array(30).fill("NA");
    setTableData([
      {
        key: "default-row",
        inspector: "",
        inspectorId: "",
        shiftId: "",
        days: defaultDays,
      },
    ]);
    setHasValidData(false);
  };

  const resetAllFilters = () => {
    setInspectorFilter("");
    setShiftFilter([]);
    setActiveTab("1");
    setCurrentPage(0);
    setViewMode("week");
  };

  const validRange = useMemo(() => dateRange.length === 2 && !!dateRange[0] && !!dateRange[1], [dateRange]);

  const daysCount = useMemo(() => {
    if (validRange) {
      const diff = (dateRange[1] as Dayjs).diff(dateRange[0] as Dayjs, "day") + 1;
      const maxDays = 6 * 30;
      return Math.min(Math.max(diff, 1), maxDays);
    }
    return 30;
  }, [dateRange, validRange]);

  // Auto set start date only from last batch end + 1 day
  useEffect(() => {
    if (!lastBatch?.data) return;
    const lastEnd = dayjs(lastBatch.data.assignmentEndDate);
    if (!lastEnd.isValid()) return;
    const newStart = lastEnd.add(1, "day").startOf("day");
    setDateRange([newStart, null]);
    form.setFieldsValue({ planDate: [newStart, null] });
  }, [lastBatch, form]);

  // Pagination helpers
  const daysPerPage = useMemo(
    () => (viewMode === "week" ? 7 : viewMode === "month" ? 30 : daysCount),
    [viewMode, daysCount],
  );
  const totalPages = useMemo(
    () => (viewMode === "all" ? 1 : Math.ceil(daysCount / daysPerPage)),
    [daysCount, daysPerPage, viewMode],
  );
  const startDayIndex = currentPage * daysPerPage;
  const endDayIndex = Math.min(startDayIndex + daysPerPage, daysCount);

  useEffect(() => setCurrentPage(0), [viewMode]);

  // Helper label getters
  const getZoneName = (zoneVal: any) => {
    if (!zoneVal) return "";
    const z = zonesLookup.find((x) => String(x.value) === String(zoneVal) || String(x.id) === String(zoneVal));
    return z ? z.label : String(zoneVal);
  };

  const getAreaName = (areaVal: any) => {
    if (!areaVal && areaVal !== 0) return "";
    const a = allAreasLookup.find((x) => String(x.value) === String(areaVal) || String(x.id) === String(areaVal));
    return a ? a.label : String(areaVal);
  };

  // Get shift info by GUID (shiftId from API)
  const getShiftInfoByGUID = (shiftGUID: string): ShiftType | null => {
    if (!shiftGUID) return null;
    return shiftsMap[shiftGUID] || null;
  };

  // Get shift info by code (for backwards compatibility)
  const getShiftInfoByCode = (shiftCode: string): ShiftType | null => {
    if (!shiftCode) return null;
    return shiftsLookup.find((s) => s.shiftTypeCode === shiftCode) || null;
  };

  /* Day columns generation */
  const dayColumns = useMemo(() => {
    const columnsToShow = viewMode === "all" ? daysCount : Math.min(daysPerPage, endDayIndex - startDayIndex);

    if (validRange) {
      const start = dateRange[0] as Dayjs;
      return Array.from({ length: columnsToShow }, (_, i) => {
        const actualDayIndex = startDayIndex + i;
        const currentDate = start.add(actualDayIndex, "day");
        const weekday = currentDate.format("ddd");

        return {
          title: (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600 }}>{weekday}</div>
              <div style={{ fontSize: 12 }}>{t("shiftPlanning.dayNumber", { number: actualDayIndex + 1 })}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{currentDate.format("DD/MM")}</div>
            </div>
          ),
          dataIndex: ["days", actualDayIndex],
          key: `day${actualDayIndex + 1}`,
          width: 120,
          render: (value: string, row: any) => renderDayCell(value, actualDayIndex, row),
        };
      });
    }

    return Array.from({ length: Math.min(columnsToShow, 30) }, (_, i) => {
      const actualDayIndex = startDayIndex + i;
      return {
        title: (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600 }}>{t("shiftPlanning.dayNumber", { number: actualDayIndex + 1 })}</div>
          </div>
        ),
        dataIndex: ["days", actualDayIndex],
        key: `day${actualDayIndex + 1}`,
        width: 120,
        render: (value: string, row: any) => renderDayCell(value, actualDayIndex, row),
      };
    });
  }, [dateRange, daysCount, startDayIndex, endDayIndex, viewMode, daysPerPage, t, validRange, shiftsLookup]);

  /* Available shifts - use GUID for filtering */
  const availableShifts = useMemo(() => {
    const shiftIds = [...new Set(tableData.map((d) => d.shiftId).filter(Boolean))];
    return shiftIds.map((guid) => {
      const shiftInfo = getShiftInfoByGUID(guid);
      return {
        text: shiftInfo ? (i18n.language === "ar" ? shiftInfo.shiftTypeNameAr : shiftInfo.shiftTypeNameEn) : guid,
        value: guid,
      };
    });
  }, [tableData, shiftsMap, i18n.language]);

  /* Table columns */
  const columns = useMemo(
    () => [
      {
        title: t("form.inspector"),
        dataIndex: "inspector",
        key: "inspector",
        width: 220,
        fixed: "left" as const,
        filters: [...new Set(tableData.map((d) => d.inspector))].map((x) => ({ text: x, value: x })),
        onFilter: (value: any, record: any) => record.inspector === value,
        render: (text: string, record: any) => {
          const shiftInfo = getShiftInfoByGUID(record.shiftId);
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{text || t("common.noData")}</div>
              {shiftInfo ? (
                <Tag
                  color={shiftInfo.colorCode || "blue"}
                  style={{
                    color: shiftInfo.fontColor || "#fff",
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {i18n.language === "ar" ? shiftInfo.shiftTypeNameAr : shiftInfo.shiftTypeNameEn}
                </Tag>
              ) : (
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{t("shiftPlanning.noShift")}</div>
              )}
            </div>
          );
        },
      },
      ...dayColumns,
    ],
    [t, tableData, dayColumns, shiftsMap, i18n.language],
  );

  // Auto-save as draft after generating plan
  const autoSaveDraft = async (planData: any[]) => {
    if (!planData || planData.length === 0) return;
    if (!validRange) return;

    const scheduleEntries = planData.map((item) => ({
      id: 0,
      rosterId: item.rosterId || "00000000-0000-0000-0000-000000000000",
      date: toUTCStartOfDay(item.date),
      inspectorId: item.inspectorId,
      inspectorName: item.inspectorName,
      inspectorNameAr: item.inspectorName,
      zoneId: item.zoneId ?? item.zone_Id ?? "",
      zoneCode: item.zoneCode || "",
      areaId: Array.isArray(item.areasIds) ? item.areasIds[0] : item.areaId,
      areasIds: Array.isArray(item.areasIds) ? item.areasIds : item.areaId ? [item.areaId] : [],
      areaCode: item.areaCode || "",
      shiftId: item.shiftId || "00000000-0000-0000-0000-000000000000",
      shiftCode: item.shiftCode || "",
      batchId: item.batchId || "00000000-0000-0000-0000-000000000000",
      isOff: item.isOff || false,
      offType: item.offType || "",
      offTypeAr: item.offTypeAr || "",
    }));

    const payload = {
      batch: {
        startDate: toUTCStartOfDay(dateRange[0] as Dayjs),
        endDate: toUTCStartOfDay(dateRange[1] as Dayjs),
        persist: true,
      },
      scheduleEntries,
      isPublished: false,
    };
    console.log({ payload });

    try {
      await publishShiftPlan(payload).unwrap();
      refetchDraft();
    } catch (err: any) {
      // Silent fail for auto-save
    }
  };

  /* PLAN button handler (generate plan) */
  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      notification.error(
        { data: { en_Msg: t("shiftPlanning.selectPlanDate"), ar_Msg: t("shiftPlanning.selectPlanDate") } },
        t("common.error"),
      );
      return;
    }

    if (!validRange) {
      notification.error(
        { data: { en_Msg: t("shiftPlanning.selectPlanDate"), ar_Msg: t("shiftPlanning.selectPlanDate") } },
        t("common.error"),
      );
      return;
    }

    const body = {
      startDate: toUTCStartOfDay(dateRange[0] as Dayjs),
      endDate: toUTCStartOfDay(dateRange[1] as Dayjs),
      persist: true,
    };

    console.log("Sending payload:", body);

    try {
      const res: any = await getShiftPlan(body).unwrap();
      if (res.successful) {
        console.log("Plan data received:", res.data);
        setRawApiData(res.data || []);
        setHasDataLoaded(true);
        setHasValidData(true);
        setIsLoadedFromDraft(false);
        resetAllFilters();
        notification.success({ data: { en_Msg: res.en_Msg, ar_Msg: res.ar_Msg } }, t("messages.operationSuccess"));

        await autoSaveDraft(res.data || []);
      } else {
        notification.error({ data: { en_Msg: res.en_Msg, ar_Msg: res.ar_Msg } }, t("common.error"));
        setHasValidData(false);
      }
    } catch (err: any) {
      notification.error({ data: { en_Msg: err?.data?.en_Msg, ar_Msg: err?.data?.ar_Msg } }, t("common.error"));
      setHasValidData(false);
    }
  };

  /* Convert API -> table rows - USE SHIFTID NOT SHIFTCODE */
  useEffect(() => {
    if (!rawApiData || rawApiData.length === 0) {
      if (!dateRange.length && !hasDataLoaded) {
        generateDefaultTable();
      } else {
        setTableData([]);
        setHasValidData(false);
      }
      return;
    }

    if (!validRange) {
      setTableData([]);
      setHasValidData(false);
      return;
    }

    const start = (dateRange[0] as Dayjs).startOf("day");
    const grouped: Record<string, any> = {};

    rawApiData.forEach((item) => {
      const d = dayjs(item.date).startOf("day");
      const idx = start ? d.diff(start, "day") : d.date() - 1;
      if (idx < 0 || idx >= daysCount) return;

      // Use inspectorId + shiftId as key to group rows
      const key = `${item.inspectorId}-${item.shiftId}`;

      if (!grouped[key]) {
        grouped[key] = {
          key,
          inspector: item.inspectorName,
          inspectorId: item.inspectorId,
          shiftId: item.shiftId, // Store shiftId instead of shiftCode
          days: Array(daysCount).fill("NA"),
          _raw: {},
        };
      }

      if (item.isOff) {
        grouped[key].days[idx] = item.offType === "weekOff" ? "WO" : "LV";
      } else {
        const zoneIdRaw = item.zoneId ?? item.zone_Id ?? item.zoneGUID ?? item.zoneCode ?? "";
        let areaRaw: any = item.areasIds ?? item.areaId ?? item.area_Id ?? item.areaGUID ?? "";

        let areasArray: any[] = [];
        if (Array.isArray(areaRaw)) {
          areasArray = areaRaw;
        } else if (typeof areaRaw === "string" && areaRaw.includes(",")) {
          areasArray = areaRaw.split(",").map((a: string) => a.trim());
        } else if (areaRaw) {
          areasArray = [areaRaw];
        }

        const zoneLabel = zoneIdRaw ? getZoneName(zoneIdRaw) : item.zoneCode || "NA";
        const areaLabels = areasArray.map((aid) => getAreaName(aid)).filter(Boolean);
        const areaLabel = areaLabels.length ? areaLabels.join(", ") : item.areaCode || "NA";

        grouped[key].days[idx] = `${zoneLabel}-${areaLabel}`;
      }

      const normalizedZone = item.zoneId ?? item.zone_Id ?? item.zoneGUID ?? item.zoneCode ?? "";
      let normalizedAreas: any = item.areasIds ?? item.areaId ?? item.area_Id ?? item.areaGUID ?? "";

      let normalizedAreasArray: any[] = [];
      if (Array.isArray(normalizedAreas)) {
        normalizedAreasArray = normalizedAreas;
      } else if (typeof normalizedAreas === "string" && normalizedAreas.includes(",")) {
        normalizedAreasArray = normalizedAreas.split(",").map((s: string) => s.trim());
      } else if (normalizedAreas) {
        normalizedAreasArray = [normalizedAreas];
      }

      grouped[key]._raw[idx] = {
        rosterId: item.rosterId,
        shiftId: item.shiftId,
        batchId: item.batchId,
        inspectorId: item.inspectorId,
        inspectorName: item.inspectorName,
        zoneId: normalizedZone,
        zoneCode: item.zoneCode || "",
        areasIds: normalizedAreasArray,
        areaId: normalizedAreasArray[0] || "",
        areaCode: item.areaCode || "",
        shiftCode: item.shiftCode || "",
        isOff: item.isOff || false,
        offType: item.offType || "",
      };
    });

    const rows = Object.values(grouped).map((r: any) => ({ ...r, _raw: r._raw || {} }));
    console.log("Table rows created:", rows);
    setTableData(rows);
    setHasDataLoaded(true);
    setHasValidData(rows.length > 0);
  }, [rawApiData, dateRange, daysCount, validRange, allAreasLookup, zonesLookup]);

  /* Filtered data by shift - use shiftId */
  const filteredTableData = useMemo(() => {
    if (shiftFilter.length === 0) return tableData;
    return tableData.filter((row) => shiftFilter.includes(row.shiftId));
  }, [tableData, shiftFilter]);

  /* Cell style helper */
  const getCellStyle = (value: string) => {
    if (value === "LV") return { background: "#ffccc7", color: "#a8071a", fontWeight: 600 };
    if (value === "WO") return { background: "#fff7e6", color: "#d46b08", fontWeight: 600 };
    if (value?.includes("-")) return { background: "#e6f7ff", color: "#0050b3" };
    return {};
  };

  /* Render cell with proper multi-area handling */
  const renderDayCell = (value: string, index: number, row: any) => {
    const cellRaw = (row._raw && row._raw[index]) || {};

    if (value === "WO") {
      return (
        <Tooltip
          title={
            <div>
              <b>{t("form.inspector")}:</b> {row.inspector}
              <br />
              <b>{t("shiftPlanning.day")}:</b> {index + 1}
              <br />
              <b>{t("form.status")}:</b> {t("shiftPlanning.weekOff")}
            </div>
          }
        >
          <div style={{ padding: 6, textAlign: "center", borderRadius: 4, ...getCellStyle(value) }}>{value}</div>
        </Tooltip>
      );
    }

    if (value === "LV") {
      return (
        <Tooltip
          title={
            <div>
              <b>{t("form.inspector")}:</b> {row.inspector}
              <br />
              <b>{t("shiftPlanning.day")}:</b> {index + 1}
              <br />
              <b>{t("form.status")}:</b> {t("shiftPlanning.leave")}
            </div>
          }
        >
          <div style={{ padding: 6, textAlign: "center", borderRadius: 4, ...getCellStyle(value) }}>{value}</div>
        </Tooltip>
      );
    }

    const zoneId = cellRaw.zoneId ?? "";

    let areaIds: string[] = [];
    if (Array.isArray(cellRaw.areasIds)) {
      areaIds = cellRaw.areasIds;
    } else if (cellRaw.areasIds && typeof cellRaw.areasIds === "string") {
      areaIds = cellRaw.areasIds.includes(",")
        ? cellRaw.areasIds.split(",").map((a: string) => a.trim())
        : [cellRaw.areasIds];
    } else if (cellRaw.areaId) {
      areaIds = Array.isArray(cellRaw.areaId) ? cellRaw.areaId : [cellRaw.areaId];
    }

    const zoneName = zoneId ? getZoneName(zoneId) : "";
    const areaNames = areaIds.length ? areaIds.map((aid) => getAreaName(aid)).filter(Boolean) : [];
    const display = zoneName || areaNames.length ? `${zoneName}-${areaNames.join(", ")}` : value || t("common.noData");

    const shiftGUID = cellRaw.shiftId || row.shiftId || "";
    const shiftInfo = getShiftInfoByGUID(shiftGUID);
    const shiftName = shiftInfo
      ? i18n.language === "ar"
        ? shiftInfo.shiftTypeNameAr
        : shiftInfo.shiftTypeNameEn
      : t("common.noData");

    return (
      <Tooltip
        title={
          <div style={{ maxWidth: 320 }}>
            <div>
              <b>{t("form.inspector")}:</b> {row.inspector}
            </div>
            <div>
              <b>{t("shiftPlanning.day")}:</b> {index + 1}
            </div>
            <div>
              <b>{t("form.Shift")}:</b> {shiftName}
            </div>
            {shiftInfo && (
              <div style={{ fontSize: 11, color: "#ddd", marginTop: 2 }}>
                {dayjs(shiftInfo.shiftTimeFrom).format("HH:mm")} - {dayjs(shiftInfo.shiftTimeTo).format("HH:mm")}
              </div>
            )}
            <div>
              <b>{t("form.zone")}:</b> {zoneName || t("common.noData")}
            </div>
            <div>
              <b>{t("form.area")}:</b> {areaNames.length ? areaNames.join(", ") : t("common.noData")}
            </div>
            <div style={{ marginTop: 6 }}>
              <Button type="link" style={{ color: "#ff4d4f", padding: 0 }} onClick={() => openEdit(row, value, index)}>
                {t("common.edit")}
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ padding: 6, textAlign: "center", borderRadius: 6, minWidth: 100, ...getCellStyle(display) }}>
          {display}
        </div>
      </Tooltip>
    );
  };

  /* Open edit modal with ALL areas selected */
  const openEdit = (row: any, value: string, dayIndex: number) => {
    const cellRaw = (row._raw && row._raw[dayIndex]) || {};

    let areaValue: any[] = [];
    if (Array.isArray(cellRaw.areasIds)) {
      areaValue = cellRaw.areasIds;
    } else if (cellRaw.areasIds && typeof cellRaw.areasIds === "string") {
      areaValue = cellRaw.areasIds.includes(",")
        ? cellRaw.areasIds.split(",").map((a: string) => a.trim())
        : [cellRaw.areasIds];
    } else if (cellRaw.areaId) {
      areaValue = Array.isArray(cellRaw.areaId) ? cellRaw.areaId : [cellRaw.areaId];
    }

    const zoneValue = cellRaw.zoneId || "";

    form.setFieldsValue({
      inspector: row.inspector,
      zone: zoneValue,
      area: areaValue,
    });

    (async () => {
      if (zoneValue) {
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
      } else {
        setAreasLookup(allAreasLookup);
      }
    })();

    setEditing({ rowKey: row.key, dayIndex, row });
    setIsModalOpen(true);
  };

  /* saveEdit with proper multi-area handling */
  const saveEdit = async () => {
    try {
      const values = await form.validateFields();
      const zoneValue = values.zone;
      const areaValue = values.area;

      if (!zoneValue) {
        message.warning("Select zone");
        return;
      }
      if (!areaValue || areaValue.length === 0) {
        message.warning("Select area");
        return;
      }

      const zoneObj = zonesLookup.find((z) => String(z.value) === String(zoneValue));
      const areaObjs = areaValue
        .map((id: any) => allAreasLookup.find((a) => String(a.value) === String(id)))
        .filter(Boolean);

      const zoneName = zoneObj?.label;
      const areaNames = areaObjs.map((a: any) => a?.label).filter(Boolean);

      setTableData((prev) =>
        prev.map((row) => {
          if (row.key !== editing?.rowKey) return row;

          const updatedDays = [...row.days];
          updatedDays[editing.dayIndex] = `${zoneName}-${areaNames.join(", ")}`;

          const backendRaw = row._raw[editing.dayIndex];

          const newRaw = {
            ...row._raw,
            [editing.dayIndex]: {
              rosterId: backendRaw.rosterId,
              shiftId: backendRaw.shiftId,
              batchId: backendRaw.batchId,
              inspectorId: row.inspectorId,
              inspectorName: row.inspector,
              zoneId: zoneValue,
              zoneCode: zoneObj?.original?.zoneCode || backendRaw.zoneCode,
              areasIds: areaValue,
              areaId: areaValue[0],
              areaCode: areaObjs[0]?.original?.areaCode || backendRaw.areaCode,
              shiftCode: backendRaw.shiftCode,
            },
          };

          return { ...row, days: updatedDays, _raw: newRaw };
        }),
      );

      const backendRaw = editing.row._raw[editing.dayIndex];
      const editKey = `${editing.rowKey}_${editing.dayIndex}`;

      setEditsMap((prev) => ({
        ...prev,
        [editKey]: {
          ...backendRaw,
          dayIndex: editing.dayIndex,
          zoneId: zoneValue,
          areasIds: areaValue,
          areaCode: areaObjs[0]?.original?.areaCode || backendRaw.areaCode,
        },
      }));

      setIsModalOpen(false);
      setEditing(null);
      message.success("Updated");
    } catch (err) {
      // Validation failed
    }
  };

  /* Build scheduleEntries from ALL data or edits */
  const buildScheduleEntriesFromEdits = () => {
    const entries: any[] = [];
    const start = dateRange[0]?.startOf("day");
    if (!start) return entries;

    if (Object.keys(editsMap).length === 0 && hasValidData) {
      tableData.forEach((row) => {
        Object.keys(row._raw || {}).forEach((dayIdx) => {
          const e = row._raw[dayIdx];
          const entryDate = start.add(Number(dayIdx), "day");

          entries.push({
            id: 0,
            rosterId: e.rosterId,
            date: toUTCStartOfDay(entryDate),
            inspectorId: e.inspectorId,
            inspectorName: e.inspectorName,
            inspectorNameAr: e.inspectorName,
            zoneId: e.zoneId,
            zoneCode: e.zoneCode,
            areaId: e.areasIds[0],
            areasIds: e.areasIds,
            areaCode: e.areaCode,
            shiftId: e.shiftId,
            shiftCode: e.shiftCode,
            batchId: e.batchId,
            isOff: e.isOff || false,
            offType: e.offType || "",
            offTypeAr: e.offTypeAr || "",
          });
        });
      });
    } else {
      Object.values(editsMap).forEach((e: any) => {
        const entryDate = start.add(e.dayIndex, "day");

        entries.push({
          id: 0,
          rosterId: e.rosterId,
          date: toUTCStartOfDay(entryDate),
          inspectorId: e.inspectorId,
          inspectorName: e.inspectorName,
          inspectorNameAr: e.inspectorName,
          zoneId: e.zoneId,
          zoneCode: e.zoneCode,
          areaId: e.areasIds[0],
          areasIds: e.areasIds,
          areaCode: e.areaCode,
          shiftId: e.shiftId,
          shiftCode: e.shiftCode,
          batchId: e.batchId,
          isOff: false,
          offType: "",
          offTypeAr: "",
        });
      });
    }

    return entries;
  };

  /* Publish or Save Draft handlers */
  const handlePublishOrDraft = async (publish: boolean) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.error(t("shiftPlanning.selectPlanDate"));
      return;
    }

    const scheduleEntries = buildScheduleEntriesFromEdits();
    if (scheduleEntries.length === 0) {
      message.warning(publish ? "No data to publish" : "No data to save as draft");
      return;
    }

    const payload = {
      batch: {
        startDate: toUTCStartOfDay(dateRange[0] as Dayjs),
        endDate: toUTCStartOfDay(dateRange[1] as Dayjs),
        persist: true,
      },
      scheduleEntries,
      isPublished: publish,
    };

    console.log("Publishing payload:", payload);

    try {
      const res = await publishShiftPlan(payload).unwrap();

      notification.success(
        { data: { en_Msg: res?.en_Msg || (publish ? "Published" : "Saved as draft"), ar_Msg: res?.ar_Msg || "" } },
        t("messages.operationSuccess"),
      );

      setEditsMap({});
      setRawApiData([]);
      setTableData([]);
      setHasValidData(false);
      setHasDataLoaded(false);
      setInspectorFilter("");
      setShiftFilter([]);
      setCurrentPage(0);
      setActiveTab("1");
      setViewMode("week");
      setDateRange([]);
      form.resetFields();

      if (isModalOpen) {
        setIsModalOpen(false);
        setEditing(null);
      }

      generateDefaultTable();

      if (!publish && typeof refetchDraft === "function") {
        refetchDraft();
      }
    } catch (err: any) {
      if (err?.data?.en_Msg) {
        message.error(err.data.en_Msg);
      } else if (err?.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat();
        message.error(errorMessages.join(", "));
      } else {
        message.error(t("common.error"));
      }
    }
  };

  /* JSX return */
  return (
    <>
      {contextHolder}

      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Card>
          <Form form={form} layout="inline">
            <Form.Item
              label={t("shiftPlanning.planDate", "Plan Date")}
              name="planDate"
              rules={[{ required: true, message: t("shiftPlanning.selectPlanDate", "Please select plan date") }]}
            >
              <RangePicker
                value={dateRange as any}
                onCalendarChange={(val) => setTempStart(val?.[0] || null)}
                onChange={(v) => {
                  setDateRange(v || []);
                  form.setFieldsValue({ planDate: v });
                  setCurrentPage(0);
                  if (!v || !v[0]) {
                    if (!hasDataLoaded) generateDefaultTable();
                    setRawApiData([]);
                    resetAllFilters();
                  }
                  setTempStart(null);
                }}
                disabledDate={(current) => {
                  if (!current) return false;
                  if (current < dayjs().startOf("day")) return true;
                  const start = dateRange[0];
                  if (start) {
                    const maxEnd = (start as Dayjs).add(6, "month").endOf("day");
                    if (current < (start as Dayjs).startOf("day")) return true;
                    if (current > maxEnd) return true;
                  } else {
                    const maxFromToday = dayjs().add(6, "month").endOf("day");
                    if (current > maxFromToday) return true;
                  }
                  return false;
                }}
                format="DD-MM-YYYY"
                placeholder={[t("placeholders.startDate", "Start Date"), t("placeholders.endDate", "End Date")]}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" onClick={handleSubmit} loading={isPlanning}>
                {t("shiftPlanning.plan", "Plan")}
              </Button>
            </Form.Item>

            <Form.Item label={t("shiftPlanning.shiftFilter", "Shift Filter")}>
              <Select
                mode="multiple"
                placeholder={t("shiftPlanning.selectShifts", "Select Shifts")}
                style={{ minWidth: 200 }}
                value={shiftFilter}
                onChange={setShiftFilter}
                allowClear
                loading={isShiftsLoading}
              >
                {availableShifts.map((shift) => (
                  <Select.Option key={shift.value} value={shift.value}>
                    {shift.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 12, color: "#888" }}>{t("shiftPlanning.previousBatch", "previous batch")}</div>
                {lastBatch?.data ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 600 }}>
                      {t("shiftPlanning.publishedBy", "Published by")}:{" "}
                      {lastBatch.data.addByName || lastBatch.data.addBy}
                    </div>
                    <div style={{ color: "#666", fontSize: 12 }}>
                      {t("shiftPlanning.publishedOn", "Published On")}:{" "}
                      {dayjs(lastBatch.data.addOn).isValid()
                        ? dayjs(lastBatch.data.addOn).format("DD-MM-YYYY HH:mm")
                        : "-"}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#999", marginTop: 6 }}>
                    {t("shiftPlanning.noPreviousBatch", "No previous batch")}
                  </div>
                )}
              </div>
            </Form.Item>
          </Form>
        </Card>

        {hasValidData && daysCount > 7 && (
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {t("shiftPlanning.totalDays", "Total Days")}: {daysCount} ({Math.ceil(daysCount / 7)}{" "}
                    {t("shiftPlanning.weeks", "weeks")})
                  </div>
                  <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="week">{t("shiftPlanning.weekView", "Week View (7 days)")}</Radio.Button>
                    <Radio.Button value="month">{t("shiftPlanning.monthView", "Month View (30 days)")}</Radio.Button>
                    <Radio.Button value="all">{t("shiftPlanning.allView", "All Days")}</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              {viewMode !== "all" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f5f5f5",
                    borderRadius: 8,
                  }}
                >
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    {t("common.previous", "Previous")}
                  </Button>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {t("shiftPlanning.days", "Days")} {startDayIndex + 1} - {endDayIndex}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {t("shiftPlanning.page", "Page")} {currentPage + 1} / {totalPages}
                    </div>
                  </div>

                  <Button
                    icon={<RightOutlined />}
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    {t("common.next", "Next")}
                  </Button>
                </div>
              )}
            </Space>
          </Card>
        )}

        <Card bordered>
          <Tabs
            type="card"
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarExtraContent={
              <Space>
                <Button onClick={() => handlePublishOrDraft(false)} loading={isPublishing}>
                  {t("shiftPlanning.saveDraft", "Save Draft")}
                </Button>
                <Button type="primary" onClick={() => handlePublishOrDraft(true)} loading={isPublishing}>
                  {t("shiftPlanning.publish", "Publish")}
                </Button>
              </Space>
            }
          >
            <TabPane tab={t("common.all", "All")} key="1">
              <Table
                dataSource={filteredTableData}
                columns={columns}
                bordered
                scroll={{ x: viewMode === "all" ? daysCount * 120 + 300 : "max-content", y: 650 }}
                pagination={false}
                rowKey="key"
              />
            </TabPane>

            <TabPane tab={t("shiftPlanning.inspectorWise", "Inspector Wise")} key="3">
              <Card style={{ marginBottom: 10 }}>
                <Select
                  placeholder={t("shiftPlanning.selectInspector", "Select Inspector")}
                  style={{ width: 240 }}
                  allowClear
                  value={inspectorFilter}
                  onChange={setInspectorFilter}
                >
                  {[...new Set(filteredTableData.map((d) => d.inspector))].map((insp) => (
                    <Select.Option key={insp} value={insp}>
                      {insp}
                    </Select.Option>
                  ))}
                </Select>
              </Card>

              <Table
                dataSource={
                  inspectorFilter ? filteredTableData.filter((d) => d.inspector === inspectorFilter) : filteredTableData
                }
                columns={columns}
                bordered
                scroll={{ x: viewMode === "all" ? daysCount * 120 + 300 : "max-content", y: 650 }}
                pagination={false}
                rowKey="key"
              />
            </TabPane>
          </Tabs>
        </Card>

        <Modal
          title={t("common.edit", "Edit")}
          open={isModalOpen}
          onOk={saveEdit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditing(null);
          }}
          okText={t("common.update", "Update")}
          cancelText={t("common.cancel", "Cancel")}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label={t("form.inspector")} name="inspector">
              <Input disabled />
            </Form.Item>

            <Form.Item
              label={t("form.zone")}
              name="zone"
              rules={[{ required: true, message: t("shiftPlanning.selectZone") }]}
            >
              <Select
                placeholder={t("placeholders.zone")}
                showSearch
                optionFilterProp="children"
                allowClear
                onChange={async (value) => {
                  form.setFieldsValue({ area: [] });

                  if (!value) {
                    setAreasLookup(allAreasLookup);
                    return;
                  }

                  try {
                    const res = await triggerGetAreas(value).unwrap();
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
                      (z) => String(z.value) === String(value) || String(z.id) === String(value),
                    );
                    const zoneIdToFilter = selectedZone?.value || selectedZone?.id || value;
                    setAreasLookup(allAreasLookup.filter((a) => String(a.zoneId) === String(zoneIdToFilter)));
                  }
                }}
              >
                {zonesLookup.map((z) => (
                  <Select.Option key={z.value} value={z.value}>
                    {z.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t("form.area")}
              name="area"
              rules={[{ required: true, message: t("shiftPlanning.selectArea") }]}
            >
              <Select
                mode="multiple"
                placeholder={t("placeholders.area")}
                showSearch
                optionFilterProp="children"
                allowClear
                disabled={!form.getFieldValue("zone")}
              >
                {areasLookup.map((a) => (
                  <Select.Option key={a.value} value={a.value}>
                    {a.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </>
  );
}
