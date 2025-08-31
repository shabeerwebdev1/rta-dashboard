import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "date-fns";
import {
  DragOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  TableOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Zone & Area mapping
const zoneMapping: Record<string, string> = {
  Z1: "Zone 1",
  Z2: "Zone 2",
  A1: "Gandhi Nagar",
  A2: "MG Road",
  A3: "Brigade Road",
  A4: "Koramangala",
  A5: "Indiranagar",
  A6: "Whitefield",
  A7: "HSR Layout",
  A8: "BTM Layout",
  A9: "Electronic City",
  A10: "Jayanagar",
  A11: "Bannerghatta",
  A12: "KR Puram",
  A13: "Yelahanka",
  A14: "Hebbal",
  A15: "Marathahalli",
  A16: "Vijayanagar",
  A17: "Basavanagudi",
  A18: "Rajajinagar",
  A19: "Ulsoor",
  A20: "Shivajinagar",
  A21: "Domlur",
  A22: "Banashankari",
  A23: "Malleswaram",
  A24: "Sadashivanagar",
  A25: "Frazer Town",
  A26: "Lingarajapuram",
  A27: "Cooke Town",
  A28: "Kengeri",
  A29: "Nagawara",
  A30: "Peenya",
  A31: "Chickpet",
};

// --- Sample data (moved into state so edits can be saved locally) ---
const initialData = [
  {
    key: 1,
    slno: 1,
    inspector: "Inspector 1",
    inspectorId: "INS001",
    month: "August",
    shift: "Morning",
    days: [
      "Z1-A1",
      "Z1-A2",
      "LV",
      "WO",
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "LV",
      "WO",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "Z1-A18",
      "LV",
      "WO",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
    ],
  },
  {
    key: 2,
    slno: 2,
    inspector: "Inspector 2",
    inspectorId: "INS002",
    month: "August",
    shift: "Morning",
    days: [
      "Z1-A4",
      "Z1-A3",
      "WO",
      "Z1-A5",
      "Z1-A6",
      "Z1-A7",
      "Z1-A8",
      "LV",
      "WO",
      "Z1-A9",
      "Z1-A10",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "LV",
      "WO",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "LV",
      "WO",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "Z1-A1",
    ],
  },
  {
    key: 3,
    slno: 3,
    inspector: "Inspector 3",
    inspectorId: "INS003",
    month: "August",
    shift: "Afternoon",
    days: [
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "LV",
      "WO",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "Z1-A11",
      "LV",
      "WO",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "LV",
      "WO",
      "Z1-A17",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "LV",
      "WO",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
    ],
  },
  {
    key: 4,
    slno: 4,
    inspector: "Inspector 4",
    inspectorId: "INS004",
    month: "September",
    shift: "Morning",
    days: [
      "Z2-A1",
      "Z2-A2",
      "LV",
      "WO",
      "Z2-A3",
      "Z2-A4",
      "Z2-A5",
      "Z2-A6",
      "Z2-A7",
      "Z2-A8",
      "Z2-A9",
      "Z2-A10",
      "LV",
      "WO",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "Z2-A18",
      "LV",
      "WO",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
    ],
  },
  {
    key: 5,
    slno: 5,
    inspector: "Inspector 5",
    inspectorId: "INS005",
    month: "September",
    shift: "Night",
    days: [
      "Z2-A4",
      "Z2-A3",
      "WO",
      "Z2-A5",
      "Z2-A6",
      "Z2-A7",
      "Z2-A8",
      "LV",
      "WO",
      "Z2-A9",
      "Z2-A10",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "LV",
      "WO",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "LV",
      "WO",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "Z2-A1",
    ],
  },
];

// helpers
const monthIndexByName: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

const monthNameByIndex = (i: number) =>
  [
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
  ][i];

function getDayNamesForMonth(year: number, monthIndex: number) {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  return days.map((d) => ({
    dayOfMonth: format(d, "d"),
    dayOfWeek: format(d, "EEE"),
    isSunday: isSunday(d),
    fullDate: d,
  }));
}

export default function AdhocShiftPlan() {
  // --- view state
  const [activeTab, setActiveTab] = useState("1");
  const [viewMode, setViewMode] = useState<"table" | "list" | "calendar">(
    "table"
  );

  // data state
  const [rows, setRows] = useState(initialData);

  // top controls
  // Default selectedInspector to first inspector so calendar initially shows only 1 inspector's data
  const defaultInspector = initialData[0]?.inspector;
  const [selectedInspector, setSelectedInspector] = useState<string | undefined>(
    defaultInspector
  );
  const [dateRange, setDateRange] = useState<any[]>([]);

  // calendar header state (month & year selectors inside Calendar only)
  const today = new Date();
  const [calYear, setCalYear] = useState(getYear(today));
  const [calMonthIdx, setCalMonthIdx] = useState(getMonth(today));

  const dayNames = useMemo(
    () => getDayNamesForMonth(calYear, calMonthIdx),
    [calYear, calMonthIdx]
  );

  // --- drag selection (table) ---
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<number | null>(null);

  // --- calendar drag selection ---
  const [calIsSelecting, setCalIsSelecting] = useState(false);
  const [calSelStart, setCalSelStart] = useState<number | null>(null);
  const [calSelEnd, setCalSelEnd] = useState<number | null>(null);
  const [calSelectedInspector, setCalSelectedInspector] = useState<string | undefined>(defaultInspector);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [form] = Form.useForm();
  // extra state for table tabs
const [tableTab, setTableTab] = useState("monthly");


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
        // open modal for calendar selection if we have a valid range
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

  // cell coloring (accessible for dark mode)
  const getCellStyle = (value: string, dayIndex?: number, isSun?: boolean) => {
    let style: React.CSSProperties = {
      color: "#111",
      backgroundColor: "#fff",
    };

    if (value === "LV") style = { backgroundColor: "#ff4d4f", color: "#fff", fontWeight: 600 };
    else if (value === "WO") style = { backgroundColor: "#fa8c16", color: "#fff", fontWeight: 600 };
    else if (value?.startsWith("Z")) style = { backgroundColor: "#e6f4ff", color: "#0958d9", fontWeight: 500 };

    if (isSun) {
      style = { ...style, outline: "2px solid #b7eb8f" };
    }

    // selection band (table)
    if (
      selectionStart !== null &&
      selectionEnd !== null &&
      dayIndex !== undefined &&
      selectedRowKey !== null
    ) {
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
    if (isSelecting && selectedRowKey === row.key) {
      setSelectionEnd(dayIndex);
    }
  };

  const openEditForSelection = (row: any, startDayIndex: number, endDayIndex?: number) => {
    const value = row.days[startDayIndex];
    const zone = value?.includes("-") ? value.split("-")[0] : undefined;
    const area = value?.includes("-") ? value.split("-")[1] : undefined;

    setEditingData({ ...row, zone, area, dayStart: startDayIndex + 1, dayEnd: (endDayIndex ?? startDayIndex) + 1 });
    form.setFieldsValue({
      inspector: row.inspector,
      shift: row.shift,
      zone,
      area,
    });
    setIsModalOpen(true);
  };

  const handleMouseUp = (row: any) => {
    if (
      isSelecting &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectedRowKey === row.key
    ) {
      setIsSelecting(false);
      const startDay = Math.min(selectionStart, selectionEnd);
      const endDay = Math.max(selectionStart, selectionEnd);
      openEditForSelection(row, startDay, endDay);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedRowKey(null);
    }
  };

  // calendar drag handlers
  const calHandleMouseDown = (idx: number) => {
    setCalIsSelecting(true);
    setCalSelStart(idx);
    setCalSelEnd(idx);
  };
  const calHandleMouseEnter = (idx: number) => {
    if (calIsSelecting) {
      setCalSelEnd(idx);
    }
  };

  const openCalendarEdit = (startIdx: number, endIdx: number) => {
    const s = Math.min(startIdx, endIdx);
    const e = Math.max(startIdx, endIdx);
    // find inspector row by calSelectedInspector (or default first)
    const inspName = calSelectedInspector || defaultInspector;
    const row = rows.find((r) => r.inspector === inspName) || rows[0];
    setEditingData({ ...row, dayStart: s + 1, dayEnd: e + 1, zone: row.days[s]?.split("-")[0], area: row.days[s]?.split("-")[1] });
    form.setFieldsValue({ inspector: row.inspector, shift: row.shift, zone: row.days[s]?.split("-")[0], area: row.days[s]?.split("-")[1] });
    setIsModalOpen(true);
  };

  // modal save
  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        // if editingData has dayStart/dayEnd apply changes
        if (editingData && editingData.dayStart && editingData.dayEnd) {
          const startIdx = editingData.dayStart - 1;
          const endIdx = editingData.dayEnd - 1;

          setRows((prev) =>
            prev.map((r) => {
              if (r.inspector !== values.inspector && r.key !== editingData.key) return r;
              // if modal was opened from table, match by key; if from calendar, match by inspector
              const match = editingData.key ? r.key === editingData.key : r.inspector === values.inspector;
              if (!match) return r;
              const updated = { ...r } as any;
              updated.inspector = values.inspector;
              updated.shift = values.shift;
              for (let i = startIdx; i <= endIdx; i++) {
                updated.days[i] = `${values.zone}-${values.area}`;
              }
              return updated;
            })
          );
        }

        setIsModalOpen(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectedRowKey(null);
        setCalSelStart(null);
        setCalSelEnd(null);
      })
      .catch(() => {});
  };

  // dynamic table columns based on current calendar month
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
    render: (value: string, row: any) => (
      <Tooltip
        title={
          value?.includes("-") ? (
            <div style={{ maxWidth: 250 }}>
              <p style={{ marginBottom: 4 }}>
                <b>Inspector:</b> {row.inspector}
              </p>
              <p style={{ marginBottom: 4 }}>
                <b>Date:</b> {day.dayOfMonth} {monthNameByIndex(calMonthIdx)} ({
                  day.dayOfWeek
                })
              </p>
              <p style={{ marginBottom: 4 }}>
                <b>Shift:</b> {row.shift}
              </p>
              <p style={{ marginBottom: 4 }}>
                <b>Zone:</b> {zoneMapping[value.split("-")[0]] || value.split("-")[0]}
              </p>
              <p style={{ marginBottom: 8 }}>
                <b>Area:</b> {zoneMapping[value.split("-")[1]] || value.split("-")[1]}
              </p>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditForSelection(row, i)}
              >
                Edit
              </Button>
            </div>
          ) : value === "LV" ? (
            "Leave"
          ) : value === "WO" ? (
            "Week Off"
          ) : (
            "Not Assigned"
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
    ),
  }));

  const columns = [
    {
      title: "Inspector",
      dataIndex: "inspector",
      key: "inspector",
      fixed: "left" as const,
      width: 160,
      filters: [
        ...new Set(rows.map((d) => d.inspector)),
      ].map((x) => ({ text: x as string, value: x })),
      onFilter: (value: any, record: any) => record.inspector === value,
      sorter: (a: any, b: any) => a.inspector.localeCompare(b.inspector),
    },
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      fixed: "left" as const,
      width: 120,
      filters: [
        ...new Set(rows.map((d) => d.month)),
      ].map((x) => ({ text: x as string, value: x })),
      onFilter: (value: any, record: any) => record.month === value,
      sorter: (a: any, b: any) => a.month.localeCompare(b.month),
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
      fixed: "left" as const,
      width: 120,
      filters: [
        ...new Set(rows.map((d) => d.shift)),
      ].map((x) => ({ text: x as string, value: x })),
      onFilter: (value: any, record: any) => record.shift === value,
      sorter: (a: any, b: any) => a.shift.localeCompare(b.shift),
    },
    ...dayColumns,
  ];

  // table datasource filtered by inspector at top (only for table view per spec)
  const tableData = useMemo(() => {
    if (!selectedInspector || viewMode !== "calendar") return rows;
    // For calendar, we will filter separately in dateCellRender; table should show all unless user filters via column.
    return rows;
  }, [rows, selectedInspector, viewMode]);

  // Top controls (spec 3): only View buttons + Inspector + DateRange + Plan button
  // Inspector dropdown should be hidden in List view (spec 4)

  const inspectorOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.inspector))),
    [rows]
  );

  const handlePlan = () => {
    // Hook up to your API later
    console.log("Plan clicked", { selectedInspector, dateRange });
  };

  // List View: today -> next 10 days
  const next10Days = useMemo(() => {
    const arr = [] as Date[];
    for (let i = 0; i < 10; i++) arr.push(addDays(today, i));
    return arr;
  }, [today]);

  const listData = useMemo(() => {
    return rows.map((ins) => {
      const days = next10Days.map((dt) => {
        // only map if same month as current calendar month; else show NA
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

  // Calendar cell renderer with inspector filtering + accessible chips + drag handlers
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

    // If the calendar selection is active we want to highlight cells in the selected range
    const selStart = calSelStart;
    const selEnd = calSelEnd;
    const inSel = selStart !== null && selEnd !== null && dayIndex >= Math.min(selStart, selEnd) && dayIndex <= Math.max(selStart, selEnd);

    const cell = (
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
        {assignments.length > 3 && (
          <div style={{ fontSize: 11, opacity: 0.75 }}>+{assignments.length - 3} more</div>
        )}
      </div>
    );

    return cell;
  };

  // Calendar custom header: month dropdown + year dropdown (current & future only) + inspector name on right
  const calendarHeaderRender = ({ value, onChange }: any) => {
    const curYear = getYear(new Date());
    const years = Array.from({ length: 6 }).map((_, i) => curYear + i); // current + 5 years
    const months = Array.from({ length: 12 }).map((_, i) => ({ label: monthNameByIndex(i), value: i }));

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

        {/* Inspector display at right of calendar header */}
        <div>
          <Select
            value={calSelectedInspector}
            onChange={(v) => setCalSelectedInspector(v)}
            options={inspectorOptions.map((x) => ({ label: x, value: x }))}
            style={{ width: 220 }}
          />
        </div>
      </div>
    );
  };

  return (
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
                Table View
              </Button>
              <Button
                type={viewMode === "list" ? "primary" : "default"}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode("list")}
              >
                List View (Next 10 Days)
              </Button>
              <Button
                type={viewMode === "calendar" ? "primary" : "default"}
                icon={<CalendarOutlined />}
                onClick={() => setViewMode("calendar")}
              >
                Calendar View
              </Button>
            </Space>
          </Col>

          {/* Inspector dropdown hidden in List view per spec */}
          {viewMode !== "list" && (
            <Col>
              <Select
                allowClear
                placeholder="Select Inspector"
                style={{ width: 220 }}
                value={selectedInspector}
                onChange={(v) => { setSelectedInspector(v); setCalSelectedInspector(v); }}
                options={inspectorOptions.map((x) => ({ label: x, value: x }))}
              />
            </Col>
          )}

          <Col>
            <RangePicker onChange={(val) => setDateRange(val as any)} />
          </Col>

          <Col>
            <Button type="primary" onClick={handlePlan}>
              Plan
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Legend card above calendar */}
      {viewMode === "calendar" && (
        <Card size="small" style={{ width: 420 }}>
          <Space>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 14, height: 14, background: "#ff4d4f", borderRadius: 3 }} />
              <div>Leave (LV)</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 14, height: 14, background: "#fa8c16", borderRadius: 3 }} />
              <div>Week Off (WO)</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 14, height: 14, background: "#e6f4ff", borderRadius: 3 }} />
              <div>Assigned (Z-A)</div>
            </div>
          </Space>
        </Card>
      )}

      {viewMode === "table" && (
        <Card bordered>
          <Tabs
            type="card"
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarExtraContent={<Button type="primary">Publish</Button>}
          >
            <TabPane tab="Monthly" key="1">
              <Table
                dataSource={tableData}
                columns={columns}
                // keep Inspector/Month/Shift columns fixed; days scroll horizontally
                scroll={{ x: Math.max(1200, 200 + dayNames.length * 90), y: 700 }}
                bordered
                pagination={false}
                rowKey="key"
              />
            </TabPane>
            <TabPane tab="Inspector Wise" key="2">
              <Table
                dataSource={selectedInspector ? rows.filter((d) => d.inspector === selectedInspector) : []}
                columns={columns}
                scroll={{ x: Math.max(1200, 200 + dayNames.length * 90), y: 700 }}
                bordered
                pagination={false}
                rowKey="key"
              />
            </TabPane>
            <TabPane tab="All" key="3">
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

      {viewMode === "list" && (
        <Card title="Next 10 Days" bordered>
          <List
            itemLayout="vertical"
            dataSource={listData}
            renderItem={(item) => (
              <List.Item>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>
                  {item.inspector} ({item.inspectorId}) – {item.shift} Shift
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
                          color:
                            d.value === "LV" ? "#a8071a" : d.value === "WO" ? "#d46b08" : "#0958d9",
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

      {viewMode === "calendar" && (
        <Card
          title={<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>Shift Calendar – {monthNameByIndex(calMonthIdx)} {calYear}</div>
            <div style={{ fontWeight: 600 }}>{calSelectedInspector}</div>
          </div>}
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
        title="Edit Shift Details"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Save Changes"
        cancelText="Cancel"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="inspector" label="Inspector" rules={[{ required: true, message: "Please select inspector" }]}>
            <Select
              options={inspectorOptions.map((x) => ({ label: x, value: x }))}
              placeholder="Select inspector"
            />
          </Form.Item>

          <Form.Item name="shift" label="Shift" rules={[{ required: true, message: "Please select a shift" }]}>
            <Select>
              <Select.Option value="Morning">Morning</Select.Option>
              <Select.Option value="Afternoon">Afternoon</Select.Option>
              <Select.Option value="Night">Night</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="zone" label="Zone" rules={[{ required: true, message: "Please select a zone" }]}>
            <Select>
              <Select.Option value="Z1">Zone 1</Select.Option>
              <Select.Option value="Z2">Zone 2</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="area" label="Area" rules={[{ required: true, message: "Please select an area" }]}>
            <Select
              options={Object.entries(zoneMapping)
                .filter(([k]) => k.startsWith("A"))
                .map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
