import React, { useEffect, useState } from "react";
import { Table, Tabs, Tooltip, Button, Card, Select, DatePicker, Space, Modal, Form } from "antd";
import { ShiftPlanningConfig } from "../config/pageConfigs/shiftPlanningConfig";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { AdhocShiftPlanConfig } from "../config/pageConfigs/adhocShiftPlanConfig";

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

// Sample data
const dataSource = [
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
    ],
    status: "Published",
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
    ],
    status: "Draft",
  },
  {
    key: 3,
    slno: 3,
    inspector: "Inspector 3",
    inspectorId: "INS003",
    month: "August",
    shift: "Morning",
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
    ],
    status: "Published",
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
    ],
    status: "Draft",
  },
  {
    key: 5,
    slno: 5,
    inspector: "Inspector 5",
    inspectorId: "INS005",
    month: "September",
    shift: "Morning",
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
    ],
    status: "Published",
  },
  {
    key: 6,
    slno: 6,
    inspector: "Inspector 6",
    inspectorId: "INS006",
    month: "October",
    shift: "Morning",
    days: [
      "Z1-A8",
      "Z1-A9",
      "LV",
      "WO",
      "Z1-A10",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "LV",
      "WO",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "LV",
      "WO",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "Z1-A30",
      "Z1-A31",
    ],
    status: "Draft",
  },
  {
    key: 7,
    slno: 7,
    inspector: "Inspector 7",
    inspectorId: "INS007",
    month: "October",
    shift: "Morning",
    days: [
      "Z2-A8",
      "Z2-A9",
      "LV",
      "WO",
      "Z2-A10",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "LV",
      "WO",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "LV",
      "WO",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "Z2-A30",
      "Z2-A31",
    ],
    status: "Published",
  },
  {
    key: 8,
    slno: 8,
    inspector: "Inspector 8",
    inspectorId: "INS008",
    month: "November",
    shift: "Morning",
    days: [
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
      "Z1-A21",
      "WO",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "LV",
      "WO",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "Z1-A3",
      "Z1-A4",
    ],
    status: "Draft",
  },
  {
    key: 9,
    slno: 9,
    inspector: "Inspector 9",
    inspectorId: "INS009",
    month: "November",
    shift: "Morning",
    days: [
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
      "Z2-A21",
      "Z2-A31",
      "WO",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "LV",
      "WO",
      "Z2-A30",
      "LV",
      "Z2-A1",
      "Z2-A2",
      "Z2-A3",
      "Z2-A4",
    ],
    status: "Published",
  },
  {
    key: 10,
    slno: 10,
    inspector: "Inspector 10",
    inspectorId: "INS010",
    month: "December",
    shift: "Morning",
    days: [
      "Z1-A16",
      "Z1-A17",
      "LV",
      "WO",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "LV",
      "WO",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "Z1-A30",
      "Z1-A31",
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
    ],
    status: "Draft",
  },
  {
    key: 11,
    slno: 11,
    inspector: "Inspector 11",
    inspectorId: "INS011",
    month: "December",
    shift: "Morning",
    days: [
      "Z2-A16",
      "Z2-A17",
      "LV",
      "WO",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "LV",
      "WO",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "Z2-A30",
      "Z极-A31",
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
    ],
    status: "Published",
  },
  {
    key: 12,
    slno: 12,
    inspector: "Inspector 12",
    inspectorId: "INS012",
    month: "January",
    shift: "Morning",
    days: [
      "Z1-A20",
      "Z1-A21",
      "LV",
      "极O",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "LV",
      "WO",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A极",
      "LV",
      "WO",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "Z1-A11",
      "Z1-A12",
    ],
    status: "Draft",
  },
  {
    key: 13,
    slno: 13,
    inspector: "Inspector 13",
    inspectorId: "INS013",
    month: "January",
    shift: "Morning",
    days: [
      "Z2-A20",
      "Z2-A21",
      "LV",
      "WO",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "LV",
      "WO",
      "Z2-A30",
      "Z2-A31",
      "Z2-A1",
      "Z2-A2",
      "Z2-A3",
      "Z2-A4",
      "Z2-A5",
      "Z2-A6",
      "LV",
      "WO",
      "Z2-A7",
      "Z2-A8",
      "Z2-A9",
      "Z2-A10",
      "Z2-A11",
      "Z2-A12",
    ],
    status: "Published",
  },
  {
    key: 14,
    slno: 14,
    inspector: "Inspector 14",
    inspectorId: "INS014",
    month: "February",
    shift: "Morning",
    days: [
      "Z1-A24",
      "Z1-A25",
      "LV",
      "WO",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "LV",
      "WO",
      "Z1-A3",
      "Z极-A4",
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
    ],
    status: "Draft",
  },
  {
    key: 15,
    slno: 15,
    inspector: "Inspector 15",
    inspectorId: "INS015",
    month: "February",
    shift: "Morning",
    days: [
      "Z2-A24",
      "Z2-A25",
      "LV",
      "WO",
      "Z2-A极6",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "Z2-A30",
      "Z2-A31",
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
    ],
    status: "Published",
  },
];

export default function AdhocShiftPlan() {
  const [activeTab, setActiveTab] = useState("1");
  const [inspector, setInspector] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("August");
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [form] = Form.useForm();

  // Cell color styles
  // ✅ Update getCellStyle to handle Day 29
  const getCellStyle = (value: string, dayIndex?: number) => {
    let style: any = {};

    if (value === "LV") style = { backgroundColor: "#ffccc7", color: "#a8071a", fontWeight: 600 };
    else if (value === "WO") style = { backgroundColor: "#fff7e6", color: "#d46b08", fontWeight: 600 };
    else if (value?.startsWith("Z")) style = { backgroundColor: "#e6f7ff", color: "#0050b3", fontWeight: 500 };

    if (dayIndex === 28) {
      style = {
        ...style,
        backgroundColor: "#fffbe6", // light yellow highlight
        border: "2px solid #faad14", // orange border
      };
    }

    return style;
  };

  const handleEditClick = (row: any, value: string, dayIndex: number) => {
    if (!value.includes("-")) return;

    const [zone, area] = value.split("-");
    setEditingData({
      ...row,
      zone,
      area,
      day: dayIndex + 1,
    });

    form.setFieldsValue({
      inspector: row.inspector,
      shift: row.shift,
      zone,
      area,
    });

    setIsModalOpen(true);
  };

  // Tooltip + styled cell renderer
  const renderDayCell = (value: string, dayIndex: number, row: any) => {
    let tooltipContent: React.ReactNode;

    if (value.includes("-")) {
      const [zone, area] = value.split("-");
      const zoneName = zoneMapping[zone] || zone;
      const areaName = zoneMapping[area] || area;

      tooltipContent = (
        <div style={{ maxWidth: 250 }}>
          <p style={{ marginBottom: 4 }}>
            <b>Inspector:</b> {row.inspector}
          </p>
          <p style={{ marginBottom: 4 }}>
            <b>Date:</b> Day {dayIndex + 1}
          </p>
          <p style={{ marginBottom: 4 }}>
            <b>Shift:</b> {row.shift}
          </p>
          <p style={{ marginBottom: 4 }}>
            <b>Zone:</b> {zoneName}
          </p>
          <p style={{ marginBottom: 8 }}>
            <b>Area:</b> {areaName}
          </p>
          <Button
            type="link"
            size="small"
            style={{ color: "red" }}
            onClick={() => handleEditClick(row, value, dayIndex)}
          >
            Edit
          </Button>
        </div>
      );
    } else if (value === "LV") {
      tooltipContent = "Leave";
    } else if (value === "WO") {
      tooltipContent = "Week Off";
    } else {
      tooltipContent = "Not Assigned";
    }

    return (
      <Tooltip
        title={tooltipContent}
        overlayStyle={{
          maxWidth: 260,

          backgroundColor: "white", // white background

          borderRadius: "6px",
          padding: "1px 1px", // reduced padding
          boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
          fontSize: "13px",

          lineHeight: 1.4,
        }}
        overlayInnerStyle={{
          borderRadius: "6px",
          backgroundColor: "black", // inside background
          color: "white",
          fontWeight: "400", // 🔹 text color inside tooltip
        }}
      >
        <div
          style={{
            padding: "4px 8px",
            textAlign: "center",
            borderRadius: 4,
            ...getCellStyle(value, dayIndex), // ✅ pass dayIndex
          }}
        >
          {value}
        </div>
      </Tooltip>
    );
  };

  useEffect(() => {
    // ✅ bind page title from config + translation
    setPageTitle(t(AdhocShiftPlanConfig.title));
  }, [setPageTitle, t]);

  // Dynamic columns (Day 1 - 30)
  // ✅ Update dayColumns to pass dayIndex into getCellStyle
  const dayColumns = Array.from({ length: 30 }, (_, i) => ({
    title: `Day ${i + 1}`,
    dataIndex: ["days", i],
    key: `day${i + 1}`,
    render: (value: string, row: any) => renderDayCell(value || "NA", i, row),
    width: 100,
  }));

  const columns = [
    {
      title: "Inspector",
      dataIndex: "inspector",
      key: "inspector",
      fixed: "left",
      width: 150,
      filters: [...new Set(dataSource.map((d) => d.inspector))].map((insp) => ({
        text: insp,
        value: insp,
      })),
      onFilter: (value: any, record: any) => record.inspector === value,
      sorter: (a: any, b: any) => a.inspector.localeCompare(b.inspector),
    },
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      width: 120,
      filters: [...new Set(dataSource.map((d) => d.month))].map((m) => ({
        text: m,
        value: m,
      })),
      onFilter: (value: any, record: any) => record.month === value,
      sorter: (a: any, b: any) => a.month.localeCompare(b.month),
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
      width: 120,
      filters: [...new Set(dataSource.map((d) => d.shift))].map((s) => ({
        text: s,
        value: s,
      })),
      onFilter: (value: any, record: any) => record.shift === value,
      sorter: (a: any, b: any) => a.shift.localeCompare(b.shift),
    },
    ...dayColumns,
  ];

  const handleSubmit = () => {
    console.log("Inspector:", inspector);
    console.log("Date Range:", dateRange);
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Updated values:", values);
        setIsModalOpen(false);
      })
      .catch((info) => {
        console.log("Validation Failed:", info);
      });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card style={{ marginBottom: 20 }}>
        <Form layout="inline">
          {/* <Form.Item label="Inspector">
            <Select
              placeholder="Select Inspector"
              style={{ width: 200 }}
              value={inspector}
              onChange={(val) => setInspector(val)}
            >
              <Select.Option value="Inspector 1">Inspector 1</Select.Option>
              <Select.Option value="Inspector 2">Inspector 2</Select.Option>
              <Select.Option value="Inspector 3">Inspector 3</Select.Option>
              <Select.Option value="Inspector 4">Inspector 4</Select.Option>
              <Select.Option value="Inspector 5">Inspector 5</Select.Option>
            </Select>
          </Form.Item> */}

          <Form.Item label=" Date">
            <RangePicker onChange={(val) => setDateRange(val)} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={
          <Button type="primary" size="middle">
            Publish
          </Button>
        }
      >
        <TabPane tab="Monthly" key="1">
          <Table
            dataSource={dataSource.filter((d) => d.month === selectedMonth)}
            columns={columns}
            scroll={{ x: 3200, y: 700 }}
            bordered
            pagination={false}
          />
        </TabPane>

        <TabPane tab="Inspector Wise" key="2">
          <Table
            dataSource={inspector ? dataSource.filter((d) => d.inspector === inspector) : []}
            columns={columns}
            scroll={{ x: 3200, y: 700 }}
            bordered
            pagination={false}
          />
        </TabPane>

        <TabPane tab="All" key="3">
          <Table dataSource={dataSource} columns={columns} scroll={{ x: 3200, y: 700 }} bordered pagination={false} />
        </TabPane>
      </Tabs>

      <Modal
        title="Edit Shift Details"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Save Changes"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="inspector" label="Inspector">
            <Select disabled>
              {[...new Set(dataSource.map((d) => d.inspector))].map((insp) => (
                <Select.Option key={insp} value={insp}>
                  {insp}
                </Select.Option>
              ))}
            </Select>
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
            <Select>
              {Object.entries(zoneMapping)
                .filter(([key]) => key.startsWith("A"))
                .map(([key, label]) => (
                  <Select.Option key={key} value={key}>
                    {label}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
