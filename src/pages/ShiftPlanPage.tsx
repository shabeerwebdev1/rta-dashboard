/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, DatePicker, Table, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { usePage } from "../contexts/PageContext"; // Add this import
import { useTranslation } from "react-i18next";

import { startOfMonth, endOfMonth, eachDayOfInterval, format as dfFormat, isSunday as dfIsSunday } from "date-fns";

const { Option } = Select;

const shiftLegend = [
  { code: "A", times: "6:00AM to 2:00PM", color: "#0b5394" },
  { code: "A1", times: "10:00AM to 6:00PM", color: "#154360" },
  { code: "B", times: "2:00PM to 10:00PM", color: "#1f6aa5" },
  { code: "B1", times: "1:00PM to 9:00PM", color: "#29a3ff" },
  { code: "B2", times: "12:00PM to 8:00PM", color: "#29a3ff" },
  { code: "B3", times: "4:00PM to 12:00AM", color: "#29a3ff" },
  { code: "B4", times: "6:00PM to 2:00AM", color: "#29a3ff" },
  { code: "c", times: "10:00PM to 6:00AM", color: "#29a3ff" },
  { code: "c1", times: "8:00PM to 4:00AM", color: "#29a3ff" },
  { code: "c2", times: "10:00PM to 6:00AM", color: "#29a3ff" },
  { code: "LV", times: "Leave", color: "#d9534f" },
  { code: "WO", times: "Week Off", color: "#f0ad4e" },
];

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

// ---------- Initial inspectors ----------
const initialRows = [
  {
    key: 1,
    inspector: "Abdullah Ibrahim Shahdad Ali",
    phone: "971507283734",
    shift: "Morning",
    days: [] as string[],
  },
  {
    key: 2,
    inspector: "Mohammed Khaled Mohammed Alsayyad",
    phone: "971506560630",
    shift: "Morning",
    days: [] as string[],
  },
  {
    key: 3,
    inspector: "Yousuf Mohammed Ali M Allengawy",
    phone: "971584501818",
    shift: "Night",
    days: [] as string[],
  },
];

// ---------- helper to get days for month ----------
function getDayNamesForMonth(year: number, monthIndex: number) {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  return days.map((d) => ({
    dayOfMonth: dfFormat(d, "d"),
    dayOfWeek: dfFormat(d, "EEE"),
    isSunday: dfIsSunday(d),
  }));
}

export default function ShiftPlanPage() {
  const { setPageTitle } = usePage(); // Add this
  const { t } = useTranslation(); // Add this
  const today = new Date();

  // calendar month & year
  const [calYear, setCalYear] = useState<number>(today.getFullYear());
  const [calMonthIdx, setCalMonthIdx] = useState<number>(today.getMonth());

  // top controls
  const [planNo, setPlanNo] = useState<string>("");
  const [planDate, setPlanDate] = useState<any>(null);
  const [status, setStatus] = useState<string>("Draft");
  const [inspectionType, setInspectionType] = useState<string>("Monthly");

  // rows (initialize to current month length)
  const [rows, setRows] = useState(() => {
    const count = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return initialRows.map((r) => ({ ...r, days: Array.from({ length: count }).map(() => "NA") }));
  });

  // selection drag state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectRowKey, setSelectRowKey] = useState<number | null>(null);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  // modals
  const [isAddInspectorOpen, setIsAddInspectorOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [isEditSelectionOpen, setIsEditSelectionOpen] = useState(false);
  const [editForm] = Form.useForm();

  const [isPatternOpen, setIsPatternOpen] = useState(false);
  const [patternForm] = Form.useForm();

  const dayNames = useMemo(() => getDayNamesForMonth(calYear, calMonthIdx), [calYear, calMonthIdx]);

  // When month changes, KEEP previous data for overlapping indices (user requested)
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => {
        const newLen = dayNames.length;
        const old = r.days || [];
        const copyLen = Math.min(old.length, newLen);
        const newDays = new Array(newLen).fill("NA");
        for (let i = 0; i < copyLen; i++) newDays[i] = old[i];
        // extra days remain NA
        return { ...r, days: newDays };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear, calMonthIdx]);

  useEffect(() => {
    setPageTitle(t("sidebar.shiftplan"));
  }, [setPageTitle]);

  // cell styling
  const getCellStyle = (val: string, isSun?: boolean, inSelection?: boolean) => {
    const base: React.CSSProperties = {
      padding: 6,
      minHeight: 36,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 600,
      cursor: "pointer",
      userSelect: "none",
    };
    if (val === "LV") {
      base.backgroundColor = "#d9534f";
      base.color = "#fff";
    } else if (val === "WO") {
      base.backgroundColor = "#f0ad4e";
      base.color = "#fff";
    } else if (val && val.startsWith("Z")) {
      base.backgroundColor = "#0b5ed7";
      base.color = "#fff";
    } else {
      base.backgroundColor = "#fff";
      base.color = "#111";
    }
    if (isSun) base.outline = "2px solid #b7eb8f";
    if (inSelection) base.boxShadow = "inset 0 0 0 2px #1677ff";
    return base;
  };

  // dynamic table columns
  const dayColumns = dayNames.map((d, i) => ({
    title: (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: d.isSunday ? 700 : 500, color: d.isSunday ? "#cf1322" : undefined }}>
          {d.dayOfMonth}
        </div>
        <div style={{ fontSize: 10 }}>{d.dayOfWeek}</div>
      </div>
    ),
    dataIndex: ["days", i],
    key: `day${i + 1}`,
    width: 82,
    render: (value: string, row: any) => {
      const inSel =
        selectRowKey === row.key &&
        selStart !== null &&
        selEnd !== null &&
        i >= Math.min(selStart, selEnd) &&
        i <= Math.max(selStart, selEnd);

      return (
        <Tooltip title={value && value !== "NA" ? `${row.inspector} — ${value}` : `${row.inspector} — Not Assigned`}>
          <div
            style={getCellStyle(value || "NA", d.isSunday, inSel)}
            onMouseDown={() => {
              setIsSelecting(true);
              setSelectRowKey(row.key);
              setSelStart(i);
              setSelEnd(i);
            }}
            onMouseEnter={() => {
              if (isSelecting && selectRowKey === row.key) {
                setSelEnd(i);
              }
            }}
            onMouseUp={() => {
              if (isSelecting && selectRowKey === row.key && selStart !== null && selEnd !== null) {
                setIsSelecting(false);
                setIsEditSelectionOpen(true);
                // set form defaults
                const start = Math.min(selStart, selEnd);
                editForm.setFieldsValue({
                  zoneAndArea: row.days[start] || "Z1-A1",
                  inspectorName: row.inspector,
                  shift: row.shift,
                });
              }
            }}
          >
            {value || "NA"}
          </div>
        </Tooltip>
      );
    },
  }));

  const columns: any[] = [
    {
      title: "#",
      dataIndex: "key",
      key: "sl",
      width: 60,
      render: (_: any, __: any, idx: number) => <div style={{ textAlign: "center" }}>{idx + 1}</div>,
    },
    {
      title: "Inspector",
      dataIndex: "inspector",
      key: "inspector",
      width: 260,
      render: (v: string, r: any) => (
        <div>
          <div style={{ fontWeight: 700 }}>{v}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{r.phone}</div>
        </div>
      ),
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
      width: 120,
    },
    ...dayColumns,
  ];

  // ---------- Timing Table Columns ----------
  const timingColumns = [
    {
      title: "Shift Code",
      dataIndex: "code",
      key: "code",
      width: 100,
      render: (code: string) => (
        <div
          style={{
            padding: "8px",
            backgroundColor: shiftLegend.find((s) => s.code === code)?.color || "#fff",
            color: "#fff",
            fontWeight: "bold",
            textAlign: "center",
            borderRadius: "4px",
          }}
        >
          {code}
        </div>
      ),
    },
    {
      title: "Timing",
      dataIndex: "times",
      key: "times",
      width: 200,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
  ];

  // ---------- Additional Deployment Data Table ----------
  const deploymentDataColumns = [
    {
      title: "Zone",
      dataIndex: "zone",
      key: "zone",
      width: 100,
    },
    {
      title: "Area",
      dataIndex: "area",
      key: "area",
      width: 150,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Inspector Count",
      dataIndex: "inspectorCount",
      key: "inspectorCount",
      width: 120,
      render: (count: number) => <div style={{ textAlign: "center", fontWeight: "bold" }}>{count}</div>,
    },
  ];

  const deploymentData = [
    { key: 1, zone: "Z1", area: "A1", location: "Gandhi Nagar", inspectorCount: 2 },
    { key: 2, zone: "Z1", area: "A2", location: "MG Road", inspectorCount: 1 },
    { key: 3, zone: "Z1", area: "A3", location: "Brigade Road", inspectorCount: 1 },
    { key: 4, zone: "Z2", area: "A1", location: "Koramangala", inspectorCount: 1 },
    { key: 5, zone: "Z2", area: "A2", location: "Indiranagar", inspectorCount: 2 },
  ];

  // ---------- Add Inspector ----------
  const handleAddInspector = () => {
    addForm.validateFields().then((vals) => {
      const nextKey = Math.max(0, ...rows.map((r) => r.key)) + 1;
      const newRow = {
        key: nextKey,
        inspector: vals.inspector,
        phone: vals.phone,
        shift: vals.shift,
        days: Array.from({ length: dayNames.length }).map(() => "NA"),
      };
      setRows((p) => [...p, newRow]);
      addForm.resetFields();
      setIsAddInspectorOpen(false);
      message.success("Inspector added");
    });
  };

  // ---------- Edit selection modal (apply zone/LV/WO to selected range) ----------
  const applyEditSelection = async () => {
    const values = await editForm.validateFields();
    if (!selectRowKey || selStart === null || selEnd === null) {
      setIsEditSelectionOpen(false);
      return;
    }
    const start = Math.min(selStart, selEnd);
    const end = Math.max(selStart, selEnd);
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== selectRowKey) return r;
        const updated = [...r.days];
        for (let i = start; i <= end; i++) updated[i] = values.zoneAndArea;
        return { ...r, days: updated };
      }),
    );
    // clear selection
    setSelectRowKey(null);
    setSelStart(null);
    setSelEnd(null);
    setIsEditSelectionOpen(false);
    message.success("Selection updated");
  };

  // ---------- Pattern modal (apply repeating pattern) ----------
  const applyPattern = async () => {
    const vals = await patternForm.validateFields();
    const patternCount = vals.patternCount;
    const pattern: string[] = [];
    for (let i = 1; i <= patternCount; i++) pattern.push(vals[`d${i}`]);
    const applyAll = !!vals.applyAll;
    // apply pattern: if not applyAll, apply to first inspector
    setRows((prev) =>
      prev.map((r, idx) => {
        if (!applyAll && idx !== 0) return r;
        const newDays = [...r.days];
        for (let i = 0; i < newDays.length; i++) {
          newDays[i] = pattern[i % pattern.length];
        }
        return { ...r, days: newDays };
      }),
    );
    patternForm.resetFields();
    setIsPatternOpen(false);
    message.success("Pattern applied");
  };

  // ---------- CSV export ---------

  // ---------- simple Save / Submit / Cancel ----------
  const handleSaveDraft = () => message.success("Saved as draft (local)");
  const handleSubmit = () => message.success("Submitted (local)");
  const handleCancel = () => message.info("Cancelled");

  useEffect(() => {
    setRows((prev) =>
      prev.map((r, idx) => {
        const pattern = ["Z1-A1", "Z1-A2", "Z1-A3", "LV", "WO"];
        const newDays = prev[0].days.map((_, i) => pattern[(i + idx) % pattern.length]);
        return { ...r, days: newDays };
      }),
    );
  }, []);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      {/* Title */}

      {/* Card 1 - Plan info */}
      <Card>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 6, fontSize: 12, color: "#666" }}>Plan No</div>
            <Input placeholder="Plan No" value={planNo} onChange={(e) => setPlanNo(e.target.value)} />
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 6, fontSize: 12, color: "#666" }}>Plan Date</div>
            <DatePicker style={{ width: "100%" }} value={planDate} onChange={(d) => setPlanDate(d)} />
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 6, fontSize: 12, color: "#666" }}>Status</div>
            <Select style={{ width: "100%" }} value={status} onChange={(v) => setStatus(v)}>
              <Option value="Draft">Draft</Option>
              <Option value="Send to Manager Review">Send to Manager Review</Option>
              <Option value="Approved">Approved</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Card 2 - Inspection period */}
      <Card>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 6, fontSize: 12, color: "#666" }}>Inspection Type</div>
            <Select style={{ width: "100%" }} value={inspectionType} onChange={(v) => setInspectionType(v)}>
              <Option value="Monthly">Monthly</Option>
              <Option value="Weekly">Weekly</Option>
            </Select>
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 6, fontSize: 12, color: "#666" }}>Year</div>
            <Select style={{ width: "100%" }} value={calYear} onChange={(y) => setCalYear(Number(y))}>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = today.getFullYear() + i;
                return (
                  <Option key={y} value={y}>
                    {y}
                  </Option>
                );
              })}
            </Select>
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 6, fontSize: 12, color: "#666" }}>Month</div>
            <Select style={{ width: "100%" }} value={calMonthIdx} onChange={(m) => setCalMonthIdx(Number(m))}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Option key={i} value={i}>
                  {monthNameByIndex(i)}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Deployment Details */}
      <Card
        title="Deployment Details"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsAddInspectorOpen(true)}>
              Add Inspector
            </Button>
            <Button onClick={() => setIsPatternOpen(true)}>Apply Pattern</Button>
          </Space>
        }
      >
        <Table
          dataSource={rows}
          columns={columns}
          pagination={false}
          rowKey="key"
          scroll={{ x: Math.max(1100, 90 * dayNames.length), y: 420 }}
          bordered
        />
      </Card>

      {/* Shift Timing Legend */}

      <Card size="small">
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            flexWrap: "nowrap",
            overflow: "hidden",
            width: "100%",
          }}
        >
          {shiftLegend.map((s, index) => (
            <React.Fragment key={s.code}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  alignItems: "center",
                  padding: "4px 0",
                }}
              >
                {/* TOP: COLORED SHIFT CODE */}
                <div
                  style={{
                    background: s.color,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "3px 12px",
                    borderRadius: 6,
                    marginBottom: 4,
                    width: "fit-content",
                  }}
                >
                  {s.code.toUpperCase()}
                </div>

                {/* BOTTOM: TIME */}
                <div
                  style={{
                    fontSize: 10,
                    lineHeight: "12px",
                    textAlign: "center",
                    color: "black",
                    whiteSpace: "normal",
                  }}
                >
                  {s.times}
                </div>
              </div>

              {/* VERTICAL SEPARATOR (except after last item) */}
              {index !== shiftLegend.length - 1 && (
                <div
                  style={{
                    width: 1,
                    background: "#ccc",
                    margin: "0 6px",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Additional Deployment Data Table */}
      <Card title="Zone-wise Deployment Summary" size="small">
        <Table
          dataSource={deploymentData}
          columns={deploymentDataColumns}
          pagination={false}
          rowKey="key"
          bordered
          size="small"
        />
      </Card>

      {/* Footer Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button style={{ background: "#f0ad4e", color: "#fff" }} onClick={handleSaveDraft}>
          Save as Draft
        </Button>
        <Button style={{ background: "#28a745", color: "#fff" }} onClick={handleSubmit}>
          Submit
        </Button>
        <Button onClick={handleCancel}>Cancel</Button>
      </div>

      {/* Add Inspector Modal */}
      <Modal
        title="Add Inspector"
        open={isAddInspectorOpen}
        onCancel={() => setIsAddInspectorOpen(false)}
        onOk={handleAddInspector}
        okText="Add"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="inspector" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Inspector name" />
          </Form.Item>
          <Form.Item name="phone" label="Mobile" rules={[{ required: true }]}>
            <Input placeholder="Mobile number" />
          </Form.Item>
          <Form.Item name="shift" label="Shift" initialValue="Morning" rules={[{ required: true }]}>
            <Select>
              <Option value="Morning">Morning</Option>
              <Option value="Afternoon">Afternoon</Option>
              <Option value="Night">Night</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Selection Modal */}
      <Modal
        title="Edit Selected Range"
        open={isEditSelectionOpen}
        onCancel={() => {
          setIsEditSelectionOpen(false);
          setSelectRowKey(null);
          setSelStart(null);
          setSelEnd(null);
        }}
        onOk={applyEditSelection}
        okText="Apply"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="inspectorName" label="Inspector">
            <Input disabled />
          </Form.Item>
          <Form.Item name="shift" label="Shift">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="zoneAndArea"
            label="Assign (Zone-Area / LV / WO)"
            rules={[{ required: true, message: "Please select a value" }]}
          >
            <Select>
              <Option value="Z1-A1">Z1-A1</Option>
              <Option value="Z1-A2">Z1-A2</Option>
              <Option value="Z1-A3">Z1-A3</Option>
              <Option value="Z2-A1">Z2-A1</Option>
              <Option value="LV">LV</Option>
              <Option value="WO">WO</Option>
            </Select>
          </Form.Item>
          {selStart !== null && selEnd !== null && (
            <div style={{ fontSize: 12, color: "#666" }}>
              Range: {Math.min(selStart, selEnd) + 1} — {Math.max(selStart, selEnd) + 1}
            </div>
          )}
        </Form>
      </Modal>

      {/* Pattern Modal */}
      <Modal
        title="Apply Repeating Pattern"
        open={isPatternOpen}
        onCancel={() => setIsPatternOpen(false)}
        onOk={applyPattern}
        width={720}
        okText="Apply"
      >
        <Form
          form={patternForm}
          layout="vertical"
          initialValues={{ patternCount: 3, d1: "Z1-A1", d2: "Z1-A2", d3: "Z1-A3" }}
        >
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="patternCount" label="Pattern Length">
                <Select>
                  <Option value={2}>2</Option>
                  <Option value={3}>3</Option>
                  <Option value={4}>4</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="applyAll" valuePropName="checked">
                <label>
                  <input type="checkbox" /> Apply to all inspectors
                </label>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="d1" label="Day 1" rules={[{ required: true }]}>
                <Select>
                  <Option value="Z1-A1">Z1-A1</Option>
                  <Option value="Z1-A2">Z1-A2</Option>
                  <Option value="LV">LV</Option>
                  <Option value="WO">WO</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="d2" label="Day 2" rules={[{ required: true }]}>
                <Select>
                  <Option value="Z1-A2">Z1-A2</Option>
                  <Option value="Z1-A3">Z1-A3</Option>
                  <Option value="LV">LV</Option>
                  <Option value="WO">WO</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="d3" label="Day 3" rules={[{ required: true }]}>
                <Select>
                  <Option value="Z1-A3">Z1-A3</Option>
                  <Option value="Z2-A1">Z2-A1</Option>
                  <Option value="LV">LV</Option>
                  <Option value="WO">WO</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 8, color: "#666" }}>
            Tip: choose pattern length and values. Pattern repeats across the month.
          </div>
        </Form>
      </Modal>
    </Space>
  );
}
