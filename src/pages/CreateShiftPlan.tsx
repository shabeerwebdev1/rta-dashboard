/* Part 1 of 3 — CreateShiftPlan (imports, lookup loading, date & pagination state) */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
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
} from "antd";
import { LeftOutlined, RightOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
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
} from "../services/rtkApiFactory";
import { useAppNotification } from "../utils/notificationManager";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

type ViewMode = "week" | "month" | "all";

// UUID generator function
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function CreateShiftPlan() {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();

  // RTK hooks
  const [getShiftPlan, { isLoading: isPlanning }] = useGetShiftPlanMutation();
  const [publishShiftPlan, { isLoading: isPublishing }] = usePublishShiftPlanMutation();

  const { data: lastBatch } = useGetLastBatchDetailQuery();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetAreas] = useLazyGetAreasQuery();
  const { data: allAreasData } = useGetAllAreasQuery();

  // lookups normalized
  const [zonesLookup, setZonesLookup] = useState<any[]>([]);
  const [areasLookup, setAreasLookup] = useState<any[]>([]); // current filtered areas (for modal & UI)
  const [allAreasLookup, setAllAreasLookup] = useState<any[]>([]); // full list

  // main table & UI state
  const [rawApiData, setRawApiData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [form] = Form.useForm();

  // RangePicker supports start-only (end can be null)
  const [dateRange, setDateRange] = useState<(Dayjs | null)[]>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string[]>([]);

  // edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // view & pagination
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentPage, setCurrentPage] = useState(0);

  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [hasValidData, setHasValidData] = useState(false);
  const [tempStart, setTempStart] = useState<Dayjs | null>(null);

  // Map shift codes to labels
  const shiftMap: Record<string, string> = useMemo(
    () => ({
      EM: t("shifts.earlyMorning"),
      M: t("shifts.morning"),
      E: t("shifts.evening"),
      LE: t("shifts.lateEvening"),
      AN: t("shifts.afternoon"),
    }),
    [t],
  );

  // Keep track of local edits: key = `${rowKey}_${dayIndex}`, value = { rowKey, dayIndex, zoneId, areasIds, ... }
  // This map stores only user edits (so Publish/Save Draft sends only edited entries).
  const [editsMap, setEditsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    setPageTitle(t(ShiftPlanningConfig.title));
    if (!hasDataLoaded) generateDefaultTable();
    loadZones();
  }, [setPageTitle, t]);

  useEffect(() => {
    setPageTitle(t(ShiftPlanningConfig.title));
  }, [i18n.language, setPageTitle, t]);

  // load zones (normalize)
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
      console.error("Failed to load zones:", err);
    }
  };

  // normalize all areas list for label lookups
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
    // default areas lookup to full list (modal will filter on zone change)
    setAreasLookup(normalized);
  }, [allAreasData]);

  // default NA table (30 days)
  const generateDefaultTable = () => {
    const defaultDays = Array(30).fill("NA");
    setTableData([
      {
        key: "default-row",
        inspector: "",
        inspectorId: "",
        shiftCode: "",
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
    setHasValidData(false);
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

  // pagination helpers
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

  // helper label getters
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

  /* Part 1 ends here — Part 2 continues with columns, day rendering, openEdit/saveEdit (local) */
  /* Part 2 of 3 — columns, day columns, converting API data to UI, render cell, openEdit */

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
  }, [dateRange, daysCount, startDayIndex, endDayIndex, viewMode, daysPerPage, t, validRange]);

  /* Available shifts */
  const availableShifts = useMemo(() => {
    const shifts = [...new Set(tableData.map((d) => d.shiftCode).filter(Boolean))];
    return shifts.map((code) => ({ text: shiftMap[code] || code, value: code }));
  }, [tableData, shiftMap]);

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
        render: (text: string, record: any) => (
          <div>
            <div style={{ fontWeight: 600 }}>{text || t("common.noData")}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {record.shiftCode ? shiftMap[record.shiftCode] || record.shiftCode : t("shiftPlanning.noShift")}
            </div>
          </div>
        ),
      },
      ...dayColumns,
    ],
    [t, tableData, shiftMap, dayColumns],
  );

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
      startDate: (dateRange[0] as Dayjs).toISOString(),
      endDate: (dateRange[1] as Dayjs).toISOString(),
      persist: true,
    };

    try {
      const res: any = await getShiftPlan(body).unwrap();
      if (res.successful) {
        setRawApiData(res.data || []);
        setHasDataLoaded(true);
        setHasValidData(true);
        resetAllFilters();
        notification.success({ data: { en_Msg: res.en_Msg, ar_Msg: res.ar_Msg } }, t("messages.operationSuccess"));
      } else {
        notification.error({ data: { en_Msg: res.en_Msg, ar_Msg: res.ar_Msg } }, t("common.error"));
        setHasValidData(false);
      }
    } catch (err: any) {
      notification.error({ data: { en_Msg: err?.data?.en_Msg, ar_Msg: err?.data?.ar_Msg } }, t("common.error"));
      setHasValidData(false);
    }
  };

  /* Convert API -> table rows (use zone/area lookups to show labels) */
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

      const key = item.inspectorId || `${item.inspectorName}-${item.date}-${idx}`;

      if (!grouped[key]) {
        grouped[key] = {
          key,
          inspector: item.inspectorName,
          inspectorId: item.inspectorId,
          shiftCode: item.shiftCode || "",
          days: Array(daysCount).fill("NA"),
          _raw: {},
        };
      }

      if (item.isOff) {
        grouped[key].days[idx] = item.offType === "weekOff" ? "WO" : "LV";
      } else {
        // show zoneName-areaName
        const zoneIdRaw = item.zoneId ?? item.zone_Id ?? item.zoneGUID ?? item.zoneCode ?? "";
        let areaRaw: any = item.areaId ?? item.area_Id ?? item.areasIds ?? item.areaGUID ?? "";
        if (Array.isArray(areaRaw)) {
          // keep as array
        } else if (typeof areaRaw === "string" && areaRaw.includes(",")) {
          areaRaw = areaRaw.split(",").map((a: string) => a.trim());
        }

        const zoneLabel = zoneIdRaw ? getZoneName(zoneIdRaw) : item.zoneCode || "NA";
        let areaLabel = "";
        if (Array.isArray(areaRaw)) areaLabel = areaRaw.map((aid) => getAreaName(aid)).join(",");
        else areaLabel = getAreaName(areaRaw) || item.areaCode || "NA";

        grouped[key].days[idx] = `${zoneLabel}-${areaLabel}`;
      }

      // normalized ids for editing
      const normalizedZone = item.zoneId ?? item.zone_Id ?? item.zoneGUID ?? item.zoneCode ?? "";
      let normalizedArea: any = item.areaId ?? item.area_Id ?? item.areasIds ?? item.areaGUID ?? "";
      if (!Array.isArray(normalizedArea) && typeof normalizedArea === "string" && normalizedArea.includes(",")) {
        normalizedArea = normalizedArea.split(",").map((s: string) => s.trim());
      }

      grouped[key]._raw[idx] = {
        // keep original backend IDs
        rosterId: item.rosterId,
        shiftId: item.shiftId,
        batchId: item.batchId,

        inspectorId: item.inspectorId,
        inspectorName: item.inspectorName,

        zoneId: normalizedZone,
        zoneCode: item.zoneCode || "",

        areaId: Array.isArray(normalizedArea) ? normalizedArea[0] : normalizedArea,
        areasIds: Array.isArray(normalizedArea) ? normalizedArea : [normalizedArea],
        areaCode: item.areaCode || "",

        shiftCode: item.shiftCode || "",
        isOff: item.isOff || false,
        offType: item.offType || "",
      };
    });

    const rows = Object.values(grouped).map((r: any) => ({ ...r, _raw: r._raw || {} }));
    setTableData(rows);
    setHasDataLoaded(true);
    setHasValidData(rows.length > 0);
  }, [rawApiData, dateRange, daysCount, validRange, allAreasLookup, zonesLookup]);

  /* filtered data by shift */
  const filteredTableData = useMemo(() => {
    if (shiftFilter.length === 0) return tableData;
    return tableData.filter((row) => shiftFilter.includes(row.shiftCode));
  }, [tableData, shiftFilter]);

  /* cell style helper */
  const getCellStyle = (value: string) => {
    if (value === "LV") return { background: "#ffccc7", color: "#a8071a", fontWeight: 600 };
    if (value === "WO") return { background: "#fff7e6", color: "#d46b08", fontWeight: 600 };
    if (value?.includes("-")) return { background: "#e6f7ff", color: "#0050b3" };
    return {};
  };

  /* render cell */
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
    const areaId = cellRaw.areaId ?? "";

    let areaIds: string[] = [];
    if (Array.isArray(areaId)) areaIds = areaId;
    else if (typeof areaId === "string" && areaId.includes(","))
      areaIds = areaId.split(",").map((a: string) => a.trim());
    else if (areaId) areaIds = [areaId];

    const zoneName = zoneId ? getZoneName(zoneId) : "";
    const areaNames = areaIds.length ? areaIds.map((aid) => getAreaName(aid)).filter(Boolean) : [];
    const display = zoneName || areaNames.length ? `${zoneName}-${areaNames.join(",")}` : value || t("common.noData");

    const shiftCode = cellRaw.shiftCode || row.shiftCode || "";
    const shiftName = shiftCode ? shiftMap[shiftCode] || shiftCode : t("common.noData");

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
            <div>
              <b>{t("form.zone")}:</b> {zoneName || t("common.noData")}
            </div>
            <div>
              <b>{t("form.area")}:</b> {areaNames.length ? areaNames.join(", ") : t("common.noData")}
            </div>
            <div style={{ marginTop: 6 }}>
              <Button type="link" style={{ color: "red", padding: 0 }} onClick={() => openEdit(row, value, index)}>
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

  /* open edit modal */
  const openEdit = (row: any, value: string, dayIndex: number) => {
    const cellRaw = (row._raw && row._raw[dayIndex]) || {};

    let areaValue: any = cellRaw.areaId ?? cellRaw.areasIds ?? [];
    if (!Array.isArray(areaValue) && typeof areaValue === "string" && areaValue) {
      if (areaValue.includes(",")) areaValue = areaValue.split(",").map((a: string) => a.trim());
      else areaValue = [areaValue];
    }

    const zoneValue = cellRaw.zoneId || "";

    // Reset form with current values
    form.setFieldsValue({
      inspector: row.inspector,
      zone: zoneValue,
      area: areaValue,
    });

    // Load areas for the selected zone
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
          console.error("areas by zone failed:", err);
          // Fallback: filter all areas by zone ID comparison
          const selectedZone = zonesLookup.find(
            (z) => String(z.value) === String(zoneValue) || String(z.id) === String(zoneValue),
          );
          const zoneIdToFilter = selectedZone?.value || selectedZone?.id || zoneValue;
          setAreasLookup(allAreasLookup.filter((a) => String(a.zoneId) === String(zoneIdToFilter)));
        }
      } else {
        // If no zone, show all areas
        setAreasLookup(allAreasLookup);
      }
    })();

    setEditing({ rowKey: row.key, dayIndex, row });
    setIsModalOpen(true);
  };

  /* Part 2 ends here — Part 3 includes saveEdit (local), publish / saveDraft using RTK mutation, and JSX return */
  /* Part 3 of 3 — saveEdit (local), publish/saveDraft using RTK mutation, and JSX return (modal + buttons) */

  /* saveEdit: update UI locally and add edit to editsMap (only edited entries will be sent) */
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
      const areaObjs = areaValue.map((id) => allAreasLookup.find((a) => String(a.value) === String(id)));

      const zoneName = zoneObj?.label;
      const areaNames = areaObjs.map((a) => a?.label).filter(Boolean);

      setTableData((prev) =>
        prev.map((row) => {
          if (row.key !== editing?.rowKey) return row;

          const updatedDays = [...row.days];
          updatedDays[editing.dayIndex] = `${zoneName}-${areaNames.join(",")}`;

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

              areaId: areaValue[0],
              areasIds: areaValue,
              areaCode: areaObjs[0]?.original?.areaCode || backendRaw.areaCode,

              shiftCode: row.shiftCode,
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
      console.log("Modal validation failed:", err);
    }
  };

  /* build scheduleEntries payload from editsMap only (user requested) */
  const buildScheduleEntriesFromEdits = () => {
    const entries: any[] = [];
    const start = dateRange[0]?.startOf("day");
    if (!start) return entries;

    Object.values(editsMap).forEach((e: any) => {
      const entryDate = start.add(e.dayIndex, "day").startOf("day").toISOString();

      entries.push({
        id: 0,
        rosterId: e.rosterId,
        date: entryDate,

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

    return entries;
  };

  /* Publish or Save Draft click handlers */
  /* Publish or Save Draft click handlers */
  const handlePublishOrDraft = async (publish: boolean) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.error(t("shiftPlanning.selectPlanDate"));
      return;
    }

    const scheduleEntries = buildScheduleEntriesFromEdits();
    if (scheduleEntries.length === 0) {
      message.warning(publish ? "No edits to publish" : "No edits to save as draft");
      return;
    }

    const payload = {
      batch: {
        startDate: (dateRange[0] as Dayjs).toISOString(), // FIX: Use ISO format
        endDate: (dateRange[1] as Dayjs).toISOString(), // FIX: Use ISO format
        persist: true,
      },
      scheduleEntries,
      isPublished: publish,
    };

    console.log("Publishing payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await publishShiftPlan(payload).unwrap();
      notification.success(
        { data: { en_Msg: res?.en_Msg || (publish ? "Published" : "Saved as draft"), ar_Msg: res?.ar_Msg || "" } },
        t("messages.operationSuccess"),
      );
      setEditsMap({});
    } catch (err: any) {
      console.error("publish/saveDraft error:", err);
      // Show specific error message from backend if available
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

  /* JSX return (main UI + modal). Place this at the end of the component */
  return (
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
                    {t("shiftPlanning.publishedBy", "Published by")}: {lastBatch.data.addByName || lastBatch.data.addBy}
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

      {/* View / Pagination controls */}
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

      {/* EDIT MODAL */}
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
          {/* INSPECTOR */}
          <Form.Item label={t("form.inspector")} name="inspector">
            <Input disabled />
          </Form.Item>

          {/* ZONE */}
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
                // Clear areas whenever zone changes
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
                  console.error("Failed loading areas by zone:", err);
                  // Fallback: filter from all areas lookup
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

          {/* AREAS */}
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
  );
}
