/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
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
import { useGetShiftPlanMutation, useLazyGetZonesQuery, useGetAllAreasQuery } from "../services/rtkApiFactory";
import { useAppNotification } from "../utils/notificationManager";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

type ViewMode = "week" | "month" | "all";

export default function CreateShiftPlan() {
  const { setPageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();

  const [getShiftPlan, { isLoading }] = useGetShiftPlanMutation();

  // lookup hooks
  const [triggerGetZones] = useLazyGetZonesQuery();
  const { data: allAreasData } = useGetAllAreasQuery();

  const [zonesLookup, setZonesLookup] = useState<any[]>([]);
  const [areasLookup, setAreasLookup] = useState<any[]>([]);

  // main data
  const [rawApiData, setRawApiData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [form] = Form.useForm();

  const [dateRange, setDateRange] = useState<Dayjs[]>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // NEW: View mode and pagination state
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentPage, setCurrentPage] = useState(0);

  // Track if we have loaded data from API to prevent reset on language change
  const [hasDataLoaded, setHasDataLoaded] = useState(false);

  // Track if we have valid data to show pagination
  const [hasValidData, setHasValidData] = useState(false);
  // Temporary start date during selection
  const [tempStart, setTempStart] = useState<Dayjs | null>(null);

  // Shift mapping with translations
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

  // Set page title and initial NA table - only on mount
  useEffect(() => {
    setPageTitle(t(ShiftPlanningConfig.title));
    if (!hasDataLoaded) {
      generateDefaultTable();
    }
    loadLookups();
  }, [setPageTitle, t]);

  // Separate effect for language changes to update title without resetting data
  useEffect(() => {
    setPageTitle(t(ShiftPlanningConfig.title));
  }, [i18n.language, setPageTitle, t]);

  // Load lookups: zones via lazy trigger, areas via useGetAllAreasQuery (auto)
  const loadLookups = async () => {
    try {
      const zonesRes: any = await triggerGetZones().unwrap();
      const zones = zonesRes?.data ? zonesRes.data : Array.isArray(zonesRes) ? zonesRes : [];
      setZonesLookup(zones);
    } catch (err) {
      // fail silently but log
      console.error("Failed to load zones:", err);
    }
  };

  // when allAreasData arrives set area lookup
  useEffect(() => {
    if (!allAreasData) return;
    const areas = allAreasData?.data ? allAreasData.data : Array.isArray(allAreasData) ? allAreasData : [];
    setAreasLookup(areas);
  }, [allAreasData]);

  // Generate default NA table (30 days)
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

  // Reset all filters and data when creating new plan or clearing date
  const resetAllFilters = () => {
    setInspectorFilter("");
    setShiftFilter([]);
    setActiveTab("1");
    setCurrentPage(0);
    setViewMode("week");
    setHasValidData(false);
  };

  // days count derived from dateRange - with 6 months maximum limit
  const daysCount = useMemo(() => {
    if (dateRange.length === 2) {
      const diff = dateRange[1].diff(dateRange[0], "day") + 1;
      const maxDays = 6 * 30; // Approximately 6 months
      return Math.min(Math.max(diff, 1), maxDays); // Enforce 6 months maximum
    }
    return 30;
  }, [dateRange]);

  // NEW: Calculate pagination parameters
  const daysPerPage = useMemo(() => {
    if (viewMode === "week") return 7;
    if (viewMode === "month") return 30;
    return daysCount; // "all" mode
  }, [viewMode, daysCount]);

  const totalPages = useMemo(() => {
    if (viewMode === "all") return 1;
    return Math.ceil(daysCount / daysPerPage);
  }, [daysCount, daysPerPage, viewMode]);

  const startDayIndex = currentPage * daysPerPage;
  const endDayIndex = Math.min(startDayIndex + daysPerPage, daysCount);

  // Reset to page 0 when view mode changes
  useEffect(() => {
    setCurrentPage(0);
  }, [viewMode]);

  // Day columns - now supports pagination
  const dayColumns = useMemo(() => {
    const columnsToShow = viewMode === "all" ? daysCount : Math.min(daysPerPage, endDayIndex - startDayIndex);

    if (dateRange.length === 2) {
      const start = dateRange[0];
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
          width: 90,
          render: (value: string, row: any) => renderDayCell(value, actualDayIndex, row),
        };
      });
    }

    return Array.from({ length: columnsToShow }, (_, i) => {
      const actualDayIndex = startDayIndex + i;
      return {
        title: (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600 }}>{t("shiftPlanning.dayNumber", { number: actualDayIndex + 1 })}</div>
          </div>
        ),
        dataIndex: ["days", actualDayIndex],
        key: `day${actualDayIndex + 1}`,
        width: 90,
        render: (value: string, row: any) => renderDayCell(value, actualDayIndex, row),
      };
    });
  }, [dateRange, daysCount, startDayIndex, endDayIndex, viewMode, daysPerPage, t]);

  // Get unique shifts for filter
  const availableShifts = useMemo(() => {
    const shifts = [...new Set(tableData.map((d) => d.shiftCode).filter(Boolean))];
    return shifts.map((code) => ({
      text: shiftMap[code] || code,
      value: code,
    }));
  }, [tableData, shiftMap]);

  const columns = useMemo(
    () => [
      {
        title: t("form.inspector"),
        dataIndex: "inspector",
        key: "inspector",
        width: 180,
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

  // PLAN button action
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

    if (dateRange.length !== 2) {
      notification.error(
        { data: { en_Msg: t("shiftPlanning.selectPlanDate"), ar_Msg: t("shiftPlanning.selectPlanDate") } },
        t("common.error"),
      );
      return;
    }

    const body = {
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
      persist: true,
    };

    try {
      const res: any = await getShiftPlan(body).unwrap();

      if (res.successful) {
        setRawApiData(res.data || []);
        setHasDataLoaded(true);
        setHasValidData(true); // Set valid data flag
        resetAllFilters(); // Reset all filters when new plan is created

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

  // Convert API → table rows
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

    const start = dateRange[0]?.startOf("day");
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
        const zoneCode = item.zoneCode || "NA";
        const areaCode = item.areaCode || "NA";
        grouped[key].days[idx] = `${zoneCode}-${areaCode}`;
      }

      grouped[key]._raw[idx] = {
        zoneId: item.zoneId || "",
        areaId: item.areaId || "",
        zoneCode: item.zoneCode || "NA",
        areaCode: item.areaCode || "NA",
        shiftCode: item.shiftCode || "",
      };
    });

    const rows = Object.values(grouped).map((r: any) => ({
      ...r,
      _raw: r._raw || {},
    }));

    setTableData(rows);
    setHasDataLoaded(true);
    setHasValidData(rows.length > 0); // Only set valid data if we have actual rows
  }, [rawApiData, dateRange, daysCount]);

  // Filtered table data based on shift filter
  const filteredTableData = useMemo(() => {
    if (shiftFilter.length === 0) return tableData;
    return tableData.filter((row) => shiftFilter.includes(row.shiftCode));
  }, [tableData, shiftFilter]);

  // lookup helpers
  const getZoneName = (zoneId: string) => {
    if (!zoneId) return t("common.noData");
    const z = zonesLookup.find(
      (x) => x.zoneId === zoneId || x.id === zoneId || x.zoneId?.toLowerCase() === zoneId?.toLowerCase(),
    );
    if (!z) return t("common.noData");
    return z.zone || z.zoneName || z.description || z.name || t("common.noData");
  };

  const getAreaName = (areaId: string) => {
    if (!areaId) return t("common.noData");
    const a = areasLookup.find(
      (x) => x.areaId === areaId || x.id === areaId || x.areaId?.toLowerCase() === areaId?.toLowerCase(),
    );
    if (!a) return t("common.noData");
    return a.area || a.areaName || a.description || a.name || t("common.noData");
  };

  // cell style
  const getCellStyle = (value: string) => {
    if (value === "LV") return { background: "#ffccc7", color: "#a8071a", fontWeight: 600 };
    if (value === "WO") return { background: "#fff7e6", color: "#d46b08", fontWeight: 600 };
    if (value?.includes("-")) return { background: "#e6f7ff", color: "#0050b3" };
    return {};
  };

  // render cell
  const renderDayCell = (value: string, index: number, row: any) => {
    const cellRaw = (row._raw && row._raw[index]) || {};

    // Detect WO / LV
    if (value === "WO") {
      return (
        <Tooltip
          title={
            <div>
              <b>{t("form.inspector")}:</b> {row.inspector || t("common.noData")} <br />
              <b>{t("shiftPlanning.day")}:</b> {index + 1} <br />
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
              <b>{t("form.inspector")}:</b> {row.inspector || t("common.noData")} <br />
              <b>{t("shiftPlanning.day")}:</b> {index + 1} <br />
              <b>{t("form.status")}:</b> {t("shiftPlanning.leave")}
            </div>
          }
        >
          <div style={{ padding: 6, textAlign: "center", borderRadius: 4, ...getCellStyle(value) }}>{value}</div>
        </Tooltip>
      );
    }

    // --- Default cell (Zone-Area) ---
    const zoneCode = cellRaw.zoneCode ?? t("common.noData");
    const areaCode = cellRaw.areaCode ?? t("common.noData");
    const zoneId = cellRaw.zoneId ?? "";
    const areaId = cellRaw.areaId ?? "";

    const zoneName = zoneId ? getZoneName(zoneId) : t("common.noData");
    const areaName = areaId ? getAreaName(areaId) : t("common.noData");

    const shiftCode = cellRaw.shiftCode || row.shiftCode || "";
    const shiftName = shiftCode ? shiftMap[shiftCode] || shiftCode : t("common.noData");

    return (
      <Tooltip
        title={
          <div style={{ maxWidth: 300 }}>
            <div>
              <b>{t("form.inspector")}:</b> {row.inspector || t("common.noData")}
            </div>
            <div>
              <b>{t("shiftPlanning.day")}:</b> {index + 1}
            </div>
            <div>
              <b>{t("form.Shift")}:</b> {shiftName}
            </div>
            <div>
              <b>{t("form.zone")}:</b> {zoneCode} — {zoneName}
            </div>
            <div>
              <b>{t("form.area")}:</b> {areaCode} — {areaName}
            </div>
            <div style={{ marginTop: 6 }}>
              <Button type="link" style={{ color: "red", padding: 0 }} onClick={() => openEdit(row, value, index)}>
                {t("common.edit")}
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ padding: 6, textAlign: "center", borderRadius: 4, ...getCellStyle(value || "NA") }}>
          {value || t("common.noData")}
        </div>
      </Tooltip>
    );
  };

  // open modal for editing
  const openEdit = (row: any, value: string, dayIndex: number) => {
    const cellRaw = (row._raw && row._raw[dayIndex]) || {};
    const zoneId = cellRaw.zoneId || "";
    const areaId = cellRaw.areaId || "";
    form.setFieldsValue({ inspector: row.inspector, zone: zoneId, area: areaId });
    setEditing({ rowKey: row.key, dayIndex });
    setIsModalOpen(true);
  };

  const saveEdit = async () => {
    const zoneValue = form.getFieldValue("zone");
    const areaValue = form.getFieldValue("area");

    if (!zoneValue || !areaValue) {
      message.warning(t("shiftPlanning.selectZoneArea"));
      return;
    }

    // Find selected zone and area to get their codes
    const selectedZone = zonesLookup.find((z) => z.zoneId === zoneValue || z.id === zoneValue);
    const selectedArea = areasLookup.find((a) => a.areaId === areaValue || a.id === areaValue);

    const zoneCode = selectedZone?.zoneCode || selectedZone?.code || t("common.noData");
    const areaCode = selectedArea?.areaCode || selectedArea?.code || t("common.noData");

    setTableData((old) =>
      old.map((row) => {
        if (row.key !== editing?.rowKey) return row;
        const updated = [...row.days];
        updated[editing.dayIndex] = `${zoneCode}-${areaCode}`;
        const newRaw = { ...(row._raw || {}) };
        newRaw[editing.dayIndex] = {
          zoneCode: zoneCode,
          areaCode: areaCode,
          zoneId: zoneValue,
          areaId: areaValue,
        };
        return { ...row, days: updated, _raw: newRaw };
      }),
    );
    setIsModalOpen(false);
  };

  // Safe translation function with fallbacks
  const safeT = (key: string, fallback?: string) => {
    return t(key) || fallback || key;
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Card>
        <Form form={form} layout="inline">
          <Form.Item
            label={safeT("shiftPlanning.planDate", "Plan Date")}
            name="planDate"
            rules={[{ required: true, message: safeT("shiftPlanning.selectPlanDate", "Please select plan date") }]}
            required={false}
          >
            <RangePicker
              value={dateRange as any}
              onCalendarChange={(val) => {
                // This fires on first click → captures start date
                setTempStart(val?.[0] || null);
              }}
              onChange={(v) => {
                setDateRange(v || []);
                form.setFieldsValue({ planDate: v });
                setCurrentPage(0);

                // Reset filters/table
                if (!v) {
                  if (!hasDataLoaded) generateDefaultTable();
                  setRawApiData([]);
                  resetAllFilters();
                }

                // After selection completes → clear temp start
                setTempStart(null);
              }}
              disabledDate={(current) => {
                if (!current) return false;

                // Disable past
                if (current < dayjs().startOf("day")) return true;

                // If user picked a start date while selecting
                if (tempStart) {
                  const maxEnd = tempStart.add(6, "month");
                  const minEnd = tempStart; // prevent selecting dates before start
                  return current > maxEnd || current < minEnd;
                }

                // No start selected → disable dates > 6 months from today
                const maxRange = dayjs().add(6, "month");
                return current > maxRange;
              }}
              format="DD-MM-YYYY"
              placeholder={[safeT("placeholders.startDate", "Start Date"), safeT("placeholders.endDate", "End Date")]}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSubmit} loading={isLoading}>
              {safeT("shiftPlanning.plan", "Plan")}
            </Button>
          </Form.Item>

          {/* Shift Filter */}
          <Form.Item label={safeT("shiftPlanning.shiftFilter", "Shift Filter")}>
            <Select
              mode="multiple"
              placeholder={safeT("shiftPlanning.selectShifts", "Select Shifts")}
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
            <label>{safeT("shiftPlanning.previousBatch", "previous batch")}</label>
          </Form.Item>

          <Form.Item>
            <label>{safeT("shiftPlanning.publishedBy", "Published by")}: user name</label>
          </Form.Item>
        </Form>
      </Card>

      {/* NEW: View Mode and Pagination Controls - Only show when we have valid data */}
      {hasValidData && daysCount > 7 && (
        <Card>
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {safeT("shiftPlanning.totalDays", "Total Days")}: {daysCount} ({Math.ceil(daysCount / 7)}{" "}
                  {safeT("shiftPlanning.weeks", "weeks")})
                </div>
                <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
                  <Radio.Button value="week">{safeT("shiftPlanning.weekView", "Week View (7 days)")}</Radio.Button>
                  <Radio.Button value="month">{safeT("shiftPlanning.monthView", "Month View (30 days)")}</Radio.Button>
                  <Radio.Button value="all">{safeT("shiftPlanning.allView", "All Days")}</Radio.Button>
                </Radio.Group>
              </div>
            </div>

            {/* Pagination Controls */}
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
                  {safeT("common.previous", "Previous")}
                </Button>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {safeT("shiftPlanning.days", "Days")} {startDayIndex + 1} - {endDayIndex}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {safeT("shiftPlanning.page", "Page")} {currentPage + 1} / {totalPages}
                  </div>
                </div>

                <Button
                  icon={<RightOutlined />}
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  iconPosition="end"
                >
                  {safeT("common.next", "Next")}
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
          tabBarExtraContent={<Button type="primary">{safeT("shiftPlanning.publish", "Publish")}</Button>}
        >
          <TabPane tab={safeT("common.all", "All")} key="1">
            <Table
              dataSource={filteredTableData}
              columns={columns}
              bordered
              scroll={{ x: viewMode === "all" ? daysCount * 90 + 200 : "max-content", y: 650 }}
              pagination={false}
            />
          </TabPane>

          <TabPane tab={safeT("shiftPlanning.inspectorWise", "Inspector Wise")} key="3">
            <Card style={{ marginBottom: 10 }}>
              <Select
                placeholder={safeT("shiftPlanning.selectInspector", "Select Inspector")}
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
              scroll={{ x: viewMode === "all" ? daysCount * 90 + 200 : "max-content", y: 650 }}
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={safeT("common.edit", "Edit")}
        open={isModalOpen}
        onOk={saveEdit}
        onCancel={() => setIsModalOpen(false)}
        okText={safeT("common.ok", "OK")}
        cancelText={safeT("common.cancel", "Cancel")}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {safeT("form.inspector", "Inspector")}
            </label>
            <Input value={form.getFieldValue("inspector")} disabled style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {safeT("form.zone", "Zone")} <span style={{ color: "red" }}>*</span>
            </label>
            <Select
              placeholder={safeT("placeholders.zone", "Select zone")}
              style={{ width: "100%" }}
              value={form.getFieldValue("zone")}
              onChange={(value) => form.setFieldsValue({ zone: value })}
              showSearch
              optionFilterProp="children"
            >
              {zonesLookup.map((zone) => (
                <Select.Option key={zone.zoneId || zone.id} value={zone.zoneId || zone.id}>
                  {zone.zone || zone.zoneName || zone.description || zone.name || zone.zoneId || zone.id}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {safeT("form.area", "Area")} <span style={{ color: "red" }}>*</span>
            </label>
            <Select
              placeholder={safeT("placeholders.area", "Select area")}
              style={{ width: "100%" }}
              value={form.getFieldValue("area")}
              onChange={(value) => form.setFieldsValue({ area: value })}
              showSearch
              optionFilterProp="children"
            >
              {areasLookup.map((area) => (
                <Select.Option key={area.areaId || area.id} value={area.areaId || area.id}>
                  {area.area || area.areaName || area.description || area.name || area.areaId || area.id}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </Space>
  );
}
